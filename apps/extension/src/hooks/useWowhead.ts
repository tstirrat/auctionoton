import * as i from 'types';

export function useWowhead() {
  let version: i.GameVersion = 'classic';
  if (window.location.href.includes('wowhead.com/forever')) {
    version = 'forever';
  } else if (window.location.href.includes('wowhead.com/classic')) {
    version = 'seasonal';
  }
  const wowheadBaseUrl =
    {
      forever: 'https://www.wowhead.com/forever',
      seasonal: 'https://wowhead.com/classic',
    }[version as string] ?? 'https://wowhead.com/cata';

  return {
    isEra: version === 'seasonal',
    isClassic: version === 'classic',
    isForever: version === 'forever',
    version,
    wowheadBaseUrl,
  };
}
