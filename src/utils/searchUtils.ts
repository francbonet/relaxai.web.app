import { TileData } from "../atoms/Tile";
import { RailKey } from "../services/DataStore";

type Data = Partial<Record<RailKey, TileData[]>>;

export function searchItems(data: Data, query: string): TileData[] {
  const results: TileData[] = [];
  if (!query.trim()) return results;

  const normalizedQuery = query.toLowerCase();

  for (const railKey of Object.keys(data) as RailKey[]) {
    const items = data[railKey] ?? [];
    for (const item of items) {
      const searchable = [
        item.title,
        // disabled search in teh all content
        // item.text,
        // item.description,
        // item.author,
        // item.genres?.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      if (searchable.includes(normalizedQuery)) {
        results.push(item);
      }
    }
  }

  return results;
}
