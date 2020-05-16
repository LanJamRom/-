import Vue from 'vue'
import vuels from 'vue-ls'
const options = {
  namespace: 'vuels_',
  name: 'ls',
  storage: 'local'
}

Vue.use(vuels, options)
