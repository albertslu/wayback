import axios from 'axios';

// In production, this will use the environment variable
// In development, it will use localhost
// For Vercel preview deployments without a backend, it can use a fallback
const getApiBaseUrl = () => {
  // Environment variable from Vercel or .env file
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) return envUrl;
  
  // Local development fallback
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }
  
  // Production fallback (if no env var is set)
  return '/api'; // This will make relative requests to the same origin
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Archive {
  id: string;
  domain: string;
  rootUrl: string;
  timestamp: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalPages: number;
  totalAssets: number;
  filePath: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pages: number;
  };
}

export interface Page {
  id: string;
  archiveId: string;
  url: string;
  title: string | null;
  filePath: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  linksCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface CreateArchiveRequest {
  url: string;
}

export interface DomainGroup {
  domain: string;
  rootUrl: string;
  totalVersions: number;
  latestArchive: Archive;
  versions: Archive[];
}

export interface ScheduledArchive {
  id: string;
  url: string;
  domain: string;
  cronSchedule: string;
  isActive: boolean;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledArchiveRequest {
  url: string;
  cronSchedule?: string;
}

export interface SchedulerStatus {
  totalJobs: number;
  runningJobs: number;
  jobs: Array<{
    id: string;
    url: string;
    schedule: string;
    isRunning: boolean;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const archiveApi = {
  // Get all archives
  getArchives: async (): Promise<Archive[]> => {
    const response = await api.get<ApiResponse<Archive[]>>('/archives');
    return response.data.data;
  },

  // Get archives grouped by domain
  getArchivesByDomain: async (): Promise<DomainGroup[]> => {
    const response = await api.get<ApiResponse<DomainGroup[]>>('/archives/grouped');
    return response.data.data;
  },

  // Create new archive
  createArchive: async (data: CreateArchiveRequest): Promise<Archive> => {
    const response = await api.post<ApiResponse<Archive>>('/archives', data);
    return response.data.data;
  },

  // Get specific archive
  getArchive: async (id: string): Promise<Archive> => {
    const response = await api.get<ApiResponse<Archive>>(`/archives/${id}`);
    return response.data.data;
  },

  // Get pages for an archive
  getArchivePages: async (id: string): Promise<Page[]> => {
    const response = await api.get<ApiResponse<Page[]>>(`/archives/${id}/pages`);
    return response.data.data;
  },

  // Get archived content URL
  getArchivedContentUrl: (archiveId: string, path: string): string => {
    return `${API_BASE_URL}/archives/${archiveId}/serve/${path}`;
  },
};

export const schedulerApi = {
  // Get all scheduled archives
  getScheduledArchives: async (): Promise<ScheduledArchive[]> => {
    const response = await api.get<ApiResponse<ScheduledArchive[]>>('/scheduler/scheduled-archives');
    return response.data.data;
  },

  // Create new scheduled archive
  createScheduledArchive: async (data: CreateScheduledArchiveRequest): Promise<ScheduledArchive> => {
    const response = await api.post<ApiResponse<ScheduledArchive>>('/scheduler/scheduled-archives', data);
    return response.data.data;
  },

  // Update scheduled archive
  updateScheduledArchive: async (id: string, updates: { cronSchedule?: string; isActive?: boolean }): Promise<ScheduledArchive> => {
    const response = await api.put<ApiResponse<ScheduledArchive>>(`/scheduler/scheduled-archives/${id}`, updates);
    return response.data.data;
  },

  // Delete scheduled archive
  deleteScheduledArchive: async (id: string): Promise<void> => {
    await api.delete(`/scheduler/scheduled-archives/${id}`);
  },

  // Toggle scheduled archive on/off
  toggleScheduledArchive: async (id: string): Promise<ScheduledArchive> => {
    const response = await api.post<ApiResponse<ScheduledArchive>>(`/scheduler/scheduled-archives/${id}/toggle`);
    return response.data.data;
  },

  // Get scheduler status
  getSchedulerStatus: async (): Promise<SchedulerStatus> => {
    const response = await api.get<ApiResponse<SchedulerStatus>>('/scheduler/status');
    return response.data.data;
  },
};

export default api; 