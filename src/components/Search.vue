<script setup>
import { ref } from "vue";
import store from "../store";

const title = ref("");
const type = ref("movie");
const number = ref(10);
const year = ref("");

const filters = ref([
  {
    name: type,
    items: ["movie", "series", "episode"],
  },
  {
    name: number,
    items: [10, 20, 30],
  },
  {
    name: year,
    items: (() => {
      const years = [];
      const thisYear = new Date().getFullYear();
      for (let i = thisYear; i >= 1985; i -= 1) {
        years.push(i);
      }
      return years;
    })(),
  },
]);

function apply() {
  store.dispatch("movie/searchMovies", {
    title: title.value,
    type: type.value,
    number: number.value,
    year: year.value,
  });
}
</script>

<template>
  <div class="container">
    <input
      type="text"
      class="form-control"
      v-model="title"
      placeholder="Search for Movies, Series & more"
      @key.enter="apply"
    />

    <div class="selects">
      <select
        v-for="filter in filters"
        v-model="filter.name"
        class="form-select"
      >
        <option v-if="filter.name === year" value="">All Years</option>
        <option v-for="item in filter.items" :key="item">
          {{ item }}
        </option>
      </select>
    </div>

    <button class="btn btn-primary" @click="apply">Apply</button>
  </div>
</template>

<style lang="scss" scoped>
@import "../scss/main.scss";
.container {
  display: flex;
  > * {
    margin-right: 10px;
    font-size: 15px;
    &:last-child {
      margin-right: 0;
    }
  }
  .selects {
    display: flex;
    select {
      width: 120px;
      margin-right: 10px;
      &:last-child {
        margin-right: 0;
      }
    }
  }
  .btn {
    width: 120px;
    height: 50px;
    font-weight: 700;
    flex-shrink: 0;
  }
}
</style>
