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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-16 pb-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-600 p-4 rounded-full shadow-lg">
                  <Archive className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-900 via-purple-800 to-cyan-800 bg-clip-text text-transparent mb-4">
              Wayback Archive Tool
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto leading-relaxed mb-8">
              Preserve websites for posterity. Create complete snapshots of websites, 
              including all pages, images, and assets, accessible forever.
            </p>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="pb-16">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 md:p-10 mb-12 mx-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-800 to-cyan-800 bg-clip-text text-transparent mb-2">
                  Start Archiving
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter any website URL to begin creating a permanent archive
                </p>
              </div>

              <div className="space-y-4">
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
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
                      disabled={isLoading}
                    />
                    <Globe className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3 px-6 rounded-2xl font-semibold hover:from-indigo-700 hover:to-cyan-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
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
              </div>
            </form>
          </div>

          {/* Features Section */}
          <div className="grid gap-4 mb-12 mx-4">
            <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 p-6 rounded-2xl border border-indigo-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-2 rounded-lg">
                  <Archive className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-indigo-900">Complete Snapshots</h3>
              </div>
              <p className="text-sm text-gray-600">
                Captures entire websites including all pages, images, stylesheets, and scripts for perfect preservation.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-purple-900">Version History</h3>
              </div>
              <p className="text-sm text-gray-600">
                Create multiple snapshots over time to track changes and preserve the evolution of websites.
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-emerald-900">Permanent Access</h3>
              </div>
              <p className="text-sm text-gray-600">
                Access archived content forever, even when the original website becomes unavailable.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-indigo-600/10 to-cyan-600/10 rounded-2xl p-8 border border-indigo-200/20 mx-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-800 to-cyan-800 bg-clip-text text-transparent mb-2">
              Ready to Preserve Digital History?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Join the mission to preserve the web for future generations
            </p>
            <button
              onClick={() => document.getElementById('url')?.focus()}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-cyan-700 transition-all duration-200 shadow-lg text-sm"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 