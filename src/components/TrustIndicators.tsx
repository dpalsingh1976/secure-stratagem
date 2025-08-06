import { Shield, Users, Award, Lock, CheckCircle, Star } from "lucide-react";

const TrustIndicators = () => {
  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Families Protected",
      color: "text-primary"
    },
    {
      icon: Shield,
      number: "256-bit", 
      label: "SSL Encryption",
      color: "text-secondary"
    },
    {
      icon: Award,
      number: "4.9/5",
      label: "User Rating",
      color: "text-accent"
    },
    {
      icon: CheckCircle,
      number: "100%",
      label: "Privacy Guarantee",
      color: "text-primary"
    }
  ];

  const features = [
    "No personal data stored permanently",
    "Used by licensed financial professionals",
    "Compliant with industry regulations",
    "Instant secure analysis",
    "No credit card required",
    "Cancel anytime"
  ];

  return (
    <section className="section-padding bg-muted/20">
      <div className="container-financial">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-heading">
            Trusted by Thousands of Families
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the growing community of families who have taken control of their financial future 
            with our comprehensive risk assessment.
          </p>
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label}
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-background shadow-lg border border-border">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 font-heading">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((feature, index) => (
            <div 
              key={feature}
              className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border shadow-sm animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
              <span className="text-foreground font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Testimonial section */}
        <div className="max-w-4xl mx-auto">
          <div className="card-financial bg-gradient-card text-center">
            <div className="flex justify-center mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-accent fill-current" />
                ))}
              </div>
            </div>
            
            <blockquote className="text-xl text-foreground mb-6 font-medium leading-relaxed">
              "The risk assessment opened our eyes to gaps we never knew existed. 
              The personalized recommendations gave us a clear roadmap to protect our family's future."
            </blockquote>
            
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                MJ
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Michael & Jennifer</div>
                <div className="text-sm text-muted-foreground">Parents of 2, Denver, CO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16 opacity-60">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="text-sm font-medium">SSL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Privacy Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">Industry Certified</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;