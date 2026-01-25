/**
 * Application Root Component
 * 
 * Sets up the core application structure including:
 * - React Query for server state management
 * - Theme provider for dark/light mode
 * - Authentication context
 * - Routing configuration
 * - Global error boundaries
 * - Permission-based route protection using centralized route config
 * 
 * @module App
 */

import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AriSectionActionsProvider } from "@/contexts/AriSectionActionsContext";
import { UnifiedSearchProvider } from "@/contexts/UnifiedSearchContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionGuard } from "@/components/PermissionGuard";
import { UnifiedSearch } from "@/components/UnifiedSearch";
import { AppLayout } from "@/components/layout/AppLayout";
import { PointerEventsGuard } from "@/components/PointerEventsGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorFallback from "@/components/RouteErrorFallback";
import { getRouteById } from "@/config/routes";
import type { AppPermission } from "@/types/team";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WidgetPage from "./pages/WidgetPage";
import GetStartedWrapper from "./pages/GetStartedWrapper";
import Dashboard from "./pages/Dashboard";
import AriConfiguratorWrapper from "./pages/AriConfiguratorWrapper";
import ConversationsWrapper from "./pages/ConversationsWrapper";
import LeadsWrapper from "./pages/LeadsWrapper";
import AnalyticsWrapper from "./pages/AnalyticsWrapper";
import SettingsWrapper from "./pages/SettingsWrapper";
import PlannerWrapper from "./pages/PlannerWrapper";
import BookingComponentsTest from "./pages/BookingComponentsTest";
import ReportBuilder from "./pages/ReportBuilder";
import HelpCenterWrapper from "./pages/HelpCenterWrapper";
import { SkeletonAdminPage } from "@/components/ui/page-skeleton";
import {
  AdminLayout,
  AdminDashboard,
  AdminAccounts,
  AdminPrompts,
  AdminPlans,
  AdminTeam,
  AdminKnowledge,
  AdminEmails,
  AdminRevenue,
  AdminAuditLog,
  ArticleEditorPage,
} from "./pages/admin";

/**
 * Gets PermissionGuard props from centralized route configuration.
 * Ensures consistency between routing, sidebar, and search.
 * 
 * @param routeId - The route ID from ROUTE_CONFIG
 * @returns Object with permission and adminOnly props for PermissionGuard
 */
function getGuardProps(routeId: string): { 
  permission?: AppPermission; 
  adminOnly?: boolean;
} {
  const route = getRouteById(routeId);
  return {
    permission: route?.requiredPermission,
    adminOnly: route?.adminOnly,
  };
}

/**
 * React Query client instance with optimized global defaults.
 * Individual hooks can override these values when needed.
 * 
 * @see docs/DEVELOPMENT_STANDARDS.md for staleTime guidelines
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
    },
    mutations: {
      retry: 1,
    },
  },
});

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
          <Toaster />
          <PointerEventsGuard />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <UnifiedSearchProvider>
              <AuthProvider>
                <AriSectionActionsProvider>
                  <UnifiedSearch />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Auth />} />
                    <Route path="/widget" element={<WidgetPage />} />
                    {/* Redirect /pricing to billing settings */}
                    <Route path="/pricing" element={<Navigate to="/settings?tab=billing" replace />} />
                    
                    {/* Protected routes with shared layout */}
                    <Route element={<ProtectedLayout />}>
                      {/* Get Started - admin only onboarding page */}
                      <Route 
                        path="/" 
                        element={
                          <PermissionGuard {...getGuardProps('get-set-up')} redirectTo="/analytics">
                            <GetStartedWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Dashboard - admin only, shown after onboarding complete */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <PermissionGuard {...getGuardProps('dashboard')}>
                            <Dashboard />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Ari Configuration - requires manage_ari permission */}
                      <Route 
                        path="/ari" 
                        element={
                          <PermissionGuard {...getGuardProps('ari')}>
                            <AriConfiguratorWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Conversations - requires view_conversations permission */}
                      <Route 
                        path="/conversations" 
                        element={
                          <PermissionGuard {...getGuardProps('conversations')}>
                            <ConversationsWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Planner/Bookings - requires view_bookings permission */}
                      <Route 
                        path="/planner" 
                        element={
                          <PermissionGuard {...getGuardProps('planner')}>
                            <PlannerWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Leads - requires view_leads permission */}
                      <Route 
                        path="/leads" 
                        element={
                          <PermissionGuard {...getGuardProps('leads')}>
                            <LeadsWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Analytics - requires view_dashboard permission */}
                      <Route 
                        path="/analytics" 
                        element={
                          <PermissionGuard {...getGuardProps('analytics')}>
                            <AnalyticsWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Settings - requires view_settings permission */}
                      <Route 
                        path="/settings" 
                        element={
                          <PermissionGuard {...getGuardProps('settings')}>
                            <SettingsWrapper />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Help Center - accessible to all authenticated users */}
                      <Route 
                        path="/help-center" 
                        element={<HelpCenterWrapper />} 
                      />
                      
                      
                      {/* Report Builder - requires view_dashboard permission */}
                      <Route 
                        path="/report-builder" 
                        element={
                          <PermissionGuard {...getGuardProps('report-builder')}>
                            <ReportBuilder />
                          </PermissionGuard>
                        } 
                      />
                      
                      {/* Dev-only test routes */}
                      {import.meta.env.DEV && (
                        <Route path="/booking-test" element={<BookingComponentsTest />} />
                      )}
                    </Route>
                    
                    {/* Admin Routes - Super Admin Only */}
                    <Route element={<ProtectedLayout />}>
                      <Route 
                        path="/admin/*" 
                        element={
                          <PermissionGuard pilotTeamOnly redirectTo="/dashboard">
                            <Suspense fallback={<SkeletonAdminPage />}>
                              <AdminLayout />
                            </Suspense>
                          </PermissionGuard>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        <Route path="accounts" element={<AdminAccounts />} />
                        <Route path="prompts" element={<AdminPrompts />} />
                        <Route path="plans" element={<AdminPlans />} />
                        <Route path="team" element={<AdminTeam />} />
                        <Route path="knowledge" element={<AdminKnowledge />} />
                        <Route path="knowledge/new" element={<ArticleEditorPage />} />
                        <Route path="knowledge/:articleId" element={<ArticleEditorPage />} />
                        <Route path="emails" element={<AdminEmails />} />
                        <Route path="analytics" element={<AdminRevenue />} />
                        <Route path="audit" element={<AdminAuditLog />} />
                      </Route>
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AriSectionActionsProvider>
              </AuthProvider>
            </UnifiedSearchProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
