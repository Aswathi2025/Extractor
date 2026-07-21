import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute } from './Guards';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Admin pages
import DashboardPage from '../pages/admin/DashboardPage';
import JobsPage from '../pages/admin/JobsPage';
import SkillsPage from '../pages/admin/SkillsPage';
import QuestionsPage from '../pages/admin/QuestionsPage';
import UsersPage from '../pages/admin/UsersPage';
import ApplicationsPage from '../pages/admin/ApplicationsPage';

// Candidate pages
import CandidateDashboardPage from '../pages/candidate/CandidateDashboardPage';
import JobListPage from '../pages/candidate/JobListPage';
import JobDetailPage from '../pages/candidate/JobDetailPage';
import CandidateApplicationsPage from '../pages/candidate/CandidateApplicationsPage';
import CandidateTestsPage from '../pages/candidate/CandidateTestsPage';
import TestTakingPage from '../pages/candidate/TestTakingPage';

// Layouts
import AdminLayout from '../components/layout/AdminLayout';
import CandidateLayout from '../components/layout/CandidateLayout';

const router = createBrowserRouter([
  // Guest-only routes (redirect to /jobs if already logged in)
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  // Public routes (accessible without login)
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Admin routes
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <DashboardPage /> },
          { path: '/admin/jobs', element: <JobsPage /> },
          { path: '/admin/skills', element: <SkillsPage /> },
          { path: '/admin/questions', element: <QuestionsPage /> },
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/applications', element: <ApplicationsPage /> },
        ],
      },
    ],
  },

  // Protected candidate routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <CandidateLayout />,
        children: [
          { path: '/dashboard', element: <CandidateDashboardPage /> },
          { path: '/jobs', element: <JobListPage /> },
          { path: '/jobs/:id', element: <JobDetailPage /> },
          { path: '/applications', element: <CandidateApplicationsPage /> },
          { path: '/tests', element: <CandidateTestsPage /> },
          { path: '/tests/:id', element: <TestTakingPage /> },
        ],
      },
    ],
  },

  // Default redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
