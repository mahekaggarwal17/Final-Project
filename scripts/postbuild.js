import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve('.output/public');
const assetsDir = path.join(publicDir, 'assets');

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find(f => f.endsWith('.css'));
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js')) || files.find(f => f.endsWith('.js'));

  const cssLink = cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}">` : '';
  const jsScript = jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Azure AI Suite · Multimodal Intelligence Hub</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;800&family=Outfit:wght@500;700;800;900&display=swap" rel="stylesheet">
  ${cssLink}
</head>
<body>
  <div id="root"></div>
  ${jsScript}
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
  console.log('✅ Generated .output/public/index.html for static & SPA deployments!');

  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  fs.cpSync(publicDir, distDir, { recursive: true });
  console.log('✅ Synchronized static bundle to dist/ for Vercel/Netlify/Render!');
} else {
  console.warn('⚠️ Warning: assets directory not found in .output/public');
}
