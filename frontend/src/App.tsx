
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ArchiveListPage } from './pages/ArchiveListPage';
import { ArchiveDetailPage } from './pages/ArchiveDetailPage';
import { ArchivedContentPage } from './pages/ArchivedContentPage';
import { SchedulerPage } from './pages/SchedulerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/archives" element={<div className="container mx-auto px-4 py-8"><ArchiveListPage /></div>} />
            <Route path="/archives/:id" element={<div className="container mx-auto px-4 py-8"><ArchiveDetailPage /></div>} />
            <Route path="/archives/:id/view/*" element={<div className="container mx-auto px-4 py-8"><ArchivedContentPage /></div>} />
            <Route path="/scheduler" element={<SchedulerPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
