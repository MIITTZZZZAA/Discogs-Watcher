export type ReleaseMini = {
  id: number;
  title: string;
  artists: string;
  num_for_sale: number | null;
  lowest_price: number | { value: number; currency: string } | null;
  resource_url: string;
  uri?: string;
  thumbUrl?: string | null;
  imageUrl?: string | null;
};

export async function getReleaseMini(id: number): Promise<ReleaseMini> {
  const token = import.meta.env.VITE_DISCOGS_TOKEN as string | undefined;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Discogs token=${token}`;

  const res = await fetch(`https://api.discogs.com/releases/${id}`, {
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Release ${id}: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`
    );
  }

  const data = await res.json();

  const imgs: any[] = Array.isArray(data.images) ? data.images : [];
  const primary = imgs.find((x) => x.type === "primary") ?? imgs[0] ?? null;

  return {
    id: data.id,
    title: data.title,
    artists: Array.isArray(data.artists)
      ? data.artists.map((a: any) => a.name).join(", ")
      : "",
    num_for_sale: data.num_for_sale ?? null,
    lowest_price: data.lowest_price ?? null,
    resource_url: data.resource_url,
    uri: data.uri,
    thumbUrl: primary?.uri150 ?? primary?.uri ?? null,
    imageUrl: primary?.uri ?? null,
  };
}
