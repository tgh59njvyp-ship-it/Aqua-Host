import { Site, HostedFile, Deployment, AnalyticsEvent } from '../types';
import { SAMPLE_TEMPLATES } from './templates';
import { generateRandomId } from './crypto';
import { db } from '../config/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const DB_NAME = 'aquahost_db';
const DB_VERSION = 1;
const STORE_SITES = 'sites';
const LOCAL_STORAGE_KEY = 'aquahost_sites_backup';
const FIRESTORE_COLLECTION = 'sites';

// Open IndexedDB
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_SITES)) {
        dbInstance.createObjectStore(STORE_SITES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Creates a default initial site from SAMPLE_TEMPLATES[0] if database is empty.
 */
export function createDefaultSite(ownerId?: string, ownerEmail?: string): Site {
  const tpl = SAMPLE_TEMPLATES[0];
  const now = Date.now();
  const siteId = 'site_' + generateRandomId(8);
  const depId = 'dep_' + generateRandomId(8);

  const totalSize = tpl.files.reduce((acc, f) => acc + f.size, 0);

  const initialDeployment: Deployment = {
    id: depId,
    version: 1,
    status: 'production',
    createdAt: now - 3600 * 1000 * 2,
    buildTimeMs: 1240,
    summary: '初回自動デプロイ (Production Initial Release)',
    filesCount: tpl.files.length,
    totalSize,
    logs: [
      '[1/6] ファイル解析完了 (index.html, style.css, script.js, contact.html)',
      '[2/6] 静的アセット最適化完了 (キャッシュヘッダー生成)',
      '[3/6] エッジストレージ配置完了 (Global Anycast CDN)',
      '[4/6] 専用URL発行: https://' + tpl.subdomainSuggestion + '.aquahost.app',
      '[5/6] 自動TLS/SSL証明書有効化 (Let\'s Encrypt 256-bit ECC)',
      '[6/6] デプロイ成功 - サイトが全世界に公開されました',
    ],
    snapshotFiles: JSON.parse(JSON.stringify(tpl.files)),
  };

  return {
    id: siteId,
    ownerId: ownerId || undefined,
    ownerEmail: ownerEmail || undefined,
    name: 'ポートフォリオ (Demo Site)',
    subdomain: tpl.subdomainSuggestion,
    description: 'AquaHostで自動公開されたモダンポートフォリオサイト',
    createdAt: now - 3600 * 1000 * 2,
    updatedAt: now - 3600 * 1000 * 2,
    status: 'active',
    currentDeploymentId: depId,
    deployments: [initialDeployment],
    files: JSON.parse(JSON.stringify(tpl.files)),
    domains: [
      {
        domain: `${tpl.subdomainSuggestion}.aquahost.app`,
        status: 'verified',
        sslStatus: 'active',
        configuredAt: now - 3600 * 1000 * 2,
        type: 'cname',
        dnsTarget: 'cname.aquahost.app',
      },
    ],
    seo: {
      title: 'Kenji Sato — Full Stack Engineer Portfolio',
      description: 'Designing intuitive digital products & high-performance web systems.',
      keywords: 'engineer, developer, portfolio, typescript, webgl',
      canonicalUrl: `https://${tpl.subdomainSuggestion}.aquahost.app`,
      robotsIndex: true,
      robotsFollow: true,
      author: 'Kenji Sato',
    },
    ogp: {
      ogTitle: 'Kenji Sato — Full Stack Engineer Portfolio',
      ogDescription: 'Designing intuitive digital products & high-performance web systems.',
      ogImageUrl: '',
      twitterCard: 'summary_large_image',
    },
    access: {
      visibility: 'public',
    },
    envVars: [
      {
        id: generateRandomId(6),
        key: 'NODE_ENV',
        value: 'production',
        target: 'all',
        isSecret: false,
        updatedAt: now,
      },
      {
        id: generateRandomId(6),
        key: 'AQUA_EDGE_REGION',
        value: 'hnd1-tokyo',
        target: 'production',
        isSecret: false,
        updatedAt: now,
      }
    ],
    redirects: [],
    errorPages: {
      useCustom404: true,
      custom404Path: '/404.html',
      theme: 'aquahost_dark',
      title: '404 - Page Not Found',
      message: 'お探しのページは見つかりませんでした。URLをご確認ください。',
    },
    analytics: {
      totalViews: 48,
      uniqueVisitors: 32,
      dailyViews: [
        { date: '9/21', views: 8, visitors: 5 },
        { date: '9/22', views: 12, visitors: 9 },
        { date: '9/23', views: 7, visitors: 5 },
        { date: '9/24', views: 11, visitors: 8 },
        { date: '9/25', views: 10, visitors: 5 },
      ],
      devices: [
        { device: 'Desktop', count: 31 },
        { device: 'Mobile', count: 14 },
        { device: 'Tablet', count: 3 },
      ],
      browsers: [
        { browser: 'Chrome', count: 28 },
        { browser: 'Safari', count: 12 },
        { browser: 'Firefox', count: 6 },
        { browser: 'Edge', count: 2 },
      ],
      referrers: [
        { source: 'Direct / Bookmark', count: 22 },
        { source: 'X (Twitter)', count: 14 },
        { source: 'GitHub', count: 8 },
        { source: 'Google Search', count: 4 },
      ],
      countries: [
        { country: 'Japan', code: 'JP', count: 38 },
        { country: 'United States', code: 'US', count: 6 },
        { country: 'Taiwan', code: 'TW', count: 4 },
      ],
    },
    rawAnalytics: [],
    storageBytes: totalSize,
    bandwidthBytes: totalSize * 48,
  };
}

/**
 * Load sites:
 * If userId is provided, queries Firestore for sites owned by this user.
 * Falls back to local IndexedDB and localStorage.
 */
export async function loadSites(userId?: string): Promise<Site[]> {
  const firestoreSites: Site[] = [];

  // 1. Try loading from Firestore
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    let q = query(colRef);
    if (userId) {
      q = query(colRef, where('ownerId', '==', userId));
    }
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        firestoreSites.push(docSnap.data() as Site);
      }
    });

    if (firestoreSites.length > 0) {
      // Cache all fetched sites to IndexedDB
      for (const site of firestoreSites) {
        saveToIndexedDb(site).catch(() => {});
      }
      return firestoreSites;
    }
  } catch (err) {
    console.warn('Firestore fetch failed or offline:', err);
  }

  // 2. Try loading from IndexedDB
  try {
    const localSites = await loadFromIndexedDb();
    if (localSites && localSites.length > 0) {
      // Filter by userId if provided, or return unowned/all local sites
      const filtered = userId 
        ? localSites.filter(s => s.ownerId === userId || !s.ownerId)
        : localSites;

      if (filtered.length > 0) {
        // Sync to Firestore in background if user is logged in
        if (userId) {
          for (const site of filtered) {
            if (!site.ownerId) {
              site.ownerId = userId;
            }
            saveToFirestore(site).catch(() => {});
          }
        }
        return filtered;
      }
    }
  } catch (e) {
    console.warn('IndexedDB load failed:', e);
  }

  // 3. Fallback to localStorage
  const lsSites = loadFromLocalStorage();
  if (lsSites && lsSites.length > 0) {
    const filtered = userId
      ? lsSites.filter(s => s.ownerId === userId || !s.ownerId)
      : lsSites;
    if (filtered.length > 0) {
      return filtered;
    }
  }

  // 4. If completely empty, generate demo site
  const defaultSite = createDefaultSite(userId);
  await saveSite(defaultSite);
  return [defaultSite];
}

