import React, { useState } from 'react';
import { generateMultipleImages } from '../services/geminiService.ts';

interface ImageGeneratorScreenProps {
  onBack: () => void;
}

const ImageGeneratorScreen: React.FC<ImageGeneratorScreenProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `gemini-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setImages([]);
    try {
      const generatedImages = await generateMultipleImages(prompt, numImages);
      setImages(generatedImages);
    } catch (err) {
      console.error(err);
      setError("Failed to generate images. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-[60vh]">
      <div className="flex items-center mb-6 relative">
        <button onClick={onBack} title="Back to Menu" className="bg-gray-700 text-white rounded-full p-2 hover:bg-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-amber-200 text-center flex-grow">Image Generator</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion with a cosmic mane / एक शाही शेर जिसमें کائناتی ایال ہے"
            className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            rows={3}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 flex-grow">
            <label htmlFor="numImages" className="font-semibold text-gray-300">Number of images:</label>
            <select
              id="numImages"
              value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              className="bg-gray-700 text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-amber-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-800/50 border border-red-600 text-red-200 p-3 rounded-md mb-6 text-center">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-400 p-8">
            <p className="text-xl font-serif">Conjuring pixels from prompts...</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          {images.map((imgSrc, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border-2 border-gray-700">
              <img src={imgSrc} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button onClick={() => handleDownloadImage(imgSrc, index)} title="Download Image" className="text-white bg-amber-600/80 rounded-full p-3 hover:bg-amber-500/80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ImageGeneratorScreen;