import { lazy, Suspense, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";

// Lazy load non-critical routes to reduce initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// CRM (Amruta Geo CRM)
const CrmLayout = lazy(() => import("./components/crm/CrmLayout"));
const CrmDashboard = lazy(() => import("./pages/crm/CrmDashboard"));
const CrmLeads = lazy(() => import("./pages/crm/CrmLeads"));
const CrmContacts = lazy(() => import("./pages/crm/CrmContacts"));
const CrmOrganizations = lazy(() => import("./pages/crm/CrmOrganizations"));
const CrmDeals = lazy(() => import("./pages/crm/CrmDealsKanban"));
const CrmActivities = lazy(() => import("./pages/crm/CrmActivities"));
const CrmCalendar = lazy(() => import("./pages/crm/CrmCalendar"));
const CrmSupportTickets = lazy(() => import("./pages/crm/CrmSupportTickets"));
const CrmHydroGeo = lazy(() => import("./pages/crm/CrmHydroGeo"));
const CrmDocuments = lazy(() => import("./pages/crm/CrmDocuments"));
const CrmQuotations = lazy(() => import("./pages/crm/CrmQuotations"));
const CrmInvoices = lazy(() => import("./pages/crm/CrmInvoices"));
const CrmWorkspacesAdmin = lazy(() => import("./pages/crm/CrmWorkspacesAdmin"));
const CrmReports = lazy(() => import("./pages/crm/CrmReports"));
const CrmProjectReports = lazy(() => import("./pages/crm/CrmProjectReports"));
const CrmMeetings = lazy(() => import("./pages/crm/CrmMeetings"));
const CrmAuditLog = lazy(() => import("./pages/crm/CrmAuditLog"));
const CrmCrossAnalytics = lazy(() => import("./pages/crm/CrmCrossAnalytics"));

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinished = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/change-password" element={<ChangePassword />} />

              {/* Amruta Geo CRM */}
              <Route path="/crm/admin/workspaces" element={<CrmWorkspacesAdmin />} />
              <Route path="/crm/admin/analytics" element={<CrmCrossAnalytics />} />
              <Route path="/crm" element={<CrmLayout />} />
              <Route path="/crm/:slug" element={<CrmLayout />}>
                <Route path="dashboard" element={<CrmDashboard />} />
                <Route path="leads" element={<CrmLeads />} />
                <Route path="contacts" element={<CrmContacts />} />
                <Route path="organizations" element={<CrmOrganizations />} />
                <Route path="deals" element={<CrmDeals />} />
                <Route path="activities" element={<CrmActivities />} />
                <Route path="calendar" element={<CrmCalendar />} />
                <Route path="tickets" element={<CrmSupportTickets />} />
                <Route path="hydrogeo" element={<CrmHydroGeo />} />
                <Route path="documents" element={<CrmDocuments />} />
                <Route path="quotations" element={<CrmQuotations />} />
                <Route path="invoices" element={<CrmInvoices />} />
                <Route path="meetings" element={<CrmMeetings />} />
                <Route path="reports" element={<CrmReports />} />
                <Route path="project-reports" element={<CrmProjectReports />} />
                <Route path="audit" element={<CrmAuditLog />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
