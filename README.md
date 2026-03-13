# AI-Assisted Regulatory Submission Generator

A comprehensive web application for building regulatory submission dossiers for Health Canada medical device submissions using IMDRF (International Medical Device Regulators Forum) templates. This system combines AI-powered content extraction with human-in-the-loop workflows to streamline the regulatory submission process.

## 🏗️ Architecture

This application follows a **full-stack architecture** with clear separation between frontend and backend:

- **Frontend**: React-based SPA with Material-UI components
- **Backend**: FastAPI-based REST API with PostgreSQL database
- **AI Integration**: Sarvam AI for content extraction and processing

## ✨ Key Features

### Core Functionality

- **IMDRF Template Management**: Hierarchical section structure based on international standards
- **File Upload & Processing**: Support for PDF, DOCX, and XLSX documents
- **AI Content Extraction**: Automated extraction of relevant content from uploaded documents
- **Human Review Workflow**: Approval gates and review processes for quality assurance
- **Dossier Generation**: Structured regulatory submission document creation

### Advanced Features

- **Conflict Resolution**: Detection and management of conflicting information across documents
- **Progress Tracking**: Real-time completion status and progress indicators
- **Validation System**: Comprehensive data consistency and completeness checks
- **Dashboard Analytics**: Project overview and submission status monitoring
- **Multi-language Support**: Integration with Sarvam AI for language processing

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Component library and design system
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with PostgreSQL support
- **Pydantic** - Data validation and serialization
- **Alembic** - Database migrations
- **PostgreSQL** - Primary database
- **Sarvam AI** - AI content extraction services

### Development Tools

- **pytest** - Testing framework
- **Black & isort** - Code formatting
- **MyPy** - Static type checking
- **ESLint** - JavaScript/TypeScript linting

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.11 or higher)
- **PostgreSQL** (v13 or higher)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-assisted-submission-generator
   ```

2. **Backend Setup**

   ```bash
   cd backend

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Configure environment
   cp .env.example .env
   # Edit .env with your database credentials and API keys

   # Run database migrations
   alembic upgrade head

   # Start the backend server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**

   ```bash
   cd frontend

   # Install dependencies
   npm install

   # Start the development server
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

### Database Configuration

1. **Create PostgreSQL Database**

   ```sql
   CREATE DATABASE regulatory_submissions;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE regulatory_submissions TO your_username;
   ```

2. **Update Environment Variables**
   ```bash
   # In backend/.env
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/regulatory_submissions
   ```

### AI Configuration

1. **Get Sarvam AI API Key**
   - Sign up at [Sarvam AI](https://www.sarvam.ai/)
   - Generate an API key

2. **Configure AI Services**
   ```bash
   # In backend/.env
   SARVAM_API_KEY=your_sarvam_api_key_here
   ```

## 📁 Project Structure

```
ai-assisted-submission-generator/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── contexts/          # React contexts for state management
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
│
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── core/              # Configuration and database setup
│   │   ├── projects/          # Project management module
│   │   ├── products/          # Product metadata module
│   │   ├── submissions/       # Submission lifecycle module
│   │   ├── dossier/           # IMDRF templates and structure
│   │   ├── files/             # File upload and storage
│   │   ├── ai/                # AI extraction services
│   │   ├── reviews/           # Human review workflow
│   │   ├── validation/        # Consistency checks
│   │   ├── dashboard/         # Analytics and reporting
│   │   └── main.py            # FastAPI application entry point
│   ├── templates/             # IMDRF template JSON files
│   ├── uploads/               # Local file storage
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment configuration template
│
└── README.md                  # This file
```

## 🔄 Development Workflow

### Running in Development Mode

1. **Start Backend** (Terminal 1)

   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm start
   ```

### Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migrations
alembic downgrade -1
```

### Code Quality

```bash
# Backend formatting and linting
cd backend
black .
isort .
mypy .

# Frontend linting
cd frontend
npm run lint
npm run type-check
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📊 API Documentation

The backend provides comprehensive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Key API Endpoints

- `GET /api/health` - Health check
- `GET /api/projects` - List projects
- `POST /api/submissions` - Create submission
- `GET /api/dossier/{submission_id}` - Get dossier structure
- `POST /api/files/upload` - Upload documents
- `POST /api/ai/extract` - Extract content from files

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/regulatory_submissions

# Application
APP_NAME="AI-Assisted Regulatory Submission Builder"
DEBUG=True
SECRET_KEY=your-secret-key-here

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=100

# AI Services
SARVAM_API_KEY=your_sarvam_api_key_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and formatting
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the [API documentation](http://localhost:8000/api/docs)
2. Review existing [issues](../../issues)
3. Create a new issue with detailed description

## 🗺️ Roadmap

- [ ] Enhanced AI model integration
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile application support
- [ ] Integration with regulatory databases
- [ ] Multi-tenant architecture
- [ ] Advanced document templates

---

**Built with ❤️ for regulatory professionals**
