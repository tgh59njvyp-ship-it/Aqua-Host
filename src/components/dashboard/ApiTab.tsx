import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  Sparkles, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { Site } from '../../types';
import { APP_CONFIG } from '../../config/constants';
import { api } from '../../utils/api';

interface ApiTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const ApiTab: React.FC<ApiTabProps> = ({ site, onUpdateSite }) => {
  const [apiKey, setApiKey] = useState('aqua_live_' + site.id.replace('site_', '') + '_sec89x');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isDeployingViaApi, setIsDeployingViaApi] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  const curlCommand = `# 1行でZIPまたは静的サイトを即座にデプロイ
curl -X POST "https://aquahost.app/api/deploy" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "subdomain=${site.subdomain}" \\
  -F "file=@dist.zip"`;

  const jsSnippet = `// AquaHost Simple JavaScript / TypeScript API
import { aquaHost } from 'aquahost';

await aquaHost.deploy({
  subdomain: '${site.subdomain}',
  files: [
    { path: 'index.html', content: '<h1>Hello from Simple API</h1>' },
    { path: 'style.css', content: 'body { font-family: sans-serif; }' }
  ]
});`;

  const handleCopy = (text: string, type: 'curl' | 'js' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'js') {
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleTestApiDeploy = async () => {
    setIsDeployingViaApi(true);
    setApiResponse(null);

    try {
      const timestamp = new Intl.DateTimeFormat('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }).format(new Date());

      const res = await api.deploy({
        subdomain: site.subdomain,
        name: site.name,
        files: [
          ...site.files.filter(f => f.path !== 'api-test.html'),
          {
            path: 'api-test.html',
            content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>API Deploy Test</title>
  <style>
    body { background: #0b101b; color: #38bdf8; font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: #131c2e; padding: 2rem; border-radius: 1rem; border: 1px solid #1e293b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h2>⚡ API Deploy Successful!</h2>
    <p>Deployed at: ${timestamp}</p>
    <p>Subdomain: ${site.subdomain}.aquahost.app</p>
  </div>
</body>
</html>`,
            mimeType: 'text/html'
          }
        ]
      });

      if (res.success && res.data) {
        setApiResponse(`200 OK — サイトがAPI経由で即座にデプロイされました！\nURL: ${res.data.url}`);
        // Refresh site data
        const updated = await api.sites.get(site.id);
        if (updated) onUpdateSite(updated);
      } else {
        setApiResponse(`Error: ${res.error || 'デプロイに失敗しました'}`);
      }
    } catch (e: any) {
      setApiResponse(`Error: ${e.message}`);
    } finally {
      setIsDeployingViaApi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-white">AquaHost シンプル デプロイ API</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GitHub Actions、CI/CD、ローカルスクリプトから1行のコマンドで即座にサイトを自動デプロイできます。
          </p>
        </div>

        <button
          onClick={handleTestApiDeploy}
          disabled={isDeployingViaApi}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50 shrink-0"
        >
          {isDeployingViaApi ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          <span>APIデプロイをテスト実行</span>
        </button>
      </div>

      {/* Response callout if tested */}
      {apiResponse && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-300 flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="whitespace-pre-line leading-relaxed">{apiResponse}</div>
        </div>
      )}

      {/* API Key Box */}
      <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">デプロイ用 API トークン</label>
          <span className="text-[11px] text-slate-500 font-mono">Bearer Token</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 font-mono text-xs text-cyan-400 select-all truncate">
            {apiKey}
          </div>
          <button
            onClick={() => handleCopy(apiKey, 'key')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors shrink-0"
          >
            {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>コピー</span>
          </button>
        </div>
      </div>

      {/* Code Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* cURL Example */}
        <div className="rounded-2xl border border-slate-800 bg-[#090d16] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>cURL (ターミナル / CI/CD)</span>
            </div>
            <button
              onClick={() => handleCopy(curlCommand, 'curl')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>コピー</span>
            </button>
          </div>
          <pre className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 overflow-x-auto whitespace-pre-wrap">
            {curlCommand}
          </pre>
        </div>

        {/* JavaScript Example */}
        <div className="rounded-2xl border border-slate-800 bg-[#090d16] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Code2 className="h-4 w-4 text-sky-400" />
              <span>JavaScript / Node.js API</span>
            </div>
            <button
              onClick={() => handleCopy(jsSnippet, 'js')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              {copiedJs ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>コピー</span>
            </button>
          </div>
          <pre className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/70 overflow-x-auto whitespace-pre-wrap">
            {jsSnippet}
          </pre>
        </div>
      </div>

      {/* DevTools window.aquaHost Callout */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">ブラウザのコンソールから即座にテスト可能:</span>{' '}
            <code className="text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
              await window.aquaHost.deploy(&#123; subdomain: '{site.subdomain}', files: [...] &#125;)
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
