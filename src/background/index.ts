import { KyoboParser } from "@/parsers/kyobo";
import { Yes24Parser } from "@/parsers/yes24";
import { AladinParser } from "@/parsers/aladin";
import { StorageSchema, BookItem } from "@/types";

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

// 모든 베스트셀러 가져오기
async function fetchAllBestsellers() {
  const tasks = [fetchKyoboTop100(), fetchYes24Top100(), fetchAladinTop100()];

  await Promise.allSettled(tasks);
}

// 교보문고 Top 100
async function fetchKyoboTop100(): Promise<BookItem[]> {
  try {
    const response = await fetch(
      "https://product.kyobobook.co.kr/bestseller/online"
    );
    const html = await response.text();

    // 1. 파싱 전 구조 검증
    if (!kyoboParser.validateStructure(html)) {
      throw new Error(
        "Kyobo site structure may have changed. Please check the website structure."
      );
    }

    const books = kyoboParser.parse(html);

    // 2. 파싱 결과 검증
    if (books.length === 0) {
      console.warn(
        "Kyobo: No books parsed. Site structure might have changed."
      );
    }

    if (books.length > 0) {
      await chrome.storage.local.set({
        kyoboTop100: books,
        "lastFetched.kyoboTop100": Date.now(),
      });
      console.log(`Kyobo: Successfully fetched ${books.length} books`);
    }

    return books;
  } catch (error) {
    // 2. 에러를 더 구체적으로 기록
    console.error("Failed to fetch Kyobo Top 100:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      source: "KyoboParser",
    });
    // UI에서 이 에러를 활용할 수 있도록 빈 배열 반환
    return [];
  }
}

// YES24 Top 100
async function fetchYes24Top100(): Promise<BookItem[]> {
  try {
    const response = await fetch(
      "https://www.yes24.com/Product/Category/BestSeller?categoryNumber=001&pageNumber=1&pageSize=120"
    );
    const html = await response.text();

    // 1. 파싱 전 구조 검증
    if (!yes24Parser.validateStructure(html)) {
      throw new Error(
        "YES24 site structure may have changed. Please check the website structure."
      );
    }

    const books = yes24Parser.parse(html);

    // 2. 파싱 결과 검증
    if (books.length === 0) {
      console.warn(
        "YES24: No books parsed. Site structure might have changed."
      );
    }

    if (books.length > 0) {
      await chrome.storage.local.set({
        yes24Top100: books,
        "lastFetched.yes24Top100": Date.now(),
      });
      console.log(`YES24: Successfully fetched ${books.length} books`);
    }

    return books;
  } catch (error) {
    // 2. 에러를 더 구체적으로 기록
    console.error("Failed to fetch YES24 Top 100:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      source: "YES24Parser",
    });
    // UI에서 이 에러를 활용할 수 있도록 빈 배열 반환
    return [];
  }
}

// 알라딘 Top 100
async function fetchAladinTop100(): Promise<BookItem[]> {
  try {
    // 동적 URL 생성을 위해 파서의 fetchTop100 사용하되 구조 검증 추가
    const response = await fetch(aladinParser.generateBestsellerURL());
    const html = await response.text();

    // 1. 파싱 전 구조 검증
    if (!aladinParser.validateStructure(html)) {
      throw new Error(
        "Aladin site structure may have changed. Please check the website structure."
      );
    }

    const books = aladinParser.parse(html);

    // 2. 파싱 결과 검증
    if (books.length === 0) {
      console.warn(
        "Aladin: No books parsed. Site structure might have changed."
      );
    }

    if (books.length > 0) {
      await chrome.storage.local.set({
        aladinTop100: books,
        "lastFetched.aladinTop100": Date.now(),
      });
      console.log(`Aladin: Successfully fetched ${books.length} books`);
    }

    return books;
  } catch (error) {
    // 2. 에러를 더 구체적으로 기록
    console.error("Failed to fetch Aladin Top 100:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      source: "AladinParser",
    });
    // UI에서 이 에러를 활용할 수 있도록 빈 배열 반환
    return [];
  }
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
