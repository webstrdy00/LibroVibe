import React, { useEffect, useState } from "react";
import { BookItem } from "@/types";
import { BookCard } from "@/components/BookCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RefreshButton } from "@/components/RefreshButton";

export function Popup() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      // 캐시에서 먼저 확인
      const cached = await chrome.storage.local.get([
        "kyoboTop10",
        "lastFetched",
      ]);

      if (cached.kyoboTop10 && cached.lastFetched?.kyoboTop10) {
        const cacheAge = Date.now() - cached.lastFetched.kyoboTop10;
        const sixHours = 6 * 60 * 60 * 1000;

        if (cacheAge < sixHours) {
          setBooks(cached.kyoboTop10);
          setLastFetched(cached.lastFetched.kyoboTop10);
          setLoading(false);
          return;
        }
      }

      // 캐시가 없거나 오래된 경우 새로 가져오기
      const response = await chrome.runtime.sendMessage({
        action: "fetchKyoboTop10",
      });

      if (response && response.length > 0) {
        setBooks(response);
        setLastFetched(Date.now());
      } else {
        throw new Error("데이터를 가져올 수 없습니다");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadBooks();
  };

  const openRanksPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("ranks.html") });
  };

  return (
    <div className="w-[360px] max-h-[600px] bg-bgLight dark:bg-bgDark text-textBase dark:text-textInverse">
      {/* 헤더 */}
      <header className="bg-primary text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">교보문고 주간 베스트</h1>
          <p className="text-xs opacity-90">Top 10</p>
        </div>
        <RefreshButton onClick={handleRefresh} loading={loading} />
      </header>

      {/* 콘텐츠 */}
      <div className="p-4">
        {loading && (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {books.map((book) => (
                <BookCard key={book.rank} book={book} compact />
              ))}
            </div>

            {lastFetched && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                마지막 업데이트:{" "}
                {new Date(lastFetched).toLocaleTimeString("ko-KR")}
              </p>
            )}
          </>
        )}
      </div>

      {/* 더보기 버튼 */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={openRanksPage}
          className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <span>더 많은 순위 확인하기</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </footer>
    </div>
  );
}
