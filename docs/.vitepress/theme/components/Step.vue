<script setup lang="ts">
import { computed, inject, onMounted, ref, type Ref } from 'vue'

defineProps<{ title?: string }>()
const counter = inject<Ref<number>>('ap-step-counter', ref(0))
const index = ref(0)
onMounted(() => {
  counter.value += 1
  index.value = counter.value
})
const label = computed(() => String(index.value || 1).padStart(2, '0'))
</script>

<template>
  <div class="ap-step">
    <div class="ap-step__num">{{ label }}</div>
    <div class="ap-step__body">
      <strong v-if="title" class="ap-step__title">{{ title }}</strong>
      <slot />
    </div>
  </div>
</template>
