import Hero from "@/components/Hero";
import RiskCategories from "@/components/RiskCategories";
import Footer from "@/components/Footer";
import EnhancedChatBot from "@/components/EnhancedChatBot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <RiskCategories />
      <Footer />
      <EnhancedChatBot />
    </div>
  );
};

export default Index;
