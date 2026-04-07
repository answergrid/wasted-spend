import type { MetadataRoute } from "next";

/** Site origin: no `www`, HTTPS, lowercase host only (paths added separately). */
const SITE_ORIGIN = "https://wastedspend.app";

/**
 * Canonical sitemap URLs:
 * - https://wastedspend.app (homepage)
 * - https://wastedspend.app/blog
 * - https://wastedspend.app/blog/post-name
 * No trailing slashes, all-lowercase paths.
 */
function siteUrl(path = ""): string {
  const normalized = path
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
  if (!normalized || normalized === "/") {
    return SITE_ORIGIN;
  }
  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;
  return `${SITE_ORIGIN}${withLeadingSlash}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteUrl("/blog"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: siteUrl("/blog/automate-negative-keywords"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: siteUrl("/blog/reduce-google-ads-wasted-spend"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: siteUrl("/blog/google-ads-search-terms-report"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: siteUrl("/blog/stop-wasting-google-ads-budget"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
