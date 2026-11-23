import * as i from 'types';
import { useQuery } from '@tanstack/react-query';

type Realm = {
  name: string;
  localizedName: string;
  realmId: number;
  auctionHouses: {
    auctionHouseId: number;
    type: 'Alliance' | 'Horde';
    lastModified: number;
  }[];
};

function useRealmsList(region: i.Regions, version: i.GameVersion) {
  const realms = useQuery<Realm[], Error>({
    queryKey: ['realms', region, version],
    // The Auctionoton backend that served the realm list is gone and TSM's CSV data needs no realm
    // lookup, so there is nothing to fetch here. Realms are hardcoded where they are supported.
    queryFn: async (): Promise<Realm[]> => [],
    enabled: !!region,
    gcTime: Infinity,
    staleTime: Infinity,
  });

  return realms;
}

export default useRealmsList;
