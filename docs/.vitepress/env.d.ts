/// <reference types="vite/client" />

/**
 * 移植自 nekro-agent-doc 的组件是 JS 写的 SFC（没有 lang="ts"），
 * 因此按 Vite 默认做法为 .vue 补模块声明；组件内部仍由 vue-tsc 检查。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