/**
 * Claim existing guest or unassigned sites to the authenticated user account
 */
export async function claimLocalSites(userId: string, userEmail?: string): Promise<Site[]> {
  try {
    const localSites = await loadFromIndexedDb();
    const updated: Site[] = [];

    for (const site of localSites) {
      if (!site.ownerId || site.ownerId !== userId) {
        site.ownerId = userId;
        if (userEmail) site.ownerEmail = userEmail;
        await saveSite(site);
        updated.push(site);
      }
    }
    return updated;
  } catch (err) {
    console.warn('Failed to claim local sites:', err);
    return [];
  }
}

async function loadFromIndexedDb(): Promise<Site[]> {
  const dbInst = await openDb();
  return new Promise((resolve) => {
    const tx = dbInst.transaction(STORE_SITES, 'readonly');
    const store = tx.objectStore(STORE_SITES);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as Site[]) || []);
    req.onerror = () => resolve([]);
  });
}

function loadFromLocalStorage(): Site[] {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (item) {
      return JSON.parse(item);
    }
  } catch (e) {
    console.error('Failed to parse from localStorage', e);
  }
  return [];
}

function saveToLocalStorage(sites: Site[]) {
  try {
    const lightweight = sites.map(s => ({
      ...s,
      files: s.files.map(f => f.isBinary ? { ...f, content: '' } : f)
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweight));
  } catch (e) {
    console.warn('LocalStorage save failed, quota exceeded', e);
  }
}

async function saveToIndexedDb(site: Site): Promise<void> {
  try {
    const dbInst = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = dbInst.transaction(STORE_SITES, 'readwrite');
      const store = tx.objectStore(STORE_SITES);
      const req = store.put(site);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const sites = loadFromLocalStorage().filter(s => s.id !== site.id);
    sites.unshift(site);
    saveToLocalStorage(sites);
  }
}

async function saveToFirestore(site: Site): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, site.id);
    await setDoc(docRef, site, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc failed:', err);
  }
}

