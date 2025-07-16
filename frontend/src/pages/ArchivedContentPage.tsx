import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { archiveApi } from '../services/api';

export const ArchivedContentPage: React.FC = () => {
  const { id, '*': path } = useParams<{ id: string; '*': string }>();
  
  if (!id || !path) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Invalid archive URL</p>
        <Link
          to="/archives"
          className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Archives
        </Link>
      </div>
    );
  }

  const contentUrl = archiveApi.getArchivedContentUrl(id, path);

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Link
            to={`/archives/${id}`}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
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
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open in new tab</span>
        </a>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <iframe
          src={contentUrl}
          className="w-full h-[calc(100vh-200px)] border-0"
          title="Archived Content"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    </div>
  );
}; 