export const handleTransfer = async (request: Request, env: any) => {
  const { fromId, toId, amount, appId } = await request.json();

  // 1. Check Sender Balance
  const sender = await env.DB.prepare("SELECT balance FROM users WHERE id = ?").bind(fromId).first();
  if (!sender || sender.balance < amount) {
    return new Response(JSON.stringify({ success: false, error: "Low Energy" }), { status: 400 });
  }

  // 2. Atomic Transfer: Deduct from A, Add to B
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(amount, fromId),
    env.DB.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").bind(amount, toId),
    env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'TRANSFER_OUT')").bind(fromId, amount, appId),
    env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'TRANSFER_IN')").bind(toId, amount, appId)
  ]);

  return new Response(JSON.stringify({ success: true }));
};
