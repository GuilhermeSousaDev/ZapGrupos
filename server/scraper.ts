import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedGroup {
  name: string;
  description?: string;
  whatsappLink: string;
  imageUrl?: string;
}

const BASE = "https://www.gruposdewhatss.com.br";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    headers: HEADERS,
    timeout: 12000,
  });
  return data;
}

function toSlug(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function getDetailUrls(
  category: string,
  pages: number
): Promise<string[]> {
  const seen: Record<string, true> = {};
  const results: string[] = [];
  const DETAIL_RE = /^\/grupos-de-whatsapp-[^/]+\/grupo-\d+$/;

  for (let page = 1; page <= pages; page++) {
    const url =
      page === 1
        ? `${BASE}/grupos-de-whatsapp-${category}`
        : `${BASE}/grupos-de-whatsapp-${category}/page/${page}`;

    let html: string;
    try {
      html = await fetchHtml(url);
    } catch {
      break;
    }

    const $ = cheerio.load(html);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (DETAIL_RE.test(href) && !seen[href]) {
        seen[href] = true;
        results.push(`${BASE}${href}`);
      }
    });

    if (results.length === 0 && page === 1) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

async function fetchGroupInfo(
  detailUrl: string
): Promise<ScrapedGroup | null> {
  let html: string;
  try {
    html = await fetchHtml(detailUrl);
  } catch {
    return null;
  }

  const $ = cheerio.load(html);

  const waLink = $('a[href*="chat.whatsapp.com"]').first().attr("href");
  if (!waLink) return null;

  const name = $("h1").first().text().trim();
  if (!name || name.length < 2) return null;

  const rawImg = $('img[src*="/images/groups/"]').first().attr("src");
  const imageUrl = rawImg ? `${BASE}${rawImg}` : undefined;

  const description = $("p").first().text().trim().slice(0, 300) || undefined;

  return { name, description, whatsappLink: waLink, imageUrl };
}

export async function scrapeWhatsAppGroups(
  query: string,
  limit: number
): Promise<ScrapedGroup[]> {
  const category = toSlug(query);
  const pagesNeeded = Math.ceil((limit * 2) / 15);
  const detailUrls = await getDetailUrls(category, pagesNeeded);

  const results: ScrapedGroup[] = [];

  for (const url of detailUrls) {
    if (results.length >= limit) break;
    const group = await fetchGroupInfo(url);
    if (group) results.push(group);
    await new Promise((r) => setTimeout(r, 400));
  }

  return results;
}
