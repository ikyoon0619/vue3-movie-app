<script setup>
import Logo from "./Logo.vue";
</script>
<template>
  <footer>
    <Logo />
    <a href="https://github.com/ikyoon0619" target="_blank">
      (c){{ new Date().getFullYear() }} Inkyu Yoon
    </a>
  </footer>
</template>
<style lang="scss">
footer {
  padding: 70px 0;
  text-align: center;
  opacity: 0.3;
  .logo {
    display: block;
    margin-bottom: 4px;
  }
}
</style>
