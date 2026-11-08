const SUPABASE_URL = 'https://xdzmysjfpwcpjdrwkksk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkem15c2pmcHdjcGpkcndra3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzODE4MjgsImV4cCI6MjEwMzk1NzgyOH0.FR2EeoAnrYFjD4p12s-6CoDGg6FG6svgyyOqRfbsRBk';
const BASE = 'https://rentall-toko.vercel.app';

function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeXml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function ambil(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  try {
    const toko = await ambil('toko_publik?select=slug,nama');
    const barang = await ambil('barang_publik?select=id,judul,toko_slug,created_at');

    const urls = [];
    for (const t of toko) {
      urls.push(`${BASE}/t/${encodeURIComponent(t.slug)}`);
    }
    for (const b of barang) {
      const segmen = `${slugify(b.judul)}-${b.id.slice(0, 4)}`;
      urls.push(`${BASE}/t/${encodeURIComponent(b.toko_slug)}/${segmen}`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${escapeXml(u)}</loc></url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send('Gagal membuat sitemap');
  }
}
