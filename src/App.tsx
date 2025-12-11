import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AppLayout } from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteErrorFallback from "@/components/RouteErrorFallback";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WidgetPage from "./pages/WidgetPage";
import DashboardWrapper from "./pages/DashboardWrapper";
import AgentsWrapper from "./pages/AgentsWrapper";
import AgentConfigWrapper from "./pages/AgentConfigWrapper";
import ConversationsWrapper from "./pages/ConversationsWrapper";
import LeadsWrapper from "./pages/LeadsWrapper";
import AnalyticsWrapper from "./pages/AnalyticsWrapper";
import SettingsWrapper from "./pages/SettingsWrapper";
import CalendarWrapper from "./pages/CalendarWrapper";

const queryClient = new QueryClient();

// Shared layout for all protected routes - sidebar and header stay mounted
const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <ErrorBoundary fallback={<RouteErrorFallback />}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="app-ui-theme">
        <TooltipProvider>
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
                  <Route path="/" element={<DashboardWrapper />} />
                  <Route path="/agents" element={<AgentsWrapper />} />
                  <Route path="/agents/:agentId" element={<AgentConfigWrapper />} />
                  <Route path="/conversations" element={<ConversationsWrapper />} />
                  <Route path="/calendar" element={<CalendarWrapper />} />
                  <Route path="/leads" element={<LeadsWrapper />} />
                  <Route path="/analytics" element={<AnalyticsWrapper />} />
                  <Route path="/settings" element={<SettingsWrapper />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
