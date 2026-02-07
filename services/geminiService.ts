
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAgriculturalAdvice(areaSqm: number, cropName: string, soilName: string) {
  const areaRai = (areaSqm / 1600).toFixed(2);
  const prompt = `ในฐานะผู้เชี่ยวชาญด้านเกษตรอัจฉริยะ ให้คำแนะนำการจัดการน้ำสำหรับพื้นที่ปลูก ${cropName} ใน ${soilName} ขนาด ${areaRai} ไร่ (${areaSqm.toFixed(0)} ตร.ม.) ในประเทศไทย:
  1. ปริมาณน้ำที่เหมาะสมต่อวันในแต่ละฤดู (โดยพิจารณาจากลักษณะการกักเก็บน้ำของ ${soilName})
  2. ช่วงเวลาที่ควรให้น้ำดีที่สุด
  3. ข้อควรระวังพิเศษสำหรับพืชชนิดนี้ในดินประเภทนี้
  4. วิธีการตั้งค่าระบบอัตโนมัติให้ประหยัดน้ำที่สุด
  ตอบเป็นภาษาไทยในรูปแบบ JSON ที่มีโครงสร้างอ่านง่าย`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyWaterNeeds: { type: Type.STRING },
            bestTiming: { type: Type.STRING },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            automationTips: { type: Type.STRING }
          },
          required: ["dailyWaterNeeds", "bestTiming", "precautions", "automationTips"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function estimateSoilType(lat: number, lng: number) {
  const prompt = `จากพิกัดละติจูด ${lat} และลองจิจูด ${lng} ในประเทศไทย ให้ระบุประเภทดินที่เป็นไปได้มากที่สุดในบริเวณนี้ (ดินร่วน, ดินเหนียว, หรือดินทราย) พร้อมเหตุผลสั้นๆ 
  ตอบในรูปแบบ JSON: { "soilId": "loam" | "clay" | "sand", "reason": "string" }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            soilId: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["soilId", "reason"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Soil Estimation Error:", error);
    return null;
  }
}
