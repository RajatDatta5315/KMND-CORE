/**
 * KMND (KRYVMIND) Currency Worker — Cloudflare D1
 * Wallets start at ⟁0. Earn by using the KRYV ecosystem.
 * Endpoints: wallet, transactions, send, earn, savings, FD, leaderboard, price
 */

const CORS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization' };
const json = (d,s=200) => new Response(JSON.stringify(d),{status:s,headers:{...CORS,'Content-Type':'application/json'}});
const err  = (m,s=400) => json({error:m},s);

async function getUserId(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const [,b] = token.split('.');
    const pad = b.replace(/-/g,'+').replace(/_/g,'/');
    const p = JSON.parse(atob(pad + '=='.slice(0,(3-pad.length%3)%3)));
    return (p.exp && p.exp*1000 < Date.now()) ? null : (p.sub || null);
  } catch { return null; }
}

async function getOrCreateWallet(userId, env) {
  let w = await env.DB.prepare('SELECT * FROM wallets WHERE user_id=?').bind(userId).first();
  if (!w) {
    // Start at ZERO — earn by participating in ecosystem
    await env.DB.prepare('INSERT INTO wallets (user_id,balance,total_earned) VALUES (?,0,0)').bind(userId).run();
    w = await env.DB.prepare('SELECT * FROM wallets WHERE user_id=?').bind(userId).first();
  }
  return w;
}

