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
const CrmLeadDetail = lazy(() => import("./pages/crm/CrmLeadDetail"));
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
const CrmPayments = lazy(() => import("./pages/crm/CrmPayments"));
const CrmExpenses = lazy(() => import("./pages/crm/CrmExpenses"));
const CrmWorkspacesAdmin = lazy(() => import("./pages/crm/CrmWorkspacesAdmin"));
const CrmReports = lazy(() => import("./pages/crm/CrmReports"));
const CrmProjectReports = lazy(() => import("./pages/crm/CrmProjectReports"));
const CrmMeetings = lazy(() => import("./pages/crm/CrmMeetings"));
const CrmAuditLog = lazy(() => import("./pages/crm/CrmAuditLog"));
const CrmCrossAnalytics = lazy(() => import("./pages/crm/CrmCrossAnalytics"));
const CrmPerformance = lazy(() => import("./pages/crm/CrmPerformance"));
const CrmProducts = lazy(() => import("./pages/crm/CrmProducts"));
const CrmInventory = lazy(() => import("./pages/crm/CrmInventory"));
const CrmVendors = lazy(() => import("./pages/crm/CrmVendors"));
const CrmSalesOrders = lazy(() => import("./pages/crm/CrmSalesOrders"));
const CrmPurchaseOrders = lazy(() => import("./pages/crm/CrmPurchaseOrders"));
const CrmCampaigns = lazy(() => import("./pages/crm/CrmCampaigns"));
const CrmWebForms = lazy(() => import("./pages/crm/CrmWebForms"));
const CrmEmailTemplates = lazy(() => import("./pages/crm/CrmEmailTemplates"));
const CrmWorkflows = lazy(() => import("./pages/crm/CrmWorkflows"));
const CrmApprovals = lazy(() => import("./pages/crm/CrmApprovals"));
const CrmSla = lazy(() => import("./pages/crm/CrmSla"));
const CrmCustomerPortal = lazy(() => import("./pages/crm/CrmCustomerPortal"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const CrmReportingHub = lazy(() => import("./pages/crm/CrmReportingHub"));
const CrmFieldVisits = lazy(() => import("./pages/crm/CrmFieldVisits"));
const CrmFeedback = lazy(() => import("./pages/crm/CrmFeedback"));
const CrmCommissions = lazy(() => import("./pages/crm/CrmCommissions"));
const CrmContracts = lazy(() => import("./pages/crm/CrmContracts"));
const CrmMessages = lazy(() => import("./pages/crm/CrmMessages"));
const CrmImport = lazy(() => import("./pages/crm/CrmImport"));
const CrmTasks = lazy(() => import("./pages/crm/CrmTasks"));
const CrmNotifications = lazy(() => import("./pages/crm/CrmNotifications"));
const CrmActivityFeed = lazy(() => import("./pages/crm/CrmActivityFeed"));
const CrmDashboards = lazy(() => import("./pages/crm/CrmDashboards"));
const CrmIntegrations = lazy(() => import("./pages/crm/CrmIntegrations"));
const CrmFieldMode = lazy(() => import("./pages/crm/CrmFieldMode"));
const CrmTerritories = lazy(() => import("./pages/crm/CrmTerritories"));
const CrmForecast = lazy(() => import("./pages/crm/CrmForecast"));
const CrmDataQuality = lazy(() => import("./pages/crm/CrmDataQuality"));
const QuotationSign = lazy(() => import("./pages/QuotationSign"));
const FeedbackResponse = lazy(() => import("./pages/FeedbackResponse"));

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

              {/* Public customer portal (token-gated) */}
              <Route path="/portal/:token" element={<CustomerPortal />} />
              <Route path="/feedback/:token" element={<FeedbackResponse />} />
              <Route path="/sign/:token" element={<QuotationSign />} />

              {/* Amruta Geo CRM */}
              <Route path="/crm/admin/workspaces" element={<CrmWorkspacesAdmin />} />
              <Route path="/crm/admin/analytics" element={<CrmCrossAnalytics />} />
              <Route path="/crm" element={<CrmLayout />} />
              <Route path="/crm/:slug" element={<CrmLayout />}>
                <Route path="dashboard" element={<CrmDashboard />} />
                <Route path="leads" element={<CrmLeads />} />
                <Route path="leads/:id" element={<CrmLeadDetail />} />
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
                <Route path="payments" element={<CrmPayments />} />
                <Route path="expenses" element={<CrmExpenses />} />
                <Route path="meetings" element={<CrmMeetings />} />
                <Route path="reports" element={<CrmReports />} />
                <Route path="project-reports" element={<CrmProjectReports />} />
                <Route path="performance" element={<CrmPerformance />} />
                <Route path="products" element={<CrmProducts />} />
                <Route path="inventory" element={<CrmInventory />} />
                <Route path="vendors" element={<CrmVendors />} />
                <Route path="sales-orders" element={<CrmSalesOrders />} />
                <Route path="purchase-orders" element={<CrmPurchaseOrders />} />
                <Route path="campaigns" element={<CrmCampaigns />} />
                <Route path="web-forms" element={<CrmWebForms />} />
                <Route path="email-templates" element={<CrmEmailTemplates />} />
                <Route path="workflows" element={<CrmWorkflows />} />
                <Route path="approvals" element={<CrmApprovals />} />
                <Route path="sla" element={<CrmSla />} />
                <Route path="customer-portal" element={<CrmCustomerPortal />} />
                <Route path="reporting-hub" element={<CrmReportingHub />} />
                <Route path="field-visits" element={<CrmFieldVisits />} />
                <Route path="feedback" element={<CrmFeedback />} />
                <Route path="commissions" element={<CrmCommissions />} />
                <Route path="contracts" element={<CrmContracts />} />
                <Route path="messages" element={<CrmMessages />} />
                <Route path="import" element={<CrmImport />} />
                <Route path="tasks" element={<CrmTasks />} />
                <Route path="notifications" element={<CrmNotifications />} />
                <Route path="activity-feed" element={<CrmActivityFeed />} />
                <Route path="dashboards" element={<CrmDashboards />} />
                <Route path="integrations" element={<CrmIntegrations />} />
                <Route path="field-mode" element={<CrmFieldMode />} />
                <Route path="territories" element={<CrmTerritories />} />
                <Route path="forecast" element={<CrmForecast />} />
                <Route path="data-quality" element={<CrmDataQuality />} />
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
