import { load } from "cheerio";

const [baseUrl, sitemapOrigin = baseUrl] = process.argv.slice(2);
if (!baseUrl) throw new Error("Usage: node scripts/check-public-seo.mjs <site-url> [canonical-site-url]");

const origin = new URL(baseUrl).origin;
const canonicalOrigin = new URL(sitemapOrigin).origin;
const errors = [];

async function request(pathname) {
  return fetch(new URL(pathname, origin), {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
}

const sitemap = await request("/sitemap.xml");
const robots = await request("/robots.txt");
if (sitemap.status !== 200 || robots.status !== 200) {
  throw new Error(`Expected successful sitemap and robots responses. Got ${sitemap.status} and ${robots.status}.`);
}
if (!(await robots.text()).includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) {
  errors.push("robots.txt points to a different sitemap");
}

const xml = load(await sitemap.text(), { xml: true });
const urls = xml("url > loc").map((_, element) => new URL(xml(element).text())).get();
const paths = new Set(urls.map((url) => url.pathname));
if (!paths.has("/") || paths.size !== urls.length) {
  errors.push("The sitemap must contain the homepage and unique paths");
}

const audits = await Promise.allSettled(urls.map(async (url) => {
  const { pathname } = url;
  if (url.origin !== canonicalOrigin) errors.push(`${pathname} has the wrong sitemap origin`);

  const response = await request(pathname);
  if (response.status !== 200) throw new Error(`${pathname} returned HTTP ${response.status}`);

  const page = load(await response.text());
  const canonical = page('link[rel="canonical"]').attr("href");
  if (!canonical || new URL(canonical, canonicalOrigin).href !== url.href) {
    errors.push(`${pathname} is missing its expected canonical URL`);
  }

  const directives = [
    response.headers.get("x-robots-tag"),
    page('meta[name="robots"]').attr("content"),
    page('meta[name="googlebot"]').attr("content"),
  ];
  if (directives.some((value) => /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,])/i.test(value || ""))) {
    errors.push(`${pathname} disallows indexing`);
  }

  const title = page("title").text().trim();
  const description = page('meta[name="description"]').attr("content")?.trim();
  if (!title || !description) errors.push(`${pathname} is missing a title or description`);

  const internalPaths = [];
  for (const link of page("a[href]").toArray()) {
    const target = new URL(page(link).attr("href"), `${origin}${pathname}`);
    if ((target.origin === origin || target.origin === canonicalOrigin) && paths.has(target.pathname)) {
      internalPaths.push(target.pathname);
    }
  }
  return { pathname, title, internalPaths };
}));

const pages = new Map();
const titles = new Set();
for (const audit of audits) {
  if (audit.status === "rejected") {
    errors.push(String(audit.reason));
    continue;
  }
  const { pathname, title, internalPaths } = audit.value;
  if (titles.has(title)) errors.push(`${pathname} repeats another page's title`);
  titles.add(title);
  pages.set(pathname, internalPaths);
}

const reachable = new Set(["/"]);
const pending = ["/"];
for (const pathname of pending) {
  for (const destination of pages.get(pathname) || []) {
    if (reachable.has(destination)) continue;
    reachable.add(destination);
    pending.push(destination);
  }
}
for (const pathname of paths) {
  if (!reachable.has(pathname)) errors.push(`${pathname} cannot be reached by public links from the homepage`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Checked ${paths.size} public pages with matching canonicals, unique titles, and links from the homepage.`);
}
