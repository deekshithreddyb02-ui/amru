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
const CrmWorkspacesAdmin = lazy(() => import("./pages/crm/CrmWorkspacesAdmin"));
const CrmReports = lazy(() => import("./pages/crm/CrmPlaceholder").then((m) => ({ default: m.CrmReports })));

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
              <Route path="/crm" element={<CrmLayout />} />
              <Route path="/crm/:slug" element={<CrmLayout />}>
                <Route path="dashboard" element={<CrmDashboard />} />
                <Route path="leads" element={<CrmLeads />} />
                <Route path="contacts" element={<CrmContacts />} />
                <Route path="organizations" element={<CrmOrganizations />} />
                <Route path="deals" element={<CrmDeals />} />
                <Route path="reports" element={<CrmReports />} />
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
