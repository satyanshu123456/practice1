import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import JoinGroup from './pages/JoinGroup';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = Boolean(
    googleClientId &&
    !googleClientId.includes('placeholder') &&
    !googleClientId.includes('your_google')
  );

  const appContent = (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups/:groupId"
                    element={
                      <ProtectedRoute>
                        <GroupDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/join-group" element={<JoinGroup />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
  );

  return isGoogleConfigured ? (
    <GoogleOAuthProvider clientId={googleClientId}>{appContent}</GoogleOAuthProvider>
  ) : (
    appContent
  );
}

export default App;
