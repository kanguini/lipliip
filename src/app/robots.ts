import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/preview/"], disallow: ["/c/", "/dashboard/", "/login", "/register", "/forgot", "/reset"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