async function recordPrice(env) {
  try {
    const tc = await env.DB.prepare('SELECT COUNT(*) as c FROM transactions').first();
    const price = Math.max(0.001, (tc?.c||0)*0.00002+0.001);
    await env.DB.prepare('INSERT INTO price_history (id,price,recorded_at) VALUES (?,?,?)').bind(crypto.randomUUID(),parseFloat(price.toFixed(6)),new Date().toISOString()).run();
  } catch {}
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method==='OPTIONS') return new Response(null,{headers:CORS});

    // ── PUBLIC ────────────────────────────────────────────────────────────
    if (path==='/leaderboard') {
      const {results} = await env.DB.prepare('SELECT user_id,balance,total_earned,display_name FROM wallets ORDER BY balance DESC LIMIT 25').all();
      return json({leaders:results});
    }

    if (path==='/price') {
      const stats = await env.DB.prepare('SELECT SUM(balance) as supply,COUNT(*) as holders FROM wallets').first();
      const tc    = await env.DB.prepare('SELECT COUNT(*) as c FROM transactions').first();
      const price = Math.max(0.001,(tc?.c||0)*0.00002+0.001);
      return json({price:parseFloat(price.toFixed(6)),supply:stats?.supply||0,holders:stats?.holders||0});
    }

    if (path==='/price/history') {
      const {results} = await env.DB.prepare('SELECT price,recorded_at FROM price_history ORDER BY recorded_at DESC LIMIT 30').all();
      return json({history:results.reverse()});
    }

    // ── AUTH REQUIRED ────────────────────────────────────────────────────
    const userId = await getUserId(request);
    if (!userId && !path.startsWith('/webhook') && !path.startsWith('/earn') && !path.startsWith('/spend')) return err('Unauthorized',401);

    if (path==='/wallet' && request.method==='GET') {
      const w = await getOrCreateWallet(userId, env);
      // Also get savings summary
      const sav = await env.DB.prepare('SELECT balance,interest_earned FROM savings_accounts WHERE user_id=?').bind(userId).first();
      const fds = await env.DB.prepare('SELECT COUNT(*) as c, SUM(maturity_amount) as total FROM fixed_deposits WHERE user_id=? AND status=?').bind(userId,'active').first();
      return json({...w, savings_balance:sav?.balance||0, savings_interest:sav?.interest_earned||0, active_fds:fds?.c||0, fd_maturity_value:fds?.total||0});
    }

    if (path==='/transactions') {
      const limit=parseInt(url.searchParams.get('limit')||'30');
      const {results} = await env.DB.prepare('SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT ?').bind(userId,limit).all();
      return json(results);
    }

    // ── EARN (called by ARENAIX, KRIYEX, KRYVX) ──────────────────────────
    if (path==='/earn' && request.method==='POST') {
      const {amount,description,source,user_id:targetId} = await request.json();
      const uid = targetId || userId;
      if (!amount||amount<=0||amount>100000) return err('Invalid amount');
      const w = await getOrCreateWallet(uid,env);
      await env.DB.prepare('UPDATE wallets SET balance=?,total_earned=total_earned+? WHERE user_id=?').bind((w.balance||0)+amount,amount,uid).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),uid,'earn',amount,description||'KMND earned',source||'system').run();
      await recordPrice(env);
      return json({ok:true,balance:(w.balance||0)+amount});
    }

    // ── SPEND (called by KRYVX for trades) ───────────────────────────────
    if (path==='/spend' && request.method==='POST') {
      const {amount,description,source,user_id:targetId} = await request.json();
      const uid = targetId || userId;
      const w = await getOrCreateWallet(uid,env);
      if ((w.balance||0)<amount) return err('Insufficient KMND balance');
      await env.DB.prepare('UPDATE wallets SET balance=? WHERE user_id=?').bind((w.balance||0)-amount,uid).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),uid,'spend',-amount,description||'KMND spent',source||'system').run();
      return json({ok:true,balance:(w.balance||0)-amount});
    }

    if (path==='/send' && request.method==='POST') {
      const {to_user_id,amount,note} = await request.json();
      if (!to_user_id||!amount||amount<=0) return err('Invalid request');
      if (to_user_id===userId) return err('Cannot send to yourself');
      const sw = await getOrCreateWallet(userId,env);
      if ((sw.balance||0)<amount) return err('Insufficient KMND balance');
      const rw = await getOrCreateWallet(to_user_id,env);
      await env.DB.prepare('UPDATE wallets SET balance=? WHERE user_id=?').bind((sw.balance||0)-amount,userId).run();
      await env.DB.prepare('UPDATE wallets SET balance=?,total_earned=total_earned+? WHERE user_id=?').bind((rw.balance||0)+amount,amount,to_user_id).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,to_user_id) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,'send',-amount,note||`Sent to ${to_user_id.slice(0,8)}`,to_user_id).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,from_user_id) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),to_user_id,'receive',amount,note||`Received from ${userId.slice(0,8)}`,userId).run();
      return json({ok:true,new_balance:(sw.balance||0)-amount});
    }

    if (path==='/wallet/name' && request.method==='POST') {
      const {name} = await request.json();
      if (!name||name.length>20) return err('Name must be under 20 chars');
      await getOrCreateWallet(userId,env);
      await env.DB.prepare('UPDATE wallets SET display_name=? WHERE user_id=?').bind(name,userId).run();
      return json({ok:true});
    }

    // ── SAVINGS ACCOUNT ───────────────────────────────────────────────────
    if (path==='/savings' && request.method==='GET') {
      const sav = await env.DB.prepare('SELECT * FROM savings_accounts WHERE user_id=?').bind(userId).first();
      const {results:fds} = await env.DB.prepare('SELECT * FROM fixed_deposits WHERE user_id=? ORDER BY created_at DESC LIMIT 20').bind(userId).all();
      return json({...sav, fds, rate_pct:8.5});
    }

    if (path==='/savings/deposit' && request.method==='POST') {
      const {amount} = await request.json();
      if (!amount||amount<1) return err('Minimum deposit: ⟁1');
      const w = await getOrCreateWallet(userId,env);
      if ((w.balance||0)<amount) return err('Insufficient KMND balance');
      // Deduct from wallet
      await env.DB.prepare('UPDATE wallets SET balance=? WHERE user_id=?').bind((w.balance||0)-amount,userId).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,'spend',-amount,'Savings deposit','savings').run();
      // Add to savings
      const existing = await env.DB.prepare('SELECT * FROM savings_accounts WHERE user_id=?').bind(userId).first();
      if (existing) {
        await env.DB.prepare('UPDATE savings_accounts SET balance=balance+?,total_deposited=total_deposited+?,updated_at=? WHERE user_id=?').bind(amount,amount,new Date().toISOString(),userId).run();
      } else {
        await env.DB.prepare('INSERT INTO savings_accounts (user_id,balance,total_deposited,interest_earned,rate_pct) VALUES (?,?,?,0,8.5)').bind(userId,amount,amount).run();
      }
      return json({ok:true,deposited:amount,annual_rate:'8.5%',note:'Interest compounds daily automatically'});
    }

    if (path==='/savings/withdraw' && request.method==='POST') {
      const {amount} = await request.json();
      const sav = await env.DB.prepare('SELECT * FROM savings_accounts WHERE user_id=?').bind(userId).first();
      if (!sav||sav.balance<amount) return err('Insufficient savings balance');
      await env.DB.prepare('UPDATE savings_accounts SET balance=balance-?,updated_at=? WHERE user_id=?').bind(amount,new Date().toISOString(),userId).run();
      const w = await getOrCreateWallet(userId,env);
      await env.DB.prepare('UPDATE wallets SET balance=?,total_earned=total_earned+? WHERE user_id=?').bind((w.balance||0)+amount,amount,userId).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,'earn',amount,'Savings withdrawal','savings').run();
      return json({ok:true,withdrawn:amount,new_wallet_balance:(w.balance||0)+amount});
    }

    // ── FIXED DEPOSITS ────────────────────────────────────────────────────
    if (path==='/savings/fd' && request.method==='POST') {
      const {amount,days} = await request.json();
      const RATES: Record<number,number> = {30:9,90:10.5,180:12,365:14};
      const rate = RATES[days];
      if (!rate) return err('Valid FD periods: 30, 90, 180, 365 days');
      if (!amount||amount<100) return err('Minimum FD amount: ⟁100');
      const w = await getOrCreateWallet(userId,env);
      if ((w.balance||0)<amount) return err('Insufficient KMND balance');
      await env.DB.prepare('UPDATE wallets SET balance=? WHERE user_id=?').bind((w.balance||0)-amount,userId).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,'spend',-amount,`FD created — ${days}d at ${rate}% p.a.`,'fd').run();
      const interest = parseFloat((amount*(rate/100)*(days/365)).toFixed(4));
      const maturityAmt = parseFloat((amount+interest).toFixed(4));
      const maturityDate = new Date(Date.now()+days*86400000).toISOString();
      await env.DB.prepare('INSERT INTO fixed_deposits (id,user_id,principal,rate_pct,days,interest_earned,maturity_amount,maturity_date,status) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,amount,rate,days,interest,maturityAmt,maturityDate,'active').run();
      return json({ok:true,principal:amount,rate_pct:rate,days,interest_earned:interest,maturity_amount:maturityAmt,matures_on:maturityDate});
    }

    if (path==='/savings/fd/withdraw' && request.method==='POST') {
      const {fd_id} = await request.json();
      const fd = await env.DB.prepare('SELECT * FROM fixed_deposits WHERE id=? AND user_id=?').bind(fd_id,userId).first();
      if (!fd) return err('FD not found');
      if (fd.status!=='active') return err('FD already closed');
      let payout = fd.maturity_amount;
      let note = `FD matured — ⟁${fd.interest_earned} interest earned`;
      let status = 'matured';
      if (new Date(fd.maturity_date)>new Date()) {
        const daysLeft = Math.ceil((new Date(fd.maturity_date).getTime()-Date.now())/86400000);
        const penalty = parseFloat((fd.interest_earned*0.5).toFixed(4));
        payout = parseFloat((fd.principal+fd.interest_earned-penalty).toFixed(4));
        note = `FD closed early (${daysLeft}d early) — penalty ⟁${penalty}`;
        status = 'closed_early';
      }
      await env.DB.prepare('UPDATE fixed_deposits SET status=? WHERE id=?').bind(status,fd_id).run();
      const w = await getOrCreateWallet(userId,env);
      await env.DB.prepare('UPDATE wallets SET balance=?,total_earned=total_earned+? WHERE user_id=?').bind((w.balance||0)+payout,payout,userId).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userId,'earn',payout,note,'fd').run();
      return json({ok:true,payout,note});
    }

    // ── WEBHOOKS ──────────────────────────────────────────────────────────
    if (path==='/webhook/battle-win' && request.method==='POST') {
      const {owner_user_id,agent_name,elo_gain} = await request.json();
      const reward = Math.round((elo_gain||8)*2.5);
      const w = await getOrCreateWallet(owner_user_id,env);
      await env.DB.prepare('UPDATE wallets SET balance=?,total_earned=total_earned+? WHERE user_id=?').bind((w.balance||0)+reward,reward,owner_user_id).run();
      await env.DB.prepare('INSERT INTO transactions (id,user_id,type,amount,description,source) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),owner_user_id,'earn',reward,`Battle win — ${agent_name}(+${elo_gain||8} ELO)`,'arenaix').run();
      return json({ok:true,rewarded:reward});
    }


    // ── SELF AUTH (no Clerk needed) ──────────────────────────────────────
    if (path==='/auth/signup' && request.method==='POST') {
      const {email,password,display_name} = await request.json();
      if (!email||!password) return err('Email and password required');
      if (password.length < 6) return err('Password must be 6+ characters');
      // Check if already exists
      const ex = await env.DB.prepare('SELECT user_id FROM auth_users WHERE email=?').bind(email.toLowerCase()).first().catch(()=>null);
      if (ex) return err('Email already registered');
      // Simple hash (not bcrypt - workers limitation, use SHA-256)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + (env.JWT_SECRET||'kryv-secret'));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const uid = crypto.randomUUID();
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS auth_users (user_id TEXT PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT,display_name TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run().catch(()=>{});
      await env.DB.prepare('INSERT INTO auth_users(user_id,email,password_hash,display_name) VALUES(?,?,?,?)').bind(uid,email.toLowerCase(),hash,display_name||email.split('@')[0]).run();
      // Create wallet at zero
      await getOrCreateWallet(uid,env);
      // Issue JWT
      const header = btoa(JSON.stringify({alg:'HS256',typ:'JWT'}));
      const payload = btoa(JSON.stringify({sub:uid,email:email.toLowerCase(),exp:Math.floor(Date.now()/1000)+86400*30}));
      const sig = btoa(uid+email+(env.JWT_SECRET||'kryv-secret')).replace(/=/g,'');
      const token = `${header}.${payload}.${sig}`;
      return json({ok:true,token,user:{id:uid,email:email.toLowerCase(),display_name:display_name||email.split('@')[0]}});
    }

    if (path==='/auth/signin' && request.method==='POST') {
      const {email,password} = await request.json();
      if (!email||!password) return err('Email and password required');
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS auth_users (user_id TEXT PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT,display_name TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run().catch(()=>{});
      const encoder = new TextEncoder();
      const data = encoder.encode(password + (env.JWT_SECRET||'kryv-secret'));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const user = await env.DB.prepare('SELECT * FROM auth_users WHERE email=? AND password_hash=?').bind(email.toLowerCase(),hash).first();
      if (!user) return err('Invalid email or password');
      const header = btoa(JSON.stringify({alg:'HS256',typ:'JWT'}));
      const payload = btoa(JSON.stringify({sub:user.user_id,email:user.email,exp:Math.floor(Date.now()/1000)+86400*30}));
      const sig = btoa(user.user_id+user.email+(env.JWT_SECRET||'kryv-secret')).replace(/=/g,'');
      const token = `${header}.${payload}.${sig}`;
      return json({ok:true,token,user:{id:user.user_id,email:user.email,display_name:user.display_name}});
    }

    return err('Not found',404);
  },

  async scheduled(event, env) {
    // Hourly: record price snapshot + compound savings interest
    await recordPrice(env);
    // Daily compound: 8.5% annual = 0.0233% daily
    await env.DB.prepare(`UPDATE savings_accounts SET interest_earned=interest_earned+balance*0.000233,balance=balance+balance*0.000233,updated_at=? WHERE 1=1`).bind(new Date().toISOString()).run();
  }
};
