import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { GlobalLoadingShell } from './components/ui/GlobalLoadingShell';

const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = React.lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ItemDetail = React.lazy(() => import('./pages/ItemDetail').then(m => ({ default: m.ItemDetail })));
const CreateListing = React.lazy(() => import('./pages/CreateListing').then(m => ({ default: m.CreateListing })));
const CreateWantedItem = React.lazy(() => import('./pages/CreateWantedItem').then(m => ({ default: m.CreateWantedItem })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ChatPage = React.lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const ConversationsPage = React.lazy(() => import('./pages/ConversationsPage').then(m => ({ default: m.ConversationsPage })));
const DealsPage = React.lazy(() => import('./pages/DealsPage').then(m => ({ default: m.DealsPage })));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SavedPage = React.lazy(() => import('./pages/SavedPage').then(m => ({ default: m.SavedPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const EditListing = React.lazy(() => import('./pages/EditListing').then(m => ({ default: m.EditListing })));
const WhyCirql = React.lazy(() => import('./pages/WhyCirql').then(m => ({ default: m.WhyCirql })));
const HowItWorks = React.lazy(() => import('./pages/HowItWorks').then(m => ({ default: m.HowItWorks })));

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
          <React.Suspense fallback={<GlobalLoadingShell />}>
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
                <Route path="*" element={<Navigate to="/marketplace" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
