import React, { useState, useCallback } from 'react';
import { GameState, StorySegment, GameAction, AppMode } from './types.ts';
import { getInitialScene, getNextScene } from './services/geminiService.ts';
import GameScreen from './components/GameScreen.tsx';
import MenuScreen from './components/MenuScreen.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';
import ImageGeneratorScreen from './components/ImageGeneratorScreen.tsx';
import VideoGeneratorScreen from './components/VideoGeneratorScreen.tsx';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.MENU);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [storyHistory, setStoryHistory] = useState<(StorySegment | GameAction)[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = useCallback(async (genre: string) => {
    setGameState(GameState.LOADING);
    setError(null);
    setStoryHistory([]);
    try {
      const initialScene = await getInitialScene(genre);
      setStoryHistory([initialScene]);
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setError('Failed to start the adventure. Please check your API key and try again.');
      setGameState(GameState.MENU);
    }
  }, []);

  const handleSendAction = useCallback(async (action: string) => {
    setGameState(GameState.LOADING);
    setError(null);
    const newAction: GameAction = { type: 'action', text: action, id: Date.now() };
    const currentHistory = [...storyHistory, newAction];
    setStoryHistory(currentHistory);
    
    try {
      const nextScene = await getNextScene(currentHistory, action);
      setStoryHistory(prev => [...prev, nextScene]);
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setError('The story could not continue. An unexpected error occurred.');
      setGameState(GameState.PLAYING);
    }
  }, [storyHistory]);

  const handleBackToMenu = () => {
    setAppMode(AppMode.MENU);
    setGameState(GameState.MENU);
    setStoryHistory([]);
    setError(null);
  }
  
  const renderAdventure = () => {
     switch (gameState) {
      case GameState.LOADING:
        return <LoadingScreen />;
      case GameState.PLAYING:
        return <GameScreen storyHistory={storyHistory} onSendAction={handleSendAction} error={error} onBack={handleBackToMenu} />;
      case GameState.MENU:
      default:
        return <MenuScreen onStartGame={handleStartGame} error={error} onBack={handleBackToMenu} isGenreMenu={true} />;
    }
  }

  const renderContent = () => {
    switch (appMode) {
      case AppMode.ADVENTURE:
        return renderAdventure();
      case AppMode.IMAGE_GENERATOR:
        return <ImageGeneratorScreen onBack={handleBackToMenu} />;
      case AppMode.VIDEO_GENERATOR:
        return <VideoGeneratorScreen onBack={handleBackToMenu} />;
      case AppMode.MENU:
      default:
        return <MenuScreen onSelectMode={setAppMode} error={error} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-300 tracking-wider font-serif">Gemini Creative Suite</h1>
          <p className="text-gray-400 mt-2">Your Multilingual AI-Powered Creation Studio</p>
        </header>
        <main className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl shadow-black/30 overflow-hidden">
          {renderContent()}
        </main>
        <footer className="text-center mt-6 text-gray-500 text-sm">
            <p>Powered by Google Gemini. All content is AI-generated.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;