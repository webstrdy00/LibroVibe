import { BookItem, Parser } from "@/types";

export class KyoboParser implements Parser {
  private readonly TOP10_URL =
    "https://product.kyobobook.co.kr/api/gw/pub/pdt/best-seller/total?page=1&per=10&period=002&dsplDvsnCode=000&dsplTrgtDvsnCode=001";
  private readonly TOP100_URL =
    "https://product.kyobobook.co.kr/api/gw/pub/pdt/best-seller/total?page=1&per=100&period=002&dsplDvsnCode=000&dsplTrgtDvsnCode=001";

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
        link: `https://product.kyobobook.co.kr/detail/${item.cmdtCode}`,
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
        link: `https://product.kyobobook.co.kr/detail/${item.cmdtCode}`,
        cover: item.cmdtImgUrl || "",
        previousRank: item.prevRank || 0,
      }));
    } catch (error) {
      console.error("Kyobo Top100 fetch error:", error);
      return [];
    }
  }

  // HTML 파싱용 (API가 막힐 경우 대비)
  parse(html: string): BookItem[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const books: BookItem[] = [];

    // 베스트셀러 리스트 선택자
    const bookElements = doc.querySelectorAll(".prod_item");

    bookElements.forEach((element, index) => {
      const titleElement = element.querySelector(".prod_name");
      const authorElement = element.querySelector(".prod_author");
      const priceElement = element.querySelector(".price .val");
      const linkElement = element.querySelector(
        ".prod_name a"
      ) as HTMLAnchorElement;
      const coverElement = element.querySelector(
        ".prod_img img"
      ) as HTMLImageElement;
      const rankElement = element.querySelector(".badge_flag .num");

      if (titleElement && linkElement) {
        books.push({
          rank: rankElement
            ? parseInt(rankElement.textContent || "")
            : index + 1,
          title: titleElement.textContent?.trim() || "",
          author:
            authorElement?.textContent?.trim().replace(/^저자 : /, "") || "",
          price: priceElement ? `${priceElement.textContent?.trim()}원` : "",
          link: linkElement.href,
          cover: coverElement?.src || "",
        });
      }
    });

    return books;
  }

  validateStructure(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 주요 구조 요소 확인
    const hasBookList = doc.querySelector(".prod_item") !== null;
    const hasTitle = doc.querySelector(".prod_name") !== null;

    return hasBookList && hasTitle;
  }
}
