import { handleHistory, handleLeaderboard, handleTransfer, handleAdminAction, handleAnalytics } from './handlers';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      if (url.pathname === "/pay" && method === "POST") {
        const { amount, appId, userId } = await request.json();
        const user = await env.DB.prepare("SELECT balance, is_banned FROM users WHERE id = ?").bind(userId).first();
        if (!user || user.is_banned) return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: corsHeaders });
        
        await env.DB.batch([
          env.DB.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").bind(amount, userId),
          env.DB.prepare("INSERT INTO transactions (user_id, amount, app_id, action_type) VALUES (?, ?, ?, 'SPEND')").bind(userId, amount, appId)
        ]);
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (url.pathname === "/transfer") return handleTransfer(request, env);
      if (url.pathname === "/admin-action") return handleAdminAction(request, env);
      if (url.pathname === "/history") return handleHistory(url, env);
      if (url.pathname === "/leaderboard") return handleLeaderboard(env);
      if (url.pathname === "/analytics") return handleAnalytics(env); // Added this

      return new Response("⟁ KMND_GATEWAY_V1.1_DYNAMIC", { status: 200 });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
  },
};
