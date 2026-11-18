import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canClaimDaily,
  coinsToRupees,
  generateMathQuestion,
  pickSpinReward,
  SPIN_REWARDS,
  validateWithdraw,
} from './taskearn';

test('coinsToRupees converts 100 coins to 10.00 rupees', () => {
  assert.equal(coinsToRupees(0), '0.00');
  assert.equal(coinsToRupees(100), '10.00');
  assert.equal(coinsToRupees(550), '55.00');
});

test('canClaimDaily enforces once-per-day check-in', () => {
  assert.equal(canClaimDaily(null, '2026-11-18'), true);
  assert.equal(canClaimDaily('2026-11-17', '2026-11-18'), true);
  assert.equal(canClaimDaily('2026-11-18', '2026-11-18'), false);
});

test('generateMathQuestion produces accurate prompt and answer', () => {
  const addQ = generateMathQuestion(() => 0.2);
  assert.equal(addQ.operator, '+');
  assert.equal(addQ.answer, addQ.num1 + addQ.num2);

  const subQ = generateMathQuestion(() => 0.8);
  assert.equal(subQ.operator, '-');
  assert.equal(subQ.answer, subQ.num1 - subQ.num2);
  assert.ok(subQ.answer >= 0);
});

test('pickSpinReward returns valid segment within SPIN_REWARDS', () => {
  const first = pickSpinReward(() => 0);
  assert.equal(first.index, 0);
  assert.equal(first.coins, SPIN_REWARDS[0]);

  const last = pickSpinReward(() => 0.99);
  assert.equal(last.index, SPIN_REWARDS.length - 1);
  assert.equal(last.coins, SPIN_REWARDS[SPIN_REWARDS.length - 1]);
});

test('validateWithdraw checks 500-coin minimum and 10+ digit wallet number', () => {
  const lowCoins = validateWithdraw(490, 'eSewa', '9841234567');
  assert.equal(lowCoins.ok, false);
  assert.ok(lowCoins.error?.includes('500'));

  const shortNum = validateWithdraw(600, 'Khalti', '98412');
  assert.equal(shortNum.ok, false);
  assert.ok(shortNum.error?.includes('Khalti'));

  const valid = validateWithdraw(650, 'eSewa', '9841234567');
  assert.equal(valid.ok, true);
  assert.equal(valid.rupees, '65.00');
});
