import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, AlertCircle } from 'lucide-react';
import { archiveApi } from '../services/api';

export const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate URL format
      new URL(url);
      
      const archive = await archiveApi.createArchive({ url });
      navigate(`/archives/${archive.id}`);
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Please enter a valid URL (e.g., https://example.com)');
      } else {
        setError('Failed to create archive. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-100 p-4 rounded-full">
            <Globe className="h-12 w-12 text-primary-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Wayback Archive Tool
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Preserve websites for posterity. Enter a URL to create a complete snapshot 
          of a website, including all its pages and assets.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <div className="relative">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                disabled={isLoading}
              />
              <Globe className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Creating Archive...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Create Archive</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Complete Snapshots
          </h3>
          <p className="text-gray-600">
            Captures entire websites including all pages, images, stylesheets, and scripts.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
            <Plus className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Version History
          </h3>
          <p className="text-gray-600">
            Create multiple snapshots over time to track changes and preserve history.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
            <AlertCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Offline Access
          </h3>
          <p className="text-gray-600">
            Access archived content even when the original website is unavailable.
          </p>
        </div>
      </div>
    </div>
  );
}; 