import type * as i from 'types';
import asyncStorage from 'utils/asyncStorage';
import time from 'utils/time';
import { buildUrl, parseItemsCsv, toItemResponse, Row } from 'utils/tsmCsv';
import type { GetItemsMessage, GetItemsResponse } from 'utils/messages';

// Reset storage
// asyncStorage.clear('items');

// Open page for user's server/faction information after installation
addon.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    asyncStorage.init();
    addon.tabs.create({ url: './form.html?large=true' });
  }

  if (details.reason === 'update') {
    const prevVersion = details.previousVersion;
    const curVersion = addon.runtime.getManifest().version;

    // Update to how "lastUpdated" is shown
    if (prevVersion !== '2.3.0' && curVersion === '2.3.0') {
      asyncStorage.clear('items');
    }
  }
});

/**
 * TradeSkillMaster public CSV data.
 *
 * The CSVs have no CORS headers, so they can only be fetched from here (with host_permissions).
 * Each file is fetched at most once per update window: the raw text, ETag and fetch time are kept
 * in storage.local, parsed into an in-memory Map, and only re-requested (with If-None-Match) once
 * older than its max-age.
 */
const MAX_AGE = {
  realm: time.hours(4),
  region: time.hours(24),
};

type StoredFile = { text: string; etag?: string; fetchedAt: number };
type LoadedFile = { table: Map<number, Row>; fetchedAt: number };

const loadedFiles = new Map<string, LoadedFile>();
const inflightLoads = new Map<string, Promise<LoadedFile>>();

const storageKey = (url: string) => `tsm:${url}`;

function readStoredFile(url: string): Promise<StoredFile | undefined> {
  return new Promise((resolve) => {
    addon.storage.local.get(storageKey(url), (data) => resolve(data?.[storageKey(url)]));
  });
}

function writeStoredFile(url: string, file: StoredFile): Promise<void> {
  return new Promise((resolve) => {
    // Ignore quota errors, we can still serve from memory
    addon.storage.local.set({ [storageKey(url)]: file }, () => resolve());
  });
}

async function refreshFile(url: string, maxAge: number): Promise<LoadedFile> {
  const stored = await readStoredFile(url);
  let loaded = loadedFiles.get(url);

  // Service worker was restarted: restore from storage
  if (!loaded && stored) {
    loaded = { table: parseItemsCsv(stored.text), fetchedAt: stored.fetchedAt };
    loadedFiles.set(url, loaded);
  }

  if (loaded && Date.now() - loaded.fetchedAt < maxAge) {
    return loaded;
  }

  try {
    const response = await fetch(url, {
      headers: stored?.etag ? { 'If-None-Match': stored.etag } : {},
    });
    const fetchedAt = Date.now();

    if (response.status === 304 && stored) {
      loaded = { table: loaded?.table ?? parseItemsCsv(stored.text), fetchedAt };
      await writeStoredFile(url, { ...stored, fetchedAt });
    } else if (response.ok) {
      const text = await response.text();
      loaded = { table: parseItemsCsv(text), fetchedAt };
      await writeStoredFile(url, {
        text,
        etag: response.headers.get('ETag') ?? undefined,
        fetchedAt,
      });
    } else {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    loadedFiles.set(url, loaded);
    return loaded;
  } catch (err) {
    // Serve stale data rather than nothing
    if (loaded) {
      return loaded;
    }
    throw err;
  }
}

function loadFile(url: string, maxAge: number): Promise<LoadedFile> {
  const loaded = loadedFiles.get(url);
  if (loaded && Date.now() - loaded.fetchedAt < maxAge) {
    return Promise.resolve(loaded);
  }

  let inflight = inflightLoads.get(url);
  if (!inflight) {
    inflight = refreshFile(url, maxAge).finally(() => inflightLoads.delete(url));
    inflightLoads.set(url, inflight);
  }

  return inflight;
}

async function getItems(message: GetItemsMessage): Promise<GetItemsResponse> {
  const realmUrl = buildUrl(message.version, message.region, 'realm', message.slug);
  const regionUrl = buildUrl(message.version, message.region, 'region');

  if (!realmUrl || !regionUrl) {
    return { error: `Unsupported game version or realm: ${message.version}/${message.slug}` };
  }

  try {
    const [realm, region] = await Promise.all([
      loadFile(realmUrl, MAX_AGE.realm),
      // Region data only adds extra stats, so don't fail when it is unavailable
      loadFile(regionUrl, MAX_AGE.region).catch(() => undefined),
    ]);

    const items: Record<number, i.ItemResponseV2 | null> = {};
    for (const itemId of message.itemIds) {
      items[itemId] = toItemResponse(realm.table.get(itemId), region?.table.get(itemId)) ?? null;
    }

    return { items };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

addon.runtime.onMessage.addListener((message: GetItemsMessage, _sender, sendResponse) => {
  if (message?.type !== 'getItems') {
    return false;
  }

  getItems(message).then(sendResponse);
  return true; // Respond asynchronously
});
