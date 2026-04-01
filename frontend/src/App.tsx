import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CandidateLayout } from './components/CandidateLayout';
import { ProctoringWrapper } from './components/ProctoringWrapper';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { RecruiterLayout } from './components/RecruiterLayout';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload').then(m => ({ default: m.ResumeUpload })));
const AssessmentResumeUpload = lazy(() => import('./pages/AssessmentResumeUpload').then(m => ({ default: m.AssessmentResumeUpload })));
const JobApplicationResumeUpload = lazy(() => import('./pages/JobApplicationResumeUpload').then(m => ({ default: m.JobApplicationResumeUpload })));
const TakeExam = lazy(() => import('./pages/TakeExam').then(m => ({ default: m.TakeExam })));
const ExamResults = lazy(() => import('./pages/ExamResults').then(m => ({ default: m.ExamResults })));
const Jobs = lazy(() => import('./pages/Jobs').then(m => ({ default: m.Jobs })));
const Assessments = lazy(() => import('./pages/Assessments').then(m => ({ default: m.Assessments })));
const League = lazy(() => import('./pages/League').then(m => ({ default: m.League })));
const Salary = lazy(() => import('./pages/Salary').then(m => ({ default: m.Salary })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Candidates = lazy(() => import('./pages/Candidates').then(m => ({ default: m.Candidates })));
const MissionControl = lazy(() => import('./pages/MissionControl').then(m => ({ default: m.MissionControl })));
const JDIntelligence = lazy(() => import('./pages/JDIntelligence').then(m => ({ default: m.JDIntelligence })));
const ResumeIntelligence = lazy(() => import('./pages/ResumeIntelligence').then(m => ({ default: m.ResumeIntelligence })));
const AntiCheatingMonitor = lazy(() => import('./pages/AntiCheatingMonitor').then(m => ({ default: m.AntiCheatingMonitor })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const SkillMatching = lazy(() => import('./pages/SkillMatching').then(m => ({ default: m.SkillMatching })));
const CandidateVerification = lazy(() => import('./pages/CandidateVerification').then(m => ({ default: m.default })));
const ProctoringRules = lazy(() => import('./pages/ProctoringRules').then(m => ({ default: m.default })));
const TestEnterpriseFace = lazy(() => import('./pages/TestEnterpriseFace').then(m => ({ default: m.TestEnterpriseFace })));
const MCQTest = lazy(() => import('./pages/MCQTest').then(m => ({ default: m.MCQTest })));
const TestPhase2 = lazy(() => import('./pages/TestPhase2').then(m => ({ default: m.TestPhase2 })));
const Phase2CodingTest = lazy(() => import('./pages/Phase2CodingTest').then(m => ({ default: m.Phase2CodingTest })));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard').then(m => ({ default: m.RecruiterDashboard })));
const RecruiterAssessmentsAdd = lazy(() => import('./pages/RecruiterAssessmentsAdd').then(m => ({ default: m.RecruiterAssessmentsAdd })));
const RecruiterCandidateDetails = lazy(() => import('./pages/RecruiterCandidateDetails').then(m => ({ default: m.RecruiterCandidateDetails })));
const RecruiterJobs = lazy(() => import('./pages/RecruiterJobs').then(m => ({ default: m.RecruiterJobs })));
const RecruiterSettings = lazy(() => import('./pages/RecruiterSettings').then(m => ({ default: m.RecruiterSettings })));
const AssessmentManagement = lazy(() => import('./pages/AssessmentManagement').then(m => ({ default: m.default })));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })));
const MonitoringCamera = lazy(() => import('./pages/MonitoringCamera').then(m => ({ default: m.default })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      Loading…
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function CandidateRoute({ children }: { children: React.ReactNode }) {
  const { user, viewRole } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  
  // If the user is a recruiter viewing as a recruiter, don't let them stay in candidate routes
  if (viewRole === 'recruiter' && user.role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function RecruiterRoute({ children }: { children: React.ReactNode }) {
  const { user, viewRole } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  
  // If the user is a candidate or viewing as a candidate, don't let them stay in recruiter routes
  if (viewRole === 'candidate' && user.role === 'candidate') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  // Determine default route based on user role
  const getDefaultRoute = () => {
    if (!user) return "/signup";
    if (user.role === 'recruiter') return "/recruiter/dashboard";
    return "/dashboard";
  };

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to={getDefaultRoute()} /> : <Signup />} />
          <Route path="/forgot-password" element={user ? <Navigate to={getDefaultRoute()} /> : <ForgotPassword />} />
          <Route path="/reset-password" element={user ? <Navigate to={getDefaultRoute()} /> : <ResetPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Special Routes (No Layout) */}
          <Route path="/mcq-test/:token" element={<MCQTest />} />
          <Route path="/candidate-verification" element={<ProtectedRoute><CandidateVerification /></ProtectedRoute>} />
          <Route path="/proctoring-rules" element={<ProtectedRoute><ProctoringRules /></ProtectedRoute>} />
          <Route path="/monitoring-camera" element={<ProtectedRoute><MonitoringCamera /></ProtectedRoute>} />
          <Route path="/exam-complete" element={<Navigate to="/test-phase-2" replace />} />
          <Route path="/test-enterprise-face" element={<ProtectedRoute><TestEnterpriseFace /></ProtectedRoute>} />
          <Route path="/test-phase-2" element={<TestPhase2 />} />
          <Route path="/phase-2-exam" element={<Phase2CodingTest />} />
          <Route path="/assessment-results" element={<ProtectedRoute><ExamResults /></ProtectedRoute>} />
          <Route path="/recruiter/candidate-results/:token" element={<ProtectedRoute><ExamResults /></ProtectedRoute>} />
          <Route path="/take-exam" element={<ProtectedRoute><ProctoringWrapper><TakeExam /></ProctoringWrapper></ProtectedRoute>} />
          <Route path="/test-exam" element={<ProtectedRoute><TakeExam /></ProtectedRoute>} />

          {/* Candidate Routes with Sidebar Layout */}
          <Route path="/" element={<CandidateRoute><CandidateLayout /></CandidateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="resume-upload" element={<ResumeUpload />} />
            <Route path="assessment-resume-upload" element={<AssessmentResumeUpload />} />
            <Route path="job-resume-upload" element={<JobApplicationResumeUpload />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="exam-results" element={<ExamResults />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="league" element={<League />} />
            <Route path="salary" element={<Salary />} />
            <Route path="profile" element={<Profile />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="mission-control" element={<MissionControl />} />
            <Route path="jd-intelligence" element={<JDIntelligence />} />
            <Route path="resume-intelligence" element={<ResumeIntelligence />} />
            <Route path="anti-cheating" element={<AntiCheatingMonitor />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="skill-matching" element={<SkillMatching />} />
          </Route>

          {/* Recruiter Routes */}
          <Route path="/recruiter" element={<RecruiterRoute><RecruiterLayout /></RecruiterRoute>}>
            <Route index element={<RecruiterDashboard />} />
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="assessments/add" element={<RecruiterAssessmentsAdd />} />
            <Route path="candidates" element={<RecruiterCandidateDetails />} />
            <Route path="add-candidate" element={<Candidates />} />
            <Route path="jobs" element={<RecruiterJobs />} />
            <Route path="settings" element={<RecruiterSettings />} />
            <Route path="assessment-management" element={<AssessmentManagement />} />
          </Route>

          <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
        </Routes>
      </Suspense>
    </>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
