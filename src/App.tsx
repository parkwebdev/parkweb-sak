/**
 * Application Root Component
 * 
 * Sets up the core application structure including:
 * - React Query for server state management
 * - Theme provider for dark/light mode
 * - Authentication context
 * - Routing configuration
 * - Global error boundaries
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
                    <Route path="/" element={<GetStartedWrapper />} />
                    <Route path="/ari" element={<AriConfiguratorWrapper />} />
                    <Route path="/conversations" element={<ConversationsWrapper />} />
                    <Route path="/planner" element={<PlannerWrapper />} />
                    <Route path="/leads" element={<LeadsWrapper />} />
                    <Route path="/analytics" element={<AnalyticsWrapper />} />
                    <Route path="/settings" element={<SettingsWrapper />} />
                    <Route path="/report-builder" element={<ReportBuilder />} />
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