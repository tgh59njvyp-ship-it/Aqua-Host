export type FileType = 'html' | 'css' | 'javascript' | 'json' | 'image' | 'markdown' | 'other';

export interface HostedFile {
  id: string;
  path: string; // e.g. "index.html", "css/style.css", "assets/logo.png"
  name: string;
  size: number;
  mimeType: string;
  content: string; // UTF-8 text for text files, or base64 Data URL for images/binaries
  isBinary: boolean;
  lastModified: number;
}

export interface Deployment {
  id: string;
  version: number;
  status: 'building' | 'production' | 'failed' | 'rolled_back';
  createdAt: number;
  buildTimeMs: number;
  summary: string;
  filesCount: number;
  totalSize: number;
  logs: string[];
  snapshotFiles?: HostedFile[];
}

export interface DomainConfig {
  domain: string;
  status: 'verified' | 'pending_dns' | 'needs_config';
  sslStatus: 'active' | 'issuing' | 'error';
  configuredAt: number;
  type: 'cname' | 'a';
  dnsTarget: string;
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  author: string;
  customHeadTags?: string;
}

export interface OGPSettings {
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterCard: 'summary_large_image' | 'summary';
}

export interface AccessSettings {
  visibility: 'public' | 'private' | 'password_protected';
  passwordHash?: string; // SHA-256
  allowedIps?: string[];
}

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  path: string;
  referrer: string;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  country: string;
  countryCode: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  dailyViews: { date: string; views: number; visitors: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  referrers: { source: string; count: number }[];
  countries: { country: string; code: string; count: number }[];
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  target: 'production' | 'preview' | 'all';
  isSecret: boolean;
  updatedAt: number;
}

export interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  statusCode: 301 | 302 | 200; // 200 = rewrite
}

export interface ErrorPageConfig {
  useCustom404: boolean;
  custom404Path?: string;
  theme: 'aquahost_dark' | 'clean_minimal' | 'cyberpunk';
  title: string;
  message: string;
}

export interface Site {
  id: string; // unique internal ID
  ownerId?: string; // Firebase Auth UID
  ownerEmail?: string; // Firebase Auth Email
  name: string; // human readable name
  subdomain: string; // e.g. "my-portfolio" => "my-portfolio.aquahost.app"
  description: string;
  favicon?: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'suspended' | 'draft';
  currentDeploymentId?: string;
  deployments: Deployment[];
  files: HostedFile[];
  domains: DomainConfig[];
  seo: SEOSettings;
  ogp: OGPSettings;
  access: AccessSettings;
  envVars: EnvVariable[];
  redirects: RedirectRule[];
  errorPages: ErrorPageConfig;
  analytics: AnalyticsSummary;
  rawAnalytics: AnalyticsEvent[];
  storageBytes: number;
  bandwidthBytes: number;
}
