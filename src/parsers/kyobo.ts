import { BookItem, Parser } from "@/types";

export class KyoboParser implements Parser {
  private readonly TOP10_URL =
    "https://store.kyobobook.co.kr/api/gw/pub/pdt/best-seller/total?page=1&per=10&period=002&dsplDvsnCode=000&dsplTrgtDvsnCode=001";
  private readonly TOP100_URL =
    "https://store.kyobobook.co.kr/api/gw/pub/pdt/best-seller/total?page=1&per=100&period=002&dsplDvsnCode=000&dsplTrgtDvsnCode=001";

  async fetchTop10(): Promise<BookItem[]> {
    try {
      const response = await fetch(this.TOP10_URL);
      const data = await response.json();

      if (!data.data?.bestSeller) {
        throw new Error("Invalid API response structure");
      }

      return data.data.bestSeller.map((item: any, index: number) => ({
        rank: index + 1,
        title: item.cmdtName || "",
        author: item.chrcName || "",
        publisher: item.pbcmName || "",
        price: item.salePrc ? `${item.salePrc.toLocaleString()}원` : "",
        link: `https://store.kyobobook.co.kr/detail/${item.cmdtCode}`,
        cover: item.cmdtImgUrl || "",
        previousRank: item.prevRank || 0,
      }));
    } catch (error) {
      console.error("Kyobo Top10 fetch error:", error);
      return [];
    }
  }

  async fetchTop100(): Promise<BookItem[]> {
    try {
      const response = await fetch(this.TOP100_URL);
      const data = await response.json();

      if (!data.data?.bestSeller) {
        throw new Error("Invalid API response structure");
      }

      return data.data.bestSeller.map((item: any, index: number) => ({
        rank: index + 1,
        title: item.cmdtName || "",
        author: item.chrcName || "",
        publisher: item.pbcmName || "",
        price: item.salePrc ? `${item.salePrc.toLocaleString()}원` : "",
        link: `https://store.kyobobook.co.kr/detail/${item.cmdtCode}`,
        cover: item.cmdtImgUrl || "",
        previousRank: item.prevRank || 0,
      }));
    } catch (error) {
      console.error("Kyobo Top100 fetch error:", error);
      return [];
    }
  }

