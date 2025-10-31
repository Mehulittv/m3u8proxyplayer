import { RequestHandler } from "express";

export const handleStreamProxy: RequestHandler = async (req, res) => {
  const { url, referer } = req.query;

  // Validate URL parameter
  if (!url || typeof url !== "string") {
    return res.status(400).json({
      error: "Missing or invalid 'url' parameter",
    });
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({
      error: "Invalid URL format",
    });
  }

  try {
    // Build headers for the upstream request
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };

    // Add referer if provided
    if (referer && typeof referer === "string") {
      headers["Referer"] = referer;
    }

    // Fetch the stream from the upstream source
    const response = await fetch(url, {
      headers,
      redirect: "follow",
    });

    // Check if the response is successful
    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    // Get the content type from the upstream response
    const contentType = response.headers.get("content-type");

    // Set CORS and content headers in the response
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Cache-Control", "max-age=3600");

    if (contentType) {
      res.set("Content-Type", contentType);
    }

    // Check if it's an M3U8 playlist
    const isM3u8 =
      contentType?.includes("application/vnd.apple.mpegurl") ||
      contentType?.includes("application/x-mpegURL") ||
      url.endsWith(".m3u8");

    if (isM3u8) {
      // For M3U8, we need to read as text to rewrite URLs
      const body = await response.text();

      // Rewrite relative URLs in the M3U8 playlist to go through the proxy
      // Remove query parameters from the base URL for proper path calculation
      const urlWithoutQuery = url.split("?")[0];
      const baseUrl = urlWithoutQuery.substring(0, urlWithoutQuery.lastIndexOf("/") + 1);

      const rewriteUrl = (segmentUrl: string): string => {
        // Make it absolute if it's relative
        if (!segmentUrl.startsWith("http://") && !segmentUrl.startsWith("https://")) {
          if (segmentUrl.startsWith("/")) {
            segmentUrl = parsedUrl.origin + segmentUrl;
          } else {
            // Handle relative paths (e.g., "3257_000.jpg" or "../segment.m3u8")
            segmentUrl = new URL(segmentUrl, baseUrl).href;
          }
        }

        // Rewrite the URL to go through our proxy
        const encodedUrl = encodeURIComponent(segmentUrl);
        const refererParam = referer ? `&referer=${encodeURIComponent(referer)}` : "";
        return `/api/stream-proxy?url=${encodedUrl}${refererParam}`;
      };

      const rewrittenBody = body
        .split("\n")
        .map((line) => {
          // Handle empty lines
          if (line.trim() === "") {
            return line;
          }

          // Handle lines with URI attributes (e.g., #EXT-X-MEDIA:...URI="...")
          if (line.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (match, url) => {
              return `URI="${rewriteUrl(url)}"`;
            });
          }

          // Handle comment lines - pass through
          if (line.startsWith("#")) {
            return line;
          }

          // Handle segment/playlist URLs (lines that don't start with #)
          let segmentUrl = line.trim();

          if (!segmentUrl) {
            return line;
          }

          return rewriteUrl(segmentUrl);
        })
        .join("\n");

      res.send(rewrittenBody);
    } else {
      // For binary content (images, video segments, etc.), stream as-is
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
};
