import type { ClientFolder } from './useClients';

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useFolders = () => {
  return {
    folders: [],
    loading: false,
    createFolder: async () => {},
    updateFolder: async () => {},
    deleteFolder: async () => {},
    assignClientToFolder: async () => {},
    removeClientFromFolder: async () => {},
    refetch: async () => {},
  };
};
