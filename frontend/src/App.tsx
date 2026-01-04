import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NewApplication from "./pages/NewApplication";
import UploadedFiles from "./pages/UploadedFiles";
import StudyStatus from "./pages/StudyStatus";
import Agenda from "./pages/Agenda";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewOversight from "./pages/ReviewOversight";
import Faculty from "./pages/Faculty";
import Committee from "./pages/Committee";
import SuperAdminPortal from "./pages/SuperAdminPortal";
import Rector from "./pages/Rector";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['researcher']}><Dashboard /></ProtectedRoute>} />
          <Route path="/new-application" element={<ProtectedRoute allowedRoles={['researcher']}><NewApplication /></ProtectedRoute>} />
          <Route path="/uploaded-files" element={<ProtectedRoute allowedRoles={['researcher']}><UploadedFiles /></ProtectedRoute>} />
          <Route path="/study-status" element={<ProtectedRoute allowedRoles={['researcher']}><StudyStatus /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute allowedRoles={['researcher', 'faculty_admin', 'committee_member', 'rector', 'admin', 'super_admin']}><Agenda /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['researcher', 'faculty_admin', 'committee_member', 'rector', 'admin', 'super_admin']}><Settings /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/review-oversight" element={<ProtectedRoute allowedRoles={['admin']}><ReviewOversight /></ProtectedRoute>} />

          <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty', 'faculty_admin']}><Faculty /></ProtectedRoute>} />
          <Route path="/committee" element={<ProtectedRoute allowedRoles={['committee', 'committee_member']}><Committee /></ProtectedRoute>} />
          <Route path="/rector" element={<ProtectedRoute allowedRoles={['rector']}><Rector /></ProtectedRoute>} />
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPortal /></ProtectedRoute>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
