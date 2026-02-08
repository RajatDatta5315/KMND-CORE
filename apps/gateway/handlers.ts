export const handleHistory = async (url: URL, env: any) => {
  const userId = url.searchParams.get("userId");
  const { results } = await env.DB.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10").bind(userId).all();
  return Response.json({ transactions: results }, { headers: { "Access-Control-Allow-Origin": "*" } });
};

export const handleLeaderboard = async (env: any) => {
  const { results } = await env.DB.prepare("SELECT id, balance FROM users WHERE is_banned = 0 AND id != 'ADMIN_KRYV' ORDER BY balance DESC LIMIT 10").bind().all();
  return Response.json({ leaders: results }, { headers: { "Access-Control-Allow-Origin": "*" } });
};

export const handleTransfer = async (request: Request, env: any) => {
  const { fromId, toId, amount, appId } = await request.json();
  
  const sender = await env.DB.prepare("SELECT balance, is_banned FROM users WHERE id = ?").bind(fromId).first();
  if (!sender || sender.is_banned) return Response.json({ success: false, error: "ACCESS_DENIED" }, { status: 403 });
  if (sender.balance < amount) return Response.json({ success: false, error: "LOW_ENERGY" }, { status: 400 });

  const taxAmount = amount * 0.02; 
  const finalDebit = amount + taxAmount;

  await env.DB.batch([
    env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(finalDebit, fromId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, toId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = 'ADMIN_KRYV'").bind(taxAmount),
    env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'TRANSFER')").bind(fromId, amount, appId),
    // LOGGING SYSTEM
    env.DB.prepare("INSERT INTO system_logs (app_id, amount, tax_collected) VALUES (?, ?, ?)").bind(appId, amount, taxAmount)
  ]);
  
  return Response.json({ success: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
};

export const handleAdminAction = async (request: Request, env: any) => {
  const { action, targetId, amount } = await request.json();
  await env.DB.prepare("INSERT OR IGNORE INTO users (id, balance) VALUES (?, 0)").bind(targetId).run();

  if (action === "OVERRIDE") {
    await env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, targetId).run();
    return Response.json({ success: true, message: "NEURAL_BALANCE_MODIFIED" });
  }
  if (action === "BAN") {
    await env.DB.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").bind(targetId).run();
    return Response.json({ success: true, message: "USER_BANNED" });
  }
  return Response.json({ success: false }, { status: 400 });
};

// New Analytics Handler
export const handleAnalytics = async (env: any) => {
  const { results } = await env.DB.prepare("SELECT app_id, SUM(tax_collected) as total_tax, COUNT(*) as tx_count FROM system_logs GROUP BY app_id").bind().all();
  return Response.json({ analytics: results }, { headers: { "Access-Control-Allow-Origin": "*" } });
};
