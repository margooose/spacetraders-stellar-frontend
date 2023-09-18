
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { clickOutside } from './directives/clickoutside'


const app = createApp(App)

app.directive('clickOut', clickOutside)

const pinia = createPinia()
app.use(pinia)


app.mount('#app')

//injects vue into index.html 