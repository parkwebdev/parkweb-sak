import { useState } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  action?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useSearchData = () => {
  const [searchResults] = useState<SearchResult[]>([]);
  const [loading] = useState(false);

  return {
    searchResults,
    loading,
    refetch: async () => {},
  };
};
