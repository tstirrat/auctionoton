import type * as i from '../types';

export type Faction = 'horde' | 'alliance';

export type ForeverRealm = {
  /** Ruleset segment of the TSM auction house slug, e.g. "roleplay-pvp" */
  ruleset: string;
  name: string;
  factions: Faction[];
};

const BOTH: Faction[] = ['horde', 'alliance'];

const ALL_RULESETS: ForeverRealm[] = [
  { ruleset: 'normal', name: 'Normal', factions: BOTH },
  { ruleset: 'pvp', name: 'PvP', factions: BOTH },
  { ruleset: 'roleplay', name: 'Roleplay', factions: BOTH },
  { ruleset: 'roleplay-pvp', name: 'Roleplay PvP', factions: BOTH },
];

// TW/KR only have data for the normal and pvp rulesets (roleplay files are empty)
const ASIA_RULESETS = ALL_RULESETS.filter((realm) => !realm.ruleset.startsWith('roleplay'));

/**
 * WoW Forever auction houses. TSM's auction house slug is `${ruleset}-${faction}`,
 * e.g. "normal-alliance". Source: https://tradeskillmaster.com/public-data
 */
export const FOREVER_REALMS: Record<i.Regions, ForeverRealm[]> = {
  us: ALL_RULESETS,
  eu: ALL_RULESETS,
  tw: ASIA_RULESETS,
  kr: ASIA_RULESETS,
};

export const DEFAULT_FOREVER_REGION: i.Regions = 'us';
export const DEFAULT_FOREVER_RULESET = 'normal';
export const DEFAULT_FOREVER_FACTION: Faction = 'alliance';

export function buildAuctionHouseSlug(ruleset: string, faction: Faction) {
  return `${ruleset}-${faction}`;
}

export function parseAuctionHouseSlug(slug: string): { ruleset: string; faction: Faction } | null {
  const match = slug.match(/^(.+)-(horde|alliance)$/);
  return match ? { ruleset: match[1], faction: match[2] as Faction } : null;
}
