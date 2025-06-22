import { BookItem, Parser } from "@/types";

export class AladinParser implements Parser {
  public generateBestsellerURL(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth()는 0부터 시작

    // 현재 날짜가 속한 주차 계산
    const firstDayOfMonth = new Date(year, now.getMonth(), 1);
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ...
    const currentDate = now.getDate();

    // 월의 첫 번째 일요일을 기준으로 주차 계산
    const adjustedDate = currentDate + firstDayWeekday;
    const week = Math.ceil(adjustedDate / 7);

    return `https://www.aladin.co.kr/shop/common/wbest.aspx?BranchType=1&CID=0&Year=${year}&Month=${month}&Week=${week}&BestType=Bestseller&MaxPageIndex=10&page=1&cnt=1000&SortOrder=1`;
  }

  async fetchTop100(): Promise<BookItem[]> {
    try {
      const url = this.generateBestsellerURL();
      console.log(`Fetching Aladin HTML from: ${url}`);

      const response = await fetch(url, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log("Aladin HTML response length:", html.length);

      return this.parse(html);
    } catch (error) {
      console.error("Aladin fetch error:", error);
      return [];
    }
  }

  parse(html: string): BookItem[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const books: BookItem[] = [];

    console.log("Starting to parse Aladin HTML...");

    // 실제 알라딘 구조: main list > listitem
    let bookElements = doc.querySelectorAll("main list > listitem");

    // 대체 선택자들
    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll("list > listitem");
    }

    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll("listitem");
    }

    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll("li");
    }

    // 기존 선택자들도 시도
    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll(".ss_book_box");
    }

    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll(".book_box");
    }

    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll(".item");
    }

    console.log(`Found ${bookElements.length} Aladin book elements`);

    if (bookElements.length === 0) {
      console.log("No Aladin book elements found. Debugging HTML structure...");
      const bodyContent = doc.body?.innerHTML || "";
      console.log(
        "Aladin Body content sample:",
        bodyContent.substring(0, 1000)
      );

      const possibleElements = doc.querySelectorAll(
        'listitem, [class*="book"], [class*="best"], [class*="item"], [class*="ss_"]'
      );
      console.log(`Found ${possibleElements.length} possible Aladin elements`);

      possibleElements.forEach((el, i) => {
        if (i < 5) {
          console.log(`Aladin Element ${i}:`, el.className, el.id, el.tagName);
        }
      });
    }

    bookElements.forEach((element, index) => {
      try {
        // 순위 추출 - 텍스트에서 숫자 패턴 찾기
        let rank = index + 1;
        const textContent = element.textContent || "";
        const rankMatch = textContent.match(/^\s*(\d+)\s/);
        if (rankMatch) {
          rank = parseInt(rankMatch[1], 10);
        }

        // 제목과 링크 - "/shop/wproduct.aspx" 패턴을 포함하는 링크 찾기
        let titleElement: Element | null = null;
        let linkHref: string = "";

        const links = element.querySelectorAll("link");
        for (const link of links) {
          const href = link.getAttribute("/url");
          if (href && href.includes("/shop/wproduct.aspx")) {
            const linkText = link.textContent?.trim();
            if (
              linkText &&
              !linkText.includes("미리보기") &&
              !linkText.includes("새창이동") &&
              !linkText.includes("상세정보") &&
              !linkText.includes("정보 더 보기")
            ) {
              titleElement = link;
              linkHref = href;
              break;
            }
          }
        }

        // 저자/출판사 추출 - 텍스트에서 패턴 찾기
        let author = "";
        let publisher = "";

        // "저자명 지음 | 출판사명" 패턴 찾기
        const authorMatch = textContent.match(/([^|]+)\s+지음\s*\|\s*([^|]+)/);
        if (authorMatch) {
          author = authorMatch[1].trim();
          publisher = authorMatch[2].trim();
        } else {
          // "저자명 | 출판사명" 패턴 찾기
          const simpleMatch = textContent.match(/([^|]+)\s*\|\s*([^|]+)/);
          if (simpleMatch) {
            author = simpleMatch[1].trim();
            publisher = simpleMatch[2].trim();
          }
        }

        // 가격 추출 - "숫자,숫자원" 패턴 찾기
        let price = "";
        const priceMatch = textContent.match(/(\d{1,3}(?:,\d{3})*원)/);
        if (priceMatch) {
          price = priceMatch[1];
        }

        // 이미지 추출
        let cover = "";
        const imgElement = element.querySelector("img");
        if (imgElement) {
          cover =
            imgElement.getAttribute("src") ||
            imgElement.getAttribute("data-src") ||
            imgElement.getAttribute("data-original") ||
            "";
        }

        if (titleElement && linkHref) {
          const title = titleElement.textContent?.trim() || "";

          const book: BookItem = {
            rank: rank,
            title: title,
            author: author,
            publisher: publisher,
            price: price,
            link: linkHref.startsWith("http")
              ? linkHref
              : `https://www.aladin.co.kr${linkHref}`,
            cover: cover,
          };

          books.push(book);
          console.log(`Parsed Aladin book ${rank}:`, book.title);
        } else {
          console.log(
            `Failed to parse Aladin book ${index + 1}: missing title or link`
          );
        }
      } catch (error) {
        console.error(`Error parsing Aladin book ${index + 1}:`, error);
      }
    });

    console.log(`Successfully parsed ${books.length} Aladin books`);
    return books.slice(0, 100); // Top 100만 반환
  }

  validateStructure(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 실제 알라딘 사이트 구조 확인
    const patterns = [
      "main list > listitem", // 실제 구조
      "list > listitem",
      "listitem",
      "li",
      'link[/url*="/shop/wproduct.aspx"]', // 도서 상세 링크
      ".ss_book_box", // 기존 구조
      ".book_box",
      ".item",
      "[class*='book']",
    ];

    for (const pattern of patterns) {
      const elements = doc.querySelectorAll(pattern);
      if (elements.length > 0) {
        console.log(
          `Found Aladin HTML structure with pattern: ${pattern} (${elements.length} elements)`
        );

        // 도서 링크가 있는지 추가 확인
        if (pattern.includes("wproduct") || pattern.includes("link")) {
          return true;
        }

        // listitem이나 li 요소가 있다면 그 안에 도서 링크가 있는지 확인
        if (pattern.includes("listitem") || pattern.includes("li")) {
          const hasBookLinks = Array.from(elements).some(
            (el) =>
              el.querySelector('link[/url*="/shop/wproduct.aspx"]') !== null
          );
          if (hasBookLinks) {
            console.log("Found book links within list elements");
            return true;
          }
        }

        // 기존 클래스 기반 구조라면 바로 true
        if (pattern.includes(".") || pattern.includes("[class")) {
          return true;
        }
      }
    }

    console.log("No recognized Aladin HTML structure found");
    return false;
  }
}
