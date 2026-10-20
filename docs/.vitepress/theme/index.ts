import { h } from 'vue'
import type { Theme } from 'vitepress'
import { inBrowser } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import mediumZoom from 'medium-zoom'
import type { Zoom } from 'medium-zoom'

// 版式层（移植自 nekro-agent-doc）
import './css/base/fonts.css'
import './css/base/colors.css'
import './css/base/overrides.css'
import './css/layout/hero.css'
import './css/layout/blur.css'
import './css/components/animation.css'
import './css/components/button.css'
import './css/components/feature.css'
import './css/components/search.css'
import './css/components/zoom.css'
import './css/components/theme-image.css'

// 本项目自己的：图示配色 + 自有组件 + 明暗切换图标
import './styles/diagram-vars.css'
import './styles/diagrams.css'
import './styles/components.css'
import './styles/appearance.css'

import MyLayout from './components/vue/switch.vue'
import PageCopyActions from './components/vue/PageCopyActions.vue'
import DocIcon from './components/vue/DocIcon.vue'
import Confetti from './components/vue/Confetti.vue'
import { init3DTiltEffect } from './components/js/feature.js'

import Figure from './components/Figure.vue'
import Reveal from './components/Reveal.vue'
import Steps from './components/Steps.vue'
import Step from './components/Step.vue'
import TaskTable from './components/TaskTable.vue'
import ApiTable from './components/ApiTable.vue'
import CoreArchDiagram from './components/diagrams/CoreArchDiagram.vue'
import AndroidStack from './components/diagrams/AndroidStack.vue'

// 复用单一 medium-zoom 实例，路由切换时重新绑定
let zoomInstance: Zoom | null = null

/** 正文区的图片可点击放大；被链接包裹的卡片图不接管点击。 */
function collectZoomTargets(): HTMLImageElement[] {
  return Array.from(
    document.querySelectorAll<HTMLImageElement>('.vp-doc img:not([data-zoom-disabled])'),
  ).filter((img) => !img.closest('a'))
}

function refreshImageZoom() {
  if (!inBrowser) return
  const targets = collectZoomTargets()
  if (!zoomInstance) {
    zoomInstance = mediumZoom(targets, {
      background: 'var(--vp-c-bg)',
      margin: 32,
      scrollOffset: 0,
    })
  } else {
    zoomInstance.detach()
    zoomInstance.attach(targets)
  }
}

/**
 * 修补默认主题标记里的可达性问题（纯 ARIA 属性，不改变视觉）：
 * - 搜索按钮的快捷键不应进入可访问名称
 * - 主题开关缺少可访问名称时补一个
 * - 侧边栏折叠箭头与父级 role=button 嵌套
 */
function applyA11yFixes() {
  document.querySelectorAll('.DocSearch-Button-Keys').forEach((el) => {
    el.setAttribute('aria-hidden', 'true')
    el.querySelectorAll('kbd').forEach((k) => k.setAttribute('aria-hidden', 'true'))
  })
  document.querySelectorAll('.VPSwitchAppearance').forEach((el) => {
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', '切换主题')
  })
  document.querySelectorAll('.VPSidebarItem .caret[role="button"]').forEach((el) => {
    el.removeAttribute('role')
    el.removeAttribute('tabindex')
    el.setAttribute('aria-hidden', 'true')
  })
}

export default {
  extends: DefaultTheme,
  Layout: () => h(MyLayout),
  enhanceApp({ app, router }) {
    app.component('PageCopyActions', PageCopyActions)
    app.component('DocIcon', DocIcon)
    app.component('Confetti', Confetti)

    app.component('CoreArchDiagram', CoreArchDiagram)
    app.component('AndroidStack', AndroidStack)
    app.component('Figure', Figure)
    app.component('Reveal', Reveal)
    app.component('Steps', Steps)
    app.component('Step', Step)
    app.component('TaskTable', TaskTable)
    app.component('ApiTable', ApiTable)

    if (inBrowser) {
      router.onAfterRouteChanged = () => {
        window.setTimeout(() => {
          applyA11yFixes()
          refreshImageZoom()
          init3DTiltEffect()
        }, 100)
      }
    }
  },
  setup() {
    if (inBrowser) {
      window.requestAnimationFrame(() => {
        applyA11yFixes()
        window.setTimeout(() => {
          refreshImageZoom()
          init3DTiltEffect()
        }, 100)
      })
    }
  },
} satisfies Theme
