import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Converts a File object to a Base64 string for Gemini consumption.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeFileWithGemini = async (file: File): Promise<AIAnalysisResult | null> => {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const isImage = file.type.startsWith('image/');
    
    // Schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description: "A concise summary of the file content.",
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Up to 5 relevant tags for categorization.",
        },
      },
      required: ["description", "tags"],
    };

    let prompt = `Analyze this file named "${file.name}". `;
    const parts: any[] = [];

    if (isImage) {
        prompt += "Describe the image visually and suggest tags.";
        const imagePart = await fileToGenerativePart(file);
        parts.push(imagePart);
    } else {
        // For non-images (videos/docs in this frontend-only demo), we rely on metadata/name
        // In a real app with backend, we would extract frames or text.
        prompt += "Based on the filename and file type, suggest a likely description and organizational tags. Be creative but realistic.";
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};