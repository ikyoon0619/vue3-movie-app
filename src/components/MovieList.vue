<script setup>
import { computed } from "vue";
import store from "../store";
import MovieItem from "./MovieItem.vue";

const movies = computed(() => {
  return store.state.movie.movies;
});
const message = computed(() => {
  return store.state.movie.message;
});
</script>
<template>
  <div class="container">
    <div :class="{ 'no-result': !movies.length }" class="inner">
      <div class="spinner-border text-primary"></div>
      <div v-if="message" class="message">{{ message }}</div>
      <div v-else class="movies">
        <MovieItem v-for="movie in movies" :key="movie.imdbID" :movie="movie" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../scss/main.scss";
.container {
  margin-top: 30px;
  .inner {
    background-color: $gray-200;
    padding: 15px 0px;
    border-radius: 4px;
    text-align: center;
    &.no-result {
      padding: 70px 0;
    }
  }
  .message {
    color: $gray-400;
    font-size: 20px;
  }
  .movies {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
