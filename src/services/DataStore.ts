// src/services/DataStore.ts
import { Utils } from "@lightningjs/sdk";
import { TileData } from "../atoms/Tile";

export type AppData = Partial<Record<RailKey, TileData[]>>;

export type RailKey = `rail${number}`;

class DataStore {
  private static _data: AppData | null = null;
  static get data(): AppData {
    if (!this._data) throw new Error("DataStore no inicializado");
    return this._data;
  }
  static get isReady() {
    return this._data !== null;
  }
  static async init(from: "local" | "api" = "local") {
    if (this._data) return;
    if (from === "local") {
      const url = Utils.asset("data/data.json") as string;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error cargando JSON (${res.status})`);
      this._data = (await res.json()) as AppData;
    } else {
      // futuro: fetch('https://api...')
    }
  }
}

export default DataStore;
