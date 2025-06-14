import { KyoboParser } from "@/parsers/kyobo";
import { Yes24Parser } from "@/parsers/yes24";
import { AladinParser } from "@/parsers/aladin";
import { StorageSchema, BookItem, Parser } from "@/types";

// 파서 인스턴스
const kyoboParser = new KyoboParser();
const yes24Parser = new Yes24Parser();
const aladinParser = new AladinParser();

// 기본 설정
const DEFAULT_SETTINGS: StorageSchema["settings"] = {
  refreshInterval: 6,
  darkMode: false,
  language: "ko",
};

// 초기화
chrome.runtime.onInstalled.addListener(async () => {
  console.log("LibroVibe installed");

  // 기본 설정 저장
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  // 알람 설정
  await setupAlarms();

  // 초기 데이터 페치
  await fetchKyoboTop10();
});

// 알람 설정
async function setupAlarms() {
  const { settings } = await chrome.storage.local.get("settings");
  const interval = settings?.refreshInterval || 6;

  // 기존 알람 제거
  await chrome.alarms.clearAll();

  // 새 알람 설정 (시간 단위)
  chrome.alarms.create("fetchBestsellers", {
    periodInMinutes: interval * 60,
  });
}

// 알람 리스너
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "fetchBestsellers") {
    console.log("Fetching bestsellers...");
    await fetchAllBestsellers();
  }
});

// 교보문고 Top 10 가져오기
async function fetchKyoboTop10(): Promise<BookItem[]> {
  try {
    const books = await kyoboParser.fetchTop10();

    if (books.length > 0) {
      await chrome.storage.local.set({
        kyoboTop10: books,
        "lastFetched.kyoboTop10": Date.now(),
      });
    }

    return books;
  } catch (error) {
    console.error("Failed to fetch Kyobo Top 10:", error);
    return [];
  }
}

// 범용 베스트셀러 페처 함수
interface FetchConfig {
  parser: Parser;
  url?: string; // URL이 없으면 parser의 fetchTop100 사용
  storageKey: string;
  lastFetchedKey: string;
  sourceName: string;
}

async function fetchAndStoreBestsellers(
  config: FetchConfig
): Promise<BookItem[]> {
  const { parser, url, storageKey, lastFetchedKey, sourceName } = config;

  try {
    let html: string;

    if (url) {
      // URL이 제공된 경우 직접 fetch
      const response = await fetch(url);
      html = await response.text();
    } else {
      // 알라딘처럼 동적 URL이 필요한 경우
      if ("generateBestsellerURL" in parser) {
        const dynamicUrl = (parser as any).generateBestsellerURL();
        const response = await fetch(dynamicUrl);
        html = await response.text();
      } else {
        throw new Error(
          `No URL provided and parser doesn't support dynamic URL generation`
        );
      }
    }

    // 1. 파싱 전 구조 검증
    if (!parser.validateStructure(html)) {
      throw new Error(
        `${sourceName} site structure may have changed. Please check the website structure.`
      );
    }

    const books = parser.parse(html);

    // 2. 파싱 결과 검증
    if (books.length === 0) {
      console.warn(
        `${sourceName}: No books parsed. Site structure might have changed.`
      );
    }

    if (books.length > 0) {
      await chrome.storage.local.set({
        [storageKey]: books,
        [lastFetchedKey]: Date.now(),
      });
      console.log(`${sourceName}: Successfully fetched ${books.length} books`);
    }

    return books;
  } catch (error) {
    // 구체적인 에러 로깅
    console.error(`Failed to fetch ${sourceName}:`, error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      source: `${sourceName}Parser`,
    });
    return [];
  }
}

// 모든 베스트셀러 가져오기
async function fetchAllBestsellers() {
  const tasks = [fetchKyoboTop100(), fetchYes24Top100(), fetchAladinTop100()];

  await Promise.allSettled(tasks);
}

// 교보문고 Top 100
async function fetchKyoboTop100(): Promise<BookItem[]> {
  return fetchAndStoreBestsellers({
    parser: kyoboParser,
    url: "https://product.kyobobook.co.kr/bestseller/online",
    storageKey: "kyoboTop100",
    lastFetchedKey: "lastFetched.kyoboTop100",
    sourceName: "Kyobo",
  });
}

// YES24 Top 100
async function fetchYes24Top100(): Promise<BookItem[]> {
  return fetchAndStoreBestsellers({
    parser: yes24Parser,
    url: "https://www.yes24.com/Product/Category/BestSeller?categoryNumber=001&pageNumber=1&pageSize=120",
    storageKey: "yes24Top100",
    lastFetchedKey: "lastFetched.yes24Top100",
    sourceName: "YES24",
  });
}

// 알라딘 Top 100
async function fetchAladinTop100(): Promise<BookItem[]> {
  return fetchAndStoreBestsellers({
    parser: aladinParser,
    // URL을 제공하지 않으면 동적 URL 생성 로직 사용
    storageKey: "aladinTop100",
    lastFetchedKey: "lastFetched.aladinTop100",
    sourceName: "Aladin",
  });
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "fetchKyoboTop10") {
    fetchKyoboTop10().then(sendResponse);
    return true; // 비동기 응답을 위해
  }

  if (request.action === "fetchAllBestsellers") {
    fetchAllBestsellers().then(() => sendResponse({ success: true }));
    return true;
  }

  if (request.action === "updateSettings") {
    chrome.storage.local
      .set({ settings: request.settings })
      .then(() => setupAlarms())
      .then(() => sendResponse({ success: true }));
    return true;
  }
});

// Export for testing
export { fetchKyoboTop10, fetchAllBestsellers };
