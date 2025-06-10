// 서점 타입
export type Bookstore = "kyobo" | "yes24" | "aladin";

// 책 정보
export interface BookItem {
  rank: number;
  title: string;
  author?: string;
  publisher?: string;
  price?: string;
  link: string;
  cover?: string;
  previousRank?: number; // 이전 순위 (순위 변동 표시용)
}

// 베스트셀러 데이터
export interface BestsellerData {
  bookstore: Bookstore;
  books: BookItem[];
  lastFetched: number;
  category?: string; // 분야별 카테고리 (v0.2+)
}

// 저장소 스키마
export interface StorageSchema {
  kyoboTop10: BookItem[];
  kyoboTop100: BookItem[];
  yes24Top100: BookItem[];
  aladinTop100: BookItem[];
  lastFetched: {
    kyoboTop10: number;
    kyoboTop100: number;
    yes24Top100: number;
    aladinTop100: number;
  };
  settings: {
    refreshInterval: number; // 시간 단위 (3, 6, 12)
    darkMode: boolean;
    language: "ko" | "en" | "jp";
  };
}

// API 응답 타입
export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 파서 인터페이스
export interface Parser {
  parse(html: string): BookItem[];
  validateStructure(html: string): boolean;
}
