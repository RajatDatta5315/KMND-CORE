/**
 * ⟁ KMND UNIVERSAL BRIDGE SDK v1.0
 * Connect any app to the KRYV Ecosystem
 */
const KMND = {
  gateway: "https://kmnd-core.rajat.workers.dev",

  // Check Balance
  async getBalance(userId) {
    const res = await fetch(`${this.gateway}/history?userId=${userId}`);
    const data = await res.json();
    return data.balance || 0;
  },

  // Initiate Payment (User to App/Seller)
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

  // Universal Transfer (P2P with 2% Tax)
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

window.KMND = KMND; // Global availability
