import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, AlertCircle, Archive, Clock, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="w-1/2 mx-auto px-6 py-6">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-600 p-3 rounded-full shadow-lg">
                <Archive className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-800 to-cyan-800 bg-clip-text text-transparent mb-3">
            Wayback Archive Tool
          </h1>
          
          <p className="text-sm text-gray-600 mb-6">
            Preserve websites for posterity. Create complete snapshots of websites, 
            including all pages, images, and assets.
          </p>
        </div>

        {/* Main Form Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/30 p-5 mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="text-center mb-3">
              <h2 className="text-base font-semibold bg-gradient-to-r from-indigo-800 to-cyan-800 bg-clip-text text-transparent mb-1">
                Start Archiving
              </h2>
              <p className="text-gray-600 text-xs">
                Enter any website URL to begin
              </p>
            </div>

            <div>
              <label htmlFor="url" className="block text-xs font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                  disabled={isLoading}
                />
                <Globe className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-2 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-cyan-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Creating Archive...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Archive</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Features Section */}
        <div className="space-y-3 mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 p-3 rounded-lg border border-indigo-100">
            <div className="flex items-center space-x-2 mb-1">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-1 rounded">
                <Archive className="h-3 w-3 text-white" />
              </div>
              <h3 className="font-medium text-indigo-900 text-xs">Complete Snapshots</h3>
            </div>
            <p className="text-xs text-gray-600">
              Captures entire websites including all pages, images, stylesheets, and scripts.
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
            <div className="flex items-center space-x-2 mb-1">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1 rounded">
                <Clock className="h-3 w-3 text-white" />
              </div>
              <h3 className="font-medium text-purple-900 text-xs">Version History</h3>
            </div>
            <p className="text-xs text-gray-600">
              Create multiple snapshots over time to track changes and preserve evolution.
            </p>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
            <div className="flex items-center space-x-2 mb-1">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-1 rounded">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <h3 className="font-medium text-emerald-900 text-xs">Permanent Access</h3>
            </div>
            <p className="text-xs text-gray-600">
              Access archived content forever, even when the original website becomes unavailable.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-indigo-600/10 to-cyan-600/10 rounded-lg p-4 border border-indigo-200/20">
          <h3 className="text-sm font-bold bg-gradient-to-r from-indigo-800 to-cyan-800 bg-clip-text text-transparent mb-1">
            Ready to Preserve Digital History?
          </h3>
          <p className="text-gray-600 text-xs mb-3">
            Join the mission to preserve the web for future generations
          </p>
          <button
            onClick={() => document.getElementById('url')?.focus()}
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-4 py-1 rounded font-medium hover:from-indigo-700 hover:to-cyan-700 transition-all duration-200 shadow-lg text-xs"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
}; 