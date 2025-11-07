import { BehaviorSubject } from "rxjs";
import { TileData } from "../atoms/Tile";

export class WatchlistStore {
  private readonly _watchlist$ = new BehaviorSubject<TileData[]>(this._load());
  readonly watchlist$ = this._watchlist$.asObservable();

  add(movie: TileData) {
    const cur = this._watchlist$.value;
    if (!cur.find((m) => m.id === movie.id)) {
      const next = [...cur, movie];
      this._watchlist$.next(next);
      this._save(next);
    }
  }

  remove(id: string) {
    const next = this._watchlist$.value.filter((m) => m.id !== id);
    this._watchlist$.next(next);
    this._save(next);
  }

  toggle(movie: TileData) {
    console.log("toggle ->", movie);
    const exists = this._watchlist$.value.some((m) => m.id === movie.id);
    exists ? this.remove(movie.id) : this.add(movie);
  }

  has(id?: string): boolean {
    if (!id) return false;
    const list = this._watchlist$.value;
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.some((m) => m.id === id);
  }

  clear() {
    this._watchlist$.next([]);
    this._save([]);
  }

  private _save(list: TileData[]) {
    try {
      localStorage.setItem("watchlist", JSON.stringify(list));
    } catch {
      /* Empty */
    }
  }
  private _load(): TileData[] {
    try {
      return JSON.parse(localStorage.getItem("watchlist") || "[]");
    } catch {
      return [];
    }
  }
}

// instancia única (simple)
export const watchlistStore = new WatchlistStore();
