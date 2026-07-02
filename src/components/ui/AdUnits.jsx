import { useEffect } from 'react';

/**
 * AdSense ad unit placeholders.
 * Replace ca-pub-XXXXXXXXXXXXXXXX and slot IDs after AdSense approval.
 * minHeight reserved to prevent CLS (Core Web Vitals).
 */

export function AdLeaderboard() {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { }
  }, []);

  return (
    <div className="ad-unit" style={{ minHeight: '90px', width: '100%', maxWidth: '728px', margin: '0 auto' }}>
      {/* AdSense leaderboard 72890 / responsive */}
      {/* Uncomment after AdSense approval:
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      */}
      <span style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.4 }}>ADVERTISEMENT</span>
    </div>
  );
}

export function AdRectangle() {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { }
  }, []);

  return (
    <div className="ad-unit" style={{ minHeight: '250px', minWidth: '300px', width: '300px' }}>
      {/* AdSense rectangle 300250 */}
      {/* Uncomment after AdSense approval:
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '300px', height: '250px' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
      />
      */}
      <span style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.4 }}>ADVERTISEMENT</span>
    </div>
  );
}

export function AdInArticle() {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { }
  }, []);

  return (
    <div className="ad-unit" style={{ minHeight: '200px', margin: '32px 0', width: '100%' }}>
      {/* AdSense in-article responsive */}
      {/* Uncomment after AdSense approval:
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
      />
      */}
      <span style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.4 }}>ADVERTISEMENT</span>
    </div>
  );
}
