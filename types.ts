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
  backgroundColor: string;
  lightingColor: string; 
  lightingDirection: string; 
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
  iconId: string; // Changed to match constants usage
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentTask: string;
}