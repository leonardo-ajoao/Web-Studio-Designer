import { NicheOption, DesignConfig } from './types';

export const NICHES: NicheOption[] = [
  {
    id: 'auto',
    label: 'IA Decide',
    promptModifier: 'analyze the subject and context to determine the best professional design style, lighting, and composition automatically for high aesthetic impact',
    iconId: 'wand'
  },
  { 
    id: 'marketing', 
    label: 'Marketing', 
    promptModifier: 'professional digital marketing aesthetic, high conversion, abstract tech elements, deep blue and neon accents, clean typography space',
    iconId: 'megaphone'
  },
  { 
    id: 'dental', 
    label: 'Clínico', 
    promptModifier: 'pristine medical aesthetic, bright white and teal lighting, clean, sterile environment, confident smiling professional vibe',
    iconId: 'stethoscope'
  },
  { 
    id: 'workshop', 
    label: 'Industrial', 
    promptModifier: 'gritty garage texture, dramatic lighting, metallic surfaces, high contrast, warm orange and steel gray tones',
    iconId: 'wrench'
  },
  { 
    id: 'fashion', 
    label: 'Editorial', 
    promptModifier: 'editorial studio lighting, minimal background, focus on texture and fabric, high fashion pose, soft shadows',
    iconId: 'shirt'
  },
  { 
    id: 'tech', 
    label: 'Futurista', 
    promptModifier: 'modern minimalist, isometric 3D elements, glassmorphism, soft gradients, futuristic',
    iconId: 'cpu'
  }
];

export const INITIAL_CONFIG: DesignConfig = {
  subjectImage: null,
  secondaryImage: null,
  subjectDescription: '',
  subjectPosition: 'center', 
  cameraAngle: 0,
  cameraVertical: 0,
  cameraZoom: 5,
  niche: NICHES[0].id,
  backgroundColor: '#111111', 
  lightingColor: '#3b82f6',   // Default to Blue
  lightingDirection: 'top-right',
  rimLight: false,
  fillLight: false,
  influence: 0.5,
  aspectRatio: '1:1',
  imageCount: 1
};

export const PLACEHOLDER_IMAGE = "https://picsum.photos/800/800";