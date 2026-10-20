<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{ caption?: string }>()
const el = ref<HTMLElement | null>(null)
const hasSvg = ref(false)

onMounted(() => {
  hasSvg.value = !!el.value?.querySelector('svg')
})
</script>

<template>
  <figure ref="el" class="ap-figure">
    <slot />
    <span v-if="hasSvg" class="ap-figure__hint">图示可左右滑动查看</span>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
