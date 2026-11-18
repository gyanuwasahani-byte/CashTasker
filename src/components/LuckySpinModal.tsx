import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { pickSpinReward, SPIN_REWARDS } from '../utils/taskearn';

interface LuckySpinModalProps {
  open: boolean;
  onClose: () => void;
  onWin: (coins: number) => void;
}

const SEGMENT_COLORS = ['#1d4ed8', '#047857', '#d97706', '#0284c7', '#b45309', '#15803d'];

export const LuckySpinModal: React.FC<LuckySpinModalProps> = ({ open, onClose, onWin }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWon, setLastWon] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setLastWon(null);
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [open]);

  if (!open) return null;

  const segmentAngle = 360 / SPIN_REWARDS.length;

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setLastWon(null);

    const outcome = pickSpinReward();
    // Center of segment `outcome.index` aligns to top pointer (0 deg)
    const targetSegmentCenter = outcome.index * segmentAngle + segmentAngle / 2;
    const targetMod = (360 - targetSegmentCenter) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const nextRotation = rotation + 360 * 4 + delta;

    setRotation(nextRotation);

    timerRef.current = window.setTimeout(() => {
      setSpinning(false);
      setLastWon(outcome.coins);
      onWin(outcome.coins);
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
      onClick={(e) => {
        if (e.target === e.currentTarget && !spinning) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spin-modal-title"
        className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-amber-700">10 se 100 Coins tak</p>
            <h3 id="spin-modal-title" className="text-lg font-display font-bold text-slate-900">
              Lucky Spin &amp; Win
            </h3>
          </div>
          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            aria-label="Close lucky spin"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SVG Wheel + Top Pointer */}
        <div className="relative flex flex-col items-center my-4">
          {/* Pointer Triangle */}
          <svg viewBox="0 0 24 20" className="w-6 h-5 -mb-2 z-10 text-slate-900" fill="currentColor">
            <polygon points="12,20 2,2 22,2" />
          </svg>

          <div className="w-56 h-56 rounded-full border-4 border-slate-900 overflow-hidden shadow-md">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transition-transform duration-[1800ms] ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {SPIN_REWARDS.map((val, idx) => {
                const startDeg = idx * segmentAngle - 90;
                const endDeg = startDeg + segmentAngle;
                const startRad = (startDeg * Math.PI) / 180;
                const endRad = (endDeg * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);

                const midDeg = startDeg + segmentAngle / 2;
                const midRad = (midDeg * Math.PI) / 180;
                const tx = 100 + 64 * Math.cos(midRad);
                const ty = 100 + 64 * Math.sin(midRad);

                return (
                  <g key={val}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill="#ffffff"
                      fontSize="16"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${midDeg + 90}, ${tx}, ${ty})`}
                    >
                      {val}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="18" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {lastWon !== null && (
          <div
            role="status"
            className="mb-4 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-sm font-semibold text-emerald-800"
          >
            Wah! Spin me aapke +{lastWon} Coins lagal ba!
          </div>
        )}

        <button
          type="button"
          disabled={spinning}
          onClick={handleSpin}
          className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-display font-bold text-base transition-colors cursor-pointer"
        >
          {spinning ? 'Spinning...' : lastWon !== null ? 'Spin Again' : 'Spin Wheel'}
        </button>
      </div>
    </div>
  );
};
