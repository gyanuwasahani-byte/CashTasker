import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  Coins,
  Disc3,
  Gift,
  History,
  Play,
  Wallet,
  X,
} from 'lucide-react';
import { LuckySpinModal } from './components/LuckySpinModal';
import { MathQuizModal } from './components/MathQuizModal';
import { WithdrawPanel } from './components/WithdrawPanel';
import {
  canClaimDaily,
  coinsToRupees,
  DAILY_BONUS_COINS,
  generateMathQuestion,
  getTodayKey,
  QUIZ_REWARD_COINS,
  VIDEO_REWARD_COINS,
  type ActivityItem,
  type MathQuestion,
  type PaymentMethod,
} from './utils/taskearn';

type MobileTab = 'tasks' | 'spin' | 'withdraw' | 'history';

const STORAGE_COINS_KEY = 'userCoins';
const STORAGE_DAILY_KEY = 'taskearn_daily_claim';
const STORAGE_HISTORY_KEY = 'taskearn_history';

function loadInitialCoins(): number {
  try {
    const raw = localStorage.getItem(STORAGE_COINS_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function loadInitialDailyDate(): string | null {
  try {
    return localStorage.getItem(STORAGE_DAILY_KEY);
  } catch {
    return null;
  }
}

function loadInitialHistory(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [coins, setCoins] = useState<number>(loadInitialCoins);
  const [lastDailyClaim, setLastDailyClaim] = useState<string | null>(loadInitialDailyDate);
  const [history, setHistory] = useState<ActivityItem[]>(loadInitialHistory);
  const [activeTab, setActiveTab] = useState<MobileTab>('tasks');

  // Math Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [question, setQuestion] = useState<MathQuestion>(() => generateMathQuestion());

  // Lucky Spin state
  const [spinOpen, setSpinOpen] = useState(false);

  // 5-Sec Video Ad countdown state
  const [adSecondsLeft, setAdSecondsLeft] = useState<number | null>(null);
  const adIntervalRef = useRef<number | null>(null);

  // Inline Toast Banner (replaces window.alert)
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const tasksSectionRef = useRef<HTMLElement | null>(null);
  const withdrawSectionRef = useRef<HTMLDivElement | null>(null);
  const historySectionRef = useRef<HTMLElement | null>(null);

  const todayKey = getTodayKey();
  const dailyAvailable = canClaimDaily(lastDailyClaim, todayKey);

  // Sync persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COINS_KEY, String(coins));
    } catch {
      // ignore storage quota errors
    }
  }, [coins]);

  useEffect(() => {
    try {
      if (lastDailyClaim) {
        localStorage.setItem(STORAGE_DAILY_KEY, lastDailyClaim);
      }
    } catch {
      // ignore
    }
  }, [lastDailyClaim]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    return () => {
      if (adIntervalRef.current !== null) clearInterval(adIntervalRef.current);
      if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3600);
  }, []);

  const appendHistory = useCallback(
    (type: 'earn' | 'withdraw', title: string, detail: string, coinsDelta: number) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const entry: ActivityItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        title,
        detail,
        coinsDelta,
        timestamp,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 20));
    },
    [],
  );

  // Task 1: Daily Bonus
  const handleClaimDaily = () => {
    if (!dailyAvailable) return;
    setCoins((prev) => prev + DAILY_BONUS_COINS);
    setLastDailyClaim(todayKey);
    appendHistory('earn', 'Daily Check-in Bonus', 'Daily reward claimed', DAILY_BONUS_COINS);
    showToast(`Badhai ho! Aapke +${DAILY_BONUS_COINS} Coins milal ba.`);
  };

  // Task 2: Math Quiz
  const handleOpenQuiz = () => {
    setQuestion(generateMathQuestion());
    setQuizOpen(true);
  };

  const handleQuizSolved = () => {
    setCoins((prev) => prev + QUIZ_REWARD_COINS);
    setQuizOpen(false);
    appendHistory('earn', 'Math Quiz Solve Karu', question.prompt, QUIZ_REWARD_COINS);
    showToast(`Sahi Jawab! +${QUIZ_REWARD_COINS} Coins add ho gail.`);
  };

  // Task 3: Watch 5-Second Video / Ad
  const handleWatchAd = () => {
    if (adSecondsLeft !== null) return;
    setAdSecondsLeft(5);
    adIntervalRef.current = window.setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (adIntervalRef.current !== null) {
            clearInterval(adIntervalRef.current);
            adIntervalRef.current = null;
          }
          setCoins((c) => c + VIDEO_REWARD_COINS);
          appendHistory('earn', 'Video / Ad Dekhu', '5s sponsored clip completed', VIDEO_REWARD_COINS);
          showToast(`Video pura bhail! +${VIDEO_REWARD_COINS} Coins milal.`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Task 4: Lucky Spin
  const handleSpinWin = (wonCoins: number) => {
    setCoins((prev) => prev + wonCoins);
    appendHistory('earn', 'Lucky Spin & Win', 'Prize wheel reward', wonCoins);
    showToast(`Wah! Spin me aapke +${wonCoins} Coins lagal ba!`);
  };

  // Withdraw handler
  const handleWithdrawSuccess = (
    method: PaymentMethod,
    accountNumber: string,
    rupees: string,
    coinsDeducted: number,
  ) => {
    setCoins(0);
    appendHistory(
      'withdraw',
      `Withdraw via ${method}`,
      `${accountNumber} · रु. ${rupees}`,
      -coinsDeducted,
    );
    showToast(`Request Safal! ${method} par रु. ${rupees} 24 ghanta me bhej dihal jai.`);
  };

  const navigateSection = (tab: MobileTab) => {
    setActiveTab(tab);
    if (tab === 'spin') {
      setSpinOpen(true);
      return;
    }
    if (tab === 'tasks') {
      tasksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'withdraw') {
      withdrawSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tab === 'history') {
      historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const adProgressPct = adSecondsLeft !== null ? ((5 - adSecondsLeft) / 5) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-12">
      {/* Desktop Top Bar (Strict 3-Zone Contract) & Compact Mobile App Bar */}
      <header className="sticky top-0 z-30 h-13 md:h-16 bg-white/95 border-b border-slate-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#top"
            className="text-lg sm:text-xl font-display font-extrabold tracking-tight text-blue-700 whitespace-nowrap shrink-0"
          >
            TaskEarn
          </a>

          {/* Zone 2: Clean single-line text nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => navigateSection('tasks')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Earn Tasks
            </button>
            <button
              type="button"
              onClick={() => navigateSection('spin')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Lucky Spin
            </button>
            <button
              type="button"
              onClick={() => navigateSection('withdraw')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => navigateSection('history')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Activity
            </button>
          </nav>

          {/* Zone 3: Single primary action / Live Balance summary */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateSection('withdraw')}
              className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono-num"
            >
              रु. {coinsToRupees(coins)} · Withdraw
            </button>
          </div>
        </div>
      </header>

      {/* Inline Toast Feedback Banner */}
      {toast && (
        <div className="fixed top-16 sm:top-20 right-4 left-4 sm:left-auto sm:w-96 z-40">
          <div
            role="status"
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-lg"
          >
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Container */}
      <main id="top" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Hero Wallet Balance Banner */}
        <section
          aria-label="Wallet Balance"
          className="rounded-2xl p-6 sm:p-8 text-white shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-100">
                Total Balance (Coins)
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  data-testid="coin-balance"
                  className="text-4xl sm:text-5xl font-display font-extrabold font-mono-num text-amber-300"
                >
                  {coins}
                </span>
                <span className="text-base font-medium text-blue-100">Coins</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-emerald-200 mt-2 font-mono-num">
                लगभग रु. <span data-testid="rupee-balance">{coinsToRupees(coins)}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-8">
              <div>
                <p className="text-xs text-blue-100">Conversion Rate</p>
                <p className="text-base sm:text-lg font-display font-bold font-mono-num mt-0.5">
                  100 Coins = रु. 10
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-100">Daily Bonus</p>
                <p className="text-base sm:text-lg font-display font-bold mt-0.5">
                  {dailyAvailable ? 'Ready to Claim' : 'Claimed Today'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Desktop / Stacked Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Earn Tasks */}
          <section
            ref={tasksSectionRef}
            aria-labelledby="tasks-heading"
            className={`lg:col-span-7 space-y-4 ${
              activeTab !== 'tasks' && activeTab !== 'spin' ? 'hidden md:block' : ''
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h1 id="tasks-heading" className="text-xl font-display font-bold text-slate-900">
                Kam Karu &amp; Paisa Kamau
              </h1>
              <span className="text-xs text-slate-500">4 active tasks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              {/* Task 1: Daily Bonus */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-display font-bold text-slate-900 truncate">
                      Daily Check-in Bonus
                    </h2>
                    <p className="text-xs font-semibold text-emerald-700 font-mono-num mt-0.5">
                      +{DAILY_BONUS_COINS} Coins · Daily reward
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!dailyAvailable}
                  onClick={handleClaimDaily}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    dailyAvailable
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {dailyAvailable ? (
                    'Claim'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Claimed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Task 2: Math Quiz */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-display font-bold text-slate-900 truncate">
                      Math Quiz Solve Karu
                    </h2>
                    <p className="text-xs font-semibold text-emerald-700 font-mono-num mt-0.5">
                      +{QUIZ_REWARD_COINS} Coins / Answer
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenQuiz}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  Start
                </button>
              </div>

              {/* Task 3: Watch 5 Sec Video / Ad */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-display font-bold text-slate-900 truncate">
                        Video / Ad Dekhu (5 Sec)
                      </h2>
                      <p className="text-xs font-semibold text-emerald-700 font-mono-num mt-0.5">
                        +{VIDEO_REWARD_COINS} Coins · Instant credit
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={adSecondsLeft !== null}
                    onClick={handleWatchAd}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer font-mono-num ${
                      adSecondsLeft !== null
                        ? 'bg-slate-200 text-slate-700 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {adSecondsLeft !== null ? `Wait ${adSecondsLeft}s...` : 'Watch'}
                  </button>
                </div>
                {adSecondsLeft !== null && (
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${adProgressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Task 4: Lucky Spin & Win */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <Disc3 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-display font-bold text-slate-900 truncate">
                      Lucky Spin &amp; Win
                    </h2>
                    <p className="text-xs font-semibold text-emerald-700 font-mono-num mt-0.5">
                      10 se 100 Coins tak
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSpinOpen(true)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  Spin
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Withdraw & Recent Activity */}
          <div className="lg:col-span-5 space-y-6">
            <div
              ref={withdrawSectionRef}
              className={activeTab !== 'withdraw' ? 'hidden md:block' : ''}
            >
              <WithdrawPanel coins={coins} onWithdrawSuccess={handleWithdrawSuccess} />
            </div>

            <section
              ref={historySectionRef}
              aria-labelledby="activity-heading"
              className={`bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 ${
                activeTab !== 'history' ? 'hidden md:block' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="activity-heading" className="text-base font-display font-bold text-slate-900">
                  Recent Activity
                </h2>
                <span className="text-xs text-slate-500 font-mono-num">{history.length} entries</span>
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Abhi koi activity nai ba. Koi task complete karu aur coins kamau!
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {history.slice(0, 6).map((item) => (
                    <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.detail} · {item.timestamp}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-mono-num font-bold whitespace-nowrap shrink-0 ${
                          item.coinsDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {item.coinsDelta >= 0 ? `+${item.coinsDelta}` : item.coinsDelta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Thumb-Zone Bottom Tab Bar (64px height, <=15% total sticky height) */}
      <nav
        aria-label="Primary mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 border-t border-slate-200 grid grid-cols-4 items-center px-2"
      >
        {(
          [
            { id: 'tasks', label: 'Tasks', Icon: Coins },
            { id: 'spin', label: 'Spin', Icon: Disc3 },
            { id: 'withdraw', label: 'Withdraw', Icon: Wallet },
            { id: 'history', label: 'Activity', Icon: History },
          ] as const
        ).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigateSection(id)}
              className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-0.5 leading-none">{label}</span>
            </button>
          );
        })}
      </nav>

      <MathQuizModal
        open={quizOpen}
        question={question}
        onClose={() => setQuizOpen(false)}
        onSolved={handleQuizSolved}
      />

      <LuckySpinModal
        open={spinOpen}
        onClose={() => setSpinOpen(false)}
        onWin={handleSpinWin}
      />
    </div>
  );
}
