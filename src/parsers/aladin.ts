import { BookItem, Parser } from "@/types";

export class AladinParser implements Parser {
  private readonly TOP100_URL =
    "https://www.aladin.co.kr/shop/common/wbest.aspx?BranchType=1&CID=0&Year=2024&Month=12&Week=2&BestType=Bestseller&MaxPageIndex=10&page=1&cnt=1000&SortOrder=1";

  async fetchTop100(): Promise<BookItem[]> {
    try {
      const response = await fetch(this.TOP100_URL);
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
      const linkElement = element.querySelector(".bo3 b") as HTMLAnchorElement;
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
