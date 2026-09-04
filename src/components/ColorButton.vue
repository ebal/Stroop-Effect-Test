<template>
  <button
    class="color-btn"
    :style="{ '--btn-color': color.hex }"
    @click="$emit('click')"
  >
    {{ color.name }}
  </button>
</template>

<script setup>
defineProps({
  color: { type: Object, required: true },
})
defineEmits(['click'])
</script>

<style scoped>
.color-btn {
  background: var(--btn-color);
  border: none;
  border-radius: 10px;
  padding: 1.4rem 0.6rem;
  min-height: 3.25rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: transform 0.08s ease, filter 0.08s ease;
}

.color-btn:hover {
  filter: brightness(1.12);
}

.color-btn:active {
  transform: scale(0.95);
}
</style>
