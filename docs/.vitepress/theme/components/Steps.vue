<script setup lang="ts">
import { provide, ref } from 'vue'

const counter = ref(0)
provide('ap-step-counter', counter)
</script>

<template>
  <div class="ap-steps">
    <slot />
  </div>
</template>
