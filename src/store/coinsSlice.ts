import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

/* ---- Types ---- */
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

export interface CoinDetail {
  usd: number;
  eur: number;
  ils: number;
}

export interface CoinMarketData {
  name: string;
  usd_price_current: number;
  usd_cap_market: number;
  usd_h24_volume: number;
  currency_in_d30_percentage_change_price: number;
  currency_in_d60_percentage_change_price: number;
  currency_in_d200_percentage_change_price: number;
}

interface CoinsState {
  list: Coin[];
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  listError: string | null;
  selectedIds: string[]; // persisted
  detailsCache: Record<string, CoinDetail>; // coinId -> prices
  detailsLoading: Record<string, boolean>;
}

/* ---- Helpers ---- */
const SELECTED_KEY = "cryptonite_selected";
const loadSelected = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SELECTED_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveSelected = (ids: string[]) =>
  localStorage.setItem(SELECTED_KEY, JSON.stringify(ids));

/* ---- Thunks ---- */
export const fetchCoins = createAsyncThunk("coins/fetchCoins", async () => {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=100"
  );
  if (!res.ok) throw new Error("Failed to fetch coins");
  const data = await res.json();
  return data.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    symbol: (c.symbol as string).toUpperCase(),
    name: c.name as string,
    image: c.image as string,
  })) as Coin[];
});

export const fetchCoinDetail = createAsyncThunk(
  "coins/fetchCoinDetail",
  async (coinId: string) => {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    if (!res.ok) throw new Error("Failed to fetch coin details");
    const data = await res.json();
    const mp = data.market_data.current_price;
    return {
      coinId,
      detail: { usd: mp.usd, eur: mp.eur, ils: mp.ils } as CoinDetail,
    };
  }
);

/* ---- Slice ---- */
const initialState: CoinsState = {
  list: [],
  listStatus: "idle",
  listError: null,
  selectedIds: loadSelected(),
  detailsCache: {},
  detailsLoading: {},
};

const coinsSlice = createSlice({
  name: "coins",
  initialState,
  reducers: {
    toggleSelected(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((s) => s !== id);
      } else {
        if (state.selectedIds.length < 5) {
          state.selectedIds.push(id);
        }
      }
      saveSelected(state.selectedIds);
    },
    removeSelected(state, action: PayloadAction<string>) {
      state.selectedIds = state.selectedIds.filter((s) => s !== action.payload);
      saveSelected(state.selectedIds);
    },
    addSelected(state, action: PayloadAction<string>) {
      if (!state.selectedIds.includes(action.payload) && state.selectedIds.length < 5) {
        state.selectedIds.push(action.payload);
        saveSelected(state.selectedIds);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoins.pending, (state) => {
        state.listStatus = "loading";
      })
      .addCase(fetchCoins.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchCoins.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.error.message ?? "Unknown error";
      })
      .addCase(fetchCoinDetail.pending, (state, action) => {
        state.detailsLoading[action.meta.arg] = true;
      })
      .addCase(fetchCoinDetail.fulfilled, (state, action) => {
        state.detailsCache[action.payload.coinId] = action.payload.detail;
        state.detailsLoading[action.payload.coinId] = false;
      })
      .addCase(fetchCoinDetail.rejected, (state, action) => {
        state.detailsLoading[action.meta.arg] = false;
      });
  },
});

export const { toggleSelected, removeSelected, addSelected } = coinsSlice.actions;
export default coinsSlice.reducer;
