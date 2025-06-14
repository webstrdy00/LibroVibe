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
      console.log(`Fetching Aladin bestsellers from: ${url}`);

      const response = await fetch(url);
      const html = await response.text();
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

    // 알라딘 베스트셀러 리스트 선택자
    const bookElements = doc.querySelectorAll(".ss_book_box");

    bookElements.forEach((element, index) => {
      const titleElement = element.querySelector(".bo3 b");
      const authorElement = element.querySelector(
        ".ss_book_list li:first-child"
      );
      const priceElement = element.querySelector(".ss_p2 b span");
      // const linkElement = element.querySelector(".bo3 b") as HTMLAnchorElement;
      const coverElement = element.querySelector(
        ".flipcover_in img.front_cover"
      ) as HTMLImageElement;

      if (titleElement) {
        const authorText = authorElement?.textContent || "";
        const [author, publisher] = authorText.split("|").map((s) => s.trim());

        // 링크는 상위 요소에서 찾기
        const parentLink = element.querySelector(
          'a[href*="/shop/wproduct.aspx"]'
        ) as HTMLAnchorElement;

        books.push({
          rank: index + 1,
          title: titleElement.textContent?.trim() || "",
          author: author || "",
          publisher: publisher || "",
          price: priceElement?.textContent?.trim() || "",
          link: parentLink
            ? `https://www.aladin.co.kr${parentLink.getAttribute("href")}`
            : "",
          cover: coverElement?.src || "",
        });
      }
    });

    return books.slice(0, 100); // Top 100만 반환
  }

  validateStructure(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 알라딘 구조 확인
    const hasBookBox = doc.querySelector(".ss_book_box") !== null;
    const hasTitle = doc.querySelector(".bo3") !== null;

    return hasBookBox && hasTitle;
  }
}
