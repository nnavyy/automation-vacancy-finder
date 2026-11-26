import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/reset-password/"] },
    sitemap: new URL("/sitemap.xml", siteOrigin).href,
  };
}
