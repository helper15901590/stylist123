
import { ClothingCategory } from "../types";

/**
 * AliyunStylistService - 负责调用我们的后端代理接口，进而使用阿里云 DashScope API
 */
export class AliyunStylistService {
  private baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';

  /**
   * generateTryOn - 核心方法，发送图像数据给后端
   */
  async generateTryOn(params: {
    personBase64: string;
    clothingItems: Partial<Record<ClothingCategory, string>>;
  }): Promise<string> {
    const { personBase64, clothingItems } = params;

    // 阿里云 aitryon-plus 主要支持上装和下装
    // 我们将 TOP 和 OUTERWEAR 都视为上装（优先选择一个，或者业务上限制）
    const top_garment_base64 = clothingItems['TOP'] || clothingItems['OUTERWEAR'];
    const bottom_garment_base64 = clothingItems['BOTTOM'];

    try {
      // 1. 提交任务
      const submitResponse = await fetch(`${this.baseUrl}/api/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_image_base64: personBase64,
          top_garment_base64,
          bottom_garment_base64,
        }),
      });

      const { task_id, error: submitError } = await submitResponse.json();
      if (submitError) throw new Error(submitError);

      // 2. 轮询任务状态
      let resultUrl = '';
      let attempts = 0;
      const maxAttempts = 60; // 最多轮询 60 次 (约 2-3 分钟)

      while (attempts < maxAttempts) {
        const pollResponse = await fetch(`${this.baseUrl}/api/try-on/${task_id}`);
        const pollData = await pollResponse.json();

        if (pollData.task_status === 'SUCCEEDED') {
          resultUrl = pollData.results[0].url;
          break;
        } else if (pollData.task_status === 'FAILED') {
          throw new Error(pollData.message || 'AI 渲染失败');
        }

        // 等待 3 秒继续轮询
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }

      if (!resultUrl) throw new Error('任务超时，请稍后在历史记录中查看');

      // 阿里云返回的是 URL，我们需要将其转为 Base64 以保持前端逻辑一致
      // 或者直接返回 URL
      return resultUrl;
    } catch (error: any) {
      console.error("Aliyun Try-On Error:", error);
      throw new Error(error.message || "连接阿里云服务失败");
    }
  }
}
