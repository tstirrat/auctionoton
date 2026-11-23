import * as i from 'types';
import { useQueries } from '@tanstack/react-query';

import asyncStorage from 'utils/asyncStorage';
import { fetchItemFromAPI } from 'src/queries/item';

import useUser from './useUser';
import { useWowhead } from './useWowhead';
import { useAuctionHouse } from './useAuctionHouse';

export function useItemsFetcher(itemIds: number[]) {
  const user = useUser();
  const { version } = useWowhead();
  const auctionHouse = useAuctionHouse();

  return useQueries({
    queries: itemIds.map((itemId) => ({
      enabled: !!user.realm && !!auctionHouse,
      queryKey: ['item', auctionHouse?.key, itemId],
      placeholderData: {
        itemId,
      } as i.CachedItemDataClassic,
      queryFn: async () => {
        if (!user.realm || !user.faction || !auctionHouse) {
          return;
        }

        // Check browser storage if item is stored
        const cachedItem = await asyncStorage.getItem([auctionHouse.key, itemId]);
        if (cachedItem) {
          return cachedItem;
        }

        const fetchedItem = await fetchItemFromAPI(itemId, auctionHouse, version);

        if (fetchedItem === 'NOT_FOUND' || fetchedItem === undefined) {
          return {
            name: 'Not found',
            itemId,
          } as i.CachedItemDataClassic;
        }
        return fetchedItem;
      },
    })),
  });
}
