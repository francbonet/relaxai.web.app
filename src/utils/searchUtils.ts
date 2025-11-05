import { TileData } from "../atoms/Tile";
import { RailKey } from "../services/DataStore";

type Data = Partial<Record<RailKey, TileData[]>>;

/**
 * Busca una cadena dins de totes les propietats textuals dels items del JSON.
 * @param data JSON amb rails (ex: { rail1: [...], rail2: [...] })
 * @param query Text a buscar
 * @returns Array d’items que contenen la cadena
 */
export function searchItems(data: Data, query: string): TileData[] {
  const results: TileData[] = [];
  if (!query.trim()) return results;

  const normalizedQuery = query.toLowerCase();

  for (const railKey of Object.keys(data) as RailKey[]) {
    const items = data[railKey] ?? [];
    for (const item of items) {
      // concatenem tots els camps que poden contenir text rellevant
      const searchable = [
        item.title,
        item.text,
        item.description,
        item.author,
        item.genres?.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      // si la query apareix dins del text, afegim l’item
      if (searchable.includes(normalizedQuery)) {
        results.push(item);
      }
    }
  }

  return results;
}
