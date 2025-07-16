import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, FileText, Image, CheckCircle, XCircle, Loader, Plus } from 'lucide-react';
import { archiveApi, type Archive } from '../services/api';

export const ArchiveListPage: React.FC = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      setIsLoading(true);
      const data = await archiveApi.getArchives();
      setArchives(data);
    } catch (err) {
      setError('Failed to load archives');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Archive['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'IN_PROGRESS':
        return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: Archive['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: Archive['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading archives...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-red-600 text-lg mb-8">{error}</p>
            <button
              onClick={loadArchives}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Your Archives
            </h1>
            <p className="text-xl text-gray-600">
              {archives.length} {archives.length === 1 ? 'archive' : 'archives'} preserved
            </p>
          </div>
          <Link
            to="/"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Archive</span>
          </Link>
        </div>

        {archives.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-full w-fit mx-auto mb-8">
                <Globe className="h-16 w-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">No archives yet</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Start preserving websites for the future. Create your first archive to capture and store web content permanently.
              </p>
              <Link
                to="/"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Archive</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {archives.map((archive) => (
              <div key={archive.id} className="group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                          <Globe className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {archive.domain}
                          </h3>
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(archive.status)}`}>
                            {getStatusIcon(archive.status)}
                            <span>{getStatusText(archive.status)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <a 
                          href={archive.rootUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline"
                        >
                          {archive.rootUrl}
                        </a>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Pages</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{archive.totalPages}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <Image className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Assets</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{archive.totalAssets}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Created</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{formatDate(archive.createdAt)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Domain</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{archive.domain}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3 ml-8">
                      <Link
                        to={`/archives/${archive.id}`}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium text-center"
                      >
                        View Details
                      </Link>
                      {archive.status === 'COMPLETED' && (
                        <Link
                          to={`/archives/${archive.id}/view/index.html`}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium text-center shadow-lg"
                        >
                          View Archive
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 