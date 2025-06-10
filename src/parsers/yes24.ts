import { BookItem, Parser } from "@/types";

export class Yes24Parser implements Parser {
  private readonly TOP100_URL =
    "https://www.yes24.com/Product/Category/BestSeller?categoryNumber=001&pageNumber=1&pageSize=120";

  async fetchTop100(): Promise<BookItem[]> {
    try {
      const response = await fetch(this.TOP100_URL);
      const html = await response.text();
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

    // YES24 베스트셀러 리스트 선택자
    const bookElements = doc.querySelectorAll("#bestList > ol > li");

    bookElements.forEach((element) => {
      const rankElement = element.querySelector(".num");
      const titleElement = element.querySelector(".gd_name");
      const authorElement = element.querySelector(".authPub a:first-child");
      const publisherElement = element.querySelector(".authPub .pub");
      const priceElement = element.querySelector(".yes_m strong");
      const linkElement = element.querySelector(
        ".gd_name"
      ) as HTMLAnchorElement;
      const coverElement = element.querySelector(".lazy") as HTMLImageElement;

      if (titleElement && linkElement) {
        const rank = rankElement?.textContent?.trim() || "0";

        books.push({
          rank: parseInt(rank),
          title: titleElement.textContent?.trim() || "",
          author: authorElement?.textContent?.trim() || "",
          publisher: publisherElement?.textContent?.trim() || "",
          price: priceElement?.textContent?.trim() || "",
          link: `https://www.yes24.com${linkElement.getAttribute("href")}`,
          cover:
            coverElement?.getAttribute("data-original") ||
            coverElement?.src ||
            "",
        });
      }
    });

    return books.slice(0, 100); // Top 100만 반환
  }

  validateStructure(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // YES24 구조 확인
    const hasBestList = doc.querySelector("#bestList") !== null;
    const hasBookItems = doc.querySelector("#bestList > ol > li") !== null;

    return hasBestList && hasBookItems;
  }
}
