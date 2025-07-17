import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarOff, Globe, Clock, Play, Pause, Trash2, Plus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { schedulerApi, type ScheduledArchive, type SchedulerStatus } from '../services/api';

export const SchedulerPage: React.FC = () => {
  const [scheduledArchives, setScheduledArchives] = useState<ScheduledArchive[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedulerData();
  }, []);

  const loadSchedulerData = async () => {
    try {
      setIsLoading(true);
      const [scheduledData, statusData] = await Promise.all([
        schedulerApi.getScheduledArchives(),
        schedulerApi.getSchedulerStatus()
      ]);
      setScheduledArchives(scheduledData);
      setSchedulerStatus(statusData);
    } catch (err) {
      setError('Failed to load scheduler data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSchedule = async (id: string) => {
    try {
      await schedulerApi.toggleScheduledArchive(id);
      await loadSchedulerData(); // Refresh data
    } catch (err) {
      setError('Failed to toggle schedule');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled archive?')) {
      return;
    }

    try {
      await schedulerApi.deleteScheduledArchive(id);
      await loadSchedulerData(); // Refresh data
    } catch (err) {
      setError('Failed to delete schedule');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatCronSchedule = (cronSchedule: string) => {
    switch (cronSchedule) {
      case '0 0 * * 0':
        return 'Weekly (Sundays)';
      case '0 0 * * *':
        return 'Daily';
      case '0 0 * * 1':
        return 'Weekly (Mondays)';
      default:
        return cronSchedule;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto py-20">
          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading scheduler...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto py-20">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={loadSchedulerData}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-1">
              Archive Scheduler
            </h1>
            <p className="text-gray-600">
              Manage automatic archiving for your websites
            </p>
          </div>
          <Link
            to="/"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Archive</span>
          </Link>
        </div>

        {/* Status Cards */}
        {schedulerStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{schedulerStatus.totalJobs}</p>
                  <p className="text-sm text-gray-600">Total Scheduled</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-lg">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{schedulerStatus.runningJobs}</p>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-lg">
                  <Pause className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {schedulerStatus.totalJobs - schedulerStatus.runningJobs}
                  </p>
                  <p className="text-sm text-gray-600">Paused</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Archives List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Scheduled Archives</h2>
            <p className="text-gray-600 mt-1">Manage your automatic archiving schedules</p>
          </div>

          {scheduledArchives.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled archives</h3>
              <p className="text-gray-600 mb-6">Set up automatic archiving to keep your archives up-to-date</p>
              <Link
                to="/"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Schedule</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scheduledArchives.map((scheduled) => (
                <div key={scheduled.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate">{scheduled.domain}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          scheduled.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {scheduled.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </>
                          )}
                        </span>
                      </div>
                      
                      <p className="text-sm text-blue-600 truncate mb-2">{scheduled.url}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Schedule: {formatCronSchedule(scheduled.cronSchedule)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Next: {formatDate(scheduled.nextRun)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Last: {formatDate(scheduled.lastRun)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleSchedule(scheduled.id)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          scheduled.isActive
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {scheduled.isActive ? (
                          <>
                            <Pause className="h-4 w-4" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteSchedule(scheduled.id)}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">How Automatic Archiving Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Scheduled archives run automatically based on the cron schedule</li>
                <li>• Weekly schedules run every Sunday at midnight UTC</li>
                <li>• You can pause/resume or delete schedules at any time</li>
                <li>• Each run creates a new version in your archive history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 