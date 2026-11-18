import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  coinsToRupees,
  MIN_WITHDRAW_COINS,
  validateWithdraw,
  type PaymentMethod,
} from '../utils/taskearn';

interface WithdrawPanelProps {
  coins: number;
  onWithdrawSuccess: (method: PaymentMethod, accountNumber: string, rupees: string, coinsDeducted: number) => void;
}

export const WithdrawPanel: React.FC<WithdrawPanelProps> = ({ coins, onWithdrawSuccess }) => {
  const [method, setMethod] = useState<PaymentMethod>('eSewa');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    method: PaymentMethod;
    account: string;
    rupees: string;
  } | null>(null);

  const progressPct = Math.min(100, Math.round((coins / MIN_WITHDRAW_COINS) * 100));
  const coinsRemaining = Math.max(0, MIN_WITHDRAW_COINS - coins);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReceipt(null);
    const result = validateWithdraw(coins, method, accountNumber);
    if (!result.ok || !result.rupees) {
      setError(result.error ?? 'Invalid withdrawal request');
      return;
    }
    setError(null);
    const cleaned = accountNumber.trim();
    onWithdrawSuccess(method, cleaned, result.rupees, coins);
    setReceipt({ method, account: cleaned, rupees: result.rupees });
    setAccountNumber('');
  };

  return (
    <section
      aria-labelledby="withdraw-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 id="withdraw-heading" className="text-lg font-display font-bold text-slate-900">
            Paisa Nikalu (Withdraw)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100 Coins = रु. 10 · Minimum {MIN_WITHDRAW_COINS} Coins (रु. {coinsToRupees(MIN_WITHDRAW_COINS)})
          </p>
        </div>
        <span className="text-xs font-mono-num font-semibold text-amber-700 whitespace-nowrap">
          {progressPct}% Ready
        </span>
      </div>

      {/* Minimum Threshold Progress Bar */}
      <div className="mb-5">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              coinsRemaining === 0 ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-1.5 font-mono-num">
          {coinsRemaining === 0
            ? `Eligible to withdraw रु. ${coinsToRupees(coins)} now`
            : `${coinsRemaining} more coins needed to unlock payout`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="payment-method-select"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Payment Method
          </label>
          <select
            id="payment-method-select"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value as PaymentMethod);
              setError(null);
            }}
            className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
          >
            <option value="eSewa">eSewa</option>
            <option value="Khalti">Khalti</option>
            <option value="Mobile Recharge">Mobile Recharge (NTC/Ncell)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="account-number-input"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Mobile / Wallet Number
          </label>
          <input
            id="account-number-input"
            type="tel"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Aapan Mobile / Wallet Number Dalu"
            className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-mono-num text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        {receipt && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Request Safal!</span>
            </div>
            <p>
              Method: {receipt.method} · Number: <span className="font-mono-num">{receipt.account}</span>
            </p>
            <p className="font-mono-num font-semibold">
              Amount: रु. {receipt.rupees} · 24 ghanta me paisa bhej dihal jai.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>Withdraw Request Bheju</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
};
