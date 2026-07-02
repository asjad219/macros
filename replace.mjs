import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      const ext = path.extname(filepath);
      if (['.astro', '.jsx', '.md', '.mdx'].includes(ext)) {
        callback(filepath);
      }
    }
  }
}

// Replaces all the variations, but skips if followed by .com, .app, etc.
// Also we must skip if preceded by href=" or https://
const BRAND_REGEX = /(?<!https?:\/\/)(?<!href=["']\/?)(\bMacroCalc\b|\bMacro Calc\b|\bmacrocalc\b|\bmacro calc\b|\bMACROCALC\b|\bCalcmacros\b|\bcalcmacros\b|\bCALCMACROS\b)(?!\.com|\.app|\.js|\.md|\.astro|[-/a-zA-Z0-9])/g;

walkSync('d:\\calcmacros\\src', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let newContent = content.replace(BRAND_REGEX, 'CalcMacros');
  
  if (filepath.endsWith('Footer.astro')) {
    newContent = newContent.replace(/&copy;\s*\{year\}\s*(MacroCalc|CalcMacros)/gi, '&copy; 2026 CalcMacros');
    newContent = newContent.replace(/<strong>Tagline:<\/strong>\s*Know your numbers\. Hit your goals\./g, 'Know your numbers. Hit your goals.');
    // Also "Macro<span style="color: var(--text-muted);">Calc</span>" if any in footer
    newContent = newContent.replace(/Macro<span style="color: var\(--text-muted\);">Calc<\/span>/g, 'Calc<span style="color: var(--text-muted);">Macros</span>');
  }

  if (filepath.endsWith('Header.astro')) {
    newContent = newContent.replace(/Macro<span style="color: var\(--text-muted\);">Calc<\/span>/g, 'Calc<span style="color: var(--text-muted);">Macros</span>');
    newContent = newContent.replace(/aria-label="MacroCalc — Home"/g, 'aria-label="CalcMacros — Home"');
  }

  if (filepath.endsWith('BaseLayout.astro')) {
    // og:site_name content to "CalcMacros"
    if (!newContent.includes('og:site_name')) {
      newContent = newContent.replace(/<meta property="og:type"/, '<meta property="og:site_name" content="CalcMacros" />\n  <meta property="og:type"');
    } else {
      newContent = newContent.replace(/<meta property="og:site_name" content=".*?"\s*\/>/, '<meta property="og:site_name" content="CalcMacros" />');
    }
  }

  // Find any meta description or <title> tags that might have the wrong brand name using the old case but we already replaced it via BRAND_REGEX.
  // We'll just trust BRAND_REGEX for that.

  if (content !== newContent) {
    console.log(`Updated ${filepath}`);
    fs.writeFileSync(filepath, newContent, 'utf8');
  }
});
