import { GoogleGenAI } from "@google/genai";
import { DesignConfig } from '../types';
import { NICHES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const enhancePrompt = async (originalText: string): Promise<string> => {
  if (!originalText) return "";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a professional art director. Rewrite this user brief into a detailed image generation prompt focusing on lighting and composition: "${originalText}"`,
    });
    return response.text || originalText;
  } catch (e) {
    return originalText;
  }
};

const getCameraPrompt = (angle: number, vertical: number, zoom: number): string => {
  let camPrompt = "Camera: ";
  // Zoom
  if (zoom <= 3) camPrompt += "Close-up detail shot. ";
  else if (zoom <= 7) camPrompt += "Medium waist-up shot. ";
  else camPrompt += "Wide full-body shot. ";

  // Angles
  camPrompt += `Angle: ${angle} degrees rotation, ${vertical} degrees vertical tilt. `;
  return camPrompt;
};

const getLightingPrompt = (config: DesignConfig): string => {
    let lightPrompt = "";
    
    if (config.rimLight) {
        const directionMap: Record<string, string> = {
            'top-left': 'top left', 'top-center': 'top', 'top-right': 'top right',
            'middle-left': 'left', 'center': 'front', 'middle-right': 'right',
            'bottom-left': 'bottom left', 'bottom-center': 'bottom', 'bottom-right': 'bottom right'
        };
        
        const dir = directionMap[config.lightingDirection] || 'side';
        lightPrompt += `DRAMATIC LIGHTING: Strong volumetric rim light (backlight/contour light) coming from the ${dir}. `;
        lightPrompt += `The rim light color is ${config.lightingColor}. This light should trace the edges of the subject strongly. `;
    }

    if (config.fillLight) {
        lightPrompt += "Add soft, diffused fill light to reveal details in the shadows. ";
    }

    return lightPrompt;
};

export const constructPrompt = (config: DesignConfig, isRefinement: boolean = false): string => {
  const niche = NICHES.find(n => n.id === config.niche);
  
  // ---------------------------------------------------------
  // MODE: CHARACTER GENERATION (IDENTITY SWAP/MERGE)
  // ---------------------------------------------------------
  if (config.isCharacterGen) {
    let prompt = "TASK: IDENTITY PRESERVATION AND CHARACTER GENERATION. ";
    prompt += "I have provided two images. ";
    
    prompt += "STEP 1 - IDENTITY EXTRACTION (IMAGE 1): Analyze the FIRST image provided. Strictly capture the DNA/Identity of this person: their facial features, eye shape, nose structure, mouth, skin tone, ethnicity, age, and hair style. Keep this identity constant. ";
    
    prompt += "STEP 2 - CONTEXT & STYLE EXTRACTION (IMAGE 2): Analyze the SECOND image provided. Ignore the person in it. Extract strictly: the clothing/outfit, the pose, the camera angle, the lighting setup, the background environment, and the artistic style/vibe. ";
    
    prompt += "STEP 3 - SYNTHESIS: Generate a new photorealistic image. Put the Person from Image 1 (Identity) into the Clothing/Pose/Context of Image 2. ";
    prompt += "The result must look like the person from Image 1 is wearing the clothes and performing the action shown in Image 2. ";
    
    if (config.subjectDescription) prompt += `Additional Instructions: ${config.subjectDescription}. `;
    
    prompt += getLightingPrompt(config);
    prompt += `Quality: 8k, photorealistic, cinematic, consistent identity.`;
    return prompt;
  }

  // ---------------------------------------------------------
  // MODE: STANDARD COMPOSITION
  // ---------------------------------------------------------
  let prompt = isRefinement 
    ? `Edit mode. Maintain composition. ` 
    : `Create a professional high-end advertising image. `;
  
  if (config.subjectDescription) prompt += `Subject: ${config.subjectDescription}. `;
  if (config.secondaryImage) prompt += `Integrate elements/style from the second reference image provided into the main composition. `;

  prompt += getCameraPrompt(config.cameraAngle, config.cameraVertical, config.cameraZoom);
  
  if (niche) prompt += `Style: ${niche.promptModifier}. `;
  
  prompt += getLightingPrompt(config);

  prompt += `Background color: ${config.backgroundColor}. Quality: 8k, photorealistic, cinematic.`;

  return prompt;
};

export const generateDesign = async (config: DesignConfig, previousImage?: string): Promise<string> => {
  try {
    const isRefinement = !!previousImage;
    const prompt = constructPrompt(config, isRefinement);
    const parts: any[] = [{ text: prompt }];

    // 1. Primary Image (Subject/Identity)
    if (previousImage) {
        const base64Data = previousImage.includes('base64,') ? previousImage.split(',')[1] : previousImage;
        parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
    } else if (config.subjectImage) {
        const base64Data = config.subjectImage.split(',')[1];
        parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        // Tagging image for the model
        parts[0].text += " [IMAGE 1: MAIN SUBJECT/IDENTITY SOURCE]";
    }

    // 2. Secondary Image (Reference/Style/Pose)
    if (config.secondaryImage) {
         const base64Data = config.secondaryImage.split(',')[1];
         parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
         // Tagging image for the model
         parts[0].text += " [IMAGE 2: REFERENCE STYLE/POSE/CLOTHING]";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: config.aspectRatio }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const upscaleImage = async (base64Image: string): Promise<string> => {
    const parts: any[] = [
        { text: "Upscale this image to 4k, enhancing textures and lighting details." },
        { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
    });
    
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("Upscale failed");
}