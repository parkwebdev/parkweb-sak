import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AnimatePresence } from "motion/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorFallback from "@/components/RouteErrorFallback";

// Lazy load route components for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WidgetPage = lazy(() => import("./pages/WidgetPage"));
const DashboardWrapper = lazy(() => import("./pages/DashboardWrapper"));
const AgentsWrapper = lazy(() => import("./pages/AgentsWrapper"));
const AgentConfigWrapper = lazy(() => import("./pages/AgentConfigWrapper"));
const ConversationsWrapper = lazy(() => import("./pages/ConversationsWrapper"));
const LeadsWrapper = lazy(() => import("./pages/LeadsWrapper"));
const AnalyticsWrapper = lazy(() => import("./pages/AnalyticsWrapper"));
const SettingsWrapper = lazy(() => import("./pages/SettingsWrapper"));

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Auth />} />
          <Route path="/widget" element={<WidgetPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } />
          <Route path="/agents" element={
            <ProtectedRoute>
              <AgentsWrapper />
            </ProtectedRoute>
          } />
          <Route path="/agents/:agentId" element={
            <ProtectedRoute>
              <AgentConfigWrapper />
            </ProtectedRoute>
          } />
          <Route path="/conversations" element={
            <ProtectedRoute>
              <ConversationsWrapper />
            </ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute>
              <LeadsWrapper />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsWrapper />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsWrapper />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary fallback={<RouteErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="app-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <GlobalSearch />
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
