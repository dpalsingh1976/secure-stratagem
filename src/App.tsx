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
import Policies from "./pages/Policies";
import PolicyDetail from "./pages/PolicyDetail";
import FNAReport from "./pages/FNAReport";
import IULBanking from "./pages/IULBanking";

import Resources from "./pages/Resources";
import InflationStressTest from "./pages/InflationStressTest";
import RetirementCalculator from "./pages/RetirementCalculator";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
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
            <Route path="/policies" element={<Policies />} />
            <Route path="/policies/:id" element={<PolicyDetail />} />
            <Route path="/fna-report" element={<FNAReport />} />
            <Route path="/iul" element={<IULBanking />} />
            <Route path="/iul-banking" element={<IULBanking />} />
            
            <Route path="/resources" element={<Resources />} />
            <Route path="/inflation-stress-test" element={<InflationStressTest />} />
            <Route path="/retirement-calculator" element={<RetirementCalculator />} />
            <Route path="/contact" element={<Contact />} />
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
