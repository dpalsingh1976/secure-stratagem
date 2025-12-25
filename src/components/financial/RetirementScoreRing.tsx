import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RetirementScoreRingProps {
  score: number;
  grade: string;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  showGrade?: boolean;
  className?: string;
}

export function RetirementScoreRing({
  score,
  grade,
  size = 128,
  strokeWidth = 12,
  animated = true,
  showGrade = true,
  className
}: RetirementScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [isAnimationComplete, setIsAnimationComplete] = useState(!animated);
  const [isVisible, setIsVisible] = useState(!animated);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animation duration in ms
  const SCORE_ANIMATION_DURATION = 1200;
  const RING_ANIMATION_DURATION = 1400;

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      setIsVisible(true);
      setIsAnimationComplete(true);
      return;
    }

    // Start entrance animation
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Start score count-up animation
    const animateScore = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / SCORE_ANIMATION_DURATION, 1);
      
      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(easeOut * score);
      
      setDisplayScore(currentScore);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateScore);
      } else {
        setIsAnimationComplete(true);
      }
    };

    // Delay the number animation slightly after entrance
    const scoreTimer = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animateScore);
    }, 300);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(scoreTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animated]);

  // Get color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: 'hsl(142, 76%, 36%)', glow: 'hsl(142, 76%, 36%)' }; // green-600
    if (s >= 70) return { stroke: 'hsl(142, 69%, 45%)', glow: 'hsl(142, 69%, 45%)' }; // green-500
    if (s >= 60) return { stroke: 'hsl(48, 96%, 53%)', glow: 'hsl(48, 96%, 53%)' }; // yellow-400
    if (s >= 50) return { stroke: 'hsl(45, 93%, 47%)', glow: 'hsl(45, 93%, 47%)' }; // yellow-500
    if (s >= 40) return { stroke: 'hsl(38, 92%, 50%)', glow: 'hsl(38, 92%, 50%)' }; // orange-400
    return { stroke: 'hsl(0, 84%, 60%)', glow: 'hsl(0, 84%, 60%)' }; // red-500
  };

  const colors = getScoreColor(score);

  const getGradeColor = () => {
    switch (grade) {
      case 'A': return 'bg-green-600 hover:bg-green-700';
      case 'B': return 'bg-blue-600 hover:bg-blue-700';
      case 'C': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'D': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-red-600 hover:bg-red-700';
    }
  };

  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div 
      className={cn(
        'relative inline-flex flex-col items-center gap-3 transition-all duration-500',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
        className
      )}
    >
      {/* SVG Ring */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
          style={{
            filter: isAnimationComplete ? `drop-shadow(0 0 8px ${colors.glow}40)` : 'none',
            transition: 'filter 0.5s ease-out'
          }}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted/30"
          />
          
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? strokeDashoffset : circumference - (score / 100) * circumference}
            style={{
              transition: animated 
                ? `stroke-dashoffset ${RING_ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) 200ms, stroke 0.3s ease` 
                : 'none'
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span 
            className={cn(
              'font-bold transition-all duration-300',
              size >= 128 ? 'text-3xl' : size >= 96 ? 'text-2xl' : 'text-xl'
            )}
            style={{
              color: isAnimationComplete ? colors.stroke : 'inherit'
            }}
          >
            {displayScore}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>

        {/* Pulse effect on completion */}
        {isAnimationComplete && (
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ 
              backgroundColor: colors.glow,
              animationDuration: '2s',
              animationIterationCount: '1'
            }}
          />
        )}
      </div>

      {/* Grade Badge */}
      {showGrade && (
        <Badge 
          className={cn(
            'text-lg px-4 py-1 font-bold text-white shadow-lg transition-all duration-500',
            getGradeColor(),
            isAnimationComplete 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-2'
          )}
          style={{
            transitionDelay: isAnimationComplete ? '0ms' : '800ms'
          }}
        >
          Grade: {grade}
        </Badge>
      )}
    </div>
  );
}

export default RetirementScoreRing;
