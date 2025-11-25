import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// Helper to get a fresh client instance with the provided API key or fallback to env
const getAiClient = (apiKey?: string) => {
  const key = apiKey || (process.env.API_KEY as string);
  if (!key) {
      throw new Error("API Key is missing. Please provide a valid Gemini API Key.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const MAX_IMAGE_DIMENSION = 2048; 

export interface AnalysisResult {
  architecturalStyle: string;
  keyMaterials: string[];
  lightingConditions: string;
  improvementSuggestions: string[];
}

const resizeImage = (
  base64Data: string,
  mimeType: string,
): Promise<{ resizedBase64: string; resizedMimeType: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
        resolve({ resizedBase64: base64Data, resizedMimeType: mimeType, width, height });
        return;
      }
      
      if (width > height) {
        if (width > MAX_IMAGE_DIMENSION) {
          height = Math.round(height * (MAX_IMAGE_DIMENSION / width));
          width = MAX_IMAGE_DIMENSION;
        }
      } else {
        if (height > MAX_IMAGE_DIMENSION) {
          width = Math.round(width * (MAX_IMAGE_DIMENSION / height));
          height = MAX_IMAGE_DIMENSION;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context for resizing.'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      resolve({
        resizedBase64: resizedDataUrl.split(',')[1],
        resizedMimeType: 'image/jpeg',
        width,
        height
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing.'));
    };
    img.src = dataUrl;
  });
};

export const cropAndResizeImage = (
  dataUrl: string,
  targetSize: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const [targetWidth, targetHeight] = targetSize.split('x').map(Number);
    if (!targetWidth || !targetHeight) {
      return reject(new Error('Invalid target size format. Expected "WIDTHxHEIGHT".'));
    }

    const img = new Image();
    img.onload = () => {
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = targetWidth / targetHeight;

      let sx = 0, sy = 0, sWidth = sourceWidth, sHeight = sourceHeight;

      if (sourceRatio > targetRatio) {
        sWidth = sourceHeight * targetRatio;
        sx = (sourceWidth - sWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        sHeight = sourceWidth / targetRatio;
        sy = (sourceHeight - sHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context for resizing.'));
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for client-side resizing.'));
    };
    img.src = dataUrl;
  });
};

// Internal function to call the API with a specific model
const generateImageWithModel = async (
  modelName: string,
  parts: any[],
  config: any,
  apiKey?: string
): Promise<GenerateContentResponse> => {
  const ai = getAiClient(apiKey);
  return await ai.models.generateContent({
    model: modelName,
    contents: { parts: parts },
    config: config,
  });
};

const parseGeminiError = (error: any): string => {
    let message = error instanceof Error ? error.message : String(error);
    if (typeof error === 'object' && error !== null && !('message' in error)) {
        try { message = JSON.stringify(error); } catch {}
    }
    
    // Extract useful info from JSON error dumps
    if (message.includes('"message":')) {
        try {
            const jsonMatch = message.match(/\{.*\}/s);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error && parsed.error.message) {
                    return parsed.error.message;
                }
            }
        } catch (e) { /* ignore parsing error */ }
    }
    return message;
};

