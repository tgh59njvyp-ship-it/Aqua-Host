import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Site, DomainConfig } from '../../types';
import { APP_CONFIG } from '../../config/constants';

interface DomainsTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const DomainsTab: React.FC<DomainsTabProps> = ({ site, onUpdateSite }) => {
  const [newDomain, setNewDomain] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    let clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (site.domains.some(d => d.domain === clean)) {
      alert('このドメインは既に追加されています。');
      return;
    }

    const isSubdomain = clean.split('.').length > 2;
    const newConfig: DomainConfig = {
      domain: clean,
      status: 'pending_dns',
      sslStatus: 'issuing',
      configuredAt: Date.now(),
      type: isSubdomain ? 'cname' : 'a',
      dnsTarget: isSubdomain ? APP_CONFIG.dns.cnameTarget : APP_CONFIG.dns.aRecordIp,
    };

    onUpdateSite({
      ...site,
      domains: [...site.domains, newConfig],
      updatedAt: Date.now(),
    });

    setNewDomain('');
  };

  const handleVerifyDomain = (domain: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      const updatedDomains = site.domains.map(d => {
        if (d.domain === domain) {
          return {
            ...d,
            status: 'verified' as const,
            sslStatus: 'active' as const,
          };
        }
        return d;
      });

      onUpdateSite({
        ...site,
        domains: updatedDomains,
        updatedAt: Date.now(),
      });
      setIsVerifying(false);
    }, 1200);
  };

  const handleDeleteDomain = (domain: string) => {
    if (domain.endsWith(`.${APP_CONFIG.defaultDomainSuffix}`)) {
      alert('デフォルトサブドメインは削除できません。設定タブからサブドメイン名を変更してください。');
      return;
    }

    if (!confirm(`ドメイン「${domain}」の接続を解除しますか？`)) return;

    onUpdateSite({
      ...site,
      domains: site.domains.filter(d => d.domain !== domain),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">カスタムドメイン設定</h2>
        <p className="text-xs text-slate-400">
          独自ドメイン（例: example.com, portfolio.me）を接続し、無料の自動SSL/TLS証明書を適用します。
        </p>
      </div>

      {/* Add Domain Form */}
      <form onSubmit={handleAddDomain} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-bold text-white mb-2">ドメインを追加</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="example.com または www.example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>ドメインを追加</span>
          </button>
        </div>
      </form>

      {/* Domain List */}
      <div className="space-y-4">
        {site.domains.map((d) => {
          const isVerified = d.status === 'verified';

          return (
            <div
              key={d.domain}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white">{d.domain}</span>
                      {d.domain.endsWith(`.${APP_CONFIG.defaultDomainSuffix}`) && (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          デフォルト
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isVerified ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ● 接続済み (Active)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <Clock className="h-3.5 w-3.5 animate-spin" />
                          ○ DNS確認中 (Pending)
                        </span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        HTTPS / SSL 有効
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isVerified && (
                    <button
                      onClick={() => handleVerifyDomain(d.domain)}
                      disabled={isVerifying}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold"
                    >
                      <RefreshCw className={`h-3 w-3 ${isVerifying ? 'animate-spin' : ''}`} />
                      <span>DNS検証を実行</span>
                    </button>
                  )}

                  {!d.domain.endsWith(`.${APP_CONFIG.defaultDomainSuffix}`) && (
                    <button
                      onClick={() => handleDeleteDomain(d.domain)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* DNS Instructions if not verified */}
              {!isVerified && (
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>お使いのドメインレジストラ（お名前.com, Cloudflare, Route53等）でDNSレコードを設定してください</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-2 px-2">Type</th>
                          <th className="py-2 px-2">Name / Host</th>
                          <th className="py-2 px-2">Target Value</th>
                          <th className="py-2 px-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        <tr className="border-b border-slate-900">
                          <td className="py-2 px-2 font-bold text-cyan-400">{d.type.toUpperCase()}</td>
                          <td className="py-2 px-2">{d.type === 'cname' ? d.domain.split('.')[0] : '@'}</td>
                          <td className="py-2 px-2 text-slate-100">{d.dnsTarget}</td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => handleCopy(d.domain, d.dnsTarget)}
                              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                            >
                              {copiedKey === d.domain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>コピー</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
