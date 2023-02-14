import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import loadImage from "./plugins/loadImage";

import "./assets/main.css";
import "./scss/main.scss";

const app = createApp(App);

app.use(router).use(loadImage).use(store);

app.mount("#app");
