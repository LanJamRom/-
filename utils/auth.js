import Vue from 'vue'
const TokenKey = 'Admin-Token'

export function getToken() {
  return Vue.ls.get(TokenKey)
}

export function setToken(token) {
  return Vue.ls.set(TokenKey, token)
}

export function removeToken() {
  return Vue.ls.remove(TokenKey)
}
