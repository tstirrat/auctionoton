import type * as i from '../types';

/**
 * Helpers for TradeSkillMaster's public CSV data (https://tradeskillmaster.com/public-data).
 * Prices are in copper.
 */

export type TsmRegion = 'us' | 'eu' | 'tw' | 'kr';
export type TsmScope = 'region' | 'realm';

type NumericColumn =
  | 'marketValue'
  | 'minBuyout'
  | 'recent'
  | 'historical'
  | 'avgSalePrice'
  | 'saleRate'
  | 'soldPerDay';

export type Row = {
  itemId: number;
  name: string;
  updatedAt: string;
} & Partial<Record<NumericColumn, number>>;

const TSM_DATA_URL = 'https://public-data.tradeskillmaster.com';

/** Maps our game versions to the path segment TSM uses. Add more versions here later. */
export const TSM_VERSION_PATHS: Partial<Record<string, string>> = {
  forever: 'forever',
};

const SAFE_SEGMENT = /^[a-z0-9-]+$/;

export function buildUrl(
  version: string,
  region: string,
  scope: TsmScope,
  slug?: string,
): string | undefined {
  const versionPath = TSM_VERSION_PATHS[version];
  if (!versionPath || !SAFE_SEGMENT.test(region)) {
    return undefined;
  }

  if (scope === 'region') {
    return `${TSM_DATA_URL}/${versionPath}/${region}/region/items.csv`;
  }

  if (!slug || !SAFE_SEGMENT.test(slug)) {
    return undefined;
  }

  return `${TSM_DATA_URL}/${versionPath}/${region}/realm/${slug}/items.csv`;
}

export function buildItemUrl(version: string, region: string, slug: string, itemId: number) {
  const versionPath = TSM_VERSION_PATHS[version];
  return versionPath
    ? `https://tradeskillmaster.com/${versionPath}/${region}/${slug}/items/${itemId}`
    : undefined;
}

/** RFC4180 parser. Handles quoted fields with embedded commas, quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  if (text.charCodeAt(0) === 0xfeff) {
    i = 1; // strip BOM
  }

  for (; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') {
        i++;
      }
      record.push(field);
      field = '';
      records.push(record);
      record = [];
    } else {
      field += c;
    }
  }

  // Last record without trailing newline
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records.filter((r) => !(r.length === 1 && r[0] === ''));
}

const STRING_COLUMNS = new Set(['name', 'updatedAt']);

/** Parses a TSM items.csv into a map keyed by item ID. Header-only/empty files give an empty map. */
export function parseItemsCsv(text: string): Map<number, Row> {
  const rows = new Map<number, Row>();
  const [header, ...records] = parseCsv(text);

  if (!header || !header.includes('itemId')) {
    return rows;
  }

  for (const record of records) {
    const row: Record<string, string | number> = {};

    header.forEach((column, index) => {
      const value = record[index] ?? '';
      row[column] = STRING_COLUMNS.has(column) ? value : Number(value);
    });

    const itemId = row.itemId as number;
    if (Number.isInteger(itemId) && itemId > 0) {
      rows.set(itemId, row as unknown as Row);
    }
  }

  return rows;
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Maps TSM rows onto the item response shape the UI consumes.
 * Returns undefined when the item is in neither file.
 */
export function toItemResponse(
  realmRow: Row | undefined,
  regionRow: Row | undefined,
): i.ItemResponseV2 | undefined {
  const base = realmRow ?? regionRow;
  if (!base) {
    return undefined;
  }

  return {
    server: '',
    itemId: base.itemId,
    name: base.name,
    uniqueName: slugifyName(base.name),
    icon: '',
    tags: [],
    requiredLevel: 0,
    itemLevel: 0,
    sellPrice: 0,
    vendorPrice: null,
    tooltip: [],
    itemLink: '',
    uri: '',
    amount: 1,
    stats: {
      lastUpdated: base.updatedAt,
      current: {
        marketValue: realmRow?.marketValue ?? 0,
        minBuyout: realmRow?.minBuyout ?? 0,
        historicalValue: realmRow?.historical ?? 0,
        // The realm CSV has no quantity/numAuctions columns
        quantity: undefined,
        numAuctions: undefined,
      },
    },
    regional: regionRow
      ? {
          marketValue: regionRow.marketValue ?? 0,
          historical: regionRow.historical ?? 0,
          avgSalePrice: regionRow.avgSalePrice ?? 0,
          saleRate: regionRow.saleRate ?? 0,
          soldPerDay: regionRow.soldPerDay ?? 0,
          lastUpdated: regionRow.updatedAt,
        }
      : undefined,
  };
}
