import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "むすび｜災害支援情報システム", short_name: "むすび",
    description: "行政と災害ボランティアの支援要請・割当・状況確認",
    start_url: "/", display: "standalone", background_color: "#f6f8f7", theme_color: "#075a50",
    lang: "ja", icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
