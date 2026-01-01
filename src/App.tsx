/**
 * Application Root Component
 * 
 * Sets up the core application structure including:
 * - React Query for server state management
 * - Theme provider for dark/light mode
 * - Authentication context
 * - Routing configuration
 * - Global error boundaries
 * - Permission-based route protection
 * 
 * @module App
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalSearchProvider } from "@/contexts/GlobalSearchContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionGuard } from "@/components/PermissionGuard";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AppLayout } from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorFallback from "@/components/RouteErrorFallback";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WidgetPage from "./pages/WidgetPage";
import GetStartedWrapper from "./pages/GetStartedWrapper";
import AriConfiguratorWrapper from "./pages/AriConfiguratorWrapper";
import ConversationsWrapper from "./pages/ConversationsWrapper";
import LeadsWrapper from "./pages/LeadsWrapper";
import AnalyticsWrapper from "./pages/AnalyticsWrapper";
import SettingsWrapper from "./pages/SettingsWrapper";
import PlannerWrapper from "./pages/PlannerWrapper";
import BookingComponentsTest from "./pages/BookingComponentsTest";
import EmailTemplatesTest from "./pages/EmailTemplatesTest";
import ReportBuilder from "./pages/ReportBuilder";

/** React Query client instance with default configuration */
const queryClient = new QueryClient();

/**
 * Layout wrapper for protected routes.
 * Ensures authentication and renders the shared sidebar/header layout.
 * @internal
 */
const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

/**
 * Root application component.
 * Configures providers and routes for the entire application.
 */
const App = () => (
  <ErrorBoundary fallback={(error) => <RouteErrorFallback error={error ?? undefined} />}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="app-ui-theme">
        <TooltipProvider>
          <GlobalSearchProvider>
            <Toaster />
            <BrowserRouter>
              <AuthProvider>
                <GlobalSearch />
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Auth />} />
                  <Route path="/widget" element={<WidgetPage />} />
                  
                  {/* Protected routes with shared layout */}
                  <Route element={<ProtectedLayout />}>
                    {/* Dashboard - always accessible for authenticated users */}
                    <Route path="/" element={<GetStartedWrapper />} />
                    
                    {/* Ari Configuration - requires manage_ari permission */}
                    <Route 
                      path="/ari" 
                      element={
                        <PermissionGuard permission="manage_ari">
                          <AriConfiguratorWrapper />
                        </PermissionGuard>
                      } 
                    />
                    
                    {/* Conversations - requires view_conversations permission */}
                    <Route 
                      path="/conversations" 
                      element={
                        <PermissionGuard permission="view_conversations">
                          <ConversationsWrapper />
                        </PermissionGuard>
                      } 
                    />
                    
                    {/* Planner/Bookings - requires view_bookings permission */}
                    <Route 
                      path="/planner" 
                      element={
                        <PermissionGuard permission="view_bookings">
                          <PlannerWrapper />
                        </PermissionGuard>
                      } 
                    />
                    
                    {/* Leads - requires view_leads permission */}
                    <Route 
                      path="/leads" 
                      element={
                        <PermissionGuard permission="view_leads">
                          <LeadsWrapper />
                        </PermissionGuard>
                      } 
                    />
                    
                    {/* Analytics - requires view_dashboard permission */}
                    <Route 
                      path="/analytics" 
                      element={
                        <PermissionGuard permission="view_dashboard">
                          <AnalyticsWrapper />
                        </PermissionGuard>
                      } 
                    />
                    
                    {/* Settings - requires view_settings permission */}
                    <Route 
                      path="/settings" 
                      element={
                        <PermissionGuard permission="view_settings">
                          <SettingsWrapper />
                        </PermissionGuard>
                      } 
                    />
                    
                    {/* Report Builder - requires view_dashboard permission */}
                    <Route 
                      path="/report-builder" 
                      element={
                        <PermissionGuard permission="view_dashboard">
                          <ReportBuilder />
                        </PermissionGuard>
                      } 
                    />
                    
                    <Route path="/email-templates-test" element={<EmailTemplatesTest />} />
                    
                    {/* Dev-only routes inside layout */}
                    {import.meta.env.DEV && (
                      <Route path="/booking-test" element={<BookingComponentsTest />} />
                    )}
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </GlobalSearchProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
