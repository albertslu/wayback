import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Archive, Home, Clock } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-white/30 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-600 p-1.5 rounded-lg">
                <Archive className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-900 to-cyan-900 bg-clip-text text-transparent">
              Wayback Archive
            </span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-gradient-to-r from-indigo-100 to-cyan-100 text-indigo-700' 
                  : 'text-gray-600 hover:text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              to="/archives"
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/archives') 
                  ? 'bg-gradient-to-r from-indigo-100 to-cyan-100 text-indigo-700' 
                  : 'text-gray-600 hover:text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Archives</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}; 