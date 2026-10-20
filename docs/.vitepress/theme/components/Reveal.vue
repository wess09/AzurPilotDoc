<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{ delay?: number }>(), { delay: 0 })
const el = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  const node = el.value
  if (!node) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!('IntersectionObserver' in window)) return
  node.style.opacity = '0'
  node.style.transform = 'translateY(16px)'
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          target.style.transition = `opacity 620ms var(--ap-ease) ${props.delay}ms, transform 620ms var(--ap-ease) ${props.delay}ms`
          target.style.opacity = '1'
          target.style.transform = 'none'
          io?.unobserve(target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  )
  io.observe(node)
})

onUnmounted(() => io?.disconnect())
</script>

<template>
  <div ref="el" class="ap-reveal-host">
    <slot />
  </div>
</template>

<style scoped>
.ap-reveal-host {
  display: contents;
}
</style>
