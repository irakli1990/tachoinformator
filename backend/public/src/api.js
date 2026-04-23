export const API = 'http://localhost:3000/api';

import { state } from './state.js';

export function authHeader() {
  if (!state.currentUser) return {};
  return { Authorization: 'Bearer ' + btoa(state.currentUser.email) };
}