// Zustand workspace store — manages workspace state
// TODO: Implement workspace CRUD, member management, switching

import { create } from 'zustand';

const useWorkspaceStore = create((set) => ({
  workspaces: [],
  activeWorkspace: null,
  members: [],

  // TODO: Implement actions
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setMembers: (members) => set({ members }),
}));

export default useWorkspaceStore;
