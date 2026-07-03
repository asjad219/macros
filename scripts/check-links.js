import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error("dist folder not found. Please run 'npm run build' first.");
  process.exit(1);
}

const htmlFiles = [];
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  }
}

walkDir(DIST_DIR);

const validPaths = new Set();
// Map all valid files
function addValidPath(p) {
  const relPath = path.relative(DIST_DIR, p).replace(/\\/g, '/');
  validPaths.add(`/${relPath}`);
  
  if (relPath.endsWith('index.html')) {
    const dirPath = `/${relPath.replace('index.html', '')}`;
    validPaths.add(dirPath);
    if (dirPath.endsWith('/')) {
       validPaths.add(dirPath.slice(0, -1));
    }
  } else if (relPath.endsWith('.html')) {
    const noExt = `/${relPath.slice(0, -5)}`;
    validPaths.add(noExt);
  }
}

function walkAllFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkAllFiles(filePath);
    } else {
      addValidPath(filePath);
    }
  }
}

walkAllFiles(DIST_DIR);
// Add special cases
validPaths.add('/');
validPaths.add('');

const brokenLinks = [];

for (const htmlFile of htmlFiles) {
  const htmlContent = fs.readFileSync(htmlFile, 'utf8');
  // Simple regex for href and src to avoid jsdom overhead
  const hrefRegex = /href=["'](.*?)["']/g;
  const srcRegex = /src=["'](.*?)["']/g;
  
  const relPagePath = '/' + path.relative(DIST_DIR, htmlFile).replace(/\\/g, '/');
  
  let match;
  while ((match = hrefRegex.exec(htmlContent)) !== null) {
    checkLink(match[1], relPagePath, 'href');
  }
  while ((match = srcRegex.exec(htmlContent)) !== null) {
    checkLink(match[1], relPagePath, 'src');
  }
}

function checkLink(link, sourcePage, type) {
  if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) return;
  
  // Strip hash and query strings
  let cleanLink = link.split('#')[0].split('?')[0];
  if (!cleanLink) return;
  
  // Resolve relative path if needed
  let resolvedLink = cleanLink;
  if (!cleanLink.startsWith('/')) {
    const dir = path.dirname(sourcePage);
    resolvedLink = path.posix.join(dir, cleanLink);
  }
  
  if (!validPaths.has(resolvedLink) && !validPaths.has(resolvedLink + '/')) {
    brokenLinks.push({ link, resolvedLink, sourcePage, type });
  }
}

if (brokenLinks.length > 0) {
  console.error("❌ BROKEN LINKS FOUND:");
  console.error(JSON.stringify(brokenLinks, null, 2));
  process.exit(1);
} else {
  console.log("✅ All internal links are valid.");
}
