export type ReagentPrice = {
  itemId: number;
  /** Unit price in copper, or undefined/NaN when there is no price */
  unitPrice: number | undefined;
};

export type ReagentAmount = { id: number; amount: number };

/** Normalize a min buyout from the item response (number or object with raw copper). */
export function toUnitPrice(minBuyout: number | string | { raw: number } | undefined) {
  if (minBuyout == null) {
    return undefined;
  }

  const value = typeof minBuyout === 'object' ? minBuyout.raw : Number(minBuyout);
  return Number.isNaN(value) ? undefined : value;
}

/**
 * Total reagent cost in copper. `missing` counts reagents without a usable price.
 *
 * Price basis: callers pass each reagent's realm **min buyout** (what buying the mats costs right
 * now), while `calcProfit` values the crafted item at its realm **market value**. The tooltip
 * labels both rows so the mixed basis is visible to the user.
 */
export function calcCraftingCost(
  prices: ReagentPrice[],
  reagents: ReagentAmount[],
  craftAmount = 1,
): { cost: number; missing: number } {
  let cost = 0;
  let missing = 0;

  for (const { itemId, unitPrice } of prices) {
    if (unitPrice == null || Number.isNaN(unitPrice)) {
      missing++;
      continue;
    }

    const amount = reagents.find((reagent) => reagent.id === itemId)?.amount ?? 1;
    cost += unitPrice * amount * craftAmount;
  }

  return { cost, missing };
}

/**
 * Profit in copper: crafted item realm market value minus reagent cost (reagents at min buyout).
 * Undefined when the crafted item has no market value or a reagent price is missing,
 * since the number would be misleading.
 */
export function calcProfit(
  sellValue: number | undefined,
  cost: number,
  missingReagents = 0,
  craftAmount = 1,
): { sellValue: number; profit: number } | undefined {
  if (!sellValue || Number.isNaN(sellValue) || missingReagents > 0) {
    return undefined;
  }

  const totalSellValue = sellValue * craftAmount;
  return { sellValue: totalSellValue, profit: totalSellValue - cost };
}
