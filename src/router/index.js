import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/HomeView.vue";
import Movie from "../views/MovieView.vue";
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
    {
      // 영화 상세 화면: 검색 결과에서 영화를 클릭하면 여기로 옴 (꼭 필요)
      path: "/movie/:id",
      name: "Movie",
      component: Movie,
    },
  ],
});

export default router;
