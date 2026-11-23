import { useWowhead } from './useWowhead';
import useStorageQuery from './useStorageQuery';

export function useRealm() {
  const { data: user } = useStorageQuery('user');
  const { isEra, isForever } = useWowhead();
  const activeVersion = isForever ? 'forever' : user?.isActive?.[isEra ? 'era' : 'classic'];
  const activeRealm = activeVersion && user?.realms?.[activeVersion];

  return {
    activeVersion,
    activeRealm,
  };
}
