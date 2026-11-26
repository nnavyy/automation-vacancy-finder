import type { MetadataRoute } from "next";
import { blogPostSlugs } from "@/lib/blog-slugs";
import { siteOrigin } from "@/lib/site-url";

const publicPages = [
  "/",
  "/about",
  "/architecture",
  "/blog",
  "/compare",
  "/demo",
  "/guide",
  "/legal/privacy",
  "/legal/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...publicPages, ...blogPostSlugs.map((slug) => `/blog/${slug}`)].map(
    (path) => ({ url: new URL(path, siteOrigin).href }),
  );
}
