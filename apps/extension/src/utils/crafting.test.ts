import { describe, expect, it } from 'vitest';
import { calcCraftingCost, calcProfit, toUnitPrice } from './crafting';

const reagents = [
  { id: 1, amount: 2 },
  { id: 2, amount: 1 },
];

describe('toUnitPrice', () => {
  it('normalizes numbers, strings and objects', () => {
    expect(toUnitPrice(26)).toBe(26);
    expect(toUnitPrice({ raw: 100 })).toBe(100);
    expect(toUnitPrice('abc')).toBeUndefined();
    expect(toUnitPrice(undefined)).toBeUndefined();
  });
});

describe('calcCraftingCost', () => {
  it('multiplies unit price by reagent amount and craft amount', () => {
    const prices = [
      { itemId: 1, unitPrice: 100 },
      { itemId: 2, unitPrice: 50 },
    ];
    expect(calcCraftingCost(prices, reagents)).toEqual({ cost: 250, missing: 0 });
    expect(calcCraftingCost(prices, reagents, 3)).toEqual({ cost: 750, missing: 0 });
  });

  it('counts reagents without a price as missing', () => {
    const prices = [
      { itemId: 1, unitPrice: 100 },
      { itemId: 2, unitPrice: undefined },
    ];
    expect(calcCraftingCost(prices, reagents)).toEqual({ cost: 200, missing: 1 });
  });
});

describe('calcProfit', () => {
  it('is sell value minus reagent cost', () => {
    expect(calcProfit(1000, 250)).toEqual({ sellValue: 1000, profit: 750 });
  });

  it('can be negative and scales sell value by craft amount', () => {
    expect(calcProfit(100, 250)).toEqual({ sellValue: 100, profit: -150 });
    expect(calcProfit(1000, 750, 0, 3)).toEqual({ sellValue: 3000, profit: 2250 });
  });

  it('is undefined without a sell value or with missing reagent prices', () => {
    expect(calcProfit(undefined, 250)).toBeUndefined();
    expect(calcProfit(0, 250)).toBeUndefined();
    expect(calcProfit(1000, 250, 1)).toBeUndefined();
  });
});
