import useStorageQuery from './useStorageQuery';

export type AuctionHouse = {
  region: string;
  slug: string;
  /** Stable key for caching, e.g. "us:normal-alliance" */
  key: string;
};

export function useAuctionHouse(): AuctionHouse | undefined {
  const { data: user } = useStorageQuery('user');
  const region = user?.region;
  const slug = user?.version ? user.realms?.[user.version]?.slug : undefined;

  return region && slug ? { region, slug, key: `${region}:${slug}` } : undefined;
}
