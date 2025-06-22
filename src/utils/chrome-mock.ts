// Chrome API Mock for development environment
interface MockStorage {
  [key: string]: any;
}

class ChromeStorageMock {
  private storage: MockStorage = {};

  get(keys: string | string[] | null): Promise<MockStorage> {
    return new Promise((resolve) => {
      if (keys === null) {
        resolve(this.storage);
      } else if (typeof keys === "string") {
        resolve({ [keys]: this.storage[keys] });
      } else if (Array.isArray(keys)) {
        const result: MockStorage = {};
        keys.forEach((key) => {
          if (this.storage[key] !== undefined) {
            result[key] = this.storage[key];
          }
        });
        resolve(result);
      }
    });
  }

  set(items: MockStorage): Promise<void> {
    return new Promise((resolve) => {
      Object.assign(this.storage, items);
      resolve();
    });
  }

  remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve) => {
      if (typeof keys === "string") {
        delete this.storage[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach((key) => delete this.storage[key]);
      }
      resolve();
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve) => {
      this.storage = {};
      resolve();
    });
  }
}

class ChromeRuntimeMock {
  private messageListeners: ((
    message: any,
    sender: any,
    sendResponse: (response?: any) => void
  ) => boolean | void)[] = [];

  sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      // Mock response for different actions
      if (message.action === "fetchKyoboTop10") {
        // Return mock data for development
        setTimeout(() => {
          resolve([
            {
              rank: 1,
              title: "개발 테스트 책 1",
              author: "테스트 저자",
              publisher: "테스트 출판사",
              price: "15,000원",
              coverImage: "https://via.placeholder.com/120x174",
              link: "#",
              source: "kyobo" as const,
            },
            {
              rank: 2,
              title: "개발 테스트 책 2",
              author: "테스트 저자 2",
              publisher: "테스트 출판사 2",
              price: "18,000원",
              coverImage: "https://via.placeholder.com/120x174",
              link: "#",
              source: "kyobo" as const,
            },
            // ... 더 많은 mock 데이터 추가 가능
          ]);
        }, 500);
      } else {
        resolve({ success: true });
      }
    });
  }

  onMessage = {
    addListener: (
      callback: (
        message: any,
        sender: any,
        sendResponse: (response?: any) => void
      ) => boolean | void
    ) => {
      this.messageListeners.push(callback);
    },
  };

  getURL(path: string): string {
    return `http://localhost:3000/${path}`;
  }
}

class ChromeTabsMock {
  create(options: { url: string }): Promise<void> {
    return new Promise((resolve) => {
      window.open(options.url, "_blank");
      resolve();
    });
  }
}

class ChromeAlarmsMock {
  create(): Promise<void> {
    return Promise.resolve();
  }

  clearAll(): Promise<void> {
    return Promise.resolve();
  }

  onAlarm = {
    addListener: () => {},
  };
}

// Chrome API Mock 객체
export const chromeMock = {
  storage: {
    local: new ChromeStorageMock(),
  },
  runtime: new ChromeRuntimeMock(),
  tabs: new ChromeTabsMock(),
  alarms: new ChromeAlarmsMock(),
};

// 개발 환경에서만 chrome 객체를 mock으로 대체
if (typeof chrome === "undefined" && import.meta.env.DEV) {
  (window as any).chrome = chromeMock;
}
