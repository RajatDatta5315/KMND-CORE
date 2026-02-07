export const handleHistory = async (url: URL, env: any) => {
  const userId = url.searchParams.get("userId");
  const { results } = await env.DB.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10").bind(userId).all();
  return Response.json({ transactions: results }, { headers: { "Access-Control-Allow-Origin": "*" } });
};

export const handleLeaderboard = async (env: any) => {
  const { results } = await env.DB.prepare("SELECT id, balance FROM users WHERE is_banned = 0 ORDER BY balance DESC LIMIT 10").bind().all();
  return Response.json({ leaders: results }, { headers: { "Access-Control-Allow-Origin": "*" } });
};

export const handleTransfer = async (request: Request, env: any) => {
  const { fromId, toId, amount, appId } = await request.json();
  const sender = await env.DB.prepare("SELECT balance, is_banned FROM users WHERE id = ?").bind(fromId).first();
  
  if (!sender || sender.is_banned) return Response.json({ success: false, error: "ACCESS_DENIED" }, { status: 403 });
  if (sender.balance < amount) return Response.json({ success: false, error: "LOW_ENERGY" }, { status: 400 });

  const burnAmount = amount * 0.01; 
  const adminAmount = amount * 0.01; 
  const finalDebit = amount + burnAmount + adminAmount;

  await env.DB.batch([
    env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(finalDebit, fromId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, toId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = 'ADMIN_KRYV'").bind(adminAmount),
    env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'TRANSFER')").bind(fromId, amount, appId)
  ]);
  return Response.json({ success: true });
};

// --- ADMIN ONLY ENDPOINTS ---
export const handleAdminAction = async (request: Request, env: any) => {
  const { action, targetId, amount } = await request.json();
  
  if (action === "OVERRIDE") {
    await env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, targetId).run();
    return Response.json({ success: true, message: "BALANCE_ALTERED" });
  }

  if (action === "BAN") {
    await env.DB.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").bind(targetId).run();
    return Response.json({ success: true, message: "USER_RESTRICTED" });
  }

  if (action === "UNBAN") {
    await env.DB.prepare("UPDATE users SET is_banned = 0 WHERE id = ?").bind(targetId).run();
    return Response.json({ success: true, message: "USER_RESTORED" });
  }

  return Response.json({ success: false }, { status: 400 });
};
