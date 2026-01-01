import { Request, Response } from "express";
import { handleTrackingPixel } from "./routers";

/**
 * 1x1 transparent GIF pixel
 */
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * Handle tracking pixel requests
 */
export async function trackingPixelHandler(req: Request, res: Response) {
  const { token } = req.params;

  if (!token) {
    res.status(400).send("Missing tracking token");
    return;
  }

  // Extract IP and user agent
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    // Record the open asynchronously
    handleTrackingPixel(token, ipAddress, userAgent).catch((error) => {
      console.error("Error recording email open:", error);
    });
  } catch (error) {
    console.error("Error in tracking pixel handler:", error);
  }

  // Always return the pixel immediately
  res.set({
    "Content-Type": "image/gif",
    "Content-Length": TRACKING_PIXEL.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  res.send(TRACKING_PIXEL);
}
