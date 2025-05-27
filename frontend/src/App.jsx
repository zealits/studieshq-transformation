import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";

// Freelancer Pages
import FreelancerDashboard from "./pages/freelancer/DashboardPage";
import FreelancerFindJobs from "./pages/freelancer/FindJobsPage";
import FreelancerProjects from "./pages/freelancer/ProjectsPage";
import FreelancerMessages from "./pages/freelancer/MessagesPage";
import FreelancerPayments from "./pages/freelancer/PaymentsPage";
import FreelancerProfile from "./pages/freelancer/ProfilePage";
// import FreelancerSettings from "./pages/freelancer/SettingsPage";

// Client Pages
import ClientDashboard from "./pages/client/DashboardPage";
import ClientJobs from "./pages/client/JobsPage";
import ClientFreelancers from "./pages/client/FreelancersPage";
import ClientProjects from "./pages/client/ProjectsPage";
import ClientMessages from "./pages/client/MessagesPage";
import ClientPayments from "./pages/client/PaymentsPage";
import ClientProfile from "./pages/client/ProfilePage";
import ClientSettings from "./pages/client/SettingsPage";
import JobProposals from "./components/client/JobProposals";

// Admin Pages
import AdminDashboard from "./pages/admin/DashboardPage";
import AdminUserManagement from "./pages/admin/UserManagementPage";
import AdminJobManagement from "./pages/admin/JobManagementPage";
import AdminReports from "./pages/admin/ReportsPage";
import AdminSupport from "./pages/admin/SupportPage";
import AdminProjects from "./pages/admin/ProjectsPage";
import AdminPayments from "./pages/admin/PaymentsPage";
import AdminSettings from "./pages/admin/SettingsPage";

// Protected Routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is verified
  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<EmailVerificationPage />} />
        </Route>

        {/* Freelancer Routes */}
        <Route
          path="/freelancer"
          element={
            <ProtectedRoute allowedRoles={["freelancer"]}>
              <DashboardLayout role="freelancer" />
            </ProtectedRoute>
          }
        >
          <Route index element={<FreelancerDashboard />} />
          <Route path="find-jobs" element={<FreelancerFindJobs />} />
          <Route path="projects" element={<FreelancerProjects />} />
          <Route path="messages" element={<FreelancerMessages />} />
          <Route path="payments" element={<FreelancerPayments />} />
          <Route path="profile" element={<FreelancerProfile />} />
          {/* <Route path="settings" element={<FreelancerSettings />} />  */}
        </Route>

        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <DashboardLayout role="client" />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="jobs" element={<ClientJobs />} />
          <Route path="freelancers" element={<ClientFreelancers />} />
          <Route path="projects" element={<ClientProjects />} />
          <Route path="messages" element={<ClientMessages />} />
          <Route path="payments" element={<ClientPayments />} />
          <Route path="profile" element={<ClientProfile />} />
          <Route path="settings" element={<ClientSettings />} />
          <Route
            path="jobs/:jobId/proposals"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <JobProposals />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="jobs" element={<AdminJobManagement />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
