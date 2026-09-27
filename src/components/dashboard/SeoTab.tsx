import React, { useState } from 'react';
import { 
  Search, 
  Save, 
  FileCode, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Download,
  Check
} from 'lucide-react';
import { Site, SEOSettings } from '../../types';
import { APP_CONFIG } from '../../config/constants';

interface SeoTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const SeoTab: React.FC<SeoTabProps> = ({ site, onUpdateSite }) => {
  const [seo, setSeo] = useState<SEOSettings>({
    title: site.seo?.title || site.name,
    description: site.seo?.description || site.description || '',
    keywords: site.seo?.keywords || '',
    canonicalUrl: site.seo?.canonicalUrl || `https://${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}`,
    robotsIndex: site.seo?.robotsIndex ?? true,
    robotsFollow: site.seo?.robotsFollow ?? true,
    author: site.seo?.author || '',
  });

  const [activeTab, setActiveTab] = useState<'meta' | 'sitemap' | 'robots'>('meta');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fullDomain = `https://${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

  // Auto-generate Sitemap XML based on site's HTML files
  const htmlFiles = site.files.filter(f => f.path.endsWith('.html') || f.path.endsWith('.htm'));
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${htmlFiles.map(f => `  <url>
    <loc>${fullDomain}/${f.path === 'index.html' ? '' : f.path}</loc>
    <lastmod>${new Date(f.lastModified || site.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${f.path === 'index.html' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Auto-generate robots.txt
  const robotsTxt = `User-agent: *
${seo.robotsIndex ? 'Allow: /' : 'Disallow: /'}

Sitemap: ${fullDomain}/sitemap.xml`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Also inject sitemap.xml and robots.txt into site.files if not already there
    const updatedFiles = [...site.files];

    // sitemap
    const sitemapIdx = updatedFiles.findIndex(f => f.path === 'sitemap.xml');
    const sitemapFile = {
      id: sitemapIdx !== -1 ? updatedFiles[sitemapIdx].id : 'file_sitemap',
      path: 'sitemap.xml',
      name: 'sitemap.xml',
      size: new Blob([sitemapXml]).size,
      mimeType: 'application/xml; charset=utf-8',
      content: sitemapXml,
      isBinary: false,
      lastModified: Date.now(),
    };
    if (sitemapIdx !== -1) updatedFiles[sitemapIdx] = sitemapFile;
    else updatedFiles.push(sitemapFile);

    // robots
    const robotsIdx = updatedFiles.findIndex(f => f.path === 'robots.txt');
    const robotsFile = {
      id: robotsIdx !== -1 ? updatedFiles[robotsIdx].id : 'file_robots',
      path: 'robots.txt',
      name: 'robots.txt',
      size: new Blob([robotsTxt]).size,
      mimeType: 'text/plain; charset=utf-8',
      content: robotsTxt,
      isBinary: false,
      lastModified: Date.now(),
    };
    if (robotsIdx !== -1) updatedFiles[robotsIdx] = robotsFile;
    else updatedFiles.push(robotsFile);

    onUpdateSite({
      ...site,
      seo,
      files: updatedFiles,
      updatedAt: Date.now(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">SEO & 検索エンジン最適化</h2>
          <p className="text-xs text-slate-400">
            Googleなどの検索エンジン向けメタタグ、Canonical URL、Sitemap.xml、robots.txtの自動生成
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            onClick={() => setActiveTab('meta')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'meta' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            メタタグ設定
          </button>
          <button
            onClick={() => setActiveTab('sitemap')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'sitemap' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sitemap.xml
          </button>
          <button
            onClick={() => setActiveTab('robots')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'robots' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            robots.txt
          </button>
        </div>
      </div>

      {activeTab === 'meta' && (
        <form onSubmit={handleSave} className="space-y-5">
          
          {/* SERP Search Result Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Google 検索結果プレビュー (SERP Preview)
            </span>
            <div className="rounded-xl bg-[#202124] p-4 max-w-xl text-left font-sans">
              <div className="text-[11px] text-[#bdc1c6] truncate">{fullDomain}</div>
              <h3 className="text-base text-[#8ab4f8] hover:underline cursor-pointer truncate font-medium mt-0.5">
                {seo.title || site.name}
              </h3>
              <p className="text-xs text-[#bdc1c6] line-clamp-2 mt-1 leading-relaxed">
                {seo.description || 'サイトの説明文を入力してください。Googleの検索スニペットに表示されます。'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                ページタイトル (&lt;title&gt;)
              </label>
              <input
                type="text"
                required
                value={seo.title}
                onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">推奨: 30〜60文字以内</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Canonical URL (正規化URL)
              </label>
              <input
                type="url"
                value={seo.canonicalUrl}
                onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              メタディスクリプション (Meta Description)
            </label>
            <textarea
              rows={3}
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
              placeholder="検索結果に表示されるサイト概要..."
            />
            <span className="text-[10px] text-slate-500">推奨: 80〜120文字程度</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              キーワード (Keywords / カンマ区切り)
            </label>
            <input
              type="text"
              value={seo.keywords}
              onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
              placeholder="hosting, static, website, portfolio"
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono text-xs"
            />
          </div>

          {/* Robots Checkboxes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <span className="text-xs font-bold text-white block">Robots クローラー設定</span>
            <div className="flex flex-wrap gap-6 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seo.robotsIndex}
                  onChange={(e) => setSeo({ ...seo, robotsIndex: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>検索エンジンにインデックスを許可 (index)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seo.robotsFollow}
                  onChange={(e) => setSeo({ ...seo, robotsFollow: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>リンク先の巡回を許可 (follow)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>SEO設定を保存しました</span>
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>設定を保存</span>
            </button>
          </div>

        </form>
      )}

      {activeTab === 'sitemap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              サイト内のHTMLファイル（計 {htmlFiles.length} 件）から自動生成されたサイトマップXMLです。
            </p>
            <span className="text-xs font-mono text-cyan-400">
              {fullDomain}/sitemap.xml
            </span>
          </div>

          <pre className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {sitemapXml}
          </pre>
        </div>
      )}

      {activeTab === 'robots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              クローラー向けアクセス制御ファイル robots.txt です。
            </p>
            <span className="text-xs font-mono text-cyan-400">
              {fullDomain}/robots.txt
            </span>
          </div>

          <pre className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {robotsTxt}
          </pre>
        </div>
      )}

    </div>
  );
};
