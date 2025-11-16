
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// It's recommended to initialize the GoogleGenAI client once
// and reuse it throughout your application.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MAX_IMAGE_DIMENSION = 3840; // Max width or height for the largest side

export interface AnalysisResult {
  architecturalStyle: string;
  keyMaterials: string[];
  lightingConditions: string;
  improvementSuggestions: string[];
}

const RETRY_COUNT = 3; // Total attempts
const RETRY_DELAY = 1000; // 1 second initial delay

/**
 * A wrapper to retry a function that returns a Promise in case of transient errors.
 * @param fn The asynchronous function to execute.
 * @returns A promise that resolves with the result of the function.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message.toLowerCase();
      
      // Don't retry on specific client-side or quota errors that are unlikely to succeed on retry.
      if (
        errorMessage.includes('blocked') ||
        errorMessage.includes('429') || // Rate limit
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('400') // Bad Request (likely a prompt issue, no point retrying)
      ) {
        console.error('Non-retriable error:', errorMessage);
        throw lastError;
      }
      
      console.warn(`Attempt ${i + 1} failed. Retrying in ${RETRY_DELAY * (i + 1)}ms...`);
      // Wait before retrying for server/network errors
      if (i < RETRY_COUNT - 1) {
        await new Promise(res => setTimeout(res, RETRY_DELAY * (i + 1))); // Simple linear backoff
      }
    }
  }
  console.error("All retry attempts failed.");
  throw lastError;
}


/**
 * Resizes an image if it's larger than the specified dimensions.
 * Converts the image to JPEG for better compression.
 * @param base64Data The base64 string of the image.
 * @param mimeType The original MIME type of the image.
 * @returns A promise that resolves to the new base64 string and MIME type.
 */
const resizeImage = (
  base64Data: string,
  mimeType: string,
): Promise<{ resizedBase64: string; resizedMimeType: string }> => {
  return new Promise((resolve, reject) => {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      // If the image is already small enough, no need to resize.
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
        resolve({ resizedBase64: base64Data, resizedMimeType: mimeType });
        return;
      }
      
      // Calculate new dimensions
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
      
      // Always output as JPEG for efficient file size.
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      resolve({
        resizedBase64: resizedDataUrl.split(',')[1],
        resizedMimeType: 'image/jpeg',
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing.'));
    };
    img.src = dataUrl;
  });
};

