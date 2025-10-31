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

    // Get the response body
    const body = await response.text();

    // If it's an M3U8 playlist, rewrite URLs to go through the proxy
    if (contentType?.includes("application/vnd.apple.mpegurl") ||
        contentType?.includes("application/x-mpegURL") ||
        url.endsWith(".m3u8")) {

      // Rewrite relative URLs in the M3U8 playlist to go through the proxy
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

      const rewrittenBody = body
        .split("\n")
        .map((line) => {
          // Skip comments and empty lines
          if (line.startsWith("#") || line.trim() === "") {
            return line;
          }

          // If it's a URL line (not a comment)
          if (!line.startsWith("#")) {
            let segmentUrl = line.trim();

            // Make it absolute if it's relative
            if (!segmentUrl.startsWith("http://") && !segmentUrl.startsWith("https://")) {
              if (segmentUrl.startsWith("/")) {
                segmentUrl = parsedUrl.origin + segmentUrl;
              } else {
                segmentUrl = baseUrl + segmentUrl;
              }
            }

            // Rewrite the URL to go through our proxy
            const encodedUrl = encodeURIComponent(segmentUrl);
            const refererParam = referer ? `&referer=${encodeURIComponent(referer)}` : "";
            return `/api/stream-proxy?url=${encodedUrl}${refererParam}`;
          }

          return line;
        })
        .join("\n");

      res.send(rewrittenBody);
    } else {
      // For non-M3U8 content, just pass through
      res.send(body);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
};
