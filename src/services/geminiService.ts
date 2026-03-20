import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export interface Question {
  text: string;
  difficulty: 'সহজ' | 'মধ্যম' | 'কঠিন';
  year: string | null;
}

export const extractQuestions = async (url: string, chapter: string, studentClass: string): Promise<Question[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Please add it to your secrets.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Analyze the content of the following URL: ${url}
  
  Your task is to find and extract ALL the questions for Class: "${studentClass}" that belong to the chapter: "${chapter}".
  
  For each question found, you must:
  1. Extract the full question text exactly as it appears (it should be in Bengali).
  2. Estimate its difficulty level and return it in Bengali: "সহজ" (Easy), "মধ্যম" (Medium), or "কঠিন" (Hard).
  3. Extract the year it was asked if it's mentioned near the question (e.g., "2022", "PYQ 2019"). If not found, use null.
  
  Return the results as a JSON array of objects with the following keys: "text", "difficulty", "year".
  If no questions are found, return an empty array [].
  
  Note: The chapter name and questions are in Bengali (বাংলা). Please ensure accurate extraction and use ONLY Bengali for the text and difficulty fields.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['সহজ', 'মধ্যম', 'কঠিন'] },
              year: { type: Type.STRING, nullable: true }
            },
            required: ["text", "difficulty", "year"]
          }
        }
      },
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error extracting from ${url}:`, error);
    return [];
  }
};

export const getSolution = async (question: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Provide a detailed, step-by-step solution for the following question in Bengali (বাংলা):
  
  Question: ${question}
  
  Format your response in Markdown. Use clear headings for each step. If there are mathematical formulas, use standard notation. The entire explanation MUST be in Bengali.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "সমাধান তৈরি করা যায়নি।";
  } catch (error) {
    console.error("Error generating solution:", error);
    return "সমাধান তৈরি করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
  }
};

export const getHint = async (question: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Provide a helpful hint or a starting point to solve the following question in Bengali (বাংলা) without giving away the full answer:
  
  Question: ${question}
  
  Format your response in Markdown. The hint MUST be in Bengali.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "কোনো ইঙ্গিত তৈরি করা যায়নি।";
  } catch (error) {
    console.error("Error generating hint:", error);
    return "ইঙ্গিত তৈরি করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
  }
};

export const generateImportantQuestions = async (chapter: string, studentClass: string): Promise<Question[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Generate 5 highly important and frequently asked questions for Class: "${studentClass}", Chapter: "${chapter}" that are NOT typically found in standard PYQ lists but are essential for mastering the topic.
  
  For each question:
  1. Create a clear and challenging question in Bengali (বাংলা).
  2. Assign a difficulty level in Bengali: "সহজ" (Easy), "মধ্যম" (Medium), or "কঠিন" (Hard).
  3. For the "year" field, use "গুরুত্বপূর্ণ প্রশ্ন" (Important Question).
  
  Return the results as a JSON array of objects with the following keys: "text", "difficulty", "year".
  
  Note: The chapter name and questions are in Bengali (বাংলা). Please ensure accurate generation and use ONLY Bengali for the text, difficulty, and year fields.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['সহজ', 'মধ্যম', 'কঠিন'] },
              year: { type: Type.STRING }
            },
            required: ["text", "difficulty", "year"]
          }
        }
      },
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error generating important questions for ${chapter}:`, error);
    return [];
  }
};

export const searchBoardQuestions = async (board: string, chapter: string, studentClass: string): Promise<{ questions: Question[]; sources: { uri: string; title: string }[] }> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10;
  
  const prompt = `Search for ${board} board Class ${studentClass} questions for the chapter "${chapter}" from the last 10 years (${startYear} to ${currentYear}). 
  Find actual questions asked in previous year exams (PYQs).
  
  For each question found:
  1. Extract the full question text in Bengali (বাংলা).
  2. Estimate difficulty in Bengali: "সহজ", "মধ্যম", or "কঠিন".
  3. Identify the year it was asked.
  
  Return the results as a JSON object with a "questions" key (array of objects with "text", "difficulty", "year") and a "sources" key (empty array, I will extract sources from grounding metadata).
  
  Note: Use ONLY Bengali for text and difficulty.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ['সহজ', 'মধ্যম', 'কঠিন'] },
                  year: { type: Type.STRING }
                },
                required: ["text", "difficulty", "year"]
              }
            }
          },
          required: ["questions"]
        }
      },
    });

    const text = response.text || '{"questions": []}';
    const data = JSON.parse(text);
    
    const sources: { uri: string; title: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return { 
      questions: data.questions || [], 
      sources: sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i) // Unique sources
    };
  } catch (error) {
    console.error(`Error searching board questions for ${board} - ${chapter}:`, error);
    return { questions: [], sources: [] };
  }
};

