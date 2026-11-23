import * as i from 'types';

import { FOREVER_REALMS, ForeverRealm } from 'utils/realms';

/** Rulesets available in a region. The old backend that served realm lists is gone. */
function useRealmsList(region: i.Regions | undefined, version: i.GameVersion): ForeverRealm[] {
  if (version !== 'forever' || !region) {
    return [];
  }

  return FOREVER_REALMS[region] ?? [];
}

export default useRealmsList;