/**
 * Resizes and crops an image on the client-side to fit target dimensions.
 * @param dataUrl The data URL of the source image.
 * @param targetSize A string representing the target size, e.g., "1920x1080".
 * @returns A promise that resolves to the new data URL of the cropped and resized image.
 */
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

      // Determine cropping dimensions (center crop) to match the target aspect ratio
      if (sourceRatio > targetRatio) {
        // Source image is wider than target aspect ratio, so crop the sides
        sWidth = sourceHeight * targetRatio;
        sx = (sourceWidth - sWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        // Source image is taller than target aspect ratio, so crop the top and bottom
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

      // Draw the cropped portion of the source image onto the canvas, resizing it to the target dimensions
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      // Using JPEG for potentially better file size, with high quality
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
  advancedConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    seed?: number;
  }
): Promise<string> => {
  try {
    const { resizedBase64, resizedMimeType } = await resizeImage(
      base64ImageData,
      mimeType,
    );

    const parts = [
      {
        inlineData: {
          data: resizedBase64,
          mimeType: resizedMimeType,
        },
      },
      {
        text: prompt,
      },
    ];

    if (maskBase64) {
      parts.push({
        inlineData: {
          data: maskBase64,
          mimeType: 'image/png', // Masks are sent as PNG
        },
      });
    }

    const apiConfig: {
        responseModalities: Modality[];
        temperature?: number;
        topK?: number;
        topP?: number;
        seed?: number;
    } = {
        responseModalities: [Modality.IMAGE],
    };

    if (advancedConfig) {
        if (advancedConfig.temperature !== undefined) {
            apiConfig.temperature = advancedConfig.temperature;
        }
        if (advancedConfig.topK !== undefined) {
            apiConfig.topK = advancedConfig.topK;
        }
        if (advancedConfig.topP !== undefined) {
            apiConfig.topP = advancedConfig.topP;
        }
        if (advancedConfig.seed !== undefined && advancedConfig.seed > 0) {
            apiConfig.seed = advancedConfig.seed;
        }
    }

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: apiConfig,
    }));
    
    // Check for safety blocks or empty responses BEFORE trying to access candidates
    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            throw new Error(`Your request was blocked for safety reasons: ${response.promptFeedback.blockReason}. Please modify your prompt or image.`);
        }
        throw new Error("The AI did not generate a response. Please try again with a different prompt.");
    }
    
    // Now it's safe to access candidates, but we must also check the content of the candidate
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        // This case can happen if the generation is blocked for safety reasons on the candidate level
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const reason = candidate.finishReason;
            // Provide a more helpful error for the NO_IMAGE finish reason
            if (reason === 'NO_IMAGE') {
                 throw new Error('The AI could not generate an image from this command. Please try a more explicit image editing command (e.g., "change the background to a beach").');
            }
            throw new Error(`Generation was stopped due to: ${reason}. Please adjust your prompt.`);
        }
        throw new Error("The result generated by the AI is empty or incomplete.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    // This should ideally not be reached if the API call is successful and contains an image.
    throw new Error("No image data found in the API response.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle rate limiting errors (429)
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("You have exceeded your API quota. Please check your billing plan or try again later.");
    }
    
    // Handle generic network or server errors (500, xhr)
    if (errorMessage.includes('xhr error') || errorMessage.includes('500')) {
      throw new Error("A connection error occurred with the AI. Please check your internet and try again.");
    }

    // If it's one of our specific, user-friendly errors from the try block, rethrow it
    if (error instanceof Error && (
        error.message.startsWith('Your request was blocked') ||
        error.message.startsWith('The AI did not generate a response') ||
        error.message.startsWith('No image data found') ||
        error.message.startsWith('Failed to load image') ||
        error.message.startsWith('Generation was stopped') ||
        error.message.startsWith('The result generated by the AI is empty') ||
        error.message.startsWith('The AI could not generate an image from this command')
    )) {
        throw error;
    }
    
    // Provide a user-friendly generic error message for other cases
    throw new Error("Image generation failed. The AI may not be able to fulfill this request. Please try a different prompt or image.");
  }
};

export const analyzeImage = async (
  base64ImageData: string,
  mimeType: string,
): Promise<AnalysisResult> => {
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

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    }));

    if (!response.text) {
      throw new Error("The AI returned an empty analysis. Please try again.");
    }
    const text = response.text.trim();
    // The text might be wrapped in ```json ... ```, need to strip it.
    const jsonStr = text.startsWith('```json') ? text.replace(/^```json\n|```$/g, '') : text;
    const parsedResult = JSON.parse(jsonStr) as AnalysisResult;

    if (!parsedResult.architecturalStyle || !parsedResult.improvementSuggestions) {
        throw new Error("The AI returned an incomplete analysis. Please try again.");
    }

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    // Reuse some of the error handling from editImage
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("You have exceeded your API quota. Please check your billing plan or try again later.");
    }
    
    if (errorMessage.includes('xhr error') || errorMessage.includes('500')) {
      throw new Error("A connection error occurred with the AI. Please check your internet and try again.");
    }
    
    throw new Error("Image analysis failed. The AI may not be able to process this image. Please try another image.");
  }
};

export const suggestCameraAngles = async (
  base64ImageData: string,
  mimeType: string,
): Promise<string[]> => {
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

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    }));
    
    if (!response.text) {
      throw new Error("The AI returned empty suggestions. Please try again.");
    }
    const text = response.text.trim();
    const jsonStr = text.startsWith('```json') ? text.replace(/^```json\n|```$/g, '') : text;
    const parsedResult = JSON.parse(jsonStr) as string[];

    if (!Array.isArray(parsedResult) || parsedResult.some(item => typeof item !== 'string')) {
      throw new Error("AI returned an invalid format for camera angle suggestions.");
    }

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API for angle suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("You have exceeded your API quota. Please check your billing plan or try again later.");
    }
    
    if (errorMessage.includes('xhr error') || errorMessage.includes('500')) {
      throw new Error("A connection error occurred with the AI. Please check your internet and try again.");
    }
    
    throw new Error("Failed to get suggestions. The AI may not be able to process this image. Please try another image.");
  }
};
