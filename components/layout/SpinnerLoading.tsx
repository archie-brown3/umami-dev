import React from "react";

/**
 * Simple loading spinner component
 */
export const SpinnerLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white dark:bg-slate-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};
