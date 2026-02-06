export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === "/pay" && request.method === "POST") {
      const { amount, appId, userId } = await request.json();

      // 1. Check Balance
      const user = await env.DB.prepare("SELECT balance FROM users WHERE id = ?").bind(userId).first();
      
      if (!user || user.balance < amount) {
        return new Response(JSON.stringify({ success: false, error: "Insufficient ⟁KMND" }), { status: 400 });
      }

      // 2. Atomic Transaction (Deduct & Log)
      await env.DB.batch([
        env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(amount, userId),
        env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'SPEND')").bind(userId, amount, appId)
      ]);

      return new Response(JSON.stringify({ success: true }));
    }

    return new Response("KRYV GATEWAY LIVE");
  },
};
