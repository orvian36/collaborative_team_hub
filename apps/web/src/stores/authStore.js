// Zustand auth store — manages user session state
// TODO: Implement login, logout, register, refreshToken actions

import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // TODO: Implement actions
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));

export default useAuthStore;
