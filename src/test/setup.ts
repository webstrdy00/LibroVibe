// import { vi } from "vitest";

// // Chrome API 모킹
// global.chrome = {
//   runtime: {
//     onInstalled: {
//       addListener: vi.fn(),
//     },
//     onMessage: {
//       addListener: vi.fn(),
//     },
//     sendMessage: vi.fn(),
//     getURL: vi.fn((path) => `chrome-extension://fake-id/${path}`),
//   },
//   storage: {
//     local: {
//       get: vi.fn(),
//       set: vi.fn(),
//     },
//   },
//   alarms: {
//     create: vi.fn(),
//     clearAll: vi.fn(),
//     onAlarm: {
//       addListener: vi.fn(),
//     },
//   },
//   tabs: {
//     create: vi.fn(),
//   },
// } as any;
