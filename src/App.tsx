import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminRoute } from "./components/AdminRoute";
import Index from "./pages/Index";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import RiskIntake from "./pages/RiskIntake";
import TaxBucketEstimator from "./pages/TaxBucketEstimator";
import PolicyAssistant from "./pages/PolicyAssistant";
import FNAReport from "./pages/FNAReport";
import StressTesting from "./pages/StressTesting";
import IULBanking from "./pages/IULBanking";
import Resources from "./pages/Resources";
import AnnuityCalculator from "./pages/AnnuityCalculator";
import LongevityCalculator from "./pages/LongevityCalculator";
import InflationStressTest from "./pages/InflationStressTest";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/results" element={<Results />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={
              <AdminRoute requiredRole="advisor">
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/risk-intake" element={
              <AdminRoute requiredRole="advisor">
                <RiskIntake />
              </AdminRoute>
            } />
            <Route path="/admin/stress-test" element={
              <AdminRoute requiredRole="advisor">
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/tax-bucket-estimator" element={<TaxBucketEstimator />} />
            <Route path="/policy-assistant" element={
              <AdminRoute requiredRole="user">
                <PolicyAssistant />
              </AdminRoute>
            } />
            <Route path="/fna-report" element={<FNAReport />} />
            <Route path="/stress-test" element={<StressTesting />} />
            <Route path="/iul" element={<IULBanking />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/annuity-calculator" element={<AnnuityCalculator />} />
            <Route path="/longevity-calculator" element={<LongevityCalculator />} />
            <Route path="/inflation-stress-test" element={<InflationStressTest />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
