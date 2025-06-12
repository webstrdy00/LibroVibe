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
    const books = await kyoboParser.fetchTop100();

    if (books.length > 0) {
      await chrome.storage.local.set({
        kyoboTop100: books,
        "lastFetched.kyoboTop100": Date.now(),
      });
    }

    return books;
  } catch (error) {
    console.error("Failed to fetch Kyobo Top 100:", error);
    return [];
  }
}

// YES24 Top 100
async function fetchYes24Top100(): Promise<BookItem[]> {
  try {
    const books = await yes24Parser.fetchTop100();

    if (books.length > 0) {
      await chrome.storage.local.set({
        yes24Top100: books,
        "lastFetched.yes24Top100": Date.now(),
      });
    }

    return books;
  } catch (error) {
    console.error("Failed to fetch YES24 Top 100:", error);
    return [];
  }
}

// 알라딘 Top 100
async function fetchAladinTop100(): Promise<BookItem[]> {
  try {
    const books = await aladinParser.fetchTop100();

    if (books.length > 0) {
      await chrome.storage.local.set({
        aladinTop100: books,
        "lastFetched.aladinTop100": Date.now(),
      });
    }

    return books;
  } catch (error) {
    console.error("Failed to fetch Aladin Top 100:", error);
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
