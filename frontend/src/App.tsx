import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EntityProvider, useEntity } from "@/context/EntityContext";
import { apiService } from "@/services/apiService";
import { Loader2 } from "lucide-react";

// Lazy Load Pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage").then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import("@/pages/SignupPage").then(module => ({ default: module.SignupPage })));
const ProfileSetupPage = lazy(() => import("@/pages/ProfileSetupPage").then(module => ({ default: module.ProfileSetupPage })));
const OrganizationSetupPage = lazy(() => import("@/pages/OrganizationSetupPage").then(module => ({ default: module.OrganizationSetupPage })));
const IdentityOverview = lazy(() => import("@/pages/IdentityOverview").then(module => ({ default: module.IdentityOverview })));
const ConsentCenter = lazy(() => import("@/pages/ConsentCenter").then(module => ({ default: module.ConsentCenter })));
const AccessTransparency = lazy(() => import("@/pages/AccessTransparency").then(module => ({ default: module.AccessTransparency })));
const ServiceProviders = lazy(() => import("@/pages/ServiceProviders").then(module => ({ default: module.ServiceProviders })));
const ConnectedServices = lazy(() => import("@/pages/ConnectedServices").then(module => ({ default: module.ConnectedServices })));
const SecurityAlerts = lazy(() => import("@/pages/SecurityAlerts").then(module => ({ default: module.SecurityAlerts })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(module => ({ default: module.SettingsPage })));
const GovtLoginPage = lazy(() => import("@/pages/GovtLoginPage").then(module => ({ default: module.GovtLoginPage })));
const GovtApprovalsPage = lazy(() => import("@/pages/GovtApprovalsPage").then(module => ({ default: module.GovtApprovalsPage })));
const GovtOrganizations = lazy(() => import("@/pages/GovtOrganizations").then(module => ({ default: module.GovtOrganizations })));
const ServiceProviderDetails = lazy(() => import("@/pages/ServiceProviderDetails").then(module => ({ default: module.ServiceProviderDetails })));
const NotFound = lazy(() => import("./pages/NotFound")); // Has default export

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useEntity();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const RootRedirect = () => {
  const { isAuthenticated, currentEntity } = useEntity();
  if (isAuthenticated) {
    if (currentEntity?.type === 'GOVT') {
      return <Navigate to="/govt/approvals" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/home" replace />;
};

const App = () => {
  useEffect(() => {
    apiService.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <EntityProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<LandingPage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route
                  path="/access-transparency"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AccessTransparency />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ServiceProviders />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SettingsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Organization Routes */}
                <Route path="/govt-login" element={<GovtLoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                  path="/profile-setup"
                  element={
                    <ProtectedRoute>
                      <ProfileSetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/org-setup"
                  element={
                    <ProtectedRoute>
                      <OrganizationSetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <IdentityOverview />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consent"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ConsentCenter />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ServiceProviderDetails />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Duplicates removed: access-log, services (old), security, settings (old) - they are now at the top */}
                <Route
                  path="/security"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SecurityAlerts />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/govt/approvals" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <GovtApprovalsPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route
                  path="/govt/organizations"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GovtOrganizations />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </EntityProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
