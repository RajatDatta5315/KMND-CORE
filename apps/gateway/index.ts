import { handleHistory, handleLeaderboard, handleTransfer, handleAdminAction } from './handlers';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Handling
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Routes
    if (url.pathname === "/pay" && method === "POST") {
      const { amount, appId, userId } = await request.json();
      const user = await env.DB.prepare("SELECT balance, is_banned FROM users WHERE id = ?").bind(userId).first();
      
      if (!user || user.is_banned) return Response.json({ error: "UNAUTHORIZED_OR_BANNED" }, { status: 403 });
      if (user.balance < amount) return Response.json({ error: "INSUFFICIENT_KMND" }, { status: 400 });

      await env.DB.batch([
        env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(amount, userId),
        env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'SPEND')").bind(userId, amount, appId)
      ]);
      return Response.json({ success: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (url.pathname === "/transfer" && method === "POST") return handleTransfer(request, env);
    if (url.pathname === "/admin-action" && method === "POST") return handleAdminAction(request, env);
    if (url.pathname === "/history") return handleHistory(url, env);
    if (url.pathname === "/leaderboard") return handleLeaderboard(env);

    return new Response("⟁KMND_GATEWAY_V1_READY", { status: 200 });
  },
};
