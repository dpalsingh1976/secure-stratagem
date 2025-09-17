import Hero from "@/components/Hero";
import RiskCategories from "@/components/RiskCategories";
import AIAnalysisPreview from "@/components/AIAnalysisPreview";
import AssessmentPreview from "@/components/AssessmentPreview";
import TrustIndicators from "@/components/TrustIndicators";
import Footer from "@/components/Footer";
import EnhancedChatBot from "@/components/EnhancedChatBot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <RiskCategories />
      <AIAnalysisPreview />
      <AssessmentPreview />
      <TrustIndicators />
      <Footer />
      <EnhancedChatBot />
    </div>
  );
};

export default Index;
