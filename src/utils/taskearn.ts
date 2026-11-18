export type PaymentMethod = 'eSewa' | 'Khalti' | 'Mobile Recharge';

export interface MathQuestion {
  num1: number;
  num2: number;
  operator: '+' | '-';
  prompt: string;
  answer: number;
}

export interface ActivityItem {
  id: string;
  type: 'earn' | 'withdraw';
  title: string;
  detail: string;
  coinsDelta: number;
  timestamp: string;
}

export const RUPEE_PER_COIN = 0.1; // 100 Coins = रु. 10
export const MIN_WITHDRAW_COINS = 500;
export const DAILY_BONUS_COINS = 50;
export const QUIZ_REWARD_COINS = 30;
export const VIDEO_REWARD_COINS = 40;
export const SPIN_REWARDS = [10, 20, 30, 50, 75, 100] as const;

export function coinsToRupees(coins: number): string {
  const safe = Math.max(0, coins);
  return (safe * RUPEE_PER_COIN).toFixed(2);
}

export function getTodayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function canClaimDaily(lastClaimDate: string | null, todayKey: string): boolean {
  return lastClaimDate !== todayKey;
}

export function generateMathQuestion(rng: () => number = Math.random): MathQuestion {
  const useSubtraction = rng() > 0.65;
  const a = Math.floor(rng() * 20) + 5;
  const b = Math.floor(rng() * 18) + 1;
  if (useSubtraction) {
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return {
      num1: high,
      num2: low,
      operator: '-',
      prompt: `${high} - ${low} = ?`,
      answer: high - low,
    };
  }
  return {
    num1: a,
    num2: b,
    operator: '+',
    prompt: `${a} + ${b} = ?`,
    answer: a + b,
  };
}

export function pickSpinReward(rng: () => number = Math.random): { index: number; coins: number } {
  const index = Math.floor(rng() * SPIN_REWARDS.length) % SPIN_REWARDS.length;
  return {
    index,
    coins: SPIN_REWARDS[index],
  };
}

export interface WithdrawValidationResult {
  ok: boolean;
  error?: string;
  rupees?: string;
}

export function validateWithdraw(
  coins: number,
  method: PaymentMethod,
  rawAccountNumber: string,
): WithdrawValidationResult {
  const cleaned = rawAccountNumber.replace(/\D/g, '');
  if (coins < MIN_WITHDRAW_COINS) {
    return {
      ok: false,
      error: `Kam se kam ${MIN_WITHDRAW_COINS} Coins (रु. ${coinsToRupees(MIN_WITHDRAW_COINS)}) hokhe ke chahi withdraw kare khatir!`,
    };
  }
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      ok: false,
      error: `Sahi ${method} mobile ya wallet number (10+ digits) dalu!`,
    };
  }
  return {
    ok: true,
    rupees: coinsToRupees(coins),
  };
}
