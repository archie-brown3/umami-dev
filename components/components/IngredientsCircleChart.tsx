import React from "react";

interface IngredientsCircleChartProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

/**
 * A reusable circular chart component that displays the percentage of ingredients available
 */
const IngredientsCircleChart: React.FC<IngredientsCircleChartProps> = ({
  percentage,
  size = "md",
  showPercentage = true,
  className = "",
}) => {
  // Size variants
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  // Font size for percentage text
  const fontSize = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-lg",
  };

  // Determine color based on percentage
  const getChartColor = () => {
    if (percentage >= 75) {
      return "bg-[#8AB39F]"; // Green - healthy/fresh
    } else if (percentage >= 50) {
      return "bg-[#F08C75]"; // Coral-orange - energy/vitality
    } else {
      return "bg-[#935E4C]"; // Terracotta - warmth/earthiness
    }
  };

  // Helper function to calculate coordinates for the pie chart clip path
  const calculateCircleCoordinates = (percent: number): string => {
    // Convert percentage to angle (360 degrees = 100%)
    const angle = (percent / 100) * 360;

    // If angle is in first quadrant (0-90 degrees)
    if (angle <= 90) {
      const radian = (angle * Math.PI) / 180;
      const x = 50 + 50 * Math.sin(radian);
      const y = 50 - 50 * Math.cos(radian);
      return `${x} ${y}, 100% 0%`;
    }
    // If angle is in second quadrant (90-180 degrees)
    else if (angle <= 180) {
      const radian = ((angle - 90) * Math.PI) / 180;
      const x = 100;
      const y = 50 + 50 * Math.sin(radian);
      return `${x} ${y}, 100% 0%`;
    }
    // If angle is in third quadrant (180-270 degrees)
    else if (angle <= 270) {
      const radian = ((angle - 180) * Math.PI) / 180;
      const x = 50 - 50 * Math.sin(radian);
      const y = 100;
      return `100% 0%, 100% 50%, 100% 100%, 50% 100%, ${x} ${y}`;
    }
    // If angle is in fourth quadrant (270-360 degrees)
    else {
      const radian = ((angle - 270) * Math.PI) / 180;
      const x = 0;
      const y = 50 - 50 * Math.sin(radian);
      return `100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%, ${x} ${y}`;
    }
  };

  // Determine text color
  const getTextColor = () => {
    if (percentage >= 75) {
      return "text-[#8AB39F]"; // Green - healthy/fresh
    } else if (percentage >= 50) {
      return "text-[#F08C75]"; // Coral-orange - energy/vitality
    } else {
      return "text-[#935E4C]"; // Terracotta - warmth/earthiness
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex-shrink-0 ${className}`}>
      {/* Background Circle */}
      <div className="absolute inset-0 rounded-full bg-[#E8E3D7]"></div>

      {/* Progress Circle */}
      <div
        className={`absolute inset-0 rounded-full ${getChartColor()} shadow-sm`}
        style={{
          clipPath:
            percentage < 100
              ? `polygon(50% 50%, 50% 0%, ${calculateCircleCoordinates(
                  percentage
                )}%, 50% 50%)`
              : undefined,
        }}
      ></div>

      {/* Inner Circle with Percentage */}
      <div className="absolute inset-0 rounded-full bg-[#FAFAF7] flex items-center justify-center m-[10%]">
        {showPercentage && (
          <div className="text-center">
            <span className={`${fontSize[size]} font-bold ${getTextColor()}`}>
              {percentage}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientsCircleChart;
