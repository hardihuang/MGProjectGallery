// Cloudflare Worker — MG 项目画册 API 代理
// 部署方式：Cloudflare Pages → 设置 → Functions → 或直接作为 Pages Worker
// 环境变量（在 Cloudflare Dashboard 中设置）：
//   FEISHU_APP_ID     — 飞书自建应用 App ID
//   FEISHU_APP_SECRET — 飞书自建应用 App Secret
//   BITABLE_APP_TOKEN — 多维表格 token (MVGGbyrUCaTzixs6aoXcZd8sn7k)
//   BITABLE_TABLE_ID  — 数据表 ID (tblLeCFZXAggGpHw)

const BITABLE_APP = 'MVGGbyrUCaTzixs6aoXcZd8sn7k';
const BITABLE_TABLE = 'tblLeCFZXAggGpHw';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /api/projects — 获取项目列表
      if (url.pathname === '/api/projects') {
        const token = await getToken(env);
        const resp = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP}/tables/${BITABLE_TABLE}/records?page_size=50`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await resp.json();
        const projects = (data?.data?.items || []).map(item => {
          const f = item.fields;
          const getText = (field) => {
            const v = f[field]; if (!v) return '';
            if (typeof v === 'string') return v;
            if (Array.isArray(v)) return v.map(t => t.text || t.name || '').join('');
            return String(v);
          };
          return {
            id: item.record_id,
            name: getText('项目名称'),
            author: getText('项目作者'),
            mentor: f['指导导师']?.[0]?.name || getText('指导导师') || '',
            desc: getText('简介'),
            link: f['链接']?.link || '',
            img: f['封面图']?.[0]?.file_token
              ? `${url.origin}/api/image/${f['封面图'][0].file_token}`
              : ''
          };
        });
        return new Response(JSON.stringify(projects), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
        });
      }

      // GET /api/image/:token — 代理飞书图片
      if (url.pathname.startsWith('/api/image/')) {
        const fileToken = url.pathname.slice('/api/image/'.length);
        const token = await getToken(env);
        const imgResp = await fetch(
          `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!imgResp.ok) return new Response('Image error', { status: imgResp.status });
        const buffer = await imgResp.arrayBuffer();
        return new Response(buffer, {
          headers: {
            'Content-Type': imgResp.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 非 API 请求：返回 404
    return new Response('Not Found', { status: 404 });
  }
};

// ═══ Token 缓存 ═══
let tokenCache = { token: null, expiresAt: 0 };

async function getToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const appId = env.FEISHU_APP_ID;
  const appSecret = env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) throw new Error('Feishu credentials not configured');
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  const data = await res.json();
  if (data.tenant_access_token) {
    tokenCache = { token: data.tenant_access_token, expiresAt: Date.now() + (data.expire - 60) * 1000 };
    return data.tenant_access_token;
  }
  throw new Error('Failed to get tenant token');
}
