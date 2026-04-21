import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TeacherRoute } from "@/components/TeacherRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

// Eager: landing + auth (first paint targets)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy: everything behind auth or rarely visited
const Index = lazy(() => import("./pages/Index"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Schedule = lazy(() => import("./pages/Schedule"));
const AcademicCalendar = lazy(() => import("./pages/AcademicCalendar"));
const Gradebook = lazy(() => import("./pages/Gradebook"));
const GradesRelease = lazy(() => import("./pages/GradesRelease"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Admin = lazy(() => import("./pages/Admin"));
const StudentPanel = lazy(() => import("./pages/StudentPanel"));
const TeacherPanel = lazy(() => import("./pages/TeacherPanel"));
const ParentPanel = lazy(() => import("./pages/ParentPanel"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const DepartmentsPage = lazy(() => import("./pages/DepartmentsPage"));
const AcademicYearsPage = lazy(() => import("./pages/AcademicYearsPage"));
const FeeManagement = lazy(() => import("./pages/FeeManagement"));
const Payments = lazy(() => import("./pages/Payments"));
const Expenses = lazy(() => import("./pages/Expenses"));
const FinanceReports = lazy(() => import("./pages/FinanceReports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SchoolSettings = lazy(() => import("./pages/SchoolSettings"));
const Billing = lazy(() => import("./pages/Billing"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Install = lazy(() => import("./pages/Install"));
const StudentLifecycle = lazy(() => import("./pages/StudentLifecycle"));
const SyncStatusPage = lazy(() => import("./pages/SyncStatus"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div
    role="status"
    aria-label="Loading page"
    className="flex h-screen items-center justify-center"
  >
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SchoolProvider>
            <ImpersonationBanner />
            <PWAInstallPrompt />
            <Suspense fallback={<PageFallback />}>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/install" element={<Install />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/academic-calendar" element={<ProtectedRoute><AcademicCalendar /></ProtectedRoute>} />
            <Route path="/gradebook" element={<TeacherRoute><Gradebook /></TeacherRoute>} />
            <Route path="/grades-release" element={<AdminRoute><GradesRelease /></AdminRoute>} />
            <Route path="/reports" element={<TeacherRoute><Reports /></TeacherRoute>} />
            <Route path="/analytics" element={<TeacherRoute><Analytics /></TeacherRoute>} />
            <Route path="/attendance" element={<TeacherRoute><Attendance /></TeacherRoute>} />
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
            <Route path="/settings/school" element={<AdminRoute><SchoolSettings /></AdminRoute>} />
            <Route path="/settings/billing" element={<AdminRoute><Billing /></AdminRoute>} />
            <Route path="/student-lifecycle" element={<AdminRoute><StudentLifecycle /></AdminRoute>} />
            <Route path="/sync-status" element={<ProtectedRoute><SyncStatusPage /></ProtectedRoute>} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </SchoolProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
