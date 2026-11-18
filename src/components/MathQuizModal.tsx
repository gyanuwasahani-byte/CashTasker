import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { QUIZ_REWARD_COINS, type MathQuestion } from '../utils/taskearn';

interface MathQuizModalProps {
  open: boolean;
  question: MathQuestion;
  onClose: () => void;
  onSolved: () => void;
}

export const MathQuizModal: React.FC<MathQuizModalProps> = ({
  open,
  question,
  onClose,
  onSolved,
}) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setAnswer('');
      setError(null);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open, question]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(answer.trim(), 10);
    if (Number.isNaN(parsed)) {
      setError('Pahile ekta number jawab likhi!');
      return;
    }
    if (parsed === question.answer) {
      onSolved();
    } else {
      setError('Galat jawab ba, phir se koshish karu!');
      setAnswer('');
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-modal-title"
        className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-emerald-700">+{QUIZ_REWARD_COINS} Coins Reward</p>
            <h3 id="quiz-modal-title" className="text-lg font-display font-bold text-slate-900">
              Sahi Jawab Dihi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close math quiz"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-center mb-4">
          <div className="text-3xl font-display font-bold font-mono-num text-slate-900">
            {question.prompt}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quiz-answer-input" className="sr-only">
              Jawab likhi
            </label>
            <input
              ref={inputRef}
              id="quiz-answer-input"
              type="number"
              inputMode="numeric"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Jawab likhi..."
              className="w-full min-h-[48px] px-4 py-2.5 text-center text-lg font-mono-num font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600"
            />
            {error && (
              <p role="alert" className="mt-2 text-xs font-medium text-rose-600 text-center">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Band Karu
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
