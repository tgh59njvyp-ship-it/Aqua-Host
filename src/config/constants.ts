/**
 * Global AquaHost Configuration Constants
 * Easily customizable if the service name or domain changes.
 */

export const APP_CONFIG = {
  // Service branding
  serviceName: 'AquaHost',
  tagline: 'Instant Web Hosting & Serverless Deployment',
  taglineJa: 'ドラッグ＆ドロップで即座にWebサイト公開＆管理',
  
  // URL architecture
  defaultDomainSuffix: 'aquahost.app',
  previewUrlPattern: (subdomain: string) => `https://${subdomain}.aquahost.app`,
  
  // Storage & edge limits (communicated honestly to the user)
  limits: {
    freeMaxStorageMb: 100,
    freeMaxBandwidthGb: 10,
    freeMaxFilesPerSite: 500,
    freeMaxFileSizeMb: 25,
    maxDeploymentsHistory: 50,
  },

  // Edge & DNS configuration instructions
  dns: {
    cnameTarget: 'cname.aquahost.app',
    aRecordIp: '76.76.21.21',
  },

  // Supported extensions
  allowedExtensions: [
    '.html', '.htm', '.css', '.js', '.mjs', '.json', '.svg',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.md', '.txt', '.xml', '.webmanifest'
  ],

  // MIME types mapping
  mimeTypes: {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    md: 'text/markdown; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
    webmanifest: 'application/manifest+json',
  } as Record<string, string>,
};
