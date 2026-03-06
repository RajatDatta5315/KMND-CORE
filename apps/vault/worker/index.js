/**
 * KMND (KRYVMIND) Currency Worker — Cloudflare D1
 * Handles: balances, transactions, leaderboard, earn, send
 * This is a virtual currency — no real money involved
 *
 * Deploy: npx wrangler deploy --config worker/wrangler.toml
 * D1: npx wrangler d1 create kmnd-db → paste ID in wrangler.toml
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const err  = (msg, s = 400) => json({ error: msg }, s);

// Simple JWT verify (matches KRYVLABS worker pattern)
async function getClerkUserId(request) {
  // For Clerk JWTs — just extract the sub claim from the token
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const [, body] = token.split('.');
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub || null;
  } catch { return null; }
}

// Seed a user with 100 KMND on first login
async function getOrCreateWallet(userId, env) {
  let wallet = await env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();
  if (!wallet) {
    await env.DB.prepare('INSERT INTO wallets (user_id, balance, total_earned) VALUES (?, ?, ?)')
      .bind(userId, 100, 100).run();
    // Log genesis grant
    await env.DB.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
      .bind(crypto.randomUUID(), userId, 'earn', 100, 'Genesis Grant — Welcome to KMND').run();
    wallet = await env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();
  }
  return wallet;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    // ── PUBLIC: LEADERBOARD ─────────────────────────────────────────────
    if (path === '/leaderboard') {
      const { results } = await env.DB.prepare(
        'SELECT user_id, balance, total_earned, display_name FROM wallets ORDER BY balance DESC LIMIT 25'
      ).all();
      return json({ leaders: results });
    }

    // ── PUBLIC: PRICE (simulated based on total supply & transactions) ──
    if (path === '/price') {
      const stats = await env.DB.prepare(
        'SELECT SUM(balance) as supply, COUNT(*) as holders FROM wallets'
      ).first();
      // Simulated price: starts at 0.001, rises with activity
      const txCount = await env.DB.prepare('SELECT COUNT(*) as c FROM transactions').first();
      const price = Math.max(0.001, (txCount?.c || 0) * 0.00002 + 0.001);
      return json({ price: parseFloat(price.toFixed(6)), supply: stats?.supply || 0, holders: stats?.holders || 0 });
    }

    // ── PUBLIC: PRICE HISTORY (last 30 data points) ─────────────────────
    if (path === '/price/history') {
      const { results } = await env.DB.prepare(
        'SELECT price, recorded_at FROM price_history ORDER BY recorded_at DESC LIMIT 30'
      ).all();
      return json({ history: results.reverse() });
    }

    // ── AUTH REQUIRED BELOW ─────────────────────────────────────────────
    const userId = await getClerkUserId(request);
    if (!userId && !path.startsWith('/webhook')) return err('Unauthorized', 401);

    // ── WALLET: GET BALANCE ─────────────────────────────────────────────
    if (path === '/wallet' && request.method === 'GET') {
      const wallet = await getOrCreateWallet(userId, env);
      return json(wallet);
    }

    // ── TRANSACTIONS: LIST ───────────────────────────────────────────────
    if (path === '/transactions' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const { results } = await env.DB.prepare(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
      ).bind(userId, limit).all();
      return json(results);
    }

    // ── EARN KMND (called by ARENAIX on battle win, KRIYEX on sale) ─────
    if (path === '/earn' && request.method === 'POST') {
      const { amount, description, source } = await request.json();
      if (!amount || amount <= 0 || amount > 10000) return err('Invalid amount');
      const wallet = await getOrCreateWallet(userId, env);
      const newBalance = (wallet.balance || 0) + amount;
      await env.DB.prepare('UPDATE wallets SET balance = ?, total_earned = total_earned + ? WHERE user_id = ?')
        .bind(newBalance, amount, userId).run();
      await env.DB.prepare('INSERT INTO transactions (id, user_id, type, amount, description, source) VALUES (?,?,?,?,?,?)')
        .bind(crypto.randomUUID(), userId, 'earn', amount, description || 'KMND earned', source || 'manual').run();
      // Record price snapshot
      await recordPriceSnapshot(env);
      return json({ balance: newBalance, earned: amount });
    }

    // ── SEND KMND to another user ─────────────────────────────────────────
    if (path === '/send' && request.method === 'POST') {
      const { to_user_id, amount, note } = await request.json();
      if (!to_user_id || !amount || amount <= 0) return err('Invalid send request');
      const senderWallet = await getOrCreateWallet(userId, env);
      if ((senderWallet.balance || 0) < amount) return err('Insufficient KMND balance');
      if (to_user_id === userId) return err('Cannot send to yourself');
      const receiverWallet = await getOrCreateWallet(to_user_id, env);
      // Deduct from sender
      await env.DB.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?')
        .bind((senderWallet.balance || 0) - amount, userId).run();
      // Add to receiver
      await env.DB.prepare('UPDATE wallets SET balance = ?, total_earned = total_earned + ? WHERE user_id = ?')
        .bind((receiverWallet.balance || 0) + amount, amount, to_user_id).run();
      // Log both sides
      const txId = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO transactions (id, user_id, type, amount, description, to_user_id) VALUES (?,?,?,?,?,?)')
        .bind(txId, userId, 'send', -amount, note || `Sent to ${to_user_id.slice(0, 8)}`, to_user_id).run();
      await env.DB.prepare('INSERT INTO transactions (id, user_id, type, amount, description, from_user_id) VALUES (?,?,?,?,?,?)')
        .bind(crypto.randomUUID(), to_user_id, 'receive', amount, note || `Received from ${userId.slice(0, 8)}`, userId).run();
      return json({ ok: true, new_balance: (senderWallet.balance || 0) - amount });
    }

    // ── SET DISPLAY NAME ─────────────────────────────────────────────────
    if (path === '/wallet/name' && request.method === 'POST') {
      const { name } = await request.json();
      if (!name || name.length > 20) return err('Name must be under 20 chars');
      await getOrCreateWallet(userId, env);
      await env.DB.prepare('UPDATE wallets SET display_name = ? WHERE user_id = ?').bind(name, userId).run();
      return json({ ok: true });
    }

    // ── WEBHOOK: ARENAIX battle win ───────────────────────────────────────
    // Called by ARENAIX worker when an agent wins a battle
    if (path === '/webhook/battle-win' && request.method === 'POST') {
      const { owner_user_id, agent_name, elo_gain } = await request.json();
      const kmndReward = Math.round(elo_gain * 2.5); // 1 ELO gain = 2.5 KMND
      await getOrCreateWallet(owner_user_id, env);
      const w = await env.DB.prepare('SELECT balance FROM wallets WHERE user_id = ?').bind(owner_user_id).first();
      await env.DB.prepare('UPDATE wallets SET balance = ?, total_earned = total_earned + ? WHERE user_id = ?')
        .bind((w?.balance || 0) + kmndReward, kmndReward, owner_user_id).run();
      await env.DB.prepare('INSERT INTO transactions (id, user_id, type, amount, description, source) VALUES (?,?,?,?,?,?)')
        .bind(crypto.randomUUID(), owner_user_id, 'earn', kmndReward, `Battle win — ${agent_name} (+${elo_gain} ELO)`, 'arenaix').run();
      return json({ ok: true, rewarded: kmndReward });
    }

    return err('Not found', 404);
  },

  // Cron: record price snapshot every hour
  async scheduled(event, env) {
    await recordPriceSnapshot(env);
  }
};

async function recordPriceSnapshot(env) {
  try {
    const stats = await env.DB.prepare('SELECT SUM(balance) as supply FROM wallets').first();
    const txCount = await env.DB.prepare('SELECT COUNT(*) as c FROM transactions').first();
    const price = Math.max(0.001, (txCount?.c || 0) * 0.00002 + 0.001);
    await env.DB.prepare('INSERT INTO price_history (id, price, supply, recorded_at) VALUES (?,?,?,?)')
      .bind(crypto.randomUUID(), parseFloat(price.toFixed(6)), stats?.supply || 0, new Date().toISOString()).run();
  } catch {}
}
