<script setup lang="ts">
import { Input } from '@/shared/ui/primitives/input'

const model = defineModel<string>({ required: true })
</script>

<!-- Attributes such as id, maxlength and aria-* fall through to the <input>. -->
<template>
  <Input v-model="model" class="h-9" />
</template>
