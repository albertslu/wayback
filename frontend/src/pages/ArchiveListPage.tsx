import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, FileText, Image, CheckCircle, XCircle, Loader } from 'lucide-react';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={loadArchives}
          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archives</h1>
          <p className="text-gray-600 mt-2">
            {archives.length} {archives.length === 1 ? 'archive' : 'archives'} created
          </p>
        </div>
        <Link
          to="/"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create New Archive
        </Link>
      </div>

      {archives.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No archives yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first archive to preserve websites for the future.
          </p>
          <Link
            to="/"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Archive
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {archives.map((archive) => (
            <div key={archive.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {archive.domain}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(archive.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(archive.status)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-blue-600 hover:text-blue-700 mb-3">
                    <a href={archive.rootUrl} target="_blank" rel="noopener noreferrer">
                      {archive.rootUrl}
                    </a>
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{archive.totalPages} pages</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Image className="h-4 w-4" />
                      <span>{archive.totalAssets} assets</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(archive.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/archives/${archive.id}`}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Details
                  </Link>
                  {archive.status === 'COMPLETED' && (
                    <Link
                      to={`/archives/${archive.id}/view/index.html`}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      View Archive
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 