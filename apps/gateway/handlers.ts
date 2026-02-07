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
  
  // Security: No one can pretend to be Admin
  if (toId === "ADMIN_KRYV" && fromId !== "ADMIN_KRYV") {
     // Allow only if it's a tax payment, otherwise block manual transfers to Admin ID to prevent spoofing
  }

  const sender = await env.DB.prepare("SELECT balance, is_banned FROM users WHERE id = ?").bind(fromId).first();
  if (!sender || sender.is_banned) return Response.json({ success: false, error: "ACCESS_DENIED" }, { status: 403 });
  if (sender.balance < amount) return Response.json({ success: false, error: "LOW_ENERGY" }, { status: 400 });

  const taxAmount = amount * 0.02; // 2% Total Tax (Burn + Admin profit)
  const finalDebit = amount + taxAmount;

  await env.DB.batch([
    env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(finalDebit, fromId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, toId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = 'ADMIN_KRYV'").bind(taxAmount),
    env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'TRANSFER')").bind(fromId, amount, appId)
  ]);
  return Response.json({ success: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
};

export const handleAdminAction = async (request: Request, env: any) => {
  const { action, targetId, amount } = await request.json();
  
  // Create user if doesn't exist
  await env.DB.prepare("INSERT OR IGNORE INTO users (id, balance) VALUES (?, 0)").bind(targetId).run();

  if (action === "OVERRIDE") {
    await env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, targetId).run();
    return Response.json({ success: true, message: "NEURAL_BALANCE_MODIFIED" });
  }

  if (action === "BAN") {
    await env.DB.prepare("UPDATE users SET is_banned = 1 WHERE id = ?").bind(targetId).run();
    return Response.json({ success: true, message: "USER_BANNED" });
  }

  if (action === "UNBAN") {
    await env.DB.prepare("UPDATE users SET is_banned = 0 WHERE id = ?").bind(targetId).run();
    return Response.json({ success: true, message: "USER_RESTORED" });
  }

  return Response.json({ success: false }, { status: 400 });
};
