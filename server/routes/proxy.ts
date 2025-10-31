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
  try {
    new URL(url);
  } catch {
    return res.status(400).json({
      error: "Invalid URL format",
    });
  }

  try {
    // Build headers for the upstream request
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
      return res.status(response.status).json({
        error: `Upstream server returned status ${response.status}`,
      });
    }

    // Get the content type from the upstream response
    const contentType = response.headers.get("content-type");

    // Set CORS and content headers in the response
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Cache-Control", "no-cache");

    if (contentType) {
      res.set("Content-Type", contentType);
    }

    // Stream the response body
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
};
