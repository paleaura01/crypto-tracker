import { writable } from 'svelte/store';

export const adminStore = writable({
  isAdmin: false,
  checkedStatus: false
});