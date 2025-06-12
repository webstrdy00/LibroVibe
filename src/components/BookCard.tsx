// import React from "react";
import { BookItem } from "@/types";

interface BookCardProps {
  book: BookItem;
  compact?: boolean;
  showCover?: boolean;
}

export function BookCard({
  book,
  compact = false,
  showCover = false,
}: BookCardProps) {
  const handleClick = () => {
    chrome.tabs.create({ url: book.link });
  };

  // 순위 변동 표시
  const renderRankChange = () => {
    if (!book.previousRank || book.previousRank === 0) return null;

    const diff = book.previousRank - book.rank;
    if (diff === 0) return null;

    if (diff > 0) {
      return (
        <span className="text-accent text-xs flex items-center gap-0.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 17a1 1 0 01-1-1V5.414L5.707 8.707a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 5.414V16a1 1 0 01-1 1z"
              clipRule="evenodd"
            />
          </svg>
          {diff}
        </span>
      );
    } else {
      return (
        <span className="text-red-500 text-xs flex items-center gap-0.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 14.586V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {Math.abs(diff)}
        </span>
      );
    }
  };

  // 순위 배지 스타일
  const getRankBadgeClass = () => {
    if (book.rank === 1) return "bg-secondary text-white";
    if (book.rank <= 3) return "border-secondary text-secondary";
    return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeClass()} ${book.rank <= 3 ? "border-2" : ""}`}
        >
          {book.rank}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{book.title}</h3>
          {book.author && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {book.author}
            </p>
          )}
        </div>

        {renderRankChange()}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
    >
      {showCover && book.cover && (
        <img
          src={book.cover}
          alt={book.title}
          className="w-20 h-28 object-cover rounded"
          loading="lazy"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${getRankBadgeClass()} ${book.rank <= 3 ? "border-2" : ""}`}
          >
            {book.rank}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {book.author}
              </p>
            )}
          </div>

          {renderRankChange()}
        </div>

        {book.publisher && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {book.publisher}
          </p>
        )}

        {book.price && (
          <p className="text-sm font-medium text-primary mt-2">{book.price}</p>
        )}
      </div>
    </div>
  );
}
