import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { fetchCoins } from "../store/coinsSlice";
import CoinCard from "../components/CoinCard";
import MaxCoinsDialog from "../components/MaxCoinsDialog";
import Hero from "../components/Hero";
import "./Home.css";

interface Props {
  search: string;
}

export default function Home({ search }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { list, listStatus, listError } = useSelector((s: RootState) => s.coins);
  const [dialogCoin, setDialogCoin] = useState<string | null>(null);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCoins());
  }, [dispatch, listStatus]);

  const filtered = list.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
  });

  if (listStatus === "loading") return <div className="home-loading">Loading coins…</div>;
  if (listStatus === "failed") return <div className="home-error">Error: {listError}</div>;

  return (
    <>
      <Hero />
      <div className="home-grid">
        {filtered.map((coin) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            onMaxReached={(id) => setDialogCoin(id)}
          />
        ))}
        {filtered.length === 0 && <p className="home-loading">No coins found.</p>}
      </div>

      {dialogCoin && (
        <MaxCoinsDialog
          pendingCoinId={dialogCoin}
          onClose={() => setDialogCoin(null)}
        />
      )}
    </>
  );
}
