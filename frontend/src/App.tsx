import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ArchiveListPage } from './pages/ArchiveListPage';
import { ArchiveDetailPage } from './pages/ArchiveDetailPage';
import { ArchivedContentPage } from './pages/ArchivedContentPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/archives" element={<ArchiveListPage />} />
            <Route path="/archives/:id" element={<ArchiveDetailPage />} />
            <Route path="/archives/:id/view/*" element={<ArchivedContentPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
