export const blogPostSlugs = [
  "rss-vs-rest",
  "100-vacancy-guard",
  "fast-tier-ai-scoring",
  "recruiter-osint-intelligence",
] as const;

export type BlogPostSlug = (typeof blogPostSlugs)[number];
