import { useState } from "react";
import { Shield, Target, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedAssessmentModal from "@/components/EnhancedAssessmentModal";
import BookingCalendar from "@/components/BookingCalendar";
import ManageAppointments from "@/components/ManageAppointments";

const Hero = () => {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
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
            Get a comprehensive personalized risk assessment across Life Insurance, Longevity, Market, and Tax risks. 
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
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={() => setIsBookingOpen(true)}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Strategy Session
            </Button>
          </div>

          {/* Manage Appointments Link */}
          <div className="text-center">
            <button 
              onClick={() => setIsManageOpen(true)}
              className="text-white/80 hover:text-white underline text-sm transition-colors"
            >
              Already have an appointment? Manage it here
            </button>
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
      
      <BookingCalendar 
        open={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
      />
      
      <ManageAppointments 
        open={isManageOpen} 
        onOpenChange={setIsManageOpen} 
      />
    </section>
  );
};

export default Hero;