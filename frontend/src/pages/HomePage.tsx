import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, AlertCircle, Archive, Clock, Shield, Zap, Download, Search } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-2xl">
                <Archive className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 leading-tight">
            Wayback Archive
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-700 mb-4 font-medium">
            Preserve the web, one snapshot at a time
          </p>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Capture complete websites with all their content, styles, and functionality. 
            Create permanent archives that survive link rot and website changes.
          </p>
        </div>

        {/* Main Form Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8 mb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Start Archiving Today
              </h2>
              <p className="text-slate-600 text-lg">
                Enter any website URL to create a permanent snapshot
              </p>
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-semibold text-slate-800 mb-3">
                Website URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-4 text-lg border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm placeholder-slate-400"
                  disabled={isLoading}
                />
                <Globe className="absolute right-4 top-4 h-6 w-6 text-slate-400" />
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-3 text-red-700 bg-red-50 p-4 rounded-xl border-2 border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full" />
                  <span>Creating Archive...</span>
                </>
              ) : (
                <>
                  <Plus className="h-6 w-6" />
                  <span>Create Archive</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Features Section */}
        <div className="space-y-6 mb-12">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg">
                <Archive className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Complete Snapshots</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Capture entire websites including all pages, images, stylesheets, and scripts for a complete browsing experience.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Version History</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Create multiple snapshots over time to track changes and preserve the evolution of websites.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Permanent Access</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Access archived content forever, even when the original website becomes unavailable or changes.
            </p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="space-y-6 mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <Zap className="h-6 w-6 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-lg">Lightning Fast</h3>
            </div>
            <p className="text-slate-700">
              Advanced crawling technology ensures quick and efficient archiving of even the largest websites.
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <Search className="h-6 w-6 text-green-600" />
              <h3 className="font-bold text-slate-900 text-lg">Easy Discovery</h3>
            </div>
            <p className="text-slate-700">
              Browse and search through your archived content with powerful tools and intuitive navigation.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-3">
            Ready to Preserve Digital History?
          </h3>
          <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of users who trust Wayback Archive to preserve important web content for future generations.
          </p>
          <button
            onClick={() => document.getElementById('url')?.focus()}
            className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Start Archiving Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 