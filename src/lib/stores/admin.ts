// src/lib/stores/adminStore.ts

import { writable, type Writable } from 'svelte/store';

export interface AdminState {
  isAdmin: boolean;
  checkedStatus: boolean;
}

export const adminStore: Writable<AdminState> = writable<AdminState>({
  isAdmin: false,
  checkedStatus: false
});
