import React, { useState, useEffect, useRef } from 'react';
import { startVideoGeneration, checkVideoGenerationStatus, generateNarrationScript } from '../services/geminiService.ts';
import type { NarrationResponse } from '../types.ts';

interface VideoGeneratorScreenProps {
  onBack: () => void;
}

const loadingMessages = [
    "Warming up the digital director...",
    "Rendering the first few frames...",
    "Consulting with the AI muse...",
    "Splicing cinematic sequences...",
    "This can take a few minutes, thank you for your patience!",
    "Adding a touch of digital magic...",
];

const VideoGeneratorScreen: React.FC<VideoGeneratorScreenProps> = ({ onBack }) => {
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [narration, setNarration] = useState<NarrationResponse | null>(null);
    const [isNarrating, setIsNarrating] = useState(false);
    
    const operationRef = useRef<any>(null);
    const pollIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        let messageIntervalId: number;
        if (isLoading) {
            messageIntervalId = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 4000);
        }
        return () => {
            if (messageIntervalId) clearInterval(messageIntervalId);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            window.speechSynthesis.cancel();
        };
    }, [isLoading]);

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };
    
    const handleNarration = () => {
        if (!narration) return;

        if (isNarrating) {
            window.speechSynthesis.cancel();
            setIsNarrating(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(narration.script);
            utterance.lang = narration.languageCode;
            utterance.onend = () => setIsNarrating(false);
            utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
              console.error(`Speech synthesis error: ${event.error}`, event);
              let userErrorMessage = "Could not play narration. Your browser may not support this language or an unknown error occurred.";
              switch (event.error) {
                  case 'not-allowed':
                      userErrorMessage = "Narration blocked. Please interact with the page first or check your browser's autoplay settings.";
                      break;
                  // FIX: Corrected SpeechSynthesisErrorCode from 'lang-unavailable' to 'language-unavailable'.
                  case 'language-unavailable':
                      userErrorMessage = `The narration language (${utterance.lang}) is not supported by your browser's speech synthesis engine.`;
                      break;
                  case 'synthesis-failed':
                      userErrorMessage = "The speech synthesis engine failed. Please try again later.";
                      break;
                  case 'network':
                      userErrorMessage = "A network error occurred while fetching speech. Please check your connection.";
                      break;
                  case 'canceled':
                      // This can happen if we stop it ourselves, so don't show an error.
                      setIsNarrating(false);
                      return;
              }
              setError(userErrorMessage);
              setIsNarrating(false);
            };
            window.speechSynthesis.speak(utterance);
            setIsNarrating(true);
        }
    };

    const pollForVideo = async () => {
        if (!operationRef.current) {
            stopPolling();
            return;
        };
        try {
            const updatedOperation = await checkVideoGenerationStatus(operationRef.current);
            operationRef.current = updatedOperation;

            if (updatedOperation.done) {
                stopPolling();
                const downloadLink = updatedOperation.response?.generatedVideos?.[0]?.video?.uri;
                if (downloadLink) {
                    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    setVideoUrl(objectUrl);
                    
                    try {
                        const narrationData = await generateNarrationScript(prompt);
                        setNarration(narrationData);
                    } catch (narrationError) {
                        console.error("Failed to generate narration:", narrationError);
                        // Don't block video, just show an error for narration.
                        setError("Video generated, but failed to create narration.");
                    }
                } else {
                    const errorMsg = "Video generation finished, but no video was returned. The prompt may have been rejected.";
                    console.error(errorMsg, updatedOperation);
                    setError(errorMsg);
                }
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Error during polling:", err);
            setError("An error occurred while checking video status.");
            setIsLoading(false);
            stopPolling();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError("Please enter a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setNarration(null);
        setLoadingMessage(loadingMessages[0]);
        try {
            const initialOperation = await startVideoGeneration(prompt);
            operationRef.current = initialOperation;
            pollIntervalRef.current = window.setInterval(pollForVideo, 10000);
        } catch (err) {
            console.error(err);
            setError("Failed to start video generation. Please try again.");
            setIsLoading(false);
        }
    };
    
    const handleDownloadVideo = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = 'gemini-video.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-6 min-h-[60vh]">
            <div className="flex items-center mb-6 relative">
                <button onClick={onBack} title="Back to Menu" className="bg-gray-700 text-white rounded-full p-2 hover:bg-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-amber-200 text-center flex-grow">Video Generator</h2>
            </div>
            
            {!isLoading && !videoUrl && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                    <div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A neon hologram of a cat driving at top speed / उदा. बिल्ली तेज़ रफ़्तार से गाड़ी चला रही है"
                            className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-amber-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                            Generate Video
                        </button>
                    </div>
                </form>
            )}

            {error && (
                <div className="bg-red-800/50 border border-red-600 text-red-200 p-3 rounded-md my-6 text-center">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="text-center text-gray-400 p-8 flex flex-col items-center justify-center min-h-[40vh]">
                    <div className="text-2xl font-serif mb-4">
                        Weaving your vision into video...
                    </div>
                    <p className="text-amber-300 animate-pulse">{loadingMessage}</p>
                </div>
            )}

            {videoUrl && (
                <div className="animate-fade-in text-center">
                    <video src={videoUrl} controls autoPlay loop className="w-full max-w-2xl mx-auto rounded-lg border-2 border-gray-700 mb-4" />
                    <div className="flex justify-center items-center gap-4">
                      {narration && (
                          <button
                              onClick={handleNarration}
                              title={isNarrating ? 'Stop Narration' : 'Play Narration'}
                              className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center gap-2"
                          >
                              {isNarrating ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                              }
                              <span>{isNarrating ? 'Stop' : 'Play Narration'}</span>
                          </button>
                      )}
                      <button
                          onClick={handleDownloadVideo}
                          className="bg-amber-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                          Download Video
                      </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGeneratorScreen;