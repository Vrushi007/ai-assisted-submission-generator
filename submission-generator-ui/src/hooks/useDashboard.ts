import { useState, useCallback, useEffect } from 'react';
import { DashboardStats, RecentActivity } from '../types';
import { apiService } from '../services/api';
import { useApp } from '../contexts/AppContext';

export const useDashboard = () => {
  const { setLoading } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading('projects', true);
      
      // Try to get real stats from API, fallback to mock data
      let dashboardStats: DashboardStats;
      
      try {
        dashboardStats = await apiService.getDashboardStats();
      } catch (error) {
        console.warn('Dashboard API not available, using mock data:', error);
        
        // Mock dashboard stats as fallback
        dashboardStats = {
          total_projects: 12,
          active_projects: 8,
          total_submissions: 25,
          pending_reviews: 7,
          files_processed: 156,
          ai_extractions_today: 23,
        };
      }
      
      setStats(dashboardStats);
      setLoading('projects', false);
      return dashboardStats;
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoading('projects', false, 'Failed to load dashboard statistics');
      throw error;
    }
  }, [setLoading]);

  const loadRecentActivity = useCallback(async (limit = 10) => {
    try {
      let activity: RecentActivity[];
      
      try {
        activity = await apiService.getRecentActivity(limit);
      } catch (error) {
        console.warn('Recent activity API not available, using mock data:', error);
        
        // Mock recent activity as fallback
        activity = [
          {
            id: '1',
            type: 'project_created',
            title: 'New Project Created',
            description: 'Smart Insulin Pump - Class III Device',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: 'Dr. Sarah Johnson',
          },
          {
            id: '2',
            type: 'file_uploaded',
            title: 'Clinical Study Report Uploaded',
            description: 'Phase III clinical trial results for glucose monitor',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            user: 'Michael Chen',
          },
          {
            id: '3',
            type: 'submission_updated',
            title: 'Submission Status Updated',
            description: 'Blood Pressure Monitor - Moved to Under Review',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            user: 'Emily Rodriguez',
          },
          {
            id: '4',
            type: 'review_completed',
            title: 'AI Review Completed',
            description: 'Technical specifications review completed with 95% confidence',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            user: 'AI Assistant',
          },
        ];
      }
      
      setRecentActivity(activity);
      return activity;
    } catch (error) {
      console.error('Error loading recent activity:', error);
      throw error;
    }
  }, []);

  const checkHealthStatus = useCallback(async () => {
    try {
      await apiService.healthCheck();
      setIsHealthy(true);
      return true;
    } catch (error) {
      console.warn('Health check failed:', error);
      setIsHealthy(false);
      return false;
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Load all dashboard data in parallel
      const [statsResult, activityResult, healthResult] = await Promise.allSettled([
        loadDashboardStats(),
        loadRecentActivity(),
        checkHealthStatus(),
      ]);

      // Log any failures but don't throw
      if (statsResult.status === 'rejected') {
        console.error('Failed to load stats:', statsResult.reason);
      }
      if (activityResult.status === 'rejected') {
        console.error('Failed to load activity:', activityResult.reason);
      }
      if (healthResult.status === 'rejected') {
        console.error('Failed to check health:', healthResult.reason);
      }

      return {
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        activity: activityResult.status === 'fulfilled' ? activityResult.value : [],
        healthy: healthResult.status === 'fulfilled' ? healthResult.value : false,
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  }, [loadDashboardStats, loadRecentActivity, checkHealthStatus]);

  const refreshDashboard = useCallback(async () => {
    return loadDashboardData();
  }, [loadDashboardData]);

  // Helper functions for activity formatting
  const getActivityIcon = useCallback((type: RecentActivity['type']) => {
    const iconMap = {
      'project_created': 'FolderOpen',
      'submission_updated': 'Assignment',
      'file_uploaded': 'CloudUpload',
      'review_completed': 'Psychology',
    };
    return iconMap[type] || 'TrendingUp';
  }, []);

  const getActivityColor = useCallback((type: RecentActivity['type']) => {
    const colorMap = {
      'project_created': 'primary',
      'submission_updated': 'secondary',
      'file_uploaded': 'info',
      'review_completed': 'success',
    };
    return colorMap[type] || 'default';
  }, []);

  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }, []);

  // Auto-load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only set up once

  return {
    stats,
    recentActivity,
    isHealthy,
    
    // Actions
    loadDashboardData,
    loadDashboardStats,
    loadRecentActivity,
    checkHealthStatus,
    refreshDashboard,
    
    // Helper functions
    getActivityIcon,
    getActivityColor,
    formatTimeAgo,
  };
};

export default useDashboard;