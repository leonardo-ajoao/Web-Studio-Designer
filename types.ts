export interface DesignConfig {
  subjectImage: string | null;
  secondaryImage: string | null; // New: For merging/reference
  subjectDescription: string;
  isCharacterGen: boolean; // New: Toggles "Identity Preservation" mode
  
  // Camera
  cameraAngle: number; 
  cameraVertical: number;
  cameraZoom: number; 
  
  niche: string;
  
  // Advanced Lighting
  backgroundColor: string;
  lightingColor: string; // New: Specific color for the rim light
  lightingDirection: string; // New: 'top-left', 'center', etc.
  rimLight: boolean;
  fillLight: boolean;
  
  influence: number;
  aspectRatio: AspectRatio;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  isThinking?: boolean;
  timestamp: Date;
}

export interface NicheOption {
  id: string;
  label: string;
  promptModifier: string;
  icon?: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentTask: string;
}