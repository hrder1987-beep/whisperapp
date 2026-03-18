import { useMemo, useState, useEffect } from 'react';

const ITEMS_PER_PAGE = 10;

export function usePaginatedData<T>(items: T[], activeTab: string, searchQuery: string) {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return result.filter(item => 
        (item as any).title?.toLowerCase().includes(q) || 
        (item as any).text?.toLowerCase().includes(q)
      );
    }

    switch (activeTab) {
      case "hrm":
        return result.filter((q: any) => q.category === "인사전략/HRM");
      case "hrd":
        return result.filter((q: any) => q.category === "HRD/교육");
      case "culture":
        return result.filter((q: any) => q.category === "조직문화/EVP");
      case "popular":
        return [...result].sort((a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0));
      case "all":
      default:
        return result;
    }
  }, [items, activeTab, searchQuery]);

  const paginatedItems = useMemo(() => {
    return filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
  };
}
