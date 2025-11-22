import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// Helper to get a fresh client instance. 
// If a custom apiKey is provided (from UI input), use it.
// Otherwise, fall back to process.env.API_KEY (for dev environment).
const getAiClient = (customApiKey?: string) => {
  // Prioritize the custom key provided by the user in the UI
  if (customApiKey) {
      return new GoogleGenAI({ apiKey: customApiKey });
  }
  
  // Fallback to process.env for development environment
  const envKey = process.env.API_KEY as string;
  if (envKey) {
      return new GoogleGenAI({ apiKey: envKey });
  }

  // If neither exists, we can't proceed, but we'll let the specific function handle the error
  // or return a client that might fail if called.
  throw new Error("API Key is missing. Please provide a valid Gemini API Key.");
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


export const editImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64?: string | null,
  outputSize?: '1K' | '2K' | '4K',
  referenceImage?: { base64: string; mimeType: string } | null,
  apiKey?: string 
): Promise<{ data: string; mimeType: string }> => {
  const ai = getAiClient(apiKey);
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
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts,
      },
      config: config,
    });
    
    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            throw new Error(`Your request was blocked for safety reasons: ${response.promptFeedback.blockReason}. Please modify your prompt or image.`);
        }
        throw new Error("The AI did not generate a response. Please try again with a different prompt.");
    }
    
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const reason = candidate.finishReason;
            if (reason === 'NO_IMAGE') {
                 throw new Error('The AI could not generate an image from this command. Please try a more explicit image editing command.');
            }
            if (reason === 'OTHER') {
                 throw new Error('The AI could not generate an image (Status: OTHER). This often happens with vague prompts or safety filters. Please try rephrasing.');
            }
            throw new Error(`Generation was stopped due to: ${reason}. Please adjust your prompt.`);
        }
        throw new Error("The result generated by the AI is empty or incomplete.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/jpeg'
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
             try {
                 errorMessage = JSON.stringify(error);
             } catch {
                 errorMessage = String(error);
             }
         }
    }

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("You have exceeded your API quota. Please check your billing plan or try again later.");
    }
    
    if (errorMessage.includes('xhr error') || errorMessage.includes('500') || errorMessage.includes('Rpc failed')) {
      throw new Error("A network error occurred. Please check your internet connection or API key.");
    }

    if (error instanceof Error && (
        error.message.startsWith('Your request was blocked') ||
        error.message.startsWith('The AI did not generate') ||
        error.message.startsWith('No image data found') ||
        error.message.startsWith('Failed to load image') ||
        error.message.startsWith('Generation was stopped') ||
        error.message.startsWith('The result generated') ||
        error.message.startsWith('The AI could not generate') ||
        error.message.startsWith('A network error')
    )) {
        throw error;
    }
    
    throw new Error("Image generation failed. The AI may not be able to fulfill this request. Please try a different prompt or image.");
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

    const prompt = "Analyze this photorealistic exterior architectural image. Provide the following information in a structured JSON format: 1. architecturalStyle: Identify the primary architectural style (e.g., Modern, Classic, Minimalist). 2. keyMaterials: List the main visible materials (e.g., Concrete, Wood, Glass). 3. lightingConditions: Describe the lighting (e.g., Bright Daylight, Overcast, Golden Hour). 4. improvementSuggestions: Provide three distinct, creative suggestions to enhance the image. Each suggestion should be a concise, actionable prompt for an image editor. For example: 'Add a modern swimming pool in the foreground' or 'Change the season to autumn with golden leaves on the trees'.";

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
          architecturalStyle: { type: Type.STRING, description: "The primary architectural style of the building." },
          keyMaterials: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of main visible materials." },
          lightingConditions: { type: Type.STRING, description: "The lighting conditions of the scene." },
          improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Three creative, actionable prompts to improve the image." },
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
    if (!text) {
      throw new Error("The AI returned an empty analysis. Please try again.");
    }
    const jsonStr = text.trim().startsWith('```json') ? text.trim().replace(/^```json\n|```$/g, '') : text.trim();
    const parsedResult = JSON.parse(jsonStr) as AnalysisResult;

    if (!parsedResult.architecturalStyle || !parsedResult.improvementSuggestions) {
        throw new Error("The AI returned an incomplete analysis. Please try again.");
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

    const prompt = "Analyze the provided architectural image. Suggest 3 to 5 creative and suitable camera angles for re-rendering the scene. The suggestions should be short, descriptive phrases. Return the result as a JSON array of strings. For example: [\"dramatic low-angle shot\", \"bird's eye view\", \"wide-angle from the left corner\"].";

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
    if (!text) {
      throw new Error("The AI returned empty suggestions. Please try again.");
    }
    const jsonStr = text.trim().startsWith('```json') ? text.trim().replace(/^```json\n|```$/g, '') : text.trim();
    const parsedResult = JSON.parse(jsonStr) as string[];

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API for angle suggestions:", error);
    throw new Error("Failed to get suggestions.");
  }
};