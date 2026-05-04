import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { UserDashboard } from './pages/UserDashboard';
import { Dashboard } from './pages/Dashboard';
import { ItemDetail } from './pages/ItemDetail';
import { CreateListing } from './pages/CreateListing';
import { CreateWantedItem } from './pages/CreateWantedItem';
import { Profile } from './pages/Profile';
import { ChatPage } from './pages/ChatPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { DealsPage } from './pages/DealsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SavedPage } from './pages/SavedPage';
import { AdminPage } from './pages/AdminPage';
import { EditListing } from './pages/EditListing';
import { WhyCirql } from './pages/WhyCirql';
import { HowItWorks } from './pages/HowItWorks';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="browse" element={<Navigate to="/marketplace" replace />} />
              <Route path="dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="marketplace" element={<Dashboard />} />
              <Route path="why-cirql" element={<WhyCirql />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="item/:id" element={<ItemDetail />} />
              <Route path="create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="wanted/new" element={<ProtectedRoute><CreateWantedItem /></ProtectedRoute>} />
              <Route path="listings/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="messages" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
              <Route path="messages/:roomId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="deals" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
              <Route path="saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
