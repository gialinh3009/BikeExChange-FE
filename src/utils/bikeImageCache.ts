/**
 * bikeImageCache.ts
 * Lightweight in-memory cache for bike thumbnail URLs.
 * Avoids duplicate fetches across tabs.
 */
import { getBikeDetailAPI } from "../services/bikeService";

const cache = new Map<number, string>();

export async function getBikeImageUrl(bikeId: number, token: string): Promise<string> {
  if (cache.has(bikeId)) return cache.get(bikeId)!;
  try {
    const data = await getBikeDetailAPI(bikeId, token);
    const media: { url: string; type: string }[] = data?.media ?? [];
    const img = media.find((m) => m.type === "IMAGE")?.url ?? media[0]?.url ?? "";
    cache.set(bikeId, img);
    return img;
  } catch {
    cache.set(bikeId, "");
    return "";
  }
}

export async function batchGetBikeImages(
  bikeIds: number[],
  token: string
): Promise<Map<number, string>> {
  const unique = [...new Set(bikeIds)];
  await Promise.all(unique.map((id) => getBikeImageUrl(id, token)));
  const result = new Map<number, string>();
  unique.forEach((id) => result.set(id, cache.get(id) ?? ""));
  return result;
}
