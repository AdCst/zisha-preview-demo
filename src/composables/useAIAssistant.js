import { ref } from 'vue';
import { aiKnowledge } from '../data/aiKnowledge.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.deepseek.com';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const MODEL = import.meta.env.VITE_AI_MODEL || 'deepseek-chat';

export function useAIAssistant() {
  const isLoading = ref(false);
  const error = ref(null);

  // 构建系统提示词
  const buildSystemPrompt = () => {
    return {
      role: 'system',
      content: `${aiKnowledge.systemPrompt}

当前知识库信息：
- 壶型：${Object.values(aiKnowledge.potTypes).join('；')}
- 纹理：梅-坚韧希望；兰-高洁谦和；竹-虚心气节；菊-淡泊坚守。

回答要求：
- 使用简洁自然的语言，不要使用 Markdown 格式（不要用**、#、-等符号）
- 直接用纯文本回答，段落之间用换行分隔
- 保持优雅但不要过度使用古文
- 回答要清晰、有条理`
    };
  };

  // 调用 DeepSeek API
  const callDeepSeek = async (userMessage, history = []) => {
    if (!API_KEY) {
      throw new Error('未配置 DeepSeek API Key，请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY');
    }

    isLoading.value = true;
    error.value = null;

    try {
      // 转换历史消息格式：{type, content} -> {role, content}
      const convertedHistory = history
        .slice(-6) // 保留最近6条对话，避免超长
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const messages = [
        buildSystemPrompt(),
        ...convertedHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 800,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('AI 未返回有效内容');
      }

      // 清理 Markdown 格式和多余符号
      aiResponse = cleanAIResponse(aiResponse);

      return aiResponse;

    } catch (err) {
      error.value = err.message;
      console.error('AI API 调用失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 清理 AI 输出中的 Markdown 和多余格式
  const cleanAIResponse = (text) => {
    return text
      // 移除 Markdown 粗体
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // 移除 Markdown 标题
      .replace(/^#{1,6}\s+/gm, '')
      // 移除列表标记
      .replace(/^[-*+]\s+/gm, '')
      // 移除多余的空格和换行
      .replace(/\n{3,}/g, '\n\n')
      // 清理其他特殊字符
      .replace(/^\s+|\s+$/g, '')
      .trim();
  };

  return {
    callDeepSeek,
    isLoading,
    error,
    hasApiKey: !!API_KEY
  };
}
