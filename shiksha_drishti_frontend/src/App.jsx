import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/common/AppLayout';
import LoginPage from './components/auth/LoginPage';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import PrincipalDashboard from './components/dashboard/PrincipalDashboard';
import CacDashboard from './components/dashboard/CacDashboard';
import BlockDashboard from './components/dashboard/BlockDashboard';
import DistrictDashboard from './components/dashboard/DistrictDashboard';
import StateDashboard from './components/dashboard/StateDashboard';
import ClassReportCard from './components/marks/ClassReportCard';
import QuestionMarksEntry from './components/marks/QuestionMarksEntry';
import NewAssessment from './components/marks/NewAssessment';
import AssessmentsList from './components/marks/AssessmentsList';
import StudentsList from './components/marks/StudentsList';
import AnalyticsOverview from './components/dashboard/AnalyticsOverview';
import SchoolProfile from './components/school/SchoolProfile';
import { CircularProgress, Box } from '@mui/material';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle, #0f3460 0%, #071526 100%)',
    }}>
      <CircularProgress sx={{ color: '#0284c7' }} size={48} />
    </Box>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function DynamicDashboard() {
  const { user } = useAuth();
  if (user?.role === 'STATE_ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <StateDashboard />;
  }
  if (user?.role === 'DISTRICT_OFFICER' || user?.role === 'DEO') {
    return <DistrictDashboard />;
  }
  if (user?.role === 'BLOCK_OFFICER' || user?.role === 'BEO') {
    return <BlockDashboard />;
  }
  if (user?.role === 'CAC' || user?.role === 'CLUSTER_COORDINATOR') {
    return <CacDashboard />;
  }
  if (user?.role === 'SCHOOL_ADMIN') {
    return <PrincipalDashboard />;
  }
  return <TeacherDashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DynamicDashboard />} />
        <Route path="assessments" element={<AssessmentsList />} />
        <Route path="assessments/new" element={<NewAssessment />} />
        <Route path="assessments/:assessmentId/report-card" element={<ClassReportCard />} />
        <Route path="assessments/:assessmentId/question-marks" element={<QuestionMarksEntry />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="analytics" element={<AnalyticsOverview />} />
        <Route path="schools" element={<SchoolProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
