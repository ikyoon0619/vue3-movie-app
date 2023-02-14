import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/HomeView.vue";
import Movie from "../views/MovieView.vue";
import About from "../views/AboutView.vue";
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
    {
      path: "/movie/:id",
      name: "Movie",
      component: Movie,
    },
    {
      path: "/about",
      name: "about",
      component: About,
    },
  ],
});

export default router;
