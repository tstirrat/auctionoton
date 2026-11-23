import { describe, expect, it } from 'vitest';
import { buildItemUrl, buildUrl, parseCsv, parseItemsCsv, toItemResponse } from './tsmCsv';

const REALM_HEADER = 'itemId,name,marketValue,minBuyout,recent,historical,updatedAt';
const REGION_HEADER =
  'itemId,name,marketValue,historical,avgSalePrice,saleRate,soldPerDay,updatedAt';

describe('buildUrl', () => {
  it('builds region and realm urls for forever', () => {
    expect(buildUrl('forever', 'us', 'region')).toBe(
      'https://public-data.tradeskillmaster.com/forever/us/region/items.csv',
    );
    expect(buildUrl('forever', 'eu', 'realm', 'roleplay-pvp-horde')).toBe(
      'https://public-data.tradeskillmaster.com/forever/eu/realm/roleplay-pvp-horde/items.csv',
    );
  });

  it('returns undefined for unsupported versions and unsafe segments', () => {
    expect(buildUrl('classic', 'us', 'region')).toBeUndefined();
    expect(buildUrl('forever', 'us', 'realm')).toBeUndefined();
    expect(buildUrl('forever', 'us', 'realm', '../evil')).toBeUndefined();
    expect(buildUrl('forever', 'us/../x', 'region')).toBeUndefined();
  });

  it('builds the TSM item page link', () => {
    expect(buildItemUrl('forever', 'us', 'normal-alliance', 2589)).toBe(
      'https://tradeskillmaster.com/forever/us/normal-alliance/items/2589',
    );
  });
});

describe('parseCsv', () => {
  it('handles quoted fields with embedded quotes and commas', () => {
    const rows = parseCsv('1,"""Mage-Eye"" Blunderbuss",5\n2,"Legends, Volume 3",6\n');
    expect(rows).toEqual([
      ['1', '"Mage-Eye" Blunderbuss', '5'],
      ['2', 'Legends, Volume 3', '6'],
    ]);
  });

  it('handles CRLF and a missing trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles newlines inside quoted fields', () => {
    expect(parseCsv('1,"a\nb"\n')).toEqual([['1', 'a\nb']]);
  });

  it('returns no records for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\n')).toEqual([]);
  });
});

describe('parseItemsCsv', () => {
  it('parses realm rows into a map keyed by item id', () => {
    const map = parseItemsCsv(
      `${REALM_HEADER}\n2589,Linen Cloth,27,26,28,28,2026-11-23T18:25:03Z\n` +
        `3042,"BKP ""Sparrow"" Smallbore",4590,5900,6053,4600,2026-11-23T18:25:03Z\n`,
    );
    expect(map.size).toBe(2);
    expect(map.get(2589)).toEqual({
      itemId: 2589,
      name: 'Linen Cloth',
      marketValue: 27,
      minBuyout: 26,
      recent: 28,
      historical: 28,
      updatedAt: '2026-11-23T18:25:03Z',
    });
    expect(map.get(3042)?.name).toBe('BKP "Sparrow" Smallbore');
  });

  it('parses region rows with fractional values', () => {
    const map = parseItemsCsv(
      `${REGION_HEADER}\r\n2589,Linen Cloth,27,27,23,0.95,12794.6,2026-11-22T08:58:35Z\r\n`,
    );
    expect(map.get(2589)).toMatchObject({ avgSalePrice: 23, saleRate: 0.95, soldPerDay: 12794.6 });
  });

  it('returns an empty map for empty and header-only files', () => {
    expect(parseItemsCsv('').size).toBe(0);
    expect(parseItemsCsv(`${REALM_HEADER}\n`).size).toBe(0);
    expect(parseItemsCsv(REALM_HEADER).size).toBe(0);
  });

  it('skips rows without a valid item id', () => {
    const map = parseItemsCsv(`${REALM_HEADER}\nabc,Bad,1,1,1,1,x\n5,Ok,1,1,1,1,x\n`);
    expect([...map.keys()]).toEqual([5]);
  });
});

describe('toItemResponse', () => {
  const realmRow = parseItemsCsv(
    `${REALM_HEADER}\n2589,Linen Cloth,27,26,28,28,2026-11-23T18:25:03Z\n`,
  ).get(2589);
  const regionRow = parseItemsCsv(
    `${REGION_HEADER}\n2589,Linen Cloth,27,27,23,0.95,12794.6,2026-11-22T08:58:35Z\n`,
  ).get(2589);

  it('maps realm and region rows onto the item response shape', () => {
    const item = toItemResponse(realmRow, regionRow)!;
    expect(item.itemId).toBe(2589);
    expect(item.name).toBe('Linen Cloth');
    expect(item.uniqueName).toBe('linen-cloth');
    expect(item.stats.lastUpdated).toBe('2026-11-23T18:25:03Z');
    expect(item.stats.current).toMatchObject({
      marketValue: 27,
      minBuyout: 26,
      historicalValue: 28,
    });
    expect(item.stats.current.quantity).toBeUndefined();
    expect(item.regional).toEqual({
      marketValue: 27,
      historical: 27,
      avgSalePrice: 23,
      saleRate: 0.95,
      soldPerDay: 12794.6,
      lastUpdated: '2026-11-22T08:58:35Z',
    });
  });

  it('works without region data', () => {
    const item = toItemResponse(realmRow, undefined)!;
    expect(item.stats.current.marketValue).toBe(27);
    expect(item.regional).toBeUndefined();
  });

  it('works without realm data, with zeroed realm prices', () => {
    const item = toItemResponse(undefined, regionRow)!;
    expect(item.stats.current.marketValue).toBe(0);
    expect(item.stats.current.minBuyout).toBe(0);
    expect(item.regional?.saleRate).toBe(0.95);
  });

  it('returns undefined when the item is in neither file', () => {
    expect(toItemResponse(undefined, undefined)).toBeUndefined();
  });
});
