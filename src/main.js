import Vue from "vue";
import VueWait from "vue-wait";
import App from "./App.vue";
import store from "./store";

Vue.use(VueWait);

Vue.config.productionTip = false;

new Vue({
  store,
  wait: new VueWait({
    useVuex: true,
  }),
  beforeCreate() {
    store.commit("init_store");
  },
  render: (h) => h(App),
}).$mount("#app");
