import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import Landing from './pages/landing/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import StudentLayout from './components/layout/StudentLayout'
import StudentDashboard from './pages/student/Dashboard'
import Profile from './pages/student/Profile'
import Explore from './pages/student/Explore'
import MyJobs from './pages/student/MyJobs'
import AssignedJobs from './pages/student/AssignedJobs'
import JobDetail from './pages/student/JobDetail'
import CreateJob from './pages/student/CreateJob'
import Payments from './pages/student/Payments'
import Chat from './pages/student/Chat'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminJobs from './pages/admin/Jobs'
import AdminTransactions from './pages/admin/Transactions'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          : <Landing />
      } />
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          : <Register />
      } />
      <Route path="/forgot-password" element={
        isAuthenticated 
          ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          : <ForgotPassword />
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="explore" element={<Explore />} />
        <Route path="my-jobs" element={<MyJobs />} />
        <Route path="my-jobs/:jobId" element={<JobDetail />} />
        <Route path="create-job" element={<CreateJob />} />
        <Route path="assigned-jobs" element={<AssignedJobs />} />
        <Route path="assigned-jobs/:jobId" element={<JobDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:userId" element={<Chat />} />
      </Route>
      
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
