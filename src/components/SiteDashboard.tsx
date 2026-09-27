import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  Code2, 
  GitBranch, 
  Globe2, 
  Search, 
  Image as ImageIcon, 
  Lock, 
  BarChart3, 
  KeyRound, 
  ArrowRightLeft, 
  Settings, 
  ArrowLeft, 
  ExternalLink, 
  ChevronRight,
  Menu,
  X,
  Terminal,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { Site } from '../types';
import { APP_CONFIG } from '../config/constants';
import { OverviewTab } from './dashboard/OverviewTab';
import { FilesTab } from './dashboard/FilesTab';
import { EditorTab } from './dashboard/EditorTab';
import { DeploymentsTab } from './dashboard/DeploymentsTab';
import { DomainsTab } from './dashboard/DomainsTab';
import { SeoTab } from './dashboard/SeoTab';
import { OgImageTab } from './dashboard/OgImageTab';
import { AccessTab } from './dashboard/AccessTab';
import { AnalyticsTab } from './dashboard/AnalyticsTab';
import { EnvVarsTab } from './dashboard/EnvVarsTab';
import { RedirectsTab } from './dashboard/RedirectsTab';
import { SettingsTab } from './dashboard/SettingsTab';
import { ApiTab } from './dashboard/ApiTab';

export type DashboardTab = 
  | 'overview' 
  | 'editor' 
  | 'files' 
  | 'analytics' 
  | 'settings' 
  | 'api'
  // Secondary fallback tabs
  | 'deployments' 
  | 'domains' 
  | 'seo' 
  | 'ogp' 
  | 'access' 
  | 'env' 
  | 'redirects';

interface SiteDashboardProps {
  site: Site;
  initialTab?: DashboardTab;
  onBackToHome: () => void;
  onOpenSiteModal: () => void;
  onUpdateSite: (updated: Site) => void;
  onDeleteSite: () => void;
  onDuplicateSite: (newSite: Site) => void;
  onRedeploy: () => void;
}

export const SiteDashboard: React.FC<SiteDashboardProps> = ({
  site,
  initialTab = 'overview',
  onBackToHome,
  onOpenSiteModal,
  onUpdateSite,
  onDeleteSite,
  onDuplicateSite,
  onRedeploy,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [selectedEditorFile, setSelectedEditorFile] = useState<string>('index.html');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Settings sub-tab state
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'domains' | 'seo' | 'ogp' | 'access' | 'env' | 'deployments' | 'redirects'>('general');

  const fullUrl = `https://${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

  // Streamlined 6 primary navigation items
  const mainNavItems = [
    { id: 'overview', label: '概要', labelEn: 'Overview', icon: LayoutDashboard },
    { id: 'editor', label: 'エディタ', labelEn: 'Editor', icon: Code2 },
    { id: 'files', label: 'ファイル', labelEn: 'Files', icon: FolderTree },
    { id: 'analytics', label: 'アクセス解析', labelEn: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: '設定', labelEn: 'Settings', icon: Settings },
    { id: 'api', label: 'API連携', labelEn: 'Deploy API', icon: Terminal },
  ] as const;

  const handleSelectFileForEditor = (path: string) => {
    setSelectedEditorFile(path);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col">
      
      {/* Top Header Bar */}
      <div className="border-b border-slate-800/80 bg-[#090d16] px-4 sm:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
        
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">サイト一覧</span>
          </button>

          <span className="text-slate-700">/</span>

          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[180px] sm:max-w-md">
              {site.name}
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-400 hidden sm:inline-block">
              {site.subdomain}.{APP_CONFIG.defaultDomainSuffix}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden flex items-center gap-1.5 rounded-xl bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>メニュー</span>
          </button>

          <button
            onClick={onOpenSiteModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all hover:scale-[1.02]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>サイトを開く</span>
          </button>
        </div>

      </div>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 relative">
        
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:block w-56 shrink-0 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'settings' && [
              'settings', 'domains', 'seo', 'ogp', 'access', 'env', 'deployments', 'redirects'
            ].includes(activeTab));

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {item.labelEn}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden absolute top-0 left-0 right-0 z-30 bg-[#090d16] border-b border-slate-800 p-4 space-y-1 shadow-2xl animate-fadeIn">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{item.label} ({item.labelEn})</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Tab Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              site={site}
              onOpenSite={onOpenSiteModal}
              onRedeploy={onRedeploy}
              onGoToEditor={() => setActiveTab('editor')}
            />
          )}

          {activeTab === 'files' && (
            <FilesTab
              site={site}
              onUpdateSite={onUpdateSite}
              onSelectFileForEditor={handleSelectFileForEditor}
            />
          )}

          {activeTab === 'editor' && (
            <EditorTab
              site={site}
              activeFilePath={selectedEditorFile}
              onUpdateSite={onUpdateSite}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              site={site}
            />
          )}

          {activeTab === 'api' && (
            <ApiTab
              site={site}
              onUpdateSite={onUpdateSite}
            />
          )}

          {/* Unified Settings Tab with sleek sub-pills */}
          {(activeTab === 'settings' || [
            'domains', 'seo', 'ogp', 'access', 'env', 'deployments', 'redirects'
          ].includes(activeTab)) && (
            <div className="space-y-6">
              {/* Settings Sub-navigation Bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                {[
                  { id: 'general', label: '基本情報' },
                  { id: 'domains', label: 'カスタムドメイン' },
                  { id: 'seo', label: 'SEO設定' },
                  { id: 'ogp', label: 'OGP・SNSカード' },
                  { id: 'access', label: 'パスワード・アクセス制限' },
                  { id: 'env', label: '環境変数' },
                  { id: 'redirects', label: 'リダイレクト' },
                  { id: 'deployments', label: 'デプロイ履歴' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSettingsSubTab(sub.id as any);
                      setActiveTab('settings');
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      (activeTab === 'settings' && settingsSubTab === sub.id) || activeTab === sub.id
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab content */}
              <div>
                {(settingsSubTab === 'general' && activeTab === 'settings') && (
                  <SettingsTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                    onDeleteSite={onDeleteSite}
                    onDuplicateSite={onDuplicateSite}
                  />
                )}

                {(settingsSubTab === 'domains' || activeTab === 'domains') && (
                  <DomainsTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}

                {(settingsSubTab === 'seo' || activeTab === 'seo') && (
                  <SeoTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}

                {(settingsSubTab === 'ogp' || activeTab === 'ogp') && (
                  <OgImageTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}

                {(settingsSubTab === 'access' || activeTab === 'access') && (
                  <AccessTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}

                {(settingsSubTab === 'env' || activeTab === 'env') && (
                  <EnvVarsTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}

                {(settingsSubTab === 'redirects' || activeTab === 'redirects') && (
                  <RedirectsTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}

                {(settingsSubTab === 'deployments' || activeTab === 'deployments') && (
                  <DeploymentsTab
                    site={site}
                    onUpdateSite={onUpdateSite}
                  />
                )}
              </div>
            </div>
          )}
        </main>

      </div>

    </div>
  );
};
