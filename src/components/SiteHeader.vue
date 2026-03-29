<template>
  <header class="site-header">
    <span class="site-title">紫砂壶定制预览</span>
    <div class="header-right">
      <nav class="site-nav">
        <RouterLink
          class="nav-link"
          to="/"
          exact-active-class="nav-link--active"
        >
          定制预览
        </RouterLink>
        <RouterLink class="nav-link" to="/culture" active-class="nav-link--active">
          文化介绍
        </RouterLink>
      </nav>
      <button 
        class="theme-toggle" 
        @click="toggleTheme"
        :title="isDark ? '切换到白天模式' : '切换到黑夜模式'"
      >
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js';

const { isDark, toggleTheme } = useTheme();
</script>
