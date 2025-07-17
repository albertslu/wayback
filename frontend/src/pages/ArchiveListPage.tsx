import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, CheckCircle, XCircle, Loader, Plus, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { archiveApi, type Archive, type DomainGroup } from '../services/api';

export const ArchiveListPage: React.FC = () => {
  const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      setIsLoading(true);
      const data = await archiveApi.getArchivesByDomain();
      setDomainGroups(data);
    } catch (err) {
      setError('Failed to load archives');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDomainExpansion = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const totalArchives = domainGroups.reduce((sum, group) => sum + group.totalVersions, 0);

  const getStatusIcon = (status: Archive['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'IN_PROGRESS':
        return <Loader className="h-4 w-4 text-indigo-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto py-20">
          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading archives...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto py-20">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={loadArchives}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-cyan-700 transition-all duration-200 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-800 to-cyan-800 bg-clip-text text-transparent mb-1">
              Your Archives
            </h1>
            <p className="text-gray-600">
              {totalArchives} {totalArchives === 1 ? 'archive' : 'archives'} preserved across {domainGroups.length} {domainGroups.length === 1 ? 'domain' : 'domains'}
            </p>
          </div>
          <Link
            to="/"
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-4 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Archive</span>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 p-4 rounded-2xl border border-indigo-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{domainGroups.length}</div>
              <div className="text-xs text-gray-600">Domains</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {domainGroups.reduce((sum, group) => sum + group.versions.filter((a: Archive) => a.status === 'COMPLETED').length, 0)}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {domainGroups.reduce((sum, group) => sum + group.versions.filter((a: Archive) => a.status === 'IN_PROGRESS').length, 0)}
              </div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        {/* Domain Groups List */}
        {domainGroups.length === 0 ? (
          <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/30 mx-4">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No archives yet</h3>
            <p className="text-gray-600 mb-6">Create your first archive to get started preserving websites</p>
            <Link
              to="/"
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-cyan-700 transition-all duration-200 shadow-lg inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Archive</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {domainGroups.map((domainGroup) => (
              <div key={domainGroup.domain} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 mx-4 overflow-hidden">
                {/* Domain Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDomainExpansion(domainGroup.domain)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate">{domainGroup.domain}</h3>
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                          {domainGroup.totalVersions} version{domainGroup.totalVersions !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-indigo-600 truncate mb-2">{domainGroup.rootUrl}</p>
                      <p className="text-xs text-gray-500">Latest: {formatDate(domainGroup.latestArchive.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(domainGroup.latestArchive.status)}`}>
                        {getStatusIcon(domainGroup.latestArchive.status)}
                        <span>{getStatusText(domainGroup.latestArchive.status)}</span>
                      </span>
                      {expandedDomains.has(domainGroup.domain) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Version History */}
                {expandedDomains.has(domainGroup.domain) && (
                  <div className="border-t border-gray-200 bg-gray-50/50">
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Version History</span>
                      </h4>
                      <div className="space-y-2">
                        {domainGroup.versions.map((archive) => (
                          <Link
                            key={archive.id}
                            to={`/archives/${archive.id}`}
                            className="block p-3 bg-white rounded-lg hover:bg-indigo-50 transition-colors border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatDate(archive.createdAt)}
                                  </span>
                                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(archive.status)}`}>
                                    {getStatusIcon(archive.status)}
                                    <span>{getStatusText(archive.status)}</span>
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {archive.totalPages} pages, {archive.totalAssets} assets
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 