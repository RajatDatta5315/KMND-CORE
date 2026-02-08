/**
 * ⟁ KMND UNIVERSAL BRIDGE SDK v1.1
 * Dynamic Ecosystem Integration
 */
const KMND = {
  // Points to your Vercel rewrite path
  gateway: "/api/gateway",

  async getBalance(userId) {
    try {
      const res = await fetch(`${this.gateway}/history?userId=${userId}`);
      const data = await res.json();
      return data.balance || 0;
    } catch (e) { return 0; }
  },

  async pay(userId, amount, appId) {
    try {
      const res = await fetch(`${this.gateway}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, appId })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: "GATEWAY_OFFLINE" };
    }
  },

  async transfer(fromId, toId, amount, appId) {
    try {
      const res = await fetch(`${this.gateway}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId, toId, amount, appId })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: "BRIDGE_DISCONNECTED" };
    }
  }
};

window.KMND = KMND;
