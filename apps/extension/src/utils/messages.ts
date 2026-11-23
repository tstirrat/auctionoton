import type * as i from '../types';

export type GetItemsMessage = {
  type: 'getItems';
  version: string;
  region: string;
  slug: string;
  itemIds: number[];
};

/** Items that are in neither CSV are null. */
export type GetItemsResponse =
  | { items: Record<number, i.ItemResponseV2 | null> }
  | { error: string; items?: undefined };
