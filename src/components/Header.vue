<script setup>
import { ref } from "vue";
import Logo from "./Logo.vue";
const navigations = ref([
  { name: "Home", href: "/" },
  { name: "AI 추천", href: "/recommend" },
]);
</script>

<template>
  <header>
    <Logo />
    <div class="nav nav-pills">
      <div v-for="nav in navigations" :key="nav.name" class="nav-item">
        <RouterLink :to="nav.href" active-class="active" class="nav-link">
          {{ nav.name }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
header {
  height: 70px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  .logo {
    margin-right: 40px;
  }
}
// 메뉴가 두 개가 되면서 좁은 화면에서 줄바꿈되지 않도록 여백을 줄인다
@media (max-width: 576px) {
  header {
    padding: 0 16px;
    .logo {
      margin-right: 12px;
    }
  }
}
</style>
