import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { bskyPlugin } from './libs/bluesky'

createApp(App)
    .use(bskyPlugin)
    .mount('#app');
