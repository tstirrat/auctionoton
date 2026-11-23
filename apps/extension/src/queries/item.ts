import * as i from 'types';
import dayjs from 'dayjs';

import asyncStorage from 'utils/asyncStorage';
import type { AuctionHouse } from 'hooks/useAuctionHouse';
import type { GetItemsMessage, GetItemsResponse } from 'utils/messages';

export async function fetchItemFromAPI(
  itemId: number,
  auctionHouse: AuctionHouse,
  version: i.GameVersion,
) {
  try {
    const message: GetItemsMessage = {
      type: 'getItems',
      version,
      region: auctionHouse.region,
      slug: auctionHouse.slug,
      itemIds: [itemId],
    };
    const response: GetItemsResponse | undefined = await addon.runtime.sendMessage(message);

    if (!response || 'error' in response) {
      throw new Error(response?.error ?? 'No response from background');
    }

    const item = response.items[itemId];

    if (!item) {
      return 'NOT_FOUND';
    }

    const localData: i.CachedItemDataClassic = {
      ...item,
      updatedAt: dayjs().toISOString(),
    };

    // Store in browser storage
    await asyncStorage.addItem([auctionHouse.key, itemId], localData);

    return localData;
  } catch (err) {
    console.error('fetchItemFromAPI', err);
  }
}
