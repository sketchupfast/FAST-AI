
import { GoogleGenAI, Modality } from "@google/genai";

export default async function handler(req, res) {
  // 1. Allow CORS (เพื่อให้หน้าเว็บเรียกใช้งานได้)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. รับข้อมูลจากหน้าบ้าน
    const { base64ImageData, mimeType, prompt, maskBase64 } = req.body;

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Server API Key is missing' });
    }

    // 3. เรียกใช้งาน Gemini API (ทำงานบน Server อย่างปลอดภัย)
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    
    const parts = [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
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
          mimeType: 'image/png',
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: { responseModalities: [Modality.IMAGE] },
    });

    // 4. ตรวจสอบและส่งข้อมูลกลับ
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.inlineData?.data) {
        const reason = candidate?.finishReason || 'UNKNOWN';
        return res.status(500).json({ error: `Generation failed: ${reason}` });
    }

    const generatedImageBase64 = candidate.content.parts[0].inlineData.data;
    
    return res.status(200).json({ image: generatedImageBase64 });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
