import { HostedFile } from '../types';
import { generateRandomId } from './crypto';

export interface TemplateProject {
  id: string;
  name: string;
  category: string;
  description: string;
  subdomainSuggestion: string;
  badge: string;
  files: HostedFile[];
}

export const SAMPLE_TEMPLATES: TemplateProject[] = [
  {
    id: 'minimal-portfolio',
    name: 'Minimal Developer Portfolio',
    category: 'Portfolio',
    description: 'ダークモード対応のモダンで洗練されたエンジニア・デザイナー向けポートフォリオサイト',
    subdomainSuggestion: 'kenji-dev',
    badge: 'Popular',
    files: [
      {
        id: generateRandomId(),
        path: 'index.html',
        name: 'index.html',
        size: 2150,
        mimeType: 'text/html; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kenji Sato — Full Stack Engineer</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="glow-orb"></div>
  <header class="header">
    <div class="logo">KS.</div>
    <nav class="nav">
      <a href="#about">About</a>
      <a href="#works">Works</a>
      <a href="contact.html">Contact</a>
    </nav>
  </header>

  <main class="hero">
    <div class="badge">🚀 Available for freelance & full-time</div>
    <h1>Designing intuitive digital products & high-performance web systems.</h1>
    <p class="subtitle">フルスタックエンジニア / UIデザイナー。モダンなフロントエンドとスケーラブルな分散システムを構築しています。</p>
    <div class="cta-group">
      <a href="#works" class="btn btn-primary">作品を見る</a>
      <a href="contact.html" class="btn btn-secondary">メッセージを送る</a>
    </div>
  </main>

  <section id="works" class="section works">
    <h2>Featured Projects</h2>
    <div class="grid">
      <article class="card">
        <div class="card-tag">TypeScript • WebGL</div>
        <h3>Spatial Canvas 3D</h3>
        <p>リアルタイム共同編集が可能なWebブラウザベースの空間デザインエディタ。</p>
      </article>
      <article class="card">
        <div class="card-tag">Go • Redis • GraphQL</div>
        <h3>High-Speed Telemetry Engine</h3>
        <p>毎秒10万件のメトリクスを即座に集約するストリーミング監視基盤。</p>
      </article>
      <article class="card">
        <div class="card-tag">React • Tailwind • WASM</div>
        <h3>Audio Wave Studio</h3>
        <p>ブラウザ完結のマルチトラック音声波形編集・エフェクト処理ツール。</p>
      </article>
    </div>
  </section>

  <footer class="footer">
    <p>© 2026 Kenji Sato. Hosted proudly on <span class="highlight">AquaHost</span>.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`
      },
      {
        id: generateRandomId(),
        path: 'style.css',
        name: 'style.css',
        size: 2600,
        mimeType: 'text/css; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #080c14;
  color: #f1f5f9;
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.glow-orb {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(6, 182, 212, 0) 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -1px;
  color: #38bdf8;
}

.nav a {
  color: #94a3b8;
  text-decoration: none;
  margin-left: 2rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav a:hover {
  color: #38bdf8;
}

.hero {
  position: relative;
  z-index: 10;
  max-width: 1000px;
  margin: 4rem auto;
  padding: 0 1.5rem;
}

.badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 650px;
  margin-bottom: 2.5rem;
}

.cta-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 1.75rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #38bdf8;
  color: #080c14;
}

.btn-primary:hover {
  background: #7dd3fc;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.works {
  max-width: 1000px;
  margin: 6rem auto;
  padding: 0 1.5rem;
}

.works h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  letter-spacing: -0.02em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover {
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateY(-4px);
}

.card-tag {
  font-size: 0.8rem;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.card h3 {
  font-size: 1.35rem;
  margin-bottom: 0.75rem;
}

.card p {
  color: #94a3b8;
  font-size: 0.95rem;
}

.footer {
  text-align: center;
  padding: 4rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #64748b;
  font-size: 0.9rem;
}

.highlight {
  color: #38bdf8;
  font-weight: 600;
}`
      },
      {
        id: generateRandomId(),
        path: 'script.js',
        name: 'script.js',
        size: 450,
        mimeType: 'application/javascript; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `// AquaHost hosted client interactive script
console.log('Kenji Sato Portfolio loaded via AquaHost CDN.');

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = 'rgba(56, 189, 248, 0.6)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
  });
});`
      },
      {
        id: generateRandomId(),
        path: 'contact.html',
        name: 'contact.html',
        size: 1200,
        mimeType: 'text/html; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Contact — Kenji Sato</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="header">
    <div class="logo"><a href="index.html" style="color:inherit;text-decoration:none;">KS.</a></div>
    <nav class="nav">
      <a href="index.html">← Back to Home</a>
    </nav>
  </header>
  <main class="hero">
    <h1>Let's build something remarkable.</h1>
    <p class="subtitle">プロジェクトのご相談・お見積りなどお気軽にお問い合わせください。</p>
    <div style="background: rgba(15, 23, 42, 0.7); padding: 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); max-width: 500px;">
      <p style="margin-bottom: 1rem; color: #cbd5e1;">Email: <strong>contact@example.com</strong></p>
      <p style="color: #94a3b8;">X (Twitter): <strong>@kenji_dev</strong></p>
    </div>
  </main>
</body>
</html>`
      }
    ]
  },
  {
    id: 'cyber-arcade',
    name: 'Retro Cyber Canvas Game',
    category: 'Web Game',
    description: 'HTML5 Canvasで動くネオンサイバーシューティングゲーム（スコア機能付き）',
    subdomainSuggestion: 'cyber-blaster',
    badge: 'Interactive',
    files: [
      {
        id: generateRandomId(),
        path: 'index.html',
        name: 'index.html',
        size: 1800,
        mimeType: 'text/html; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>CYBER BLASTER 2099</title>
  <style>
    body {
      margin: 0;
      background: #020408;
      color: #00ffcc;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    h1 {
      margin: 8px 0;
      font-size: 28px;
      letter-spacing: 4px;
      text-shadow: 0 0 10px #00ffcc;
    }
    #gameCanvas {
      background: #060912;
      border: 2px solid #00ffcc;
      box-shadow: 0 0 20px rgba(0,255,204,0.3);
      border-radius: 8px;
    }
    .hud {
      margin-top: 10px;
      font-size: 16px;
      display: flex;
      gap: 30px;
    }
  </style>
</head>
<body>
  <h1>CYBER BLASTER 2099</h1>
  <canvas id="gameCanvas" width="600" height="400"></canvas>
  <div class="hud">
    <div>SCORE: <span id="score">0</span></div>
    <div>MOVE: [A][D] or [←][→] | SHOOT: [SPACE]</div>
  </div>
  <script src="game.js"></script>
</body>
</html>`
      },
      {
        id: generateRandomId(),
        path: 'game.js',
        name: 'game.js',
        size: 2500,
        mimeType: 'application/javascript; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

let score = 0;
const player = { x: 280, y: 350, w: 30, h: 20, speed: 6 };
const bullets = [];
const enemies = [];
const keys = {};

window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

let lastShot = 0;

function spawnEnemy() {
  if (Math.random() < 0.04) {
    enemies.push({
      x: Math.random() * (canvas.width - 25),
      y: -20,
      w: 25,
      h: 20,
      speed: 1.5 + Math.random() * 2
    });
  }
}

function update() {
  if (keys['ArrowLeft'] || keys['KeyA']) player.x = Math.max(0, player.x - player.speed);
  if (keys['ArrowRight'] || keys['KeyD']) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

  const now = Date.now();
  if (keys['Space'] && now - lastShot > 160) {
    bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10 });
    lastShot = now;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= 8;
    if (bullets[i].y < 0) bullets.splice(i, 1);
  }

  spawnEnemy();

  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemies[i].speed;
    // Bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (bullets[j] && enemies[i] &&
          bullets[j].x < enemies[i].x + enemies[i].w &&
          bullets[j].x + bullets[j].w > enemies[i].x &&
          bullets[j].y < enemies[i].y + enemies[i].h &&
          bullets[j].y + bullets[j].h > enemies[i].y) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 100;
        scoreEl.textContent = score;
        break;
      }
    }
    if (enemies[i] && enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
    }
  }
}

function draw() {
  ctx.fillStyle = '#060912';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player ship
  ctx.fillStyle = '#00ffcc';
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  // Bullets
  ctx.fillStyle = '#ff0077';
  ctx.shadowColor = '#ff0077';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // Enemies
  ctx.fillStyle = '#ffaa00';
  ctx.shadowColor = '#ffaa00';
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();`
      }
    ]
  },
  {
    id: 'saas-landing',
    name: 'Modern SaaS Product Landing',
    category: 'Marketing',
    description: 'プライシング、機能紹介、FAQセクションを完備した高コンバージョンランディングページ',
    subdomainSuggestion: 'nexus-flow',
    badge: 'Full Site',
    files: [
      {
        id: generateRandomId(),
        path: 'index.html',
        name: 'index.html',
        size: 3200,
        mimeType: 'text/html; charset=utf-8',
        isBinary: false,
        lastModified: Date.now(),
        content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexusFlow — The Autonomous Workflow Orchestrator</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card: #111827;
      --border: #1f2937;
      --primary: #6366f1;
      --accent: #a855f7;
      --text: #f9fafb;
      --text-muted: #9ca3af;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    header { padding: 1.5rem 0; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 1.4rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero { text-align: center; padding: 5rem 0 3rem; }
    h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1.25rem; line-height: 1.2; }
    .lead { font-size: 1.2rem; color: var(--text-muted); max-width: 640px; margin: 0 auto 2rem; }
    .button { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; padding: 0.9rem 2rem; font-weight: 600; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 4rem 0; }
    .card { background: var(--card); border: 1px solid var(--border); padding: 2rem; border-radius: 12px; }
    .card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff; }
    .card p { color: var(--text-muted); font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">NexusFlow</div>
      <a href="#features" class="button" style="padding: 0.5rem 1.2rem; font-size: 0.9rem;">Get Started</a>
    </header>
    <main class="hero">
      <h1>Automate your data pipelines with surgical precision.</h1>
      <p class="lead">複雑なマルチクラウドワークフローを数行のコードとドラッグ＆ドロップで統合。次世代のオーケストレーション基盤。</p>
      <a href="#demo" class="button">Start Free 14-Day Trial</a>
    </main>
    <section class="grid" id="features">
      <div class="card">
        <h3>⚡ Real-time Stream Engine</h3>
        <p>低レイテンシーで毎秒百万イベントをリアルタイム分散処理。</p>
      </div>
      <div class="card">
        <h3>🔒 Zero-Trust Compliance</h3>
        <p>SOC2, HIPAA, GDPRに完全準拠したエンドツーエンド暗号化。</p>
      </div>
      <div class="card">
        <h3>🧩 200+ Integrations</h3>
        <p>PostgreSQL, Snowflake, BigQuery, AWS, GCPなどワンクリック接続。</p>
      </div>
    </section>
  </div>
</body>
</html>`
      }
    ]
  }
];
