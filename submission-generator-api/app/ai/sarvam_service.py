"""
Sarvam AI service for intelligent document processing and content extraction.
"""

import os
import json
from typing import List, Dict, Any, Optional
from sarvamai import SarvamAI
from sarvamai.core.api_error import ApiError

from app.core.config import settings
from app.ai.models import DocumentContent, SectionMapping
from app.dossier.models import DossierSection


class SarvamAIService:
    """Service for intelligent document processing using Sarvam AI models."""
    
    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        if not self.api_key:
            raise ValueError("SARVAM_API_KEY environment variable is required")
        
        self.client = SarvamAI(api_subscription_key=self.api_key)
        
        # Model configuration
        self.model_config = {
            "model": "sarvam-105b-32k",  # Cost-efficient variant for moderate tasks
            "temperature": 0.3,  # Lower temperature for more consistent regulatory content
            "reasoning_effort": "medium"  # Balanced reasoning for document analysis
        }
    
    def extract_section_content(
        self, 
        document_text: str, 
        section: DossierSection,
        section_requirements: List[str] = None
    ) -> Optional[SectionMapping]:
        """
        Extract and generate content for a specific dossier section using Sarvam AI.
        """
        
        try:
            # Build the extraction prompt
            prompt = self._build_extraction_prompt(
                document_text, 
                section, 
                section_requirements or []
            )
            
            # Call Sarvam AI
            response = self.client.chat.completions(
                messages=[
                    {
                        "role": "system", 
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                **self.model_config
            )
            
            # Parse the response
            ai_response = response.choices[0].message.content
            
            # Extract structured content from AI response
            extracted_content, confidence = self._parse_ai_response(ai_response)
            
            if extracted_content and confidence > 0.2:  # Minimum confidence threshold
                return SectionMapping(
                    section_id=section.id,
                    section_code=section.section_code,
                    section_title=section.section_title,
                    extracted_content=extracted_content,
                    confidence_score=confidence,
                    keywords_matched=[]  # AI doesn't use keywords
                )
            
            return None
            
        except ApiError as e:
            print(f"Sarvam AI API error: {e}")
            return None
        except Exception as e:
            print(f"Error in Sarvam AI extraction: {e}")
            return None
    
    def generate_section_content(
        self, 
        section: DossierSection, 
        requirements: List[str],
        context_data: Dict[str, Any] = None
    ) -> str:
        """
        Generate content for a section when no document is available.
        """
        
        try:
            prompt = self._build_generation_prompt(section, requirements, context_data)
            
            response = self.client.chat.completions(
                messages=[
                    {
                        "role": "system", 
                        "content": self._get_generation_system_prompt()
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                **self.model_config
            )
            
            return response.choices[0].message.content
            
        except ApiError as e:
            print(f"Sarvam AI API error in generation: {e}")
            return self._fallback_content(section, requirements)
        except Exception as e:
            print(f"Error in Sarvam AI generation: {e}")
            return self._fallback_content(section, requirements)
    
    def analyze_document_completeness(
        self, 
        document_text: str, 
        required_sections: List[DossierSection]
    ) -> Dict[str, Any]:
        """
        Analyze how well a document covers the required regulatory sections.
        """
        
        try:
            prompt = self._build_analysis_prompt(document_text, required_sections)
            
            response = self.client.chat.completions(
                messages=[
                    {
                        "role": "system", 
                        "content": self._get_analysis_system_prompt()
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                model="sarvam-105b",  # Use full model for complex analysis
                temperature=0.2,
                reasoning_effort="high"
            )
            
            # Parse analysis response
            analysis_text = response.choices[0].message.content
            return self._parse_analysis_response(analysis_text, required_sections)
            
        except Exception as e:
            print(f"Error in document analysis: {e}")
            return {"coverage_score": 0.0, "missing_sections": [], "recommendations": []}
    
    def _get_system_prompt(self) -> str:
        """System prompt for content extraction."""
        return """You are an expert regulatory affairs specialist with deep knowledge of medical device submissions, particularly IMDRF (International Medical Device Regulators Forum) guidelines.

Your task is to extract relevant information from medical device documents and map it to specific regulatory sections.

Key principles:
1. Extract only factual information present in the document
2. Maintain regulatory language and terminology
3. Preserve specific details like model numbers, certifications, dates
4. If information is partial or unclear, indicate uncertainty
5. Focus on compliance-relevant content

Response format:
- Provide extracted content in clear, structured format
- Include confidence level (0.0-1.0) based on information quality
- Indicate if information is complete, partial, or missing"""

    def _get_generation_system_prompt(self) -> str:
        """System prompt for content generation."""
        return """You are an expert regulatory affairs consultant specializing in medical device submissions.

Generate professional, compliant content for regulatory submission sections based on IMDRF guidelines.

Requirements:
1. Use appropriate regulatory language and terminology
2. Include all required elements for the section
3. Provide clear structure with headings and bullet points
4. Include placeholders for specific information that must be provided
5. Ensure content meets regulatory standards and expectations
6. Focus on Health Canada and international regulatory requirements"""

    def _get_analysis_system_prompt(self) -> str:
        """System prompt for document analysis."""
        return """You are a regulatory compliance analyst specializing in medical device submissions.

Analyze documents for completeness against regulatory requirements and provide actionable insights.

Focus on:
1. Coverage of required regulatory sections
2. Quality and completeness of information
3. Compliance gaps and risks
4. Specific recommendations for improvement
5. Regulatory best practices"""

    def _build_extraction_prompt(
        self, 
        document_text: str, 
        section: DossierSection, 
        requirements: List[str]
    ) -> str:
        """Build prompt for content extraction."""
        
        requirements_text = "\n".join([f"- {req}" for req in requirements]) if requirements else "Standard regulatory requirements"
        
        return f"""Extract information for the following regulatory section from the provided document:

**Section:** {section.section_code} - {section.section_title}

**Description:** {section.section_description or 'No description provided'}

**Requirements:**
{requirements_text}

**Document Content:**
{document_text[:8000]}  # Limit to avoid token limits

**Instructions:**
1. Extract all relevant information for this section from the document
2. Organize the content clearly with appropriate headings
3. Preserve specific details (numbers, dates, certifications, etc.)
4. If information is incomplete, clearly indicate what's missing
5. Provide a confidence score (0.0-1.0) based on information completeness

**Output Format:**
EXTRACTED_CONTENT:
[Your extracted and organized content here]

CONFIDENCE: [0.0-1.0]
COMPLETENESS: [Complete/Partial/Minimal/Missing]
NOTES: [Any important observations or gaps]"""

    def _build_generation_prompt(
        self, 
        section: DossierSection, 
        requirements: List[str], 
        context_data: Dict[str, Any] = None
    ) -> str:
        """Build prompt for content generation."""
        
        requirements_text = "\n".join([f"- {req}" for req in requirements])
        context_text = ""
        
        if context_data:
            context_text = f"\n**Available Context:**\n"
            for key, value in context_data.items():
                context_text += f"- {key}: {value}\n"
        
        return f"""Generate professional regulatory content for the following section:

**Section:** {section.section_code} - {section.section_title}

**Description:** {section.section_description or 'Standard regulatory section'}

**Requirements:**
{requirements_text}
{context_text}

**Instructions:**
1. Generate comprehensive, professional content that addresses all requirements
2. Use appropriate regulatory language and structure
3. Include clear headings and organized information
4. Add [PLACEHOLDER] markers where specific company/device information is needed
5. Ensure content meets Health Canada and international standards
6. Make it ready for regulatory review

Generate the complete section content now:"""

    def _build_analysis_prompt(
        self, 
        document_text: str, 
        required_sections: List[DossierSection]
    ) -> str:
        """Build prompt for document analysis."""
        
        sections_list = "\n".join([
            f"- {s.section_code}: {s.section_title} ({'Required' if s.is_required else 'Optional'})"
            for s in required_sections
        ])
        
        return f"""Analyze the following document for regulatory submission completeness:

**Required Sections:**
{sections_list}

**Document Content:**
{document_text[:10000]}  # Limit for analysis

**Analysis Required:**
1. Coverage assessment for each required section
2. Quality and completeness of information provided
3. Identification of gaps or missing information
4. Specific recommendations for improvement
5. Overall compliance readiness score

**Output Format:**
COVERAGE_ANALYSIS:
[Section-by-section analysis]

OVERALL_SCORE: [0.0-1.0]
CRITICAL_GAPS: [List of critical missing elements]
RECOMMENDATIONS: [Specific actionable recommendations]
COMPLIANCE_RISKS: [Potential regulatory risks identified]"""

    def _parse_ai_response(self, ai_response: str) -> tuple[str, float]:
        """Parse AI response to extract content and confidence."""
        
        try:
            # Look for structured response
            if "EXTRACTED_CONTENT:" in ai_response:
                parts = ai_response.split("EXTRACTED_CONTENT:")
                if len(parts) > 1:
                    content_part = parts[1]
                    
                    # Extract confidence if present
                    confidence = 0.7  # Default confidence
                    if "CONFIDENCE:" in content_part:
                        conf_parts = content_part.split("CONFIDENCE:")
                        content = conf_parts[0].strip()
                        
                        try:
                            conf_line = conf_parts[1].split('\n')[0].strip()
                            confidence = float(conf_line)
                        except (ValueError, IndexError):
                            pass
                    else:
                        content = content_part.strip()
                    
                    return content, confidence
            
            # Fallback: use entire response with moderate confidence
            return ai_response.strip(), 0.6
            
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            return ai_response.strip(), 0.5

    def _parse_analysis_response(
        self, 
        analysis_text: str, 
        sections: List[DossierSection]
    ) -> Dict[str, Any]:
        """Parse analysis response into structured data."""
        
        try:
            # Extract overall score
            score = 0.5  # Default
            if "OVERALL_SCORE:" in analysis_text:
                score_line = analysis_text.split("OVERALL_SCORE:")[1].split('\n')[0].strip()
                try:
                    score = float(score_line)
                except ValueError:
                    pass
            
            # Extract recommendations
            recommendations = []
            if "RECOMMENDATIONS:" in analysis_text:
                rec_section = analysis_text.split("RECOMMENDATIONS:")[1]
                if "COMPLIANCE_RISKS:" in rec_section:
                    rec_section = rec_section.split("COMPLIANCE_RISKS:")[0]
                
                # Simple parsing - could be enhanced
                rec_lines = [line.strip() for line in rec_section.split('\n') if line.strip()]
                recommendations = rec_lines[:5]  # Top 5 recommendations
            
            return {
                "coverage_score": score,
                "missing_sections": [s.section_code for s in sections if not s.is_completed],
                "recommendations": recommendations,
                "analysis_text": analysis_text
            }
            
        except Exception as e:
            print(f"Error parsing analysis: {e}")
            return {
                "coverage_score": 0.0,
                "missing_sections": [],
                "recommendations": ["Analysis parsing failed"],
                "analysis_text": analysis_text
            }

    def _fallback_content(self, section: DossierSection, requirements: List[str]) -> str:
        """Generate fallback content when AI fails."""
        
        req_text = "\n".join([f"• {req}" for req in requirements])
        
        return f"""# {section.section_title}

## Section {section.section_code}

{section.section_description or 'This section requires regulatory documentation.'}

## Required Information:
{req_text}

## Instructions:
Please provide the required information for this section. Ensure all regulatory requirements are addressed and documentation is complete.

---
*This content was generated as a template. Please replace with actual submission information.*"""


# Global instance
sarvam_ai_service = SarvamAIService() if settings.SARVAM_API_KEY else None