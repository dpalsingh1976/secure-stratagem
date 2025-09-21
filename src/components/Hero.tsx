import { useState } from "react";
import { Shield, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedAssessmentModal from "@/components/EnhancedAssessmentModal";

const Hero = () => {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-95"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container-financial text-center text-white">
        <div className="animate-fade-in-up">

          <h1 className="text-financial-hero text-balance mb-6 font-heading">
            Discover Your Hidden
            <span className="text-accent block sm:inline"> Financial Risks</span>
          </h1>
          
          <p className="text-financial-subtitle text-balance mb-8 max-w-3xl mx-auto opacity-95">
            Get a comprehensive AI-powered risk assessment across Life Insurance, Longevity, Market, and Tax risks. 
            Personalized insights in under 5 minutes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="btn-accent text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={() => setIsAssessmentOpen(true)}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Start Free Risk Assessment
            </Button>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
      
      <EnhancedAssessmentModal 
        open={isAssessmentOpen} 
        onOpenChange={setIsAssessmentOpen} 
      />
    </section>
  );
};

export default Hero;