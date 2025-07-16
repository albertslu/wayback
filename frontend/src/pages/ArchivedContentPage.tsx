import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { archiveApi } from '../services/api';

export const ArchivedContentPage: React.FC = () => {
  const { id, '*': path } = useParams<{ id: string; '*': string }>();
  
  if (!id || !path) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">Invalid archive URL</p>
            <Link
              to="/archives"
              className="mt-4 inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Back to Archives
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const contentUrl = archiveApi.getArchivedContentUrl(id, path);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
          <div className="flex items-center space-x-4">
            <Link
              to={`/archives/${id}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Archive</span>
            </Link>
            <div className="text-sm text-gray-600">
              Viewing: <span className="font-medium">{path}</span>
            </div>
          </div>
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in new tab</span>
          </a>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <iframe
            src={contentUrl}
            className="w-full h-[calc(100vh-200px)] border-0"
            title="Archived Content"
          />
        </div>
      </div>
    </div>
  );
}; 