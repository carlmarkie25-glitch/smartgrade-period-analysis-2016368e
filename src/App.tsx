import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TeacherRoute } from "@/components/TeacherRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import AcademicCalendar from "./pages/AcademicCalendar";
import Gradebook from "./pages/Gradebook";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import StudentPanel from "./pages/StudentPanel";
import TeacherPanel from "./pages/TeacherPanel";
import ParentPanel from "./pages/ParentPanel";
import ClassesPage from "./pages/ClassesPage";
import SubjectsPage from "./pages/SubjectsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import AcademicYearsPage from "./pages/AcademicYearsPage";
import NotFound from "./pages/NotFound";
import FeeManagement from "./pages/FeeManagement";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import FinanceReports from "./pages/FinanceReports";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/academic-calendar" element={<ProtectedRoute><AcademicCalendar /></ProtectedRoute>} />
            <Route path="/gradebook" element={<TeacherRoute><Gradebook /></TeacherRoute>} />
            <Route path="/reports" element={<TeacherRoute><Reports /></TeacherRoute>} />
            <Route path="/analytics" element={<TeacherRoute><Analytics /></TeacherRoute>} />
            <Route path="/classes" element={<AdminRoute><ClassesPage /></AdminRoute>} />
            <Route path="/subjects" element={<AdminRoute><SubjectsPage /></AdminRoute>} />
            <Route path="/departments" element={<AdminRoute><DepartmentsPage /></AdminRoute>} />
            <Route path="/academic-years" element={<AdminRoute><AcademicYearsPage /></AdminRoute>} />
            <Route path="/students" element={<AdminRoute><StudentPanel /></AdminRoute>} />
            <Route path="/teachers" element={<AdminRoute><TeacherPanel /></AdminRoute>} />
            <Route path="/parents" element={<AdminRoute><ParentPanel /></AdminRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/fees" element={<AdminRoute><FeeManagement /></AdminRoute>} />
            <Route path="/payments" element={<AdminRoute><Payments /></AdminRoute>} />
            <Route path="/expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
            <Route path="/finance-reports" element={<AdminRoute><FinanceReports /></AdminRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
