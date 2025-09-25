import { useEffect, useState } from "react";

interface RiskProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showScore?: boolean;
  label?: string;
}

const RiskProgressRing = ({ 
  score, 
  size = 120, 
  strokeWidth = 8, 
  className = "",
  showScore = true,
  label
}: RiskProgressRingProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 80) return { color: "rgb(220, 38, 38)", bg: "rgb(254, 242, 242)" }; // Critical - Red
    if (score >= 60) return { color: "rgb(234, 88, 12)", bg: "rgb(255, 247, 237)" }; // High - Orange  
    if (score >= 40) return { color: "rgb(202, 138, 4)", bg: "rgb(254, 252, 232)" }; // Medium - Yellow
    return { color: "rgb(5, 150, 105)", bg: "rgb(240, 253, 250)" }; // Low - Green
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  const colors = getColor(score);
  const riskLevel = getRiskLevel(score);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = score / 50; // Animation duration control
      const animate = () => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
        } else {
          setAnimatedScore(current);
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, 200);

    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(241, 245, 249)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1))"
            }}
          />
        </svg>
        
        {/* Score display */}
        {showScore && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: colors.color }}>
              {Math.round(animatedScore)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              RISK SCORE
            </span>
          </div>
        )}
      </div>
      
      {/* Risk level indicator */}
      {label && (
        <div className="mt-3 text-center">
          <div 
            className="inline-block px-3 py-1 rounded-full text-sm font-medium border"
            style={{ 
              color: colors.color,
              backgroundColor: colors.bg,
              borderColor: colors.color + "40"
            }}
          >
            {riskLevel} Risk
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {label}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskProgressRing;