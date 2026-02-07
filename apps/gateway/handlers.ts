export const handleHistory = async (url: URL, env: any) => {
  const userId = url.searchParams.get("userId");
  const { results } = await env.DB.prepare(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10"
  ).bind(userId).all();
  return new Response(JSON.stringify({ transactions: results }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
};

export const handleLeaderboard = async (env: any) => {
  const { results } = await env.DB.prepare(
    "SELECT id, balance FROM users ORDER BY balance DESC LIMIT 5"
  ).bind().all();
  return new Response(JSON.stringify({ leaders: results }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
};
