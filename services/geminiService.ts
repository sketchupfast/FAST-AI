
import { Type } from "@google/genai";

// NOTE: We no longer import GoogleGenAI here because we are calling our own backend API.
// This keeps the API Key safe on the server.

const MAX_IMAGE_DIMENSION = 1536;

export interface AnalysisResult {
  architecturalStyle: string;
  keyMaterials: string[];
  lightingConditions: string;
  improvementSuggestions: string[];
}

/**
 * Resizes an image if it's larger than the specified dimensions.
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
      
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
        resolve({ resizedBase64: base64Data, resizedMimeType: mimeType });
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
  maskBase64?: string | null
): Promise<string> => {
  try {
    // 1. Resize logic remains on client-side to save bandwidth
    const { resizedBase64, resizedMimeType } = await resizeImage(
      base64ImageData,
      mimeType,
    );

    // 2. Send data to OUR secure backend API instead of Google directly
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            base64ImageData: resizedBase64,
            mimeType: resizedMimeType,
            prompt: prompt,
            maskBase64: maskBase64
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.image;

  } catch (error) {
    console.error("Error calling Backend API:", error);
    throw new Error(error instanceof Error ? error.message : "Image generation failed.");
  }
};

// Note: For analyzeImage and suggestCameraAngles, ideally you should create separate API routes 
// (e.g., /api/analyze, /api/suggest) similar to /api/generate to secure them as well.
// For now, we will comment them out or you can implement them following the same pattern if needed.
// Leaving placeholders to prevent build errors but they won't work without an API key on the frontend.

export const analyzeImage = async (
  base64ImageData: string,
  mimeType: string,
): Promise<AnalysisResult> => {
    // Placeholder: Needs backend implementation similar to editImage
    throw new Error("Analyze feature requires backend implementation.");
};

export const suggestCameraAngles = async (
  base64ImageData: string,
  mimeType: string,
): Promise<string[]> => {
    // Placeholder: Needs backend implementation similar to editImage
     throw new Error("Suggest feature requires backend implementation.");
};
