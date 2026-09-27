import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { Site, OGPSettings } from '../../types';
import { APP_CONFIG } from '../../config/constants';

interface OgImageTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const OgImageTab: React.FC<OgImageTabProps> = ({ site, onUpdateSite }) => {
  const [ogp, setOgp] = useState<OGPSettings>({
    ogTitle: site.ogp?.ogTitle || site.seo?.title || site.name,
    ogDescription: site.ogp?.ogDescription || site.seo?.description || site.description || '',
    ogImageUrl: site.ogp?.ogImageUrl || '',
    twitterCard: site.ogp?.twitterCard || 'summary_large_image',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullDomain = `${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setOgp(prev => ({ ...prev, ogImageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Auto-generate OGP Banner using HTML5 Canvas
  const handleGenerateBanner = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative circle glow
    const radial = ctx.createRadialGradient(900, 150, 50, 900, 150, 450);
    radial.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
    radial.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1200, 630);

    // Border line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 570);

    // Tag
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('⚡ AQUAHOST EDGE DEPLOYED', 80, 140);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px sans-serif';
    const titleText = ogp.ogTitle || site.name;
    ctx.fillText(titleText.slice(0, 35), 80, 240);

    // Description
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'normal 32px sans-serif';
    const descText = ogp.ogDescription || site.description || 'Fast, reliable hosting on AquaHost.';
    ctx.fillText(descText.slice(0, 60), 80, 320);

    // URL watermark
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`https://${fullDomain}`, 80, 520);

    const generatedDataUrl = canvas.toDataURL('image/png');
    setOgp(prev => ({ ...prev, ogImageUrl: generatedDataUrl }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateSite({
      ...site,
      ogp,
      updatedAt: Date.now(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">OGP画像 & SNSシェアカード設定</h2>
        <p className="text-xs text-slate-400">
          X (Twitter) や Facebook, LINE, Slack 等でURLが共有された際のカード表示と推奨1200×630画像の自動設定
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              OGPタイトル (og:title)
            </label>
            <input
              type="text"
              required
              value={ogp.ogTitle}
              onChange={(e) => setOgp({ ...ogp, ogTitle: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              OGP説明文 (og:description)
            </label>
            <textarea
              rows={3}
              value={ogp.ogDescription}
              onChange={(e) => setOgp({ ...ogp, ogDescription: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Twitter / X カード形式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOgp({ ...ogp, twitterCard: 'summary_large_image' })}
                className={`rounded-xl border p-3 text-xs font-semibold text-left transition-all ${
                  ogp.twitterCard === 'summary_large_image'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div>大画像カード (Large Card)</div>
                <div className="text-[10px] text-slate-500 font-normal">summary_large_image (推奨)</div>
              </button>

              <button
                type="button"
                onClick={() => setOgp({ ...ogp, twitterCard: 'summary' })}
                className={`rounded-xl border p-3 text-xs font-semibold text-left transition-all ${
                  ogp.twitterCard === 'summary'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div>通常カード (Square)</div>
                <div className="text-[10px] text-slate-500 font-normal">summary (正方形サムネイル)</div>
              </button>
            </div>
          </div>

          {/* Image Upload or Generate buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              OGP画像 (推奨サイズ: 1200 × 630px)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-cyan-400" />
                <span>画像をアップロード</span>
              </button>

              <button
                type="button"
                onClick={() => setOgp(prev => ({ ...prev, ogImageUrl: '/og-image.jpg' }))}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500/20 to-cyan-500/20 hover:from-sky-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>AquaHost 公式OG画像を使用</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateBanner}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>キャンバス自動生成 (1200×630)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>OGP設定を保存しました</span>
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>保存してmetaタグに反映</span>
            </button>
          </div>

        </form>

        {/* Right: Live Social Share Preview (Twitter / X Simulator) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold text-slate-400 block">
            SNSシェアカード・リアルタイムプレビュー
          </span>

          <div className="rounded-2xl border border-slate-800 bg-[#000000] p-4 shadow-xl">
            {/* Fake Tweet Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                AH
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>AquaHost Shared User</span>
                  <span className="text-slate-500 font-normal">@aquahost_user</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  サイトを公開しました！ぜひご覧ください 🚀
                </div>
              </div>
            </div>

            {/* Social Card */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#16181c] transition-all hover:border-slate-700">
              <div className="relative aspect-[1200/630] w-full bg-slate-900 overflow-hidden">
                <img
                  src={ogp.ogImageUrl || '/og-image.jpg'}
                  alt="OG Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {!ogp.ogImageUrl && (
                  <div className="absolute top-2.5 right-2.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                    AquaHost 公式デフォルト画像適用中
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="text-[11px] text-slate-500 truncate">{fullDomain}</div>
                <div className="text-sm font-bold text-white truncate mt-0.5">
                  {ogp.ogTitle || site.name}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                  {ogp.ogDescription || site.description || 'Fast, reliable hosting.'}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
