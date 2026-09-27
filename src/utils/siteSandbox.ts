import { Site, HostedFile } from '../types';

/**
 * Builds a self-contained HTML document for the site sandbox.
 * Rewrites relative file references (href="...", src="...") to inlined data URLs/blobs
 * from the site's virtual filesystem so images, styles, and scripts load flawlessly.
 */
export function buildSandboxedSiteHtml(
  site: Site,
  currentPath: string = 'index.html',
  isUnlockedPassword: boolean = false
): string {
  // Check private access
  if (site.access.visibility === 'private') {
    return buildPrivateSiteNotice(site);
  }

  // Check password protection
  if (site.access.visibility === 'password_protected' && !isUnlockedPassword) {
    return buildPasswordLockScreen(site);
  }

  // Check redirects
  const normalizedPath = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
  const matchedRedirect = site.redirects?.find(r => r.source === normalizedPath || r.source === currentPath);
  if (matchedRedirect) {
    let dest = matchedRedirect.destination.replace(/^\//, '');
    if (dest === '') dest = 'index.html';
    return `<script>window.location.hash = '${dest}'; window.location.reload();</script>`;
  }

  // Clean path (strip leading slash, default to index.html)
  let targetPath = currentPath.replace(/^\/+/, '');
  if (!targetPath || targetPath === '/') {
    targetPath = 'index.html';
  }

  // Find target file
  let file = site.files.find(f => f.path === targetPath || f.path === targetPath + '/index.html');
  
  if (!file) {
    // Check if 404.html exists
    const custom404 = site.files.find(f => f.path === '404.html');
    if (custom404) {
      file = custom404;
    } else {
      return buildDefault404Page(site, targetPath);
    }
  }

  let htmlContent = file.content;

  // Build a lookup map of all site files for asset resolution
  const fileMap = new Map<string, HostedFile>();
  for (const f of site.files) {
    fileMap.set(f.path, f);
    // Also store without leading ./
    fileMap.set(f.path.replace(/^\.\//, ''), f);
  }

  // Helper to resolve relative path against current HTML's directory
  const currentDir = targetPath.includes('/') ? targetPath.substring(0, targetPath.lastIndexOf('/')) : '';
  const resolveRelative = (rel: string): HostedFile | undefined => {
    // Strip query or hash
    const cleanRel = rel.split('#')[0].split('?')[0].replace(/^\.\//, '');
    if (fileMap.has(cleanRel)) return fileMap.get(cleanRel);
    if (currentDir) {
      const combined = `${currentDir}/${cleanRel}`.replace(/\/\.\//g, '/').replace(/^\/+/, '');
      if (fileMap.has(combined)) return fileMap.get(combined);
    }
    return undefined;
  };

  // Replace CSS <link rel="stylesheet" href="..."> with inlined <style>
  htmlContent = htmlContent.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
    const asset = resolveRelative(href);
    if (asset && !asset.isBinary) {
      return `<style data-source="${href}">\n${asset.content}\n</style>`;
    }
    return match;
  });

  // Replace <script src="..."> with inlined script if it matches local file
  htmlContent = htmlContent.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
    // Don't replace external http/https/cdn scripts
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      return match;
    }
    const asset = resolveRelative(src);
    if (asset && !asset.isBinary) {
      return `<script data-source="${src}">\n${asset.content}\n</script>`;
    }
    return match;
  });

  // Replace <img src="..."> and url(...) with data URIs if binary/local
  htmlContent = htmlContent.replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, val) => {
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('#')) {
      return match;
    }
    const asset = resolveRelative(val);
    if (asset) {
      if (asset.isBinary) {
        return `${attr}="${asset.content}"`;
      } else if (attr === 'href' && (val.endsWith('.html') || val.endsWith('.htm'))) {
        // Internal page navigation within sandbox: trigger parent or hash navigation
        return `${attr}="#${val}"`;
      }
    }
    return match;
  });

  // Inject SEO & OGP meta tags into <head>
  const metaTags = `
    <!-- AquaHost Injected SEO & OGP -->
    <title>${escapeHtml(site.seo?.title || site.name)}</title>
    <meta name="description" content="${escapeHtml(site.seo?.description || site.description || '')}">
    ${site.seo?.keywords ? `<meta name="keywords" content="${escapeHtml(site.seo.keywords)}">` : ''}
    <meta property="og:title" content="${escapeHtml(site.ogp?.ogTitle || site.seo?.title || site.name)}">
    <meta property="og:description" content="${escapeHtml(site.ogp?.ogDescription || site.seo?.description || site.description || '')}">
    ${site.ogp?.ogImageUrl ? `<meta property="og:image" content="${escapeHtml(site.ogp.ogImageUrl)}">` : ''}
    <meta name="twitter:card" content="${site.ogp?.twitterCard || 'summary_large_image'}">
    <meta name="generator" content="AquaHost Edge Platform">
  `;

  if (htmlContent.includes('</head>')) {
    htmlContent = htmlContent.replace('</head>', `${metaTags}\n</head>`);
  } else {
    htmlContent = `<head>${metaTags}</head>` + htmlContent;
  }

  // Inject client-side hash navigation listener so links like <a href="#contact.html"> load inside iframe
  const navScript = `
    <script>
      window.addEventListener('hashchange', function() {
        var hash = window.location.hash.replace(/^#/, '');
        if (hash && (hash.endsWith('.html') || hash.endsWith('.htm'))) {
          window.parent.postMessage({ type: 'AQUA_NAVIGATE', path: hash }, '*');
        }
      });
      // Capture link clicks on internal pages
      document.addEventListener('click', function(e) {
        var target = e.target.closest('a');
        if (target && target.getAttribute('href')) {
          var href = target.getAttribute('href');
          if (!href.startsWith('http') && !href.startsWith('//') && (href.endsWith('.html') || href.endsWith('.htm'))) {
            e.preventDefault();
            window.parent.postMessage({ type: 'AQUA_NAVIGATE', path: href }, '*');
          }
        }
      });
    </script>
  `;
  htmlContent += navScript;

  return htmlContent;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildPasswordLockScreen(site: Site): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protected Site — ${escapeHtml(site.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    h2 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 700; }
    p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; }
    .input-group { margin-bottom: 1.25rem; text-align: left; }
    label { display: block; font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.4rem; font-weight: 500; }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #020617;
      border: 1px solid #334155;
      color: #fff;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    button {
      width: 100%;
      padding: 0.8rem;
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      color: #04111d;
      font-weight: 700;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    .error { color: #f87171; font-size: 0.85rem; margin-top: 0.75rem; display: none; }
    .footer { margin-top: 2rem; font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 パスワード保護</div>
    <h2>${escapeHtml(site.name)}</h2>
    <p>このサイトは非公開で保護されています。アクセスするにはパスワードを入力してください。</p>
    <form id="pwdForm">
      <div class="input-group">
        <label for="pwd">アクセスパスワード</label>
        <input type="password" id="pwd" placeholder="••••••••" required autofocus autocomplete="current-password" />
      </div>
      <button type="submit">サイトを解除して表示</button>
      <div id="errorMsg" class="error">パスワードが正しくありません</div>
    </form>
    <div class="footer">Powered by AquaHost Secure Edge</div>
  </div>
  <script>
    document.getElementById('pwdForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var input = document.getElementById('pwd').value;
      window.parent.postMessage({ type: 'AQUA_SUBMIT_PASSWORD', password: input }, '*');
    });
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'AQUA_PASSWORD_ERROR') {
        document.getElementById('errorMsg').style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

function buildPrivateSiteNotice(site: Site): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>403 Forbidden — ${escapeHtml(site.name)}</title>
  <style>
    body { background: #080c14; color: #94a3b8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { background: #0f172a; padding: 3rem; border-radius: 12px; border: 1px solid #1e293b; max-width: 450px; }
    h1 { color: #f1f5f9; font-size: 2rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1.5rem; }
    .tag { font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">
    <h1>403 Forbidden</h1>
    <p>このWebサイトは管理者により「非公開 (Private)」に設定されています。</p>
    <div class="tag">AquaHost Edge Router</div>
  </div>
</body>
</html>`;
}

function buildDefault404Page(site: Site, missingPath: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>404 — Page Not Found</title>
  <style>
    body { background: #080c14; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .box { background: #0f172a; padding: 3rem; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { font-size: 4rem; font-weight: 800; color: #38bdf8; margin: 0; line-height: 1; }
    h2 { font-size: 1.5rem; margin: 1rem 0 0.5rem; }
    p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; }
    code { background: #020617; padding: 0.2rem 0.5rem; border-radius: 4px; color: #38bdf8; font-size: 0.85rem; }
    a { display: inline-block; background: #38bdf8; color: #080c14; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; text-decoration: none; }
    .meta { margin-top: 2rem; font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <h2>ページが見つかりません</h2>
    <p>リクエストされたパス <code>/${escapeHtml(missingPath)}</code> は存在しないか、移動した可能性があります。</p>
    <a href="#" onclick="window.parent.postMessage({ type: 'AQUA_NAVIGATE', path: 'index.html' }, '*'); return false;">トップページへ戻る</a>
    <div class="meta">${escapeHtml(site.subdomain)}.aquahost.app • AquaHost CDN</div>
  </div>
</body>
</html>`;
}
