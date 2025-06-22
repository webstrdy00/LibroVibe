import { BookItem, Parser } from "@/types";

export class Yes24Parser implements Parser {
  private readonly TOP100_URL =
    "https://www.yes24.com/product/category/bestseller?categoryNumber=001&pageNumber=1&pageSize=100";

  async fetchTop100(): Promise<BookItem[]> {
    try {
      console.log("Fetching YES24 HTML from:", this.TOP100_URL);

      const response = await fetch(this.TOP100_URL, {
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
      console.log("YES24 HTML response length:", html.length);

      return this.parse(html);
    } catch (error) {
      console.error("YES24 fetch error:", error);
      return [];
    }
  }

  parse(html: string): BookItem[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const books: BookItem[] = [];

    console.log("Starting to parse YES24 HTML...");

    // 실제 YES24 구조: main list > listitem
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

    console.log(`Found ${bookElements.length} YES24 book elements`);

    if (bookElements.length === 0) {
      console.log("No YES24 book elements found. Debugging HTML structure...");
      const bodyContent = doc.body?.innerHTML || "";
      console.log("YES24 Body content sample:", bodyContent.substring(0, 1000));

      const possibleElements = doc.querySelectorAll(
        'listitem, [role="listitem"], li'
      );
      console.log(`Found ${possibleElements.length} possible YES24 elements`);

      possibleElements.forEach((el, i) => {
        if (i < 5) {
          console.log(`YES24 Element ${i}:`, el.className, el.id, el.tagName);
        }
      });
    }

    bookElements.forEach((element, index) => {
      try {
        // 순위 요소 - emphasis 태그에서 숫자 찾기
        let rank = index + 1;
        const emphasisElements = element.querySelectorAll("emphasis");
        for (const emphasis of emphasisElements) {
          const text = emphasis.textContent?.trim();
          if (text && /^\d+$/.test(text)) {
            rank = parseInt(text);
            break;
          }
        }

        // 제목과 링크 - "/product/goods/" 패턴을 포함하는 링크 찾기
        let titleElement: Element | null = null;
        let linkHref: string = "";

        const links = element.querySelectorAll("link");
        for (const link of links) {
          const href = link.getAttribute("/url");
          if (href && href.includes("/product/goods/")) {
            const linkText = link.textContent?.trim();
            if (
              linkText &&
              !linkText.includes("미리보기") &&
              !linkText.includes("새창이동") &&
              !linkText.includes("오늘의책") &&
              !linkText.includes("정보 더 보기")
            ) {
              titleElement = link;
              linkHref = href;
              break;
            }
          }
        }

        // 저자와 출판사 - 텍스트에서 파싱
        let author = "";
        let publisher = "";

        const textContent = element.textContent || "";

        // "저자명 저 | 출판사명 |" 패턴 찾기
        const authorPublisherMatch = textContent.match(
          /([^|]+)\s+저\s*\|\s*([^|]+)\s*\|/
        );
        if (authorPublisherMatch) {
          author = authorPublisherMatch[1].trim();
          publisher = authorPublisherMatch[2].trim();
        } else {
          // 대체 패턴들
          const authorMatch = textContent.match(/([^|]+)\s+저/);
          if (authorMatch) {
            author = authorMatch[1].trim();
          }

          const publisherMatch = textContent.match(
            /\|\s*([^|]+)\s*\|\s*\d{4}년/
          );
          if (publisherMatch) {
            publisher = publisherMatch[1].trim();
          }
        }

        // 가격 - strong > emphasis 패턴에서 추출
        let price = "";
        const strongElements = element.querySelectorAll("strong");
        for (const strong of strongElements) {
          const emphasisInStrong = strong.querySelector("emphasis");
          if (emphasisInStrong) {
            const priceText = emphasisInStrong.textContent?.trim();
            if (priceText && /\d/.test(priceText)) {
              price = priceText + "원";
              break;
            }
          }
        }

        // 이미지 - img 태그에서 추출
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
              : `https://www.yes24.com${linkHref}`,
            cover: cover,
          };

          books.push(book);
          console.log(`Parsed YES24 book ${rank}:`, book.title);
        } else {
          console.log(
            `Failed to parse YES24 book ${index + 1}: missing title or link`
          );
        }
      } catch (error) {
        console.error(`Error parsing YES24 book ${index + 1}:`, error);
      }
    });

    console.log(`Successfully parsed ${books.length} YES24 books`);
    return books.slice(0, 100); // Top 100만 반환
  }

  validateStructure(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 실제 YES24 사이트 구조 확인
    const patterns = [
      "main list > listitem", // 실제 구조
      "list > listitem",
      "listitem",
      "li",
      'link[/url*="/product/goods/"]', // 도서 상세 링크
    ];

    for (const pattern of patterns) {
      const elements = doc.querySelectorAll(pattern);
      if (elements.length > 0) {
        console.log(
          `Found YES24 HTML structure with pattern: ${pattern} (${elements.length} elements)`
        );

        // 도서 링크가 있는지 추가 확인
        if (pattern.includes("product/goods")) {
          return true;
        }

        // listitem이나 li 요소가 있다면 그 안에 도서 링크가 있는지 확인
        for (const element of elements) {
          const bookLinks = element.querySelectorAll(
            'link[/url*="/product/goods/"]'
          );
          if (bookLinks.length > 0) {
            console.log(
              `Found ${bookLinks.length} book links in YES24 structure`
            );
            return true;
          }
        }
      }
    }

    console.log("No recognized YES24 HTML structure found");
    return false;
  }
}
