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
import NotFound from "./pages/NotFound";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-application" element={<NewApplication />} />
          <Route path="/uploaded-files" element={<UploadedFiles />} />
          <Route path="/study-status" element={<StudyStatus />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/settings" element={<Settings />} />

          {/* FIX HERE */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/review-oversight" element={<ReviewOversight />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
