import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientOnboarding from "./pages/ClientOnboarding";
import ScopeOfWorks from "./pages/ScopeOfWorks";
import Settings from "./pages/Settings";
import EmailTest from "./pages/EmailTest";
import NotFound from "./pages/NotFound";
import Requests from "./pages/Requests";
import ClientsWrapper from "./pages/ClientsWrapper";
import ClientDetail from "./pages/ClientDetail";
import ProjectDetail from "./pages/ProjectDetail";
import { Dashboard } from "./pages/Dashboard";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardWrapper from "./pages/DashboardWrapper";

const queryClient = new QueryClient();

function AppWithNotifications() {
  useRealtimeNotifications();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="app-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppWithNotifications />
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardWrapper />
                </ProtectedRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              {/* Redirect old scope-of-works route to onboarding */}
              <Route path="/scope-of-works" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="/client-onboarding" element={<ClientOnboarding />} />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/email-test" element={
                <ProtectedRoute>
                  <EmailTest />
                </ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute>
                  <Requests />
                </ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute>
                  <ClientsWrapper />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
