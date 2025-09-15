import React, { useState, useEffect, useRef } from 'react';
import type { StorySegment, GameAction } from '../types.ts';

interface GameScreenProps {
  storyHistory: (StorySegment | GameAction)[];
  onSendAction: (action: string) => void;
  error: string | null;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ storyHistory, onSendAction, error, onBack }) => {
  const [action, setAction] = useState('');
  const storyEndRef = useRef<HTMLDivElement>(null);

  const lastScene = storyHistory.slice().reverse().find(item => item.type === 'scene') as StorySegment | undefined;

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyHistory]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!action.trim()) return;
    onSendAction(action);
    setAction('');
  };

  const handleDownloadImage = () => {
    if (!lastScene?.imageUrl) return;
    const link = document.createElement('a');
    link.href = lastScene.imageUrl;
    link.download = `gemini-adventure-scene-${lastScene.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[85vh] relative">
      <button onClick={onBack} title="Back to Menu" className="absolute top-3 left-3 z-20 bg-gray-900/60 text-white rounded-full p-2 hover:bg-gray-800/80 backdrop-blur-sm transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="flex-shrink-0 relative">
        {lastScene?.imageUrl && (
          <>
            <img
              src={lastScene.imageUrl}
              alt="Current Scene"
              className="w-full h-48 md:h-64 object-cover"
            />
            <button onClick={handleDownloadImage} title="Download Image" className="absolute bottom-3 right-3 z-20 bg-gray-900/60 text-white rounded-full p-2 hover:bg-gray-800/80 backdrop-blur-sm transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          </>
        )}
      </div>
      <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-800/50">
        <div className="space-y-6">
          {storyHistory.map((item) => {
            if (item.type === 'scene') {
              return (
                <div key={item.id} className="text-gray-300 font-serif text-lg leading-relaxed animate-fade-in">
                  <p>{item.text}</p>
                </div>
              );
            }
            return (
              <div key={item.id} className="text-right animate-fade-in">
                <p className="inline-block bg-amber-800/50 text-amber-200 font-mono italic p-2 rounded-md">
                  &gt; {item.text}
                </p>
              </div>
            );
          })}
        </div>
        <div ref={storyEndRef} />
      </div>
      <div className="flex-shrink-0 p-4 bg-gray-900 border-t border-gray-700">
        {error && (
            <div className="bg-red-800/50 border border-red-600 text-red-200 p-2 rounded-md mb-3 text-sm">
                {error}
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="What do you do next?"
              className="flex-grow bg-transparent text-gray-200 placeholder-gray-400 p-3 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameScreen;
