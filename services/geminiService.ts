import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, GameAction, GeminiSceneResponse, NarrationResponse } from '../types.ts';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sceneSchema = {
    type: Type.OBJECT,
    properties: {
        sceneDescription: {
            type: Type.STRING,
            description: "A compelling description of what happens next as a result of the player's action. Describe the environment, events, and any characters. The tone should match the genre. Do not break the fourth wall. Keep the story moving forward. End with a prompt for the player, asking what they do next.",
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A detailed, descriptive prompt for an AI image generator to create a visual representation of the scene. This prompt should be in English and focus on visual details, style, and atmosphere (e.g., 'Digital painting, cinematic lighting, a lone astronaut stands before a vast, crystalline alien structure on a desolate red planet.').",
        },
    },
    required: ["sceneDescription", "imagePrompt"],
};

const narrationSchema = {
    type: Type.OBJECT,
    properties: {
        script: {
            type: Type.STRING,
            description: "A short, descriptive narration script for a video, based on the user's prompt. The script should be in the same language as the user's prompt.",
        },
        languageCode: {
            type: Type.STRING,
            description: "The BCP-47 language code for the script (e.g., 'en-US', 'hi-IN', 'ur-PK', 'fa-IR').",
        },
    },
    required: ["script", "languageCode"],
};

const generateSceneImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateMultipleImages = async (prompt: string, numberOfImages: number): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
};

export const startVideoGeneration = async (prompt: string) => {
  const operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: prompt,
    config: {
      numberOfVideos: 1
    }
  });
  return operation;
};

export const checkVideoGenerationStatus = async (operation: any) => {
  return await ai.operations.getVideosOperation({ operation: operation });
};

export const generateNarrationScript = async (prompt: string): Promise<NarrationResponse> => {
    const narrationPrompt = `Analyze the following user prompt for a video generation task. Your instructions are:
1. Identify the primary language of the prompt.
2. Determine the appropriate BCP-47 language code for that language (e.g., 'en-US', 'hi-IN', 'ur-PK', 'fa-IR').
3. Write a short, engaging narration script that describes the scene from the prompt. The script MUST be in the same language as the original prompt.
4. Return a single JSON object containing the language code and the script.

User Prompt: "${prompt}"`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: narrationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: narrationSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as NarrationResponse;
    } catch (e) {
        console.error("Failed to parse narration script JSON:", response.text, e);
        // Fallback for safety
        return { script: "Here is your video.", languageCode: 'en-US' };
    }
};


const generateSceneContent = async (prompt: string): Promise<GeminiSceneResponse> => {
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: sceneSchema,
            temperature: 0.8,
            topP: 0.9,
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as GeminiSceneResponse;
        return parsed;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", response.text);
        throw new Error("Received an invalid response from the storyteller.");
    }
};

const createStoryPrompt = (history: (StorySegment | GameAction)[], newAction?: string): string => {
    const systemInstruction = `You are a master storyteller and game master for a dynamic, open-ended text and image adventure game. Your goal is to create an immersive and engaging experience. For each turn, you will receive the story so far and the player's action. You must respond with a valid JSON object matching the provided schema.`;

    let storyContext = "Here is the story so far:\n";
    if (history.length === 0) {
        storyContext += "The story has not yet begun.\n";
    } else {
        history.forEach(item => {
            if (item.type === 'scene') {
                storyContext += `Scene: ${item.text}\n`;
            } else {
                storyContext += `Player Action: ${item.text}\n`;
            }
        });
    }

    const playerPrompt = newAction 
        ? `The player's next action is: "${newAction}". Generate the next part of the story.`
        : "Generate the opening scene for the adventure.";
    
    return `${systemInstruction}\n\n${storyContext}\n${playerPrompt}`;
};

export const getInitialScene = async (genre: string): Promise<StorySegment> => {
    const prompt = `Start a text adventure game in a ${genre} setting. Describe the opening scene and what the player sees. Set a mysterious and intriguing tone.`;
    
    const { sceneDescription, imagePrompt } = await generateSceneContent(prompt);
    const imageUrl = await generateSceneImage(imagePrompt);

    return {
        type: 'scene',
        id: Date.now(),
        text: sceneDescription,
        imageUrl,
    };
};

export const getNextScene = async (history: (StorySegment | GameAction)[], action: string): Promise<StorySegment> => {
    const prompt = createStoryPrompt(history, action);
    
    const { sceneDescription, imagePrompt } = await generateSceneContent(prompt);
    const imageUrl = await generateSceneImage(imagePrompt);

    return {
        type: 'scene',
        id: Date.now(),
        text: sceneDescription,
        imageUrl,
    };
};