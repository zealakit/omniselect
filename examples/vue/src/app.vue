<script setup lang="ts">
import type { Placement } from "@zealakit/omniselect-vue";

const placement: Placement = "bottom-start";
</script>

<template>
  <main class="page" :data-placement="placement">
    <p class="eyebrow">@zealakit/omniselect-vue</p>
    <h1>Omniselect examples</h1>
    <p>Placeholder page. The Select and Combobox demos arrive with the component plans.</p>
  </main>
</template>
