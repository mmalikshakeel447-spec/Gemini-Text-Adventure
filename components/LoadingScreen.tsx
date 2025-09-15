import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
      <div className="text-2xl font-serif">
        The story unfolds
        <span className="animate-pulse">.</span>
        <span className="animate-pulse delay-150">.</span>
        <span className="animate-pulse delay-300">.</span>
      </div>
      <p className="mt-4 text-sm">Crafting the next chapter of your adventure...</p>
    </div>
  );
};

export default LoadingScreen;
