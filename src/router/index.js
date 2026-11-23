import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/HomeView.vue";
import Movie from "../views/MovieView.vue";
import Recommend from "../views/RecommendView.vue";
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
    {
      // AI 추천: 기분을 적으면 Claude가 고르고 OMDb로 확인한 영화를 보여 줌
      path: "/recommend",
      name: "Recommend",
      component: Recommend,
    },
  ],
});

export default router;
