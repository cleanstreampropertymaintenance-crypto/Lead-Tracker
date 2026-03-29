const API = {
  async get(path) {
    const res = await fetch(`/api${path}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  // Meta Ads endpoints
  getCampaigns() { return this.get('/meta/campaigns'); },
  getAdSets() { return this.get('/meta/adsets'); },
  getAds() { return this.get('/meta/ads'); },
  getRecommendations() { return this.get('/meta/recommendations'); },

  updateBudget(adsetId, dailyBudget) {
    return this.post(`/meta/adsets/${adsetId}/budget`, { daily_budget: dailyBudget });
  },
  updateAdSetStatus(adsetId, status) {
    return this.post(`/meta/adsets/${adsetId}/status`, { status });
  },
  updateAdStatus(adId, status) {
    return this.post(`/meta/ads/${adId}/status`, { status });
  },
  runOptimize() { return this.post('/meta/optimize', {}); },

  // Config endpoints
  getConfig() { return this.get('/config'); },
  updateConfig(config) { return this.post('/config', config); }
};
