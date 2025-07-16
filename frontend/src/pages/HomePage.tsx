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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-full">
                  <Archive className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
              Wayback Archive Tool
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
              Preserve websites for posterity. Create complete snapshots of websites, 
              including all pages, images, and assets, accessible forever.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 md:p-12 mb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Start Archiving
              </h2>
              <p className="text-gray-600">
                Enter any website URL to begin creating a permanent archive
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-3">
                  Website URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    disabled={isLoading}
                  />
                  <Globe className="absolute right-4 top-4 h-6 w-6 text-gray-400" />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                    <span>Creating Archive...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6" />
                    <span>Create Archive</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group">
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Complete Snapshots
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Captures entire websites including all pages, images, stylesheets, and scripts for perfect preservation.
              </p>
            </div>
          </div>

          <div className="group">
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Version History
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Create multiple snapshots over time to track changes and preserve the evolution of websites.
              </p>
            </div>
          </div>

          <div className="group">
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Permanent Access
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Access archived content forever, even when the original website becomes unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Preserve Digital History?</h3>
            <p className="text-blue-100 mb-6">
              Join the mission to preserve the web for future generations
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => document.getElementById('url')?.focus()}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 border border-white/20"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 