// Save or update a site
export async function saveSite(site: Site, userId?: string, userEmail?: string): Promise<void> {
  if (userId && !site.ownerId) {
    site.ownerId = userId;
  }
  if (userEmail && !site.ownerEmail) {
    site.ownerEmail = userEmail;
  }

  // Save locally first for instant, latency-free response
  await saveToIndexedDb(site);

  // Sync to Firestore in background
  saveToFirestore(site).catch(err => {
    console.warn('Background Firestore sync failed:', err);
  });
}

// Delete site
export async function deleteSite(siteId: string): Promise<void> {
  // Delete locally
  try {
    const dbInst = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = dbInst.transaction(STORE_SITES, 'readwrite');
      const store = tx.objectStore(STORE_SITES);
      const req = store.delete(siteId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const sites = loadFromLocalStorage().filter(s => s.id !== siteId);
    saveToLocalStorage(sites);
  }

  // Delete from Firestore
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTION, siteId));
  } catch (err) {
    console.warn('Firestore deleteDoc failed:', err);
  }
}

// Record an analytics view for a site
export async function recordPageView(siteId: string, path: string = '/'): Promise<void> {
  const sites = await loadSites();
  const site = sites.find(s => s.id === siteId);
  if (!site) return;

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;

  // Update total & daily views
  site.analytics.totalViews += 1;
  const existingDaily = site.analytics.dailyViews.find(d => d.date === dateStr);
  if (existingDaily) {
    existingDaily.views += 1;
  } else {
    site.analytics.dailyViews.push({ date: dateStr, views: 1, visitors: 1 });
  }

  // Bandwidth update
  site.bandwidthBytes += Math.max(site.storageBytes, 15000);

  // Device detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isTablet = /iPad|Tablet/i.test(navigator.userAgent);
  const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';
  const devEntry = site.analytics.devices.find(d => d.device === deviceType);
  if (devEntry) devEntry.count += 1;
  else site.analytics.devices.push({ device: deviceType, count: 1 });

  // Record raw event
  const newEvent: AnalyticsEvent = {
    id: generateRandomId(8),
    timestamp: Date.now(),
    path,
    referrer: document.referrer || 'Direct / Bookmark',
    device: deviceType.toLowerCase() as 'desktop' | 'mobile' | 'tablet',
    browser: 'Chrome / WebKit',
    country: 'Japan',
    countryCode: 'JP',
  };
  site.rawAnalytics.unshift(newEvent);
  if (site.rawAnalytics.length > 50) site.rawAnalytics.pop();

  await saveSite(site);
}
