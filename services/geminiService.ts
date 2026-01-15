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

const getCameraPrompt = (config: DesignConfig): string => {
  let camPrompt = "Camera: ";
  const { cameraAngle, cameraVertical, cameraZoom, subjectPosition } = config;

  // Zoom
  if (cameraZoom <= 3) camPrompt += "Close-up detail shot. ";
  else if (cameraZoom <= 7) camPrompt += "Medium waist-up shot. ";
  else camPrompt += "Wide full-body shot. ";

  // Angles
  camPrompt += `Angle: ${cameraAngle} degrees rotation, ${cameraVertical} degrees vertical tilt. `;

  // Positioning
  if (subjectPosition === 'top') {
    camPrompt += "COMPOSITION: Subject positioned at the TOP of the frame. Leave ample negative space at the bottom for text/overlay. ";
  } else if (subjectPosition === 'bottom') {
    camPrompt += "COMPOSITION: Subject positioned at the BOTTOM of the frame. Leave ample negative space at the top for text/overlay. ";
  } else {
    camPrompt += "COMPOSITION: Perfectly centered subject. Symmetrical balance. ";
  }

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

export const constructPrompt = (config: DesignConfig, isRefinement: boolean = false, isVariation: boolean = false, isReformat: boolean = false): string => {
  const niche = NICHES.find(n => n.id === config.niche);
  
  // ---------------------------------------------------------
  // PRIORITY 0: REFORMATTING (ASPECT RATIO CHANGE)
  // ---------------------------------------------------------
  // Logic: STRICT consistency. Do not change the subject. Just extend background.
  if (isReformat) {
      let prompt = `TASK: IMAGE EXTENSION / OUTPAINTING. `;
      prompt += `I have provided an image. You must adapt this EXACT image to the new aspect ratio of ${config.aspectRatio}. `;
      prompt += `CRITICAL: Do NOT change the main subject, their pose, their face, or the core lighting. Keep the central content identical. `;
      prompt += `ACTION: Analyze the background environment and "paint" the missing areas to fit the new frame. `;
      prompt += `If the image is becoming taller, extend the floor/sky. If wider, extend the side environment. `;
      prompt += `Maintain seamless continuity with the original image style. Quality: 8k.`;
      return prompt;
  }

  // ---------------------------------------------------------
  // PRIORITY 1: VARIATION MODE
  // ---------------------------------------------------------
  if (isVariation) {
    return `Create a creative variation of the provided image. Keep the same subject, style, and composition, but change the specific details, pose slightly, and lighting nuance. The goal is to provide an alternative option of the same concept. Quality: 8k.`;
  }

  // ---------------------------------------------------------
  // PRIORITY 2: REFINEMENT / EDIT MODE (Chat Assistant)
  // ---------------------------------------------------------
  if (isRefinement) {
    let prompt = `IMAGE EDITING TASK. `;
    prompt += `I have provided an image. You must EDIT this image based strictly on the user's instruction. `;
    prompt += `User Instruction: "${config.subjectDescription}". `;
    
    prompt += getLightingPrompt(config);
    prompt += getCameraPrompt(config);

    prompt += `Maintain the overall composition, identity, character features, and style of the provided image, ONLY changing what is explicitly requested in the instruction. `;
    prompt += `Quality: 8k, photorealistic.`;
    return prompt;
  }

  // ---------------------------------------------------------
  // PRIORITY 3: CREATION MODE (Standard)
  // ---------------------------------------------------------

  let prompt = `Create a professional high-end advertising image. `;
  
  if (config.subjectDescription) prompt += `Subject: ${config.subjectDescription}. `;
  if (config.secondaryImage) prompt += `Integrate elements/style from the second reference image provided into the main composition. `;

  prompt += getCameraPrompt(config); 
  
  if (niche) prompt += `Style & Ambience: ${niche.promptModifier}. `;
  
  prompt += getLightingPrompt(config);

  prompt += `Background color: ${config.backgroundColor}. Quality: 8k, photorealistic, cinematic.`;

  return prompt;
};

export const generateDesign = async (config: DesignConfig, previousImage?: string, isVariation: boolean = false, isReformat: boolean = false): Promise<string> => {
  try {
    const isRefinement = !!previousImage;
    const prompt = constructPrompt(config, isRefinement, isVariation, isReformat);
    const parts: any[] = [{ text: prompt }];

    if (previousImage) {
        // ---------------------------------------------------------
        // IMAGE-TO-IMAGE FLOW (Refinement, Variation, Reformat)
        // ---------------------------------------------------------
        const base64Data = previousImage.includes('base64,') ? previousImage.split(',')[1] : previousImage;
        parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        
        if (isReformat) parts[0].text += " [SOURCE IMAGE FOR RESIZING]";
        else parts[0].text += " [SOURCE IMAGE]";

    } else {
        // ---------------------------------------------------------
        // TEXT-TO-IMAGE FLOW (Creation)
        // ---------------------------------------------------------
        if (config.subjectImage) {
            const base64Data = config.subjectImage.split(',')[1];
            parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
            parts[0].text += " [IMAGE 1: MAIN SUBJECT]";
        }

        if (config.secondaryImage) {
             const base64Data = config.secondaryImage.split(',')[1];
             parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
             parts[0].text += " [IMAGE 2: REFERENCE STYLE/ELEMENTS]";
        }
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