  // HTML 파싱용 (크롤링)
  parse(html: string): BookItem[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const books: BookItem[] = [];

    console.log("Starting to parse Kyobo HTML...");

    // 실제 교보문고 구조: main 내의 list > listitem
    let bookElements = doc.querySelectorAll("main list > listitem");

    // 대체 선택자 - 더 구체적으로
    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll("main ol > li, main ul > li");
    }

    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll("listitem");
    }

    if (bookElements.length === 0) {
      bookElements = doc.querySelectorAll("li");
    }

    console.log(`Found ${bookElements.length} Kyobo book elements`);

    if (bookElements.length === 0) {
      console.log("No Kyobo book elements found. Debugging HTML structure...");
      const bodyContent = doc.body?.innerHTML || "";
      console.log("Kyobo Body content sample:", bodyContent.substring(0, 1000));

      // 가능한 요소들 찾기
      const possibleElements = doc.querySelectorAll(
        'main *, [class*="prod"], [class*="book"], [class*="item"], [class*="goods"]'
      );
      console.log(`Found ${possibleElements.length} possible Kyobo elements`);

      possibleElements.forEach((el, i) => {
        if (i < 10) {
          console.log(`Kyobo Element ${i}:`, el.tagName, el.className, el.id);
        }
      });
    }

    bookElements.forEach((element, index) => {
      try {
        // 실제 구조에 맞는 선택자들

        // 체크박스가 있는지 확인 (도서 아이템 식별)
        const checkboxElement = element.querySelector(
          'checkbox[aria-label*="check"], input[type="checkbox"]'
        );
        if (!checkboxElement) {
          // 체크박스가 없으면 도서 아이템이 아닐 가능성이 높음
          return;
        }

        // 제목과 링크 - 도서 상세 페이지로 가는 링크
        let titleElement: Element | null = null;
        let linkElement: HTMLAnchorElement | null = null;

        // 도서 제목 링크 찾기 (detail 페이지로 가는 링크)
        const detailLinks = element.querySelectorAll('a[href*="/detail/"]');
        for (const link of detailLinks) {
          const linkHref = link.getAttribute("href") || "";
          if (linkHref.includes("/detail/S000")) {
            linkElement = link as HTMLAnchorElement;
            titleElement = link;
            break;
          }
        }

        // 링크에서 제목을 가져올 수 없으면 다른 방법 시도
        if (!titleElement) {
          titleElement = element.querySelector(
            "h1, h2, h3, h4, h5, h6, .title, .book_title, .prod_name"
          );
        }

        if (!linkElement) {
          linkElement = element.querySelector("a") as HTMLAnchorElement;
        }

        // 저자, 출판사, 가격 정보는 텍스트 노드에서 추출
        const textContent = element.textContent || "";

        // 정규식으로 저자, 출판사, 가격 추출
        // 예: "성해나 · 창비 · 2025.03.28 10% 16,200원 18,000원 900p"
        const authorPublisherMatch = textContent.match(
          /([^·\n]+)\s*·\s*([^·\n]+)\s*·\s*[\d.]+/
        );
        const priceMatch = textContent.match(/(\d{1,3}(?:,\d{3})*원)/);

        // 순위 추출 - 숫자만 있는 텍스트 노드 찾기
        let rank = index + 1;
        const rankMatches = textContent.match(/^\s*(\d{1,2})\s/);
        if (rankMatches) {
          rank = parseInt(rankMatches[1]);
        }

        if (titleElement && linkElement) {
          const title =
            titleElement.textContent?.trim() ||
            titleElement.getAttribute("title") ||
            "";

          // 제목이 너무 짧거나 의미없는 경우 스킵
          if (
            title.length < 2 ||
            title === "새창보기" ||
            title === "미리보기"
          ) {
            return;
          }

          const book: BookItem = {
            rank: rank,
            title: title,
            author: authorPublisherMatch ? authorPublisherMatch[1].trim() : "",
            publisher: authorPublisherMatch
              ? authorPublisherMatch[2].trim()
              : "",
            price: priceMatch ? priceMatch[1] : "",
            link: linkElement.href.startsWith("http")
              ? linkElement.href
              : `https://store.kyobobook.co.kr${linkElement.getAttribute("href")}`,
            cover: "", // 이미지는 별도 처리
          };

          // 이미지 찾기
          const imgElement = element.querySelector("img") as HTMLImageElement;
          if (imgElement) {
            book.cover =
              imgElement.src ||
              imgElement.getAttribute("data-src") ||
              imgElement.getAttribute("data-original") ||
              "";
          }

          // 유효한 도서 정보인지 확인
          if (book.title && book.link && book.link.includes("/detail/")) {
            books.push(book);
            console.log(`Parsed Kyobo book ${books.length}:`, book.title);
          }
        }
      } catch (error) {
        console.error(`Error parsing Kyobo book ${index + 1}:`, error);
      }
    });

    console.log(`Successfully parsed ${books.length} Kyobo books`);
    return books.slice(0, 100); // Top 100만 반환
  }

  validateStructure(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 실제 교보문고 사이트 구조 확인
    const patterns = [
      "main list > listitem", // 실제 구조
      "main ol > li",
      "main ul > li",
      "listitem",
      "li",
      'a[href*="/detail/S000"]', // 도서 상세 링크
      'checkbox[aria-label*="check"]', // 체크박스
    ];

    for (const pattern of patterns) {
      const elements = doc.querySelectorAll(pattern);
      if (elements.length > 0) {
        console.log(
          `Found Kyobo HTML structure with pattern: ${pattern} (${elements.length} elements)`
        );

        // 도서 링크가 있는지 추가 확인
        if (pattern.includes("detail") || pattern.includes("checkbox")) {
          return true;
        }

        // listitem이나 li 요소가 있다면 그 안에 도서 링크가 있는지 확인
        for (const element of elements) {
          const hasDetailLink = element.querySelector(
            'a[href*="/detail/S000"]'
          );
          const hasCheckbox = element.querySelector(
            'checkbox, input[type="checkbox"]'
          );
          if (hasDetailLink || hasCheckbox) {
            console.log("Found valid book structure inside elements");
            return true;
          }
        }
      }
    }

    console.log("No recognized Kyobo HTML structure found");

    // 디버깅 정보
    const mainElement = doc.querySelector("main");
    if (mainElement) {
      console.log("Found main element, checking children...");
      const children = mainElement.children;
      for (let i = 0; i < Math.min(5, children.length); i++) {
        console.log(
          `Main child ${i}:`,
          children[i].tagName,
          children[i].className
        );
      }
    }

    return false;
  }
}
