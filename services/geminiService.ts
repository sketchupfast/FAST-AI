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

// Quality Boosters
const PRO_QUALITY_BOOSTER = ", award-winning architectural photography, 8k, highly detailed, hyper-realistic, sharp focus, perfect lighting, cinematic composition, masterpiece";
const FLASH_QUALITY_BOOSTER = ", masterpiece, best quality, ultra-realistic, 8k, HDR, vivid colors, crisp details, cinematic lighting, award-winning photography";

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
      
      // Increased quality to 0.99 for Paid/Pro usage
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.99);
      
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
      resolve(canvas.toDataURL('image/jpeg', 0.99));
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
  
  // Retry logic for handling transient errors (like 429/503)
  let attempt = 0;
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds

  while (attempt < maxRetries) {
      try {
          return await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: parts }], // Correct structure: Array of Content objects
            config: config,
          });
      } catch (error: any) {
          const errMsg = parseGeminiError(error);
          
          // Fail fast on Daily Limit (unless we are in fallback loop, handled by caller)
          if (errMsg.includes('limit: 0') || errMsg.includes('daily')) {
              throw error; 
          }

          // Retry on rate limits (minute) or server errors
          if (attempt < maxRetries - 1 && (errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('quota'))) {
              const delay = baseDelay * Math.pow(2, attempt);
              console.warn(`API busy (${errMsg}). Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              attempt++;
          } else {
              throw error;
          }
      }
  }
  throw new Error("Max retries exceeded");
};

const parseGeminiError = (error: any): string => {
    let message = error instanceof Error ? error.message : String(error);
    
    if (typeof error === 'object' && error !== null) {
        if ('details' in error && Array.isArray(error.details)) {
             const quotaFailure = error.details.find((d: any) => d['@type']?.includes('QuotaFailure'));
             if (quotaFailure && quotaFailure.violations) {
                 return `Quota exceeded: ${quotaFailure.violations.map((v: any) => v.quotaMetric).join(', ')}`;
             }
        }
        if (!('message' in error)) {
             try { message = JSON.stringify(error); } catch {}
        }
    }
    
    if (message.includes('{') && message.includes('}')) {
        try {
            const jsonMatch = message.match(/(\{.*\})/s); 
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error) {
                    return parsed.error.message || JSON.stringify(parsed.error);
                }
            }
        } catch (e) { /* ignore */ }
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
  modelPreference: 'auto' | 'gemini-3-pro' | 'gemini-2.5-flash' = 'auto',
  apiKey?: string
): Promise<{ data: string; mimeType: string; modelUsed: string }> => {
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

    // INJECT PRO QUALITY BOOSTER to the primary prompt
    const enhancedPrompt = prompt + PRO_QUALITY_BOOSTER;
    parts.push({ text: enhancedPrompt });

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
    let modelUsed = 'Gemini 3 Pro';
    
    // === MODEL SELECTION LOGIC ===
    
    if (modelPreference === 'gemini-2.5-flash') {
         // FORCE FLASH MODE: Skip Pro entirely to save quota/time
         console.log("User preferred Gemini 2.5 Flash. Skipping Pro.");
         modelUsed = 'Gemini 2.5 Flash (Forced)';
         
         const fallbackConfig = { ...config };
         if (fallbackConfig.imageConfig) {
             delete fallbackConfig.imageConfig.imageSize;
         }
         const fallbackParts = JSON.parse(JSON.stringify(parts)); 
         const textPart = fallbackParts.find((p: any) => p.text);
         if (textPart) { textPart.text += FLASH_QUALITY_BOOSTER; }

         response = await generateImageWithModel('gemini-2.5-flash-image', fallbackParts, fallbackConfig, apiKey);
    
    } else {
        // DEFAULT (AUTO) OR FORCE PRO
        try {
            console.log("Attempting generation with gemini-3-pro-image-preview...");
            response = await generateImageWithModel('gemini-3-pro-image-preview', parts, config, apiKey);
        } catch (error: any) {
            // If user specifically requested Pro, throw error (don't fallback)
            if (modelPreference === 'gemini-3-pro') {
                throw error;
            }

            // Auto Fallback Logic
            const errorMessage = parseGeminiError(error);
            console.warn(`Primary model (Gemini 3 Pro) failed: ${errorMessage}. Switching to fallback.`);

            modelUsed = 'Gemini 2.5 Flash';

            const fallbackConfig = { ...config };
            if (fallbackConfig.imageConfig) {
                delete fallbackConfig.imageConfig.imageSize; // Flash doesn't support 2K/4K flag
            }

            const fallbackParts = JSON.parse(JSON.stringify(parts)); 
            const textPart = fallbackParts.find((p: any) => p.text);
            if (textPart) {
                textPart.text += FLASH_QUALITY_BOOSTER;
            }
            
            try {
                console.log("Attempting generation with gemini-2.5-flash-image...");
                response = await generateImageWithModel('gemini-2.5-flash-image', fallbackParts, fallbackConfig, apiKey);
            } catch (fallbackError: any) {
                const fbErrorMsg = parseGeminiError(fallbackError);
                console.error("Fallback failed:", fbErrorMsg);
                
                if (fbErrorMsg.includes('429') || fbErrorMsg.includes('quota') || fbErrorMsg.includes('limit')) {
                    throw new Error("System busy (Quota Exceeded). Please change API Key.");
                }
                if (fbErrorMsg.includes('403') || fbErrorMsg.includes('permission denied')) {
                    throw new Error("Access Denied. Please check your API Key permissions.");
                }
                throw new Error(fbErrorMsg);
            }
        }
    }
    
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI did not generate a response. Please try again.");
    }
    
    const candidate = response.candidates[0];
    
    // Safety check for content
    if (!candidate.content || !candidate.content.parts) {
        if (candidate.finishReason) {
             throw new Error(`Generation stopped. Reason: ${candidate.finishReason}`);
        }
        throw new Error("The AI response contained no image data.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return { 
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
            modelUsed: modelUsed
        };
      }
    }
    
    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Final Error in editImage:", error);
    throw error;
  }
};

export const generateVideo = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string,
    apiKey?: string
  ): Promise<string> => {
    const ai = getAiClient(apiKey);
    
    try {
        const { resizedBase64, resizedMimeType, width, height } = await resizeImage(
            base64ImageData,
            mimeType,
        );
        
        // Determine aspect ratio for Veo (9:16 or 16:9)
        const isPortrait = height > width;
        const aspectRatio = isPortrait ? '9:16' : '16:9';

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: resizedBase64,
                mimeType: resizedMimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoResult = operation.response?.generatedVideos?.[0];
        if (!videoResult || !videoResult.video || !videoResult.video.uri) {
             throw new Error("Video generation failed. No URI returned.");
        }

        const downloadLink = videoResult.video.uri;
        const key = apiKey || (process.env.API_KEY as string);
        
        // Fetch the actual video blob
        const response = await fetch(`${downloadLink}&key=${key}`);
        if (!response.ok) throw new Error("Failed to download video file.");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error("Video Generation Error:", error);
        throw parseGeminiError(error);
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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [{ parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "{}") as AnalysisResult;
    } catch (e) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: [{ parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "{}") as AnalysisResult;
    }

  } catch (error) {
    console.error("Analysis failed:", error);
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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [{ parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "[]") as string[];
    } catch (e) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ inlineData: { data: resizedBase64, mimeType: resizedMimeType } }, { text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: responseSchema },
        });
        return JSON.parse(response.text || "[]") as string[];
    }
  } catch (error) {
    return ["Eye-Level", "Low Angle", "High Angle"];
  }
};