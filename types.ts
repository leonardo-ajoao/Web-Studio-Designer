export interface DesignConfig {
  subjectImage: string | null;
  secondaryImage: string | null; 
  subjectDescription: string;
  
  // Composition
  subjectPosition: 'center' | 'top' | 'bottom';

  // Camera
  cameraAngle: number; 
  cameraVertical: number;
  cameraZoom: number; 
  
  niche: string; // Ambientação / Style
  
  // Advanced Lighting
  studioLightActive: boolean; // New: Master toggle for lighting section
  backgroundColor: string;
  lightingColor: string; 
  lightingDirection: string; 
  rimLight: boolean;
  fillLight: boolean;
  
  influence: number;
  aspectRatio: AspectRatio;
  
  // New: Number of images to generate
  imageCount: 1 | 2 | 3 | 4;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  imageCandidates?: string[]; 
  isThinking?: boolean;
  timestamp: Date;
}

export interface NicheOption {
  id: string;
  label: string;
  promptModifier: string;
  iconId: string; 
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentTask: string;
}

export interface ProjectState {
  id: string;
  name: string;
  timestamp: Date;
  config: DesignConfig;
  history: string[];
  lastImage: string | null;
  messages: Message[];
}