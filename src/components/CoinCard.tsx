import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { toggleSelected, fetchCoinDetail } from "../store/coinsSlice";
import type { Coin } from "../store/coinsSlice";
import "./CoinCard.css";

interface Props {
  coin: Coin;
  onMaxReached: (coinId: string) => void;
}

export default function CoinCard({ coin, onMaxReached }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const selected = useSelector((s: RootState) => s.coins.selectedIds);
  const detail = useSelector((s: RootState) => s.coins.detailsCache[coin.id]);
  const loading = useSelector((s: RootState) => s.coins.detailsLoading[coin.id]);
  const isSelected = selected.includes(coin.id);
  const [showInfo, setShowInfo] = useState(false);

  const handleSwitch = () => {
    if (!isSelected && selected.length >= 5) {
      onMaxReached(coin.id);
      return;
    }
    dispatch(toggleSelected(coin.id));
  };

  const handleMoreInfo = () => {
    if (!showInfo && !detail) {
      dispatch(fetchCoinDetail(coin.id));
    }
    setShowInfo((p) => !p);
  };

  return (
    <div className="coin-card">
      <div className="coin-card-header">
        <img src={coin.image} alt={coin.name} />
        <div className="coin-info">
          <span className="coin-symbol">{coin.symbol}</span>
          <span className="coin-name">{coin.name}</span>
        </div>
        <div className="switch-wrapper">
          <label className="switch">
            <input type="checkbox" checked={isSelected} onChange={handleSwitch} />
            <span className="slider" />
          </label>
        </div>
      </div>

      <button className="btn-more-info" onClick={handleMoreInfo}>
        {showInfo ? "Close Info" : "More Info"}
      </button>

      {showInfo && (
        <div className="coin-detail">
          {loading ? (
            <p>Loading…</p>
          ) : detail ? (
            <>
              <p className="usd">$ {detail.usd.toLocaleString()}</p>
              <p className="eur">€ {detail.eur.toLocaleString()}</p>
              <p className="ils">₪ {detail.ils.toLocaleString()}</p>
            </>
          ) : (
            <p>Failed to load</p>
          )}
          <button className="btn-close-info" onClick={() => setShowInfo(false)}>
            Close Info
          </button>
        </div>
      )}
    </div>
  );
}
