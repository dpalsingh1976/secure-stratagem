import { Heart, Clock, TrendingDown, Receipt } from "lucide-react";


const RiskCategories = () => {
  const categories = [
    {
      icon: Heart,
      title: "Life Insurance Risk",
      subtitle: "30% Weight",
      description: "Analyze your family's financial protection gap and the cost of waiting to secure adequate coverage.",
      riskFactors: ["Income replacement needs", "Dependent coverage", "Debt obligations", "Premium increases with age"],
      color: "text-risk-critical",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      icon: Clock,
      title: "Longevity Risk",
      subtitle: "30% Weight", 
      description: "Evaluate if your retirement savings will last throughout your entire lifetime given current market conditions.",
      riskFactors: ["Retirement income gap", "Life expectancy trends", "Healthcare costs", "Inflation impact"],
      color: "text-risk-high",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      icon: TrendingDown,
      title: "Market Risk",
      subtitle: "20% Weight",
      description: "Assess portfolio volatility and sequence of returns risk based on your age and investment allocation.",
      riskFactors: ["Portfolio concentration", "Time horizon", "Market volatility", "Economic cycles"],
      color: "text-risk-medium",
      bgColor: "bg-yellow-50", 
      borderColor: "border-yellow-200"
    },
    {
      icon: Receipt,
      title: "Tax Risk",
      subtitle: "20% Weight",
      description: "Examine tax diversification and potential future tax burden on your retirement income and estate.",
      riskFactors: ["Account diversification", "Future tax rates", "Income brackets", "Estate planning"],
      color: "text-risk-low",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    }
  ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-financial">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-heading">
            Four Critical Risk Areas We Analyze
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our advanced platform evaluates your financial risks across these interconnected areas 
            to provide a comprehensive protection strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div 
                key={category.title}
                className="card-financial hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${category.bgColor} ${category.borderColor} border-2`}>
                    <Icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-foreground font-heading flex items-center gap-2">
                        {category.title}
                      </h3>
                      <span className="text-sm font-medium text-muted-foreground px-2 py-1 bg-muted rounded-full">
                        {category.subtitle}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Key Risk Factors:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                        {category.riskFactors.map((factor, factorIndex) => (
                          <li key={factorIndex} className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full border border-primary/20">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-primary font-medium">
              Assessment takes less than 5 minutes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RiskCategories;