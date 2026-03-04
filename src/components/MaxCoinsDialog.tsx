import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { removeSelected, addSelected } from "../store/coinsSlice";
import "./MaxCoinsDialog.css";

interface Props {
  pendingCoinId: string;
  onClose: () => void;
}

export default function MaxCoinsDialog({ pendingCoinId, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const selectedIds = useSelector((s: RootState) => s.coins.selectedIds);
  const coins = useSelector((s: RootState) => s.coins.list);
  const [picked, setPicked] = useState<string | null>(null);

  const pendingCoin = coins.find((c) => c.id === pendingCoinId);

  const handleRemove = (id: string) => {
    dispatch(removeSelected(id));
    dispatch(addSelected(pendingCoinId));
    onClose();
  };

  const handleConfirm = () => {
    if (picked) {
      handleRemove(picked);
    }
  };

  /* Block clicks on overlay from closing */
  return (
    <div className="dialog-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h2>Maximum Coins Reached</h2>
        <p>
          You can select up to 5 coins for comparison. To add{" "}
          <strong>{pendingCoin?.name ?? pendingCoinId}</strong>, please choose
          one to remove:
        </p>

        <ul className="dialog-list">
          {selectedIds.map((id) => {
            const c = coins.find((x) => x.id === id);
            return (
              <li key={id} onClick={() => setPicked(id)}>
                <span
                  className="remove-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(id);
                  }}
                >
                  ✖
                </span>
                <input
                  type="radio"
                  name="removeCoin"
                  checked={picked === id}
                  onChange={() => setPicked(id)}
                />
                {c?.name ?? id}
              </li>
            );
          })}
        </ul>

        <div className="dialog-buttons">
          <button
            className="btn-confirm"
            disabled={!picked}
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
