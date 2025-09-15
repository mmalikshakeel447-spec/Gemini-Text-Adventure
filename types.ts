export enum GameState {
  MENU,
  LOADING,
  PLAYING,
  ERROR,
}

export enum AppMode {
  MENU,
  ADVENTURE,
  IMAGE_GENERATOR,
  VIDEO_GENERATOR,
}

export interface StorySegment {
  type: 'scene';
  id: number;
  text: string;
  imageUrl: string;
}

export interface GameAction {
    type: 'action';
    id: number;
    text: string;
}

export interface GeminiSceneResponse {
  sceneDescription: string;
  imagePrompt: string;
}

export interface NarrationResponse {
  script: string;
  languageCode: string;
}
