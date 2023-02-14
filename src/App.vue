<script setup>
import Header from "./components/Header.vue";
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <Header></Header>
  <RouterView />
</template>

<style lang="scss">
@import "./scss/main.scss";
</style>
