# Sitemap and Google Search Console

## Objective

Publish the site's canonical public content in a sitemap so Google can discover it and report indexing status. The sitemap is a discovery signal. Google determines whether and where each URL appears in search results. [Google's sitemap guide](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## What changed

- Next.js serves `/sitemap.xml` with 13 canonical URLs. It includes the homepage, About, Architecture, Guide, Compare, Demo, both legal pages, the blog index, and all four published posts. [Sitemap implementation](src/app/sitemap.ts) · [Blog slugs](src/lib/blog-slugs.ts).
- The sitemap uses `NEXT_PUBLIC_APP_URL` as the canonical origin, with the Vercel production hostname as a fallback when available. `/home` and `/landing` permanently redirect to the homepage. Sign-in, registration, recovery, dashboard, and API routes are outside the sitemap. [Site origin](src/lib/site-url.ts) · [Homepage redirects](next.config.ts).
- `/robots.txt` points crawlers to the sitemap and disallows crawling the API, dashboard, and password reset URLs. The app can render the public Search Console verification token from `GOOGLE_SITE_VERIFICATION` if the owner chooses HTML tag verification. [Robots implementation](src/app/robots.ts) · [Verification metadata](src/app/layout.tsx).

When publishing a new article, add its slug to [the shared slug list](src/lib/blog-slugs.ts) and add the article and its blog index card. TypeScript checks that the article map matches the sitemap slugs.

## Local verification

With the project environment configured, run these commands.

```powershell
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3078
curl.exe -fsS http://127.0.0.1:3078/sitemap.xml
curl.exe -fsS http://127.0.0.1:3078/robots.txt
```

Check that every sitemap path returns HTTP 200, that all URLs use the intended public origin, and that the robots file names the same sitemap.

## Production and submission

The production origin configured for this project is [the current Vercel site](https://automation-vacancy-finder-phi.vercel.app/). Before this update, its sitemap, robots file, Guide, and Compare returned HTTP 404. Publish the update and verify those live URLs before submitting the sitemap.

The public release was prepared from the production branch in a separate worktree, `B:/Projects/hh.jobs/hh-copilot-public-sitemap`. Commit `a8a6bbf` includes the sitemap and public pages, scopes the light theme to those pages, and preserves the production database schema and private workflow code.

1. In [Google Search Console](https://search.google.com/search-console), select the existing URL-prefix property for the production origin or create it if needed.
2. Use a Google account with owner permissions. If working with a new property on the project's `vercel.app` subdomain, choose **HTML tag**, copy the `content` value into the Vercel Production variable `GOOGLE_SITE_VERIFICATION`, redeploy, and click **Verify**. [Google ownership verification](https://support.google.com/webmasters/answer/9008080?hl=en).
3. Open **Sitemaps**, enter `sitemap.xml` under **Add a new sitemap**, and click **Submit**. Monitor processing and indexing in Search Console. [Google's Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en).

## Release and verification results

- On November 26, 2026, Vercel built and published [release commit `a8a6bbf`](https://github.com/nnavyy/automation-vacancy-finder/commit/a8a6bbfa25c7247338d99fb3b4cd73ea5c33bf81). The release candidate build and the production deployment both completed. The production database schema and backend were outside the release.
- The public [sitemap](https://automation-vacancy-finder-phi.vercel.app/sitemap.xml) and [robots file](https://automation-vacancy-finder-phi.vercel.app/robots.txt) returned HTTP 200. Each of the 13 canonical URLs returned HTTP 200 without a `noindex` directive. Article canonicals matched their sitemap entries, and the two homepage aliases redirected with HTTP 308.
- Google verified ownership through the HTML tag, accepted `/sitemap.xml`, and reported **Success** with **13 discovered pages** on November 26, 2026. The indexing report is separate from sitemap discovery. [Search Console result](https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fautomation-vacancy-finder-phi.vercel.app%2F).

## Live SEO and indexing audit

On November 26, 2026, checked discovery, live crawl eligibility, public HTML, and mobile performance on the production domain.

- The [Page indexing report](https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fautomation-vacancy-finder-phi.vercel.app%2F) was still processing. In URL Inspection, the homepage and `/guide` were **Discovered – currently not indexed**. For `/compare`, Google reported **URL is unknown to Google** in its index snapshot. The live Google test said the homepage and Compare were accessible and eligible for indexing. [URL Inspection guide](https://support.google.com/webmasters/answer/9012289/).
- All 13 sitemap entries returned HTTP 200 with no `noindex` directive seen in the response headers or HTML. The homepage and four blog posts emitted explicit canonicals. About, Architecture, Blog index, Compare, Demo, Guide, Privacy, and Terms did not emit canonical tags. A crawl of HTML links within the sitemap routes from the homepage did not reach Architecture, the Blog index, or its four articles.
- Guide and Compare served Russian headings with English titles in the default HTML. The language toggle stores a preference in browser storage, and the public pages use the same URL for both languages. None of the sampled pages emitted Open Graph images or JSON-LD.
- Search Console had insufficient real-user Core Web Vitals data for mobile and desktop. Two Lighthouse 13.6.0 mobile lab runs on the homepage both scored 69 for performance. Largest Contentful Paint was 1.0–1.4 s, Cumulative Layout Shift was 0, and Total Blocking Time was 2.3–2.9 s. The first trace attributed substantial work to JavaScript evaluation and style/layout. These figures describe simulated page loads. [Core Web Vitals report](https://search.google.com/search-console/core-web-vitals?resource_id=https%3A%2F%2Fautomation-vacancy-finder-phi.vercel.app%2F).

Repeat the lab check on Windows with Chrome installed.

```powershell
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$report = Join-Path $env:TEMP 'hh-copilot-homepage.lighthouse.report.json'
npm.cmd exec --yes --package=lighthouse@13.6.0 -- lighthouse https://automation-vacancy-finder-phi.vercel.app/ --quiet --only-categories=performance,seo --output=json "--output-path=$report" '--chrome-flags=--headless=new --disable-gpu'
```

### Follow-up priorities

1. Request indexing once for the homepage, Guide, and Compare if still absent from the index. Check the Page indexing report as it populates. Successful lab and live tests establish crawl eligibility. Index coverage is tracked by Google separately. [Google's recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
2. Link Articles and Architecture from relevant public pages. Add explicit canonicals and page-specific titles where missing, and match metadata to the visible page language. [Google's guidance on internal links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) · [Title guidance](https://developers.google.com/search/docs/appearance/title-link).
3. Use separate server-rendered EN and RU page URLs and reciprocal `hreflang` if both languages need to appear independently in search. [Google's localization guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).
4. Add evidence and methodology for numerical claims in published articles, including the 42% response-rate claim. Build search content around actual workflows for HeadHunter applicants. [Google's guidance on helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
5. Profile JavaScript and layout work during the homepage's initial load to reduce main-thread blocking. Repeat the mobile lab test under the same settings, then compare against field data when it becomes available. [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview).

## Public SEO improvements

The follow-up uses the 13 existing public URLs. The work targets consistent canonicals and descriptive titles, crawlable links to editorial pages, and a lighter homepage startup while preserving the product tour and database-backed public activity. A crawl of the release candidate must reach all sitemap pages from the homepage. Mobile lab runs use the same Lighthouse version and settings as the earlier two runs. Expected outcomes are fewer initial transfers and less main-thread blocking. Compare the measured results after release using the production origin.

- Added page-specific canonical URLs across the sitemap, aligned Guide, About, and Compare metadata with the Russian HTML default, and gave Demo and Architecture distinct search titles. Blog and Architecture are linked from the homepage and related public pages. Editorial copy now reflects the collector implementation and omits unsupported performance and response-rate figures.
- The homepage uses CSS for tour transitions and public-stat decoration. The tour starts watching visibility only when autoplay is enabled. Homepage links remain available in HTML and defer destination loading until navigation.
- The release candidate build completed. All 161 tests passed across 29 files, including eight homepage tests. The release candidate passed an HTTP crawl of all 13 sitemap pages, canonical and title checks, internal link reachability, and homepage redirect checks.

```powershell
$env:NODE_OPTIONS = '--no-experimental-webstorage'
npm.cmd test
npm.cmd run build
node scripts/check-public-seo.mjs https://automation-vacancy-finder-phi.vercel.app
node scripts/check-public-seo.mjs http://127.0.0.1:3077 https://automation-vacancy-finder-phi.vercel.app
```
