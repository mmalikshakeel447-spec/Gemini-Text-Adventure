import React from 'react';
import { AppMode } from '../types.ts';

interface MenuScreenProps {
  onStartGame?: (genre: string) => void;
  onSelectMode?: (mode: AppMode) => void;
  onBack?: () => void;
  isGenreMenu?: boolean;
  error: string | null;
}

const genres = ['Fantasy', 'Sci-Fi', 'Mystery', 'Cyberpunk'];
const modes = [
  { name: 'Text Adventure', mode: AppMode.ADVENTURE },
  { name: 'Image Generator', mode: AppMode.IMAGE_GENERATOR },
  { name: 'Video Generator', mode: AppMode.VIDEO_GENERATOR },
];

const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame, onSelectMode, onBack, isGenreMenu = false, error }) => {
  const buttonClass = "px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 shadow-lg w-full";

  const renderGenreMenu = () => (
    <>
      <h2 className="text-3xl font-bold text-amber-200 mb-4">Choose a Genre</h2>
      <p className="text-gray-300 mb-8 max-w-2xl">
        What kind of tale will you weave?
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onStartGame?.(genre)}
            className={buttonClass}
          >
            {genre}
          </button>
        ))}
      </div>
       <button onClick={onBack} className="mt-8 text-amber-300 hover:text-amber-200 transition-colors">
        &larr; Back to Main Menu
      </button>
    </>
  );

  const renderMainMenu = () => (
     <>
      <h2 className="text-3xl font-bold text-amber-200 mb-4">Welcome, Creator</h2>
      <p className="text-gray-300 mb-8 max-w-2xl">
        Choose a tool to begin. The world will be crafted by an AI, responding to your every command.
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        {modes.map((mode) => (
          <button
            key={mode.name}
            onClick={() => onSelectMode?.(mode.mode)}
            className={buttonClass}
          >
            {mode.name}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
      {error && (
        <div className="bg-red-800/50 border border-red-600 text-red-200 p-3 rounded-md mb-6 max-w-md w-full">
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
       {isGenreMenu ? renderGenreMenu() : renderMainMenu()}
    </div>
  );
};

export default MenuScreen;
