import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import NavBar from './components/layout/NavBar';
import ScanlineOverlay from './components/layout/ScanlineOverlay';
import SpotifyPlayer from './components/player/SpotifyPlayer';
import CallbackHandler from './components/auth/CallbackHandler';
import Airlock from './pages/Airlock';
import Mainframe from './pages/Mainframe';
import Radar from './pages/Radar';
import Archive from './pages/Archive';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-deep text-white">
      <ScanlineOverlay />
      {isAuthenticated && <NavBar />}

      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Airlock />
        } />
        <Route path="/callback" element={<CallbackHandler />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Mainframe /></ProtectedRoute>
        } />
        <Route path="/radar" element={
          <ProtectedRoute><Radar /></ProtectedRoute>
        } />
        <Route path="/archive" element={
          <ProtectedRoute><Archive /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isAuthenticated && <SpotifyPlayer />}
    </div>
  );
}
