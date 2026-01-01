import { createApi } from "unsplash-js";

let unsplashClient: ReturnType<typeof createApi> | null = null;

function getUnsplashClient() {
  if (!unsplashClient) {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      throw new Error("UNSPLASH_ACCESS_KEY environment variable is not set");
    }
    unsplashClient = createApi({
      accessKey,
    });
  }
  return unsplashClient;
}

export interface UnsplashImage {
  id: string;
  url: string;
  downloadUrl: string;
  description: string | null;
  altDescription: string | null;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
}

/**
 * Search for images on Unsplash
 */
export async function searchImages(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<UnsplashImage[]> {
  const client = getUnsplashClient();

  try {
    const result = await client.search.getPhotos({
      query,
      page,
      perPage,
      orientation: "landscape",
    });

    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors.join(", ")}`);
    }

    if (!result.response) {
      return [];
    }

    return result.response.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      downloadUrl: photo.urls.full,
      description: photo.description,
      altDescription: photo.alt_description,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    }));
  } catch (error) {
    console.error("Error searching Unsplash images:", error);
    throw new Error("Failed to search images");
  }
}

/**
 * Get a random image from Unsplash
 */
export async function getRandomImage(
  query?: string
): Promise<UnsplashImage | null> {
  const client = getUnsplashClient();

  try {
    const result = await client.photos.getRandom({
      query,
      orientation: "landscape",
    });

    if (result.errors) {
      throw new Error(`Unsplash API error: ${result.errors.join(", ")}`);
    }

    if (!result.response || Array.isArray(result.response)) {
      return null;
    }

    const photo = result.response;
    return {
      id: photo.id,
      url: photo.urls.regular,
      downloadUrl: photo.urls.full,
      description: photo.description,
      altDescription: photo.alt_description,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    };
  } catch (error) {
    console.error("Error getting random Unsplash image:", error);
    throw new Error("Failed to get random image");
  }
}

/**
 * Track download of an image (required by Unsplash API guidelines)
 */
export async function trackImageDownload(imageId: string): Promise<void> {
  const client = getUnsplashClient();

  try {
    await client.photos.trackDownload({
      downloadLocation: `https://api.unsplash.com/photos/${imageId}/download`,
    });
  } catch (error) {
    console.error("Error tracking Unsplash image download:", error);
    // Don't throw error here as it's not critical
  }
}
