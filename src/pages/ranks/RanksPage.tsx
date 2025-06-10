import React, { useState, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BookItem, Bookstore } from "@/types";
import { BookCard } from "@/components/BookCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RefreshButton } from "@/components/RefreshButton";

interface TabData {
  id: Bookstore;
  label: string;
  color: string;
}

const tabs: TabData[] = [
  { id: "kyobo", label: "교보문고", color: "text-purple-600" },
  { id: "yes24", label: "YES24", color: "text-blue-600" },
  { id: "aladin", label: "알라딘", color: "text-green-600" },
];

export function RanksPage() {
  const [activeTab, setActiveTab] = useState<Bookstore>("kyobo");
  const [books, setBooks] = useState<Record<Bookstore, BookItem[]>>({
    kyobo: [],
    yes24: [],
    aladin: [],
  });
  const [loading, setLoading] = useState<Record<Bookstore, boolean>>({
    kyobo: true,
    yes24: true,
    aladin: true,
  });
  const [lastFetched, setLastFetched] = useState<Record<Bookstore, number>>({
    kyobo: 0,
    yes24: 0,
    aladin: 0,
  });

  const parentRef = React.useRef<HTMLDivElement>(null);

  // 가상화된 리스트
  const currentBooks = useMemo(() => books[activeTab], [books, activeTab]);

  const virtualizer = useVirtualizer({
    count: currentBooks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // 캐시에서 데이터 로드
    const cached = await chrome.storage.local.get([
      "kyoboTop100",
      "yes24Top100",
      "aladinTop100",
      "lastFetched",
    ]);

    const newBooks: Record<Bookstore, BookItem[]> = {
      kyobo: cached.kyoboTop100 || [],
      yes24: cached.yes24Top100 || [],
      aladin: cached.aladinTop100 || [],
    };

    const newLastFetched: Record<Bookstore, number> = {
      kyobo: cached.lastFetched?.kyoboTop100 || 0,
      yes24: cached.lastFetched?.yes24Top100 || 0,
      aladin: cached.lastFetched?.aladinTop100 || 0,
    };

    setBooks(newBooks);
    setLastFetched(newLastFetched);

    // 데이터가 없거나 오래된 경우 새로 가져오기
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;

    const needsUpdate = {
      kyobo: !newBooks.kyobo.length || now - newLastFetched.kyobo > sixHours,
      yes24: !newBooks.yes24.length || now - newLastFetched.yes24 > sixHours,
      aladin: !newBooks.aladin.length || now - newLastFetched.aladin > sixHours,
    };

    setLoading({
      kyobo: needsUpdate.kyobo,
      yes24: needsUpdate.yes24,
      aladin: needsUpdate.aladin,
    });

    if (needsUpdate.kyobo || needsUpdate.yes24 || needsUpdate.aladin) {
      await fetchAllData();
    }
  };

  const fetchAllData = async () => {
    setLoading({ kyobo: true, yes24: true, aladin: true });

    await chrome.runtime.sendMessage({ action: "fetchAllBestsellers" });

    // 데이터 다시 로드
    setTimeout(async () => {
      await loadInitialData();
    }, 2000);
  };

  const handleRefresh = async () => {
    await fetchAllData();
  };

  const getTabClass = (tab: Bookstore) => {
    return activeTab === tab
      ? "border-b-2 border-primary text-primary font-semibold"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200";
  };

  return (
    <div className="min-h-screen bg-bgLight dark:bg-bgDark text-textBase dark:text-textInverse">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">📚 BookRanker</h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                베스트셀러 종합 순위
              </span>
            </div>

            <RefreshButton
              onClick={handleRefresh}
              loading={loading.kyobo || loading.yes24 || loading.aladin}
            />
          </div>

          {/* 탭 */}
          <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 transition-colors duration-150 ${getTabClass(tab.id)}`}
              >
                <span className={activeTab === tab.id ? "" : tab.color}>
                  {tab.label}
                </span>
                {books[tab.id].length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({books[tab.id].length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading[activeTab] ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <LoadingSpinner />
            <p className="text-gray-500 dark:text-gray-400">
              {tabs.find((t) => t.id === activeTab)?.label} 베스트셀러를
              불러오는 중...
            </p>
          </div>
        ) : currentBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              데이터를 불러올 수 없습니다.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 text-primary hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {/* 마지막 업데이트 시간 */}
            {lastFetched[activeTab] > 0 && (
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                마지막 업데이트:{" "}
                {new Date(lastFetched[activeTab]).toLocaleString("ko-KR")}
              </div>
            )}

            {/* 가상화된 리스트 */}
            <div
              ref={parentRef}
              className="h-[calc(100vh-200px)] overflow-auto"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const book = currentBooks[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="pb-4">
                        <BookCard book={book} showCover />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
