
import { GoogleGenAI, Modality, Type } from "@google/genai";

// It's recommended to initialize the GoogleGenAI client once
// and reuse it throughout your application.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MAX_IMAGE_DIMENSION = 1024; // Max width or height for the largest side

export interface AnalysisResult {
  architecturalStyle: string;
  keyMaterials: string[];
  lightingConditions: string;
  improvementSuggestions: string[];
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
        reject(new Error('ไม่สามารถเข้าถึง context ของ canvas สำหรับการปรับขนาดได้'));
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
      reject(new Error('ไม่สามารถโหลดรูปภาพเพื่อปรับขนาดได้'));
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: apiConfig,
    });
    
    // Check for safety blocks or empty responses BEFORE trying to access candidates
    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            throw new Error(`คำขอของคุณถูกบล็อกเนื่องจากเหตุผลด้านความปลอดภัย: ${response.promptFeedback.blockReason}. กรุณาแก้ไขคำสั่งหรือรูปภาพของคุณ`);
        }
        throw new Error("AI ไม่ได้สร้างการตอบกลับ กรุณาลองอีกครั้งด้วยคำสั่งอื่น");
    }
    
    // Now it's safe to access candidates, but we must also check the content of the candidate
    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        // This case can happen if the generation is blocked for safety reasons on the candidate level
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const reason = candidate.finishReason;
            // Provide a more helpful error for the NO_IMAGE finish reason
            if (reason === 'NO_IMAGE') {
                 throw new Error('AI ไม่สามารถสร้างภาพจากคำสั่งนี้ได้ กรุณาลองใช้คำสั่งที่ชัดเจนเกี่ยวกับการแก้ไขรูปภาพมากขึ้น (เช่น "เปลี่ยนพื้นหลังเป็นชายหาด")');
            }
            throw new Error(`การสร้างภาพถูกหยุดเนื่องจาก: ${reason}. กรุณาปรับเปลี่ยนคำสั่งของคุณ`);
        }
        throw new Error("ผลลัพธ์ที่สร้างโดย AI ว่างเปล่าหรือไม่สมบูรณ์");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    // This should ideally not be reached if the API call is successful and contains an image.
    throw new Error("ไม่พบข้อมูลรูปภาพในการตอบกลับจาก API");

  } catch (error) {
    console.error("Error calling Gemini API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle rate limiting errors (429)
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("คุณใช้โควต้า API เกินกำหนดแล้ว กรุณาตรวจสอบแผนการใช้งาน หรือรอสักครู่แล้วลองอีกครั้ง");
    }
    
    // Handle generic network or server errors (500, xhr)
    if (errorMessage.includes('xhr error') || errorMessage.includes('500')) {
      throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาตรวจสอบอินเทอร์เน็ตของคุณแล้วลองอีกครั้ง");
    }

    // If it's one of our specific, user-friendly errors from the try block, rethrow it
    if (error instanceof Error && (
        error.message.startsWith('คำขอของคุณถูกบล็อก') ||
        error.message.startsWith('AI ไม่ได้สร้างการตอบกลับ') ||
        error.message.startsWith('ไม่พบข้อมูลรูปภาพ') ||
        error.message.startsWith('ไม่สามารถโหลดรูปภาพ') ||
        error.message.startsWith('การสร้างภาพถูกหยุด') ||
        error.message.startsWith('ผลลัพธ์ที่สร้างโดย AI ว่างเปล่า') ||
        error.message.startsWith('AI ไม่สามารถสร้างภาพจากคำสั่งนี้ได้')
    )) {
        throw error;
    }
    
    // Provide a user-friendly generic error message for other cases
    throw new Error("สร้างรูปภาพไม่สำเร็จ AI อาจไม่สามารถทำตามคำขอนี้ได้ กรุณาลองใช้คำสั่งหรือรูปภาพอื่น");
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

    const response = await ai.models.generateContent({
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
    });

    const text = response.text.trim();
    // The text might be wrapped in ```json ... ```, need to strip it.
    const jsonStr = text.startsWith('```json') ? text.replace(/^```json\n|```$/g, '') : text;
    const parsedResult = JSON.parse(jsonStr) as AnalysisResult;

    if (!parsedResult.architecturalStyle || !parsedResult.improvementSuggestions) {
        throw new Error("AI ส่งคืนผลการวิเคราะห์ที่ไม่สมบูรณ์ กรุณาลองอีกครั้ง");
    }

    return parsedResult;

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    // Reuse some of the error handling from editImage
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("คุณใช้โควต้า API เกินกำหนดแล้ว กรุณาตรวจสอบแผนการใช้งาน หรือรอสักครู่แล้วลองอีกครั้ง");
    }
    
    if (errorMessage.includes('xhr error') || errorMessage.includes('500')) {
      throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาตรวจสอบอินเทอร์เน็ตของคุณแล้วลองอีกครั้ง");
    }
    
    throw new Error("การวิเคราะห์ภาพไม่สำเร็จ AI อาจไม่สามารถวิเคราะห์ภาพนี้ได้ กรุณาลองใช้รูปภาพอื่น");
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

    const response = await ai.models.generateContent({
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
    });
    
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