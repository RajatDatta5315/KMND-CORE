window.KMND = {
  pay: async (amount, appId, userId) => {
    try {
      const response = await fetch('https://kmnd-core.YOUR_SUBDOMAIN.workers.dev/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, appId, userId })
      });
      return await response.json();
    } catch (e) {
      return { success: false, error: "Network Error" };
    }
  }
};
