import React from 'react';

interface RiskChartProps {
  kind: 'donut' | 'bar';
  valuePct: number;
  caption: string;
  size?: number;
}

const RiskChart: React.FC<RiskChartProps> = ({ kind, valuePct, caption, size = 120 }) => {
  if (kind === 'donut') {
    const circumference = 2 * Math.PI * 45; // radius of 45
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (valuePct / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={45}
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={45}
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {Math.round(valuePct)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center" aria-label={`${valuePct}% ${caption}`}>
          {caption}
        </p>
      </div>
    );
  }

  // Bar chart implementation
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full bg-muted rounded-lg h-8 overflow-hidden">
        <div 
          className="h-full bg-primary rounded-lg transition-all duration-1000 ease-out"
          style={{ width: `${valuePct}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-foreground">{Math.round(valuePct)}%</span>
        <p className="text-sm text-muted-foreground" aria-label={`${valuePct}% ${caption}`}>
          {caption}
        </p>
      </div>
    </div>
  );
};

export default RiskChart;