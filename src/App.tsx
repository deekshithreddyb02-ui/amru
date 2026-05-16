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
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CrmWorkspacePicker = lazy(() => import("./pages/crm/CrmWorkspacePicker"));
const CrmLayout = lazy(() => import("./components/crm/CrmLayout"));
const CrmDashboard = lazy(() => import("./pages/crm/CrmDashboard"));
const CrmModulePlaceholder = lazy(() => import("./pages/crm/CrmModulePlaceholder"));

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
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/crm" element={<CrmWorkspacePicker />} />
              <Route path="/crm/:slug" element={<CrmLayout />}>
                <Route index element={<CrmDashboard />} />
                <Route path="dashboard" element={<CrmDashboard />} />
                <Route path="website-settings/*" element={<CrmModulePlaceholder />} />
                <Route path="*" element={<CrmModulePlaceholder />} />
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
