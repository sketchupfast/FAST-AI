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
      
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.99); // High quality input
      
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

// Internal function to call the API with a specific model, including smart retry logic
const generateImageWithModel = async (
  modelName: string,
  parts: any[],
  config: any,
  apiKey?: string,
  retries = 5 // Increased retries
): Promise<GenerateContentResponse> => {
  const ai = getAiClient(apiKey);
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await ai.models.generateContent({
        model: modelName,
        contents: { parts: parts },
        config: config,
      });
    } catch (error: any) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Catch almost any server-side error to trigger retry, except invalid argument
      const isRetryable = 
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') || 
        errorMessage.includes('quota') ||
        errorMessage.includes('503') || 
        errorMessage.includes('500') ||
        errorMessage.includes('Overloaded') ||
        errorMessage.includes('internal');

      if (isRetryable && i < retries) {
         // Exponential backoff: 2s, 4s, 8s, 16s, 32s (capped at 10s for responsiveness)
         const delay = Math.min(Math.pow(2, i + 1) * 1000 + Math.random() * 1000, 10000);
         console.warn(`Model ${modelName} hit rate limit/error. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${retries + 1})`);
         await new Promise(resolve => setTimeout(resolve, delay));
         continue;
      }
      
      throw error;
    }
  }
  throw lastError;
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

    // Add universal quality boosters to the prompt
    const boostedPrompt = `${prompt}, award-winning photography, 8k resolution, highly detailed, photorealistic, cinematic lighting, masterpiece`;
    parts.push({ text: boostedPrompt });

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
    
    // 1. Try Gemini 3 Pro (Best Quality) with retries
    try {
        console.log("Attempting generation with gemini-3-pro-image-preview...");
        response = await generateImageWithModel('gemini-3-pro-image-preview', parts, config, apiKey);
    } catch (error: any) {
        // Check for errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Broad fallback condition: Fallback on ANY error from Pro model except safety blocks
        // This ensures we don't get stuck on Pro model quotas
        const isSafetyError = errorMessage.includes('safety') || errorMessage.includes('blocked');
        
        if (!isSafetyError) {
             console.warn(`Gemini 3 Pro failed (${errorMessage}). Fallback initiated.`);
             
             // 2. Fallback to Gemini 2.5 Flash Image
             // Note: 2.5 Flash Image does not support 'imageSize' config, remove it.
             const fallbackConfig = { ...config };
             if (fallbackConfig.imageConfig) {
                 delete fallbackConfig.imageConfig.imageSize; 
             }

             // Enhance prompt even more for fallback model to compensate quality
             const fallbackParts = parts.map(p => {
                 if (p.text) return { text: p.text + ", hyper-realistic, sharp focus, professional photography, 8k" };
                 return p;
             }); 
             
             try {
                // Wait a split second to let network/account buffer
                await new Promise(r => setTimeout(r, 1000));
                
                // Also use retries for the fallback model
                response = await generateImageWithModel('gemini-2.5-flash-image', fallbackParts, fallbackConfig, apiKey);
             } catch (fallbackError: any) {
                 console.error("Fallback failed:", fallbackError);
                 const fbMsg = fallbackError.message || '';
                 if (fbMsg.includes('429') || fbMsg.includes('RESOURCE_EXHAUSTED')) {
                     throw new Error("Daily API quota exceeded. Please try again tomorrow or use a different API Key.");
                 }
                 throw fallbackError;
             }
        } else {
            throw error;
        }
    }
    
    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            throw new Error(`Your request was blocked for safety reasons: ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("The AI did not generate a response. Please try again.");
    }
    
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const reason = candidate.finishReason;
            if (reason === 'NO_IMAGE') {
                 throw new Error('The AI could not generate an image. Please try a more explicit command.');
            }
            throw new Error(`Generation was stopped due to: ${reason}.`);
        }
        throw new Error("The result generated by the AI is empty.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return { 
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
    
    throw new Error("No image data found in the API response.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    if (!(error instanceof Error) && typeof error === 'object' && error !== null) {
         if ('message' in error) {
             errorMessage = String((error as any).message);
         } else {
             try { errorMessage = JSON.stringify(error); } catch { errorMessage = String(error); }
         }
    }

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Daily API quota exceeded. Please change your API Key or try again tomorrow.");
    }
    
    if (errorMessage.includes('Invalid API Key') || errorMessage.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please check your settings.");
    }
    
    if (errorMessage.includes('xhr error') || errorMessage.includes('500') || errorMessage.includes('Rpc failed')) {
      throw new Error("Network error. Please check your internet connection and try again.");
    }

    if (error instanceof Error) {
        throw error;
    }
    
    throw new Error("Image generation failed.");
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

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: resizedBase64,
              mimeType: resizedMimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("The AI returned an empty analysis.");
    
    const jsonStr = text.trim().startsWith('```json') ? text.trim().replace(/^```json\n|```$/g, '') : text.trim();
    const parsedResult = JSON.parse(jsonStr) as AnalysisResult;

    if (!parsedResult.architecturalStyle || !parsedResult.improvementSuggestions) {
        throw new Error("Incomplete analysis received.");
    }

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    throw new Error("Image analysis failed.");
  }
};

export const suggestCameraAngles = async (
  base64ImageData: string,
  mimeType: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAiClient(apiKey);
  try {
    const { resizedBase64, resizedMimeType } = await resizeImage(
      base64ImageData,
      mimeType,
    );

    const prompt = "Analyze the image and suggest 3 to 5 creative camera angles for re-rendering. Return as JSON string array.";

    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: resizedBase64,
              mimeType: resizedMimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty suggestions.");
    
    const jsonStr = text.trim().startsWith('```json') ? text.trim().replace(/^```json\n|```$/g, '') : text.trim();
    const parsedResult = JSON.parse(jsonStr) as string[];

    if (!Array.isArray(parsedResult)) {
      throw new Error("Invalid format received.");
    }

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API for angles:", error);
    throw new Error("Failed to get suggestions.");
  }
};