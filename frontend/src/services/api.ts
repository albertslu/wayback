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

export default api; 