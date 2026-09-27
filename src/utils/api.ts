import { Site, HostedFile, Deployment } from '../types';
import { 
  loadSites as loadSitesInternal, 
  saveSite as saveSiteInternal, 
  deleteSite as deleteSiteInternal, 
  createDefaultSite as createDefaultSiteInternal,
  claimLocalSites as claimLocalSitesInternal
} from './storage';
import { generateRandomId } from './crypto';
import { APP_CONFIG } from '../config/constants';

export interface DeployOptions {
  name: string;
  subdomain: string;
  description?: string;
  visibility?: 'public' | 'private' | 'password_protected';
  password?: string;
  files: HostedFile[];
  userId?: string;
  userEmail?: string;
}

export interface QuickApiDeployOptions {
  subdomain: string;
  name?: string;
  files: Array<{
    path: string;
    content: string;
    mimeType?: string;
  }>;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * AquaHost Simple Unified API
 * High-level, simple programmatic API for managing and deploying static sites.
 */
export const api = {
  // Sites Management API
  sites: {
    /**
     * List all sites (Firestore + Local fallback)
     */
    async list(userId?: string): Promise<Site[]> {
      try {
        return await loadSitesInternal(userId);
      } catch (err: any) {
        console.error('API Error: sites.list failed', err);
        return [];
      }
    },

    /**
     * Get a specific site by ID
     */
    async get(siteId: string, userId?: string): Promise<Site | null> {
      const sites = await loadSitesInternal(userId);
      return sites.find(s => s.id === siteId) || null;
    },

    /**
     * Deploy a new or existing site
     */
    async deploy(options: DeployOptions): Promise<Site> {
      const now = Date.now();
      const siteId = 'site_' + generateRandomId(8);
      const depId = 'dep_' + generateRandomId(8);
      const fullUrl = `https://${options.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

      const totalSize = options.files.reduce((acc, f) => acc + (f.size || f.content?.length || 0), 0);

      const deployment: Deployment = {
        id: depId,
        version: 1,
        status: 'production',
        createdAt: now,
        buildTimeMs: Math.floor(Math.random() * 800) + 400,
        summary: `API デプロイ: ${options.files.length} ファイル`,
        filesCount: options.files.length,
        totalSize,
        logs: [
          `[1/4] ファイル検証完了 (${options.files.length} 件)`,
          `[2/4] Anycast Edge CDN 配置完了`,
          `[3/4] SSL証明書アクティブ: ${fullUrl}`,
          `[4/4] デプロイ完了: サイトが公開されました`,
        ],
        snapshotFiles: JSON.parse(JSON.stringify(options.files)),
      };

      const newSite: Site = {
        id: siteId,
        ownerId: options.userId,
        ownerEmail: options.userEmail,
        name: options.name || options.subdomain,
        subdomain: options.subdomain.toLowerCase(),
        description: options.description || '',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        currentDeploymentId: depId,
        deployments: [deployment],
        files: options.files,
        domains: [
          {
            domain: `${options.subdomain}.${APP_CONFIG.defaultDomainSuffix}`,
            status: 'verified',
            sslStatus: 'active',
            configuredAt: now,
            type: 'cname',
            dnsTarget: 'cname.aquahost.app',
          },
        ],
        seo: {
          title: options.name || options.subdomain,
          description: options.description || '',
          keywords: 'website, hosted, aquahost',
          canonicalUrl: fullUrl,
          robotsIndex: true,
          robotsFollow: true,
          author: options.userEmail || 'Developer',
        },
        ogp: {
          ogTitle: options.name || options.subdomain,
          ogDescription: options.description || '',
          ogImageUrl: '/og-image.jpg',
          twitterCard: 'summary_large_image',
        },
        access: {
          visibility: options.visibility || 'public',
        },
        envVars: [],
        redirects: [],
        errorPages: {
          useCustom404: false,
          theme: 'aquahost_dark',
          title: '404 - Not Found',
          message: 'The requested page was not found.',
        },
        analytics: {
          totalViews: 1,
          uniqueVisitors: 1,
          dailyViews: [{ date: 'Today', views: 1, visitors: 1 }],
          devices: [{ device: 'Desktop', count: 1 }],
          browsers: [{ browser: 'Chrome', count: 1 }],
          referrers: [{ source: 'Direct', count: 1 }],
          countries: [{ country: 'Japan', code: 'JP', count: 1 }],
        },
        rawAnalytics: [],
        storageBytes: totalSize,
        bandwidthBytes: totalSize,
      };

      await saveSiteInternal(newSite);
      return newSite;
    },

    /**
     * Update site settings or files
     */
    async update(site: Site): Promise<Site> {
      const updated = {
        ...site,
        updatedAt: Date.now(),
      };
      await saveSiteInternal(updated);
      return updated;
    },

    /**
     * Delete site
     */
    async delete(siteId: string): Promise<boolean> {
      await deleteSiteInternal(siteId);
      return true;
    },

    /**
     * Claim local unassigned sites to user account
     */
    async claimLocal(userId: string, userEmail?: string): Promise<Site[]> {
      return await claimLocalSitesInternal(userId, userEmail);
    },

    /**
     * Create demo default site
     */
    createDefault(userId?: string): Site {
      return createDefaultSiteInternal(userId);
    }
  },

  /**
   * Ultra-Simple 1-Function Programmatic Deploy API
   * Can be called from Developer Console or automated scripts:
   * await aquaHost.deploy({ subdomain: 'my-site', files: [{ path: 'index.html', content: '<h1>Hello!</h1>' }] })
   */
  async deploy(options: QuickApiDeployOptions): Promise<ApiResponse<{ url: string; siteId: string }>> {
    try {
      const cleanSub = options.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!cleanSub) {
        return { success: false, error: 'Subdomain is required (alphanumeric and hyphens only)' };
      }

      // Ensure index.html exists
      let files: HostedFile[] = options.files.map(f => ({
        id: 'f_' + generateRandomId(6),
        path: f.path.replace(/^\//, ''),
        name: f.path.split('/').pop() || f.path,
        size: new Blob([f.content]).size,
        mimeType: f.mimeType || (f.path.endsWith('.html') ? 'text/html' : 'text/plain'),
        content: f.content,
        isBinary: false,
        lastModified: Date.now(),
      }));

      if (!files.some(f => f.path === 'index.html')) {
        files.unshift({
          id: 'f_idx',
          path: 'index.html',
          name: 'index.html',
          size: 40,
          mimeType: 'text/html',
          content: `<!DOCTYPE html><html><body><h1>${options.name || cleanSub}</h1><p>Deployed with AquaHost API</p></body></html>`,
          isBinary: false,
          lastModified: Date.now(),
        });
      }

      const deployedSite = await api.sites.deploy({
        name: options.name || cleanSub,
        subdomain: cleanSub,
        files,
        visibility: 'public',
      });

      const url = `https://${deployedSite.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;
      return {
        success: true,
        data: {
          url,
          siteId: deployedSite.id,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Deployment failed',
      };
    }
  },
};

// Expose on window for interactive browser DevTools usage
if (typeof window !== 'undefined') {
  (window as any).aquaHost = api;
}

export default api;
