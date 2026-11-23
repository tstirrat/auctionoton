import useStorageQuery from './useStorageQuery';
import { useWowhead } from './useWowhead';

export type AuctionHouse = {
  region: string;
  /** TSM auction house slug, e.g. "normal-alliance" */
  slug: string;
  /** Stable key for caching, e.g. "us:normal-alliance" */
  key: string;
};

export function useAuctionHouse(): AuctionHouse | undefined {
  const { data: user } = useStorageQuery('user');
  const { version } = useWowhead();
  const realm = user?.realms?.[version];
  const region = realm?.region ?? user?.region;

  return region && realm?.slug
    ? { region, slug: realm.slug, key: `${region}:${realm.slug}` }
    : undefined;
}
