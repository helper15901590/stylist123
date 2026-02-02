
import { GoogleGenAI } from "@google/genai";
import { ClothingCategory } from "../types";

/**
 * GeminiStylistService - 负责调用 Google Gemini API 进行图像合成与虚拟试穿
 */
export class GeminiStylistService {
  /**
   * generateTryOn - 核心方法，发送图像数据和提示词给 AI
   * @param params 包含模特图、衣物项、场景图（均为 Base64）
   * @returns 合成后的图像 Base64 URL
   */
  async generateTryOn(params: {
    personBase64: string;
    clothingItems: Partial<Record<ClothingCategory, string>>;
    scenarioImageBase64?: string;
  }): Promise<string> {
    const { personBase64, clothingItems, scenarioImageBase64 } = params;

    // 每次生成时创建新的实例，确保使用的是最新的 API KEY 且符合 SDK 实例化规范
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // 构建多模态输入 Part 数组
    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: personBase64,
        },
      },
    ];

    // 构建引导词，使用英文以获得模型更精准的图像理解力
    let prompt = "You are a professional AI fashion stylist. Perform a realistic high-end virtual try-on. ";
    prompt += "Image 1 is the base person. Subsequent images are the apparel items to be layered correctly on that person. ";

    // 衣物分类对应的语义标签
    const categories: { key: ClothingCategory; label: string }[] = [
      { key: 'HEADWEAR', label: 'headwear' },
      { key: 'EARRINGS', label: 'earrings' },
      { key: 'NECKLACE', label: 'necklace' },
      { key: 'TOP', label: 'top/shirt' },
      { key: 'OUTERWEAR', label: 'jacket/outerwear' },
      { key: 'BOTTOM', label: 'pants/bottom' },
      { key: 'BAG', label: 'bag' },
      { key: 'SHOES', label: 'shoes' },
      { key: 'HAND_ACC', label: 'watch/accessory' },
    ];

    // 遍历已选衣物，按顺序添加进多模态输入
    categories.forEach(({ key, label }) => {
      const data = clothingItems[key];
      if (data) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: data,
          },
        });
        prompt += `Dress the person in the provided ${label}. `;
      }
    });

    // 处理背景/场景
    if (scenarioImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: scenarioImageBase64,
        },
      });
      prompt += "Place the final styled person into this provided background scene. ";
    } else {
      prompt += "Use a clean, professional minimalist fashion studio background. ";
    }

    // 关键质量控制指令
    prompt += "Maintain realistic fabric physics, perfect layering (outerwear over shirts), matching lighting, and high fidelity. Output ONLY the resulting final composite image.";

    parts.push({ text: prompt });

    try {
      // 使用图像专用模型 gemini-2.5-flash-image
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts },
      });

      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts) {
        throw new Error("模型响应为空");
      }

      // 寻找并提取返回的 inlineData 图像数据
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      throw new Error("AI 未能返回生成的图像，请尝试更换图片或稍后重试");
    } catch (error: any) {
      console.error("Gemini Try-On API Error:", error);
      throw new Error(error.message || "连接 AI 服务失败");
    }
  }
}
