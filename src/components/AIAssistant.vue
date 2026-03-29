<template>
  <div class="ai-assistant">
    <!-- 标题栏 -->
    <div class="ai-header" @click="togglePanel">
      <div class="ai-header__info">
        <span class="ai-icon">🤖</span>
        <span class="ai-title">紫砂知音</span>
        <span class="ai-subtitle">AI 文化顾问</span>
      </div>
      <span class="ai-toggle-icon">{{ isOpen ? '▼' : '◀' }}</span>
    </div>

    <!-- 聊天面板 -->
    <div v-if="isOpen" class="ai-panel">
      <!-- 聊天记录 -->
      <div class="ai-messages" ref="messagesContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          class="ai-message"
          :class="msg.type"
        >
          <div class="ai-message__avatar">
            {{ msg.type === 'user' ? '👤' : '🪷' }}
          </div>
          <div class="ai-message__content">
            {{ msg.content }}
          </div>
        </div>
        
        <!-- 正在输入中 -->
        <div v-if="isLoading" class="ai-message assistant">
          <div class="ai-message__avatar">🪷</div>
          <div class="ai-typing">
            <span>紫砂知音正在思考</span>
            <span class="dots">...</span>
          </div>
        </div>
      </div>

      <!-- 快捷问题 -->
      <div class="ai-quick-questions">
        <div 
          v-for="(q, i) in quickQuestions.slice(0, 4)" 
          :key="i"
          class="quick-btn"
          @click="sendQuickQuestion(q)"
        >
          {{ q }}
        </div>
      </div>

      <!-- 输入框 -->
      <div class="ai-input-area">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="询问紫砂文化、器型、养壶知识..."
          class="ai-input"
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <button 
          class="ai-send-btn"
          @click="sendMessage"
          :disabled="isLoading || !inputMessage.trim()"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { aiKnowledge, quickQuestions } from '../data/aiKnowledge.js';
import { useAIAssistant } from '../composables/useAIAssistant.js';

const isOpen = ref(false);
const messages = ref([
  {
    type: 'assistant',
    content: '你好！我是紫砂知音，很高兴为你解答紫砂文化相关问题。你可以问我关于壶型、纹理寓意、泥料特性或养壶知识等问题。'
  }
]);
const inputMessage = ref('');
const messagesContainer = ref(null);

const { callDeepSeek, isLoading, error, hasApiKey } = useAIAssistant();

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const addMessage = (type, content) => {
  messages.value.push({ type, content });
  scrollToBottom();
};

// 发送消息 - 使用真实 DeepSeek API
const sendMessage = async () => {
  const text = inputMessage.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  addMessage('user', text);
  inputMessage.value = '';

  try {
    const response = await callDeepSeek(text, messages.value);
    addMessage('assistant', response);
  } catch (err) {
    addMessage('assistant', `抱歉，出错了：${err.message}`);
  }
};

const sendQuickQuestion = (question) => {
  inputMessage.value = question;
  sendMessage();
};

// 检查 API 配置
const checkApiConfig = () => {
  if (!hasApiKey) {
    addMessage('assistant', '⚠️ 请先配置 DeepSeek API Key。\n\n请在项目根目录创建 .env 文件，并设置 VITE_DEEPSEEK_API_KEY=sk-...');
    return false;
  }
  return true;
};

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.ai-assistant {
  width: 320px;
  border-left: 1px solid #e5e5e5;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
}

.ai-header {
  padding: 16px;
  background: linear-gradient(135deg, #5c3318, #8d5524);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  transition: all 0.2s ease;
}

.ai-header:hover {
  background: linear-gradient(135deg, #4a2a14, #7a4a20);
}

.ai-header__info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-icon {
  font-size: 20px;
}

.ai-title {
  font-weight: 600;
  font-size: 15px;
}

.ai-subtitle {
  font-size: 12px;
  opacity: 0.85;
}

.ai-toggle-icon {
  font-size: 18px;
  transition: transform 0.2s;
}

.ai-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ai-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8f5f0;
}

.ai-message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.ai-message.user {
    margin-left: auto;
    flex-direction: row-reverse;
  }

.ai-message__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ai-message__content {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ai-message.user .ai-message__content {
  background: #5c3318;
  color: white;
}

.ai-typing {
  padding: 12px 16px;
  color: #666;
  font-size: 13px;
}

.dots {
  display: inline-block;
  animation: dots 1.5s infinite;
}

.ai-quick-questions {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  font-size: 12px;
  padding: 6px 12px;
  background: #f0e6d9;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-btn:hover {
  background: #d4c3a8;
  transform: translateY(-1px);
}

.ai-input-area {
  padding: 12px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
}

.ai-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
}

.ai-input:focus {
  border-color: #8d5524;
}

.ai-send-btn {
  padding: 0 20px;
  background: #8d5524;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.ai-send-btn:hover {
  background: #5c3318;
}

.ai-send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
}
</style>
