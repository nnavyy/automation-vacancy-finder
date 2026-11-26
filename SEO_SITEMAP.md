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

1. In [Google Search Console](https://search.google.com/search-console), select the existing URL-prefix property for the production origin or create it if needed.
2. Use a Google account with owner permissions. If working with a new property on the project's `vercel.app` subdomain, choose **HTML tag**, copy the `content` value into the Vercel Production variable `GOOGLE_SITE_VERIFICATION`, redeploy, and click **Verify**. [Google ownership verification](https://support.google.com/webmasters/answer/9008080?hl=en).
3. Open **Sitemaps**, enter `sitemap.xml` under **Add a new sitemap**, and click **Submit**. Monitor processing and indexing in Search Console. [Google's Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en).