export const editImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64?: string | null,
  outputSize?: '1K' | '2K' | '4K',
  referenceImage?: { base64: string; mimeType: string } | null,
  apiKey?: string
): Promise<{ data: string; mimeType: string }> => {
  try {
    const { resizedBase64, resizedMimeType, width, height } = await resizeImage(
      base64ImageData,
      mimeType,
    );

    const parts: any[] = [
      {
        inlineData: {
          data: resizedBase64,
          mimeType: resizedMimeType,
        },
      },
    ];

    if (referenceImage) {
        const { resizedBase64: refBase64, resizedMimeType: refMimeType } = await resizeImage(
            referenceImage.base64,
            referenceImage.mimeType
        );
        parts.push({
            inlineData: {
                data: refBase64,
                mimeType: refMimeType
            }
        });
    }

    parts.push({ text: prompt });

    if (maskBase64) {
      parts.push({
        inlineData: {
          data: maskBase64,
          mimeType: 'image/png', 
        },
      });
    }

    const lowerPrompt = prompt.toLowerCase();
    const isHighRes = lowerPrompt.includes('4k') || lowerPrompt.includes('upscale') || lowerPrompt.includes('high resolution');

    const config: any = {
        responseModalities: [Modality.IMAGE],
    };

    const ratio = width / height;
    let targetAspectRatio = "1:1";
    
    const supportedRatios = {
        "1:1": 1,
        "3:4": 3/4,
        "4:3": 4/3,
        "9:16": 9/16,
        "16:9": 16/9
    };
    
    let minDiff = Number.MAX_VALUE;
    for (const [key, val] of Object.entries(supportedRatios)) {
        const diff = Math.abs(ratio - val);
        if (diff < minDiff) {
            minDiff = diff;
            targetAspectRatio = key;
        }
    }

    if (outputSize) {
        config.imageConfig = { 
            imageSize: outputSize,
            aspectRatio: targetAspectRatio 
        };
    } else if (isHighRes) {
        config.imageConfig = { 
            imageSize: '4K',
            aspectRatio: targetAspectRatio
        };
    } else {
        config.imageConfig = {
            aspectRatio: targetAspectRatio
        };
    }

    let response: GenerateContentResponse;
    
    // STRATEGY: Try Gemini 3 Pro -> If Fail -> Silent Switch to Gemini 2.5 Flash
    try {
        console.log("Attempting generation with gemini-3-pro-image-preview...");
        response = await generateImageWithModel('gemini-3-pro-image-preview', parts, config, apiKey);
    } catch (error: any) {
        const errorMessage = parseGeminiError(error);
        console.warn(`Primary model failed: ${errorMessage}. Switching to fallback.`);

        // Fallback Configuration: Gemini 2.5 Flash Image
        // Note: Flash doesn't support 'imageSize' or some advanced configs, so we strip them.
        const fallbackConfig = { ...config };
        if (fallbackConfig.imageConfig) {
            delete fallbackConfig.imageConfig.imageSize;
        }

        // Enhance prompt to help the smaller model perform better
        const fallbackParts = JSON.parse(JSON.stringify(parts)); 
        const textPart = fallbackParts.find((p: any) => p.text);
        if (textPart) {
            textPart.text += ", highly detailed, photorealistic, 8k resolution, professional photography, sharp focus";
        }
        
        try {
            console.log("Attempting generation with gemini-2.5-flash-image...");
            response = await generateImageWithModel('gemini-2.5-flash-image', fallbackParts, fallbackConfig, apiKey);
        } catch (fallbackError: any) {
            const fbErrorMsg = parseGeminiError(fallbackError);
            console.error("Fallback failed:", fbErrorMsg);
            
            // If fallback also fails, we must report an error.
            if (fbErrorMsg.includes('429') || fbErrorMsg.includes('quota')) {
                throw new Error("System busy (Quota Exceeded). Please change API Key.");
            }
            if (fbErrorMsg.includes('403') || fbErrorMsg.includes('permission denied')) {
                throw new Error("Access Denied. Please check your API Key.");
            }
            throw new Error(fbErrorMsg);
        }
    }
    
    // Validate Response
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI did not generate a response. Please try again.");
    }
    
    const candidate = response.candidates[0];
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return { 
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
    
    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Final Error in editImage:", error);
    throw error; // Re-throw to be caught by UI
  }
};

export const analyzeImage = async (
  base64ImageData: string,
  mimeType: string,
  apiKey?: string
): Promise<AnalysisResult> => {
  const ai = getAiClient(apiKey);
  try {
    const { resizedBase64, resizedMimeType } = await resizeImage(
      base64ImageData,
      mimeType,
    );

    const prompt = "Analyze this photorealistic exterior architectural image. Provide the following information in a structured JSON format: 1. architecturalStyle 2. keyMaterials 3. lightingConditions 4. improvementSuggestions.";

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
          architecturalStyle: { type: Type.STRING },
          keyMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
          lightingConditions: { type: Type.STRING },
          improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["architecturalStyle", "keyMaterials", "lightingConditions", "improvementSuggestions"]
    };

    // Try Pro first, fallback to Flash logic if needed (though analysis usually uses text models)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }],
            },
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "{}") as AnalysisResult;
    } catch (e) {
        // Fallback to Flash for analysis
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Text model
            contents: {
                parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }],
            },
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "{}") as AnalysisResult;
    }

  } catch (error) {
    console.error("Analysis failed:", error);
    // Return dummy data to prevent crash
    return {
        architecturalStyle: "Modern",
        keyMaterials: ["Unknown"],
        lightingConditions: "Daylight",
        improvementSuggestions: ["Enhance lighting", "Add landscaping"]
    };
  }
};

export const suggestCameraAngles = async (
  base64ImageData: string,
  mimeType: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAiClient(apiKey);
  try {
    const { resizedBase64, resizedMimeType } = await resizeImage(base64ImageData, mimeType);
    const prompt = "Analyze the image and suggest 3 to 5 creative camera angles. Return as JSON string array.";
    const responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };

    // Try Pro, fallback to Flash
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "[]") as string[];
    } catch (e) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "[]") as string[];
    }
  } catch (error) {
    return ["Eye-Level", "Low Angle", "High Angle"]; // Fallback defaults
  }
};