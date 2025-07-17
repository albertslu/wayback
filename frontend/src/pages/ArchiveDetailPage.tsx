import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Image, Clock, ExternalLink, Plus, RefreshCw, Calendar, CalendarOff } from 'lucide-react';
import { archiveApi, schedulerApi, type Archive, type Page, type ScheduledArchive } from '../services/api';

export const ArchiveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [scheduledArchive, setScheduledArchive] = useState<ScheduledArchive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNewArchive, setIsCreatingNewArchive] = useState(false);
  const [isTogglingSchedule, setIsTogglingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadArchiveDetails(id);
    }
  }, [id]);

  const loadArchiveDetails = async (archiveId: string) => {
    try {
      setIsLoading(true);
      const [archiveData, pagesData, scheduledArchives] = await Promise.all([
        archiveApi.getArchive(archiveId),
        archiveApi.getArchivePages(archiveId),
        schedulerApi.getScheduledArchives()
      ]);
      setArchive(archiveData);
      setPages(pagesData);
      
      // Find if this URL has an active scheduled archive
      const scheduled = scheduledArchives.find(sa => sa.url === archiveData.rootUrl && sa.isActive);
      setScheduledArchive(scheduled || null);
    } catch (err) {
      setError('Failed to load archive details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleReArchive = async () => {
    if (!archive) return;

    setIsCreatingNewArchive(true);
    try {
      const newArchive = await archiveApi.createArchive({ url: archive.rootUrl });
      navigate(`/archives/${newArchive.id}`);
    } catch (err) {
      setError('Failed to create new archive. Please try again.');
    } finally {
      setIsCreatingNewArchive(false);
    }
  };

  const handleToggleSchedule = async () => {
    if (!archive) return;

    setIsTogglingSchedule(true);
    try {
      if (scheduledArchive) {
        // Disable existing schedule
        await schedulerApi.toggleScheduledArchive(scheduledArchive.id);
        setScheduledArchive(null);
      } else {
        // Create new weekly schedule
        const newScheduled = await schedulerApi.createScheduledArchive({
          url: archive.rootUrl,
          cronSchedule: '0 0 * * 0' // Weekly on Sunday at midnight
        });
        setScheduledArchive(newScheduled);
      }
    } catch (err) {
      setError('Failed to update automatic archiving. Please try again.');
    } finally {
      setIsTogglingSchedule(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !archive) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">{error || 'Archive not found'}</p>
        <Link
          to="/archives"
          className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Archives
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link
            to="/archives"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Archives</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Globe className="h-6 w-6 text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900">{archive.domain}</h1>
              </div>
              <p className="text-blue-600 hover:text-blue-700 mb-2">
                <a href={archive.rootUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                  <span>{archive.rootUrl}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </p>
              {scheduledArchive && (
                <div className="flex items-center space-x-2 text-sm text-green-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Automatic archiving enabled (Weekly)</span>
                  {scheduledArchive.nextRun && (
                    <span className="text-gray-500">
                      • Next: {new Date(scheduledArchive.nextRun).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleSchedule}
                disabled={isTogglingSchedule}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  scheduledArchive 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isTogglingSchedule ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Updating...</span>
                  </>
                ) : scheduledArchive ? (
                  <>
                    <CalendarOff className="h-4 w-4" />
                    <span>Disable Auto-Archive</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Enable Weekly Auto-Archive</span>
                  </>
                )}
              </button>
              <button
                onClick={handleReArchive}
                disabled={isCreatingNewArchive}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingNewArchive ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Re-Archive</span>
                  </>
                )}
              </button>
              {archive.status === 'COMPLETED' && (
                <Link
                  to={`/archives/${archive.id}/view/index.html`}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Archive
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Pages</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{archive.totalPages}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Image className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Assets</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{archive.totalAssets}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Created</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatDate(archive.createdAt)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Status</span>
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">{archive.status.toLowerCase()}</p>
            </div>
          </div>
        </div>

        {pages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Archived Pages</h2>
            <div className="space-y-4">
              {pages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{page.title || 'Untitled Page'}</h3>
                    <p className="text-sm text-gray-600">{page.url}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{page.linksCount} links</span>
                      <span>{page._count?.assets || 0} assets</span>
                    </div>
                  </div>
                  <Link
                    to={`/archives/${archive.id}/view/${page.filePath}`}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    View Page
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 