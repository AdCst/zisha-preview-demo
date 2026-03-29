import { ref, onMounted } from 'vue';

// 全局主题状态 - 使用单例确保所有组件共享
const isDark = ref(false);
let isInitialized = false;

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value;
    
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const initTheme = () => {
    if (isInitialized) return;
    isInitialized = true;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      isDark.value = true;
      document.documentElement.classList.add('dark');
    } else {
      isDark.value = false;
      document.documentElement.classList.remove('dark');
    }
  };

  // 确保初始化
  onMounted(() => {
    initTheme();
  });

  return {
    isDark,
    toggleTheme
  };
}
