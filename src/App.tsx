import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Layers, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  Globe2, 
  TrendingUp, 
  ArrowUpDown, 
  Filter,
  ShieldCheck, 
  Zap, 
  ExternalLink, 
  Archive, 
  RefreshCw,
  Cloud,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { Site, HostedFile, Deployment } from './types';
import { loadSites, saveSite, deleteSite, createDefaultSite, claimLocalSites } from './utils/storage';
import { hashPassword, generateRandomId } from './utils/crypto';
import { APP_CONFIG } from './config/constants';
import { TemplateProject } from './utils/templates';
import { useAuth } from './context/AuthContext';

// Components
import { Navbar } from './components/Navbar';
import { HeroUploader } from './components/HeroUploader';
import { SiteCard } from './components/SiteCard';
import { SiteDashboard, DashboardTab } from './components/SiteDashboard';
import { DeployModal } from './components/DeployModal';
import { SiteViewerModal } from './components/SiteViewerModal';
import { TemplatesModal } from './components/TemplatesModal';
import { PlatformStatsModal } from './components/PlatformStatsModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view states
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');

  // Search & Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'password_protected' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'name'>('latest');

  // Modals
  const [deployingSiteData, setDeployingSiteData] = useState<{
    siteName: string;
    subdomain: string;
    targetSiteId?: string;
  } | null>(null);

  const [viewerSite, setViewerSite] = useState<Site | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [cloudSyncBannerDismissed, setCloudSyncBannerDismissed] = useState(false);

  // Track previous user ID to trigger claiming on new sign-in
  const prevUserIdRef = useRef<string | null>(null);

  // Load sites when user changes or on mount
  useEffect(() => {
    if (authLoading) return;

    const fetchSites = async () => {
      setIsLoading(true);
      
      // If user just logged in from guest mode, claim any local unowned sites
      if (user && prevUserIdRef.current !== user.uid) {
        await claimLocalSites(user.uid, user.email || undefined);
      }
      prevUserIdRef.current = user ? user.uid : null;

      const loaded = await loadSites(user?.uid);
      setSites(loaded);
      setIsLoading(false);
    };

    fetchSites();
  }, [user, authLoading]);

  // Selected site for dashboard
  const currentSite = useMemo(() => {
    return sites.find(s => s.id === selectedSiteId) || null;
  }, [sites, selectedSiteId]);

  // Existing subdomains list for uniqueness check
  const existingSubdomains = useMemo(() => {
    return sites.map(s => s.subdomain.toLowerCase());
  }, [sites]);

  // Filtered & sorted sites
  const filteredSites = useMemo(() => {
    let result = sites.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesVisibility = 
        filterVisibility === 'all' || s.access.visibility === filterVisibility;

      return matchesSearch && matchesVisibility;
    });

    if (sortBy === 'latest') {
      result.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortBy === 'views') {
      result.sort((a, b) => b.analytics.totalViews - a.analytics.totalViews);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [sites, searchQuery, filterVisibility, sortBy]);

  // Start new deployment
  const handleStartDeploy = async (config: {
    name: string;
    subdomain: string;
    description: string;
    visibility: 'public' | 'private' | 'password_protected';
    password?: string;
    files: HostedFile[];
  }) => {
    const siteId = 'site_' + generateRandomId(8);
    const depId = 'dep_' + generateRandomId(8);
    const now = Date.now();
    const totalBytes = config.files.reduce((acc, f) => acc + f.size, 0);

    let passwordHash: string | undefined = undefined;
    if (config.visibility === 'password_protected' && config.password) {
      passwordHash = await hashPassword(config.password);
    }

    const initialDeployment: Deployment = {
      id: depId,
      version: 1,
      status: 'production',
      createdAt: now,
      buildTimeMs: Math.floor(Math.random() * 500) + 600,
      summary: '初回本番デプロイ (Initial Release)',
      filesCount: config.files.length,
      totalSize: totalBytes,
      logs: [
        `[1/6] ${config.files.length} 個のファイルを解析 & エントリーポイント確認`,
        `[2/6] 静的アセット最適化を適用 (Cache-Control: public, max-age=31536000)`,
        `[3/6] エッジストレージ配置完了 (Global Anycast CDN)`,
        `[4/6] サブドメイン "${config.subdomain}.${APP_CONFIG.defaultDomainSuffix}" を発行`,
        `[5/6] 自動SSL証明書プロビジョニング完了 (TLS 1.3 / ECC 256-bit)`,
        `[6/6] デプロイ成功！ サイトが全世界に公開されました`,
      ],
      snapshotFiles: JSON.parse(JSON.stringify(config.files)),
    };

    const newSite: Site = {
      id: siteId,
      ownerId: user?.uid,
      ownerEmail: user?.email || undefined,
      name: config.name,
      subdomain: config.subdomain,
      description: config.description,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      currentDeploymentId: depId,
      deployments: [initialDeployment],
      files: config.files,
      domains: [
        {
          domain: `${config.subdomain}.${APP_CONFIG.defaultDomainSuffix}`,
          status: 'verified',
          sslStatus: 'active',
          configuredAt: now,
          type: 'cname',
          dnsTarget: APP_CONFIG.dns.cnameTarget,
        }
      ],
      seo: {
        title: config.name,
        description: config.description || `${config.name} on ${APP_CONFIG.serviceName}`,
        keywords: '',
        canonicalUrl: `https://${config.subdomain}.${APP_CONFIG.defaultDomainSuffix}`,
        robotsIndex: true,
        robotsFollow: true,
        author: '',
      },
      ogp: {
        ogTitle: config.name,
        ogDescription: config.description,
        ogImageUrl: '',
        twitterCard: 'summary_large_image',
      },
      access: {
        visibility: config.visibility,
        passwordHash,
      },
      envVars: [],
      redirects: [],
      errorPages: {
        useCustom404: false,
        theme: 'aquahost_dark',
        title: '404 - Page Not Found',
        message: 'お探しのページは見つかりませんでした。',
      },
      analytics: {
        totalViews: 1,
        uniqueVisitors: 1,
        dailyViews: [{ date: '今日', views: 1, visitors: 1 }],
        devices: [{ device: 'Desktop', count: 1 }],
        browsers: [{ browser: 'Chrome', count: 1 }],
        referrers: [{ source: 'Direct / Bookmark', count: 1 }],
        countries: [{ country: 'Japan', code: 'JP', count: 1 }],
      },
      rawAnalytics: [],
      storageBytes: totalBytes,
      bandwidthBytes: totalBytes,
    };

    // Save site immediately in state and persistent storage (Firestore + IndexedDB)
    await saveSite(newSite, user?.uid, user?.email || undefined);
    setSites(prev => [newSite, ...prev]);

    // Open deployment progress modal
    setDeployingSiteData({
      siteName: newSite.name,
      subdomain: newSite.subdomain,
      targetSiteId: newSite.id,
    });
  };

  // Launch template project
  const handleSelectTemplate = (tpl: TemplateProject) => {
    setIsTemplatesOpen(false);
    const sub = `${tpl.subdomainSuggestion}-${generateRandomId(4)}`;
    handleStartDeploy({
      name: tpl.name,
      subdomain: sub,
      description: tpl.description,
      visibility: 'public',
      files: tpl.files,
    });
  };

  // Update site
  const handleUpdateSite = async (updated: Site) => {
    await saveSite(updated, user?.uid, user?.email || undefined);
    setSites(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (viewerSite?.id === updated.id) {
      setViewerSite(updated);
    }
  };

  // Delete site
  const handleDeleteSite = async (siteId: string) => {
    await deleteSite(siteId);
    setSites(prev => prev.filter(s => s.id !== siteId));
    setSelectedSiteId(null);
  };

  // Duplicate site
  const handleDuplicateSite = async (cloned: Site) => {
    if (user) {
      cloned.ownerId = user.uid;
      cloned.ownerEmail = user.email || undefined;
    }
    await saveSite(cloned, user?.uid, user?.email || undefined);
    setSites(prev => [cloned, ...prev]);
    setSelectedSiteId(cloned.id);
  };

  // Redeploy trigger from Overview tab
  const handleTriggerRedeploy = () => {
    if (!currentSite) return;
    setDeployingSiteData({
      siteName: currentSite.name,
      subdomain: currentSite.subdomain,
      targetSiteId: currentSite.id,
    });
  };

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <Navbar
        onNewSite={() => {
          setSelectedSiteId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onHomeClick={() => setSelectedSiteId(null)}
        onOpenAuth={openAuthModal}
        isDashboardActive={!!selectedSiteId}
        sitesCount={sites.length}
      />

      {/* Main Content Area */}
      {selectedSiteId && currentSite ? (
        /* Site Management Dashboard (12 Tabs) */
        <SiteDashboard
          site={currentSite}
          initialTab={dashboardTab}
          onBackToHome={() => setSelectedSiteId(null)}
          onOpenSiteModal={() => setViewerSite(currentSite)}
          onUpdateSite={handleUpdateSite}
          onDeleteSite={() => handleDeleteSite(currentSite.id)}
          onDuplicateSite={handleDuplicateSite}
          onRedeploy={handleTriggerRedeploy}
        />
      ) : (
        /* Home Screen */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
          
          {/* Cloud Sync Callout Banner (shown if guest user) */}
          {!user && !cloudSyncBannerDismissed && (
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-sky-950/30 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      Firebase Authentication & Firestore クラウド同期対応
                    </h3>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                      Cloud DB Active
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    ログインすると、デプロイしたサイト・ドメイン・アクセス解析がFirestoreクラウドに自動保存され、別端末からも編集できます。
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>ログインして同期</span>
                </button>
                <button
                  onClick={() => setCloudSyncBannerDismissed(true)}
                  className="rounded-xl px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  後で
                </button>
              </div>
            </div>
          )}

          {/* Top Hero Drag & Drop Uploader */}
          <section id="uploader-section">
            <HeroUploader
              onStartDeploy={handleStartDeploy}
              existingSubdomains={existingSubdomains}
            />
          </section>

          {/* Quick Template Picker Callout Banner */}
          <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">ZIPファイルをお持ちでないですか？</h4>
                <p className="text-xs text-slate-400">
                  モダンなポートフォリオやCanvasゲームなど、ワンクリックでデプロイ可能なテンプレートをご用意しています。
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <span>テンプレート一覧を見る</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </button>
          </section>

          {/* Hosted Sites List Section */}
          <section className="space-y-6">
            
            {/* Header + Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  ホスト中のWebサイト
                </h2>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-slate-700">
                  {filteredSites.length} 件
                </span>
                {user && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                    <Cloud className="h-3 w-3" />
                    クラウド同期中 ({user.email})
                  </span>
                )}
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                
                {/* Visibility Filter */}
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value as any)}
                  className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="all">すべて表示</option>
                  <option value="public">一般公開のみ</option>
                  <option value="password_protected">パスワード保護のみ</option>
                  <option value="private">非公開のみ</option>
                </select>

                {/* Sort Order */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="latest">更新日時が新しい順</option>
                  <option value="views">アクセス数が多い順</option>
                  <option value="name">サイト名順</option>
                </select>

              </div>
            </div>

            {/* Sites Grid */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                <span>Firestoreおよびローカルストレージからサイトを読み込み中...</span>
              </div>
            ) : filteredSites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
                <Globe2 className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-semibold text-slate-300">該当するサイトが見つかりません</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  上のアップロードエリアからZIPやHTMLファイルをドラッグ＆ドロップして最初のサイトを作成してください。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onManage={() => {
                      setSelectedSiteId(site.id);
                      setDashboardTab('overview');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onOpenLive={() => setViewerSite(site)}
                  />
                ))}
              </div>
            )}

          </section>

        </main>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090d16] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">{APP_CONFIG.serviceName}</span>
            <span>—</span>
            <span>{APP_CONFIG.taglineJa}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsStatsOpen(true)} className="hover:text-white">
              インフラ稼働状況
            </button>
            <button onClick={() => setIsTemplatesOpen(true)} className="hover:text-white">
              テンプレート
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Cloud className="h-3.5 w-3.5" />
              <span>Firebase Auth & Firestore Synced</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Deployment Progress Modal */}
      {deployingSiteData && (
        <DeployModal
          isOpen={!!deployingSiteData}
          siteName={deployingSiteData.siteName}
          subdomain={deployingSiteData.subdomain}
          onComplete={() => {
            // Updated in state
          }}
          onOpenSite={() => {
            const site = sites.find(s => s.id === deployingSiteData.targetSiteId);
            setDeployingSiteData(null);
            if (site) setViewerSite(site);
          }}
          onGoToDashboard={() => {
            if (deployingSiteData.targetSiteId) {
              setSelectedSiteId(deployingSiteData.targetSiteId);
              setDashboardTab('overview');
            }
            setDeployingSiteData(null);
          }}
        />
      )}

      {/* 2. Interactive Sandboxed Site Preview Modal */}
      <SiteViewerModal
        isOpen={!!viewerSite}
        site={viewerSite}
        onClose={() => setViewerSite(null)}
      />

      {/* 3. Sample Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* 4. Platform Health & Transparent Resource Limits Modal */}
      <PlatformStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        sites={sites}
      />

      {/* 5. Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          // Sites will reload through useEffect
        }}
      />

    </div>
  );
}
