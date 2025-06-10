import React, { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { StorageSchema } from "@/types";

export function OptionsPage() {
  const [settings, setSettings] = useState<StorageSchema["settings"]>({
    refreshInterval: 6,
    darkMode: false,
    language: "ko",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // 다크모드 적용
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const loadSettings = async () => {
    const { settings: savedSettings } =
      await chrome.storage.local.get("settings");
    if (savedSettings) {
      setSettings(savedSettings);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await chrome.runtime.sendMessage({
        action: "updateSettings",
        settings,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof StorageSchema["settings"]>(
    key: K,
    value: StorageSchema["settings"][K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-bgLight dark:bg-bgDark text-textBase dark:text-textInverse">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">📚 BookRanker 설정</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
          {/* 새로고침 주기 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              자동 새로고침 주기
            </label>
            <select
              value={settings.refreshInterval}
              onChange={(e) =>
                updateSetting("refreshInterval", Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={3}>3시간마다</option>
              <option value={6}>6시간마다</option>
              <option value={12}>12시간마다</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              베스트셀러 순위를 자동으로 업데이트하는 주기입니다.
            </p>
          </div>

          {/* 다크모드 */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">다크 모드</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                어두운 테마를 사용합니다.
              </p>
            </div>
            <Switch
              checked={settings.darkMode}
              onChange={(checked) => updateSetting("darkMode", checked)}
              className={`${
                settings.darkMode ? "bg-primary" : "bg-gray-200"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
              <span
                className={`${
                  settings.darkMode ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          {/* 언어 설정 (추후 구현) */}
          <div>
            <label className="block text-sm font-medium mb-2">언어 설정</label>
            <select
              value={settings.language}
              onChange={(e) =>
                updateSetting("language", e.target.value as "ko" | "en" | "jp")
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ko">한국어</option>
              <option value="en" disabled>
                English (Coming Soon)
              </option>
              <option value="jp" disabled>
                日本語 (Coming Soon)
              </option>
            </select>
          </div>

          {/* 저장 버튼 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : saved ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>저장되었습니다!</span>
                </>
              ) : (
                <span>설정 저장</span>
              )}
            </button>
          </div>
        </div>

        {/* 정보 섹션 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">BookRanker 정보</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium">버전:</dt>
              <dd>0.1.0 (MVP)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">지원 서점:</dt>
              <dd>교보문고, YES24, 알라딘</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">업데이트 예정:</dt>
              <dd>분야별 베스트셀러, 순위 변동 그래프</dd>
            </div>
          </dl>
        </div>

        {/* 피드백 섹션 */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>문의사항이나 버그 리포트는</p>
          <a
            href="https://github.com/yourusername/bookranker/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub Issues
          </a>
          에 남겨주세요.
        </div>
      </div>
    </div>
  );
}
