const express = require('express');
const router = express.Router();
const metaAPI = require('../services/meta-api');
const { runOptimization, getOptimizeLog } = require('../services/optimizer');
const { generateRecommendations } = require('../services/recommendations');

router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await metaAPI.getCampaigns();
    const formatted = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      dailyBudget: c.daily_budget ? (parseInt(c.daily_budget, 10) / 100).toFixed(2) : null,
      lifetimeBudget: c.lifetime_budget ? (parseInt(c.lifetime_budget, 10) / 100).toFixed(2) : null,
      insights: c.insights ? {
        spend: c.insights.spend,
        impressions: c.insights.impressions,
        reach: c.insights.reach,
        clicks: c.insights.clicks,
        ctr: c.insights.ctr,
        cpc: c.insights.cpc,
        frequency: c.insights.frequency,
        leads: metaAPI.extractLeads(c.insights),
        cpl: metaAPI.extractCPL(c.insights),
        roas: metaAPI.extractROAS(c.insights)
      } : null
    }));
    res.json({ campaigns: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/adsets', async (req, res) => {
  try {
    const adsets = await metaAPI.getAdSets(req.query.campaign_id);
    const formatted = adsets.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      campaignId: a.campaign_id,
      dailyBudget: a.daily_budget ? (parseInt(a.daily_budget, 10) / 100).toFixed(2) : null,
      dailyBudgetCents: a.daily_budget ? parseInt(a.daily_budget, 10) : null,
      optimizationGoal: a.optimization_goal,
      insights: a.insights ? {
        spend: a.insights.spend,
        impressions: a.insights.impressions,
        clicks: a.insights.clicks,
        ctr: a.insights.ctr,
        cpc: a.insights.cpc,
        frequency: a.insights.frequency,
        leads: metaAPI.extractLeads(a.insights),
        cpl: metaAPI.extractCPL(a.insights),
        roas: metaAPI.extractROAS(a.insights)
      } : null
    }));
    res.json({ adsets: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/adsets/:id/budget', async (req, res) => {
  try {
    const { daily_budget } = req.body;
    if (!daily_budget || daily_budget < 100) {
      return res.status(400).json({ error: 'daily_budget must be at least 100 (cents)' });
    }
    await metaAPI.updateBudget(req.params.id, daily_budget);
    res.json({ success: true, adsetId: req.params.id, newBudget: daily_budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/adsets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await metaAPI.updateStatus(req.params.id, status);
    res.json({ success: true, adsetId: req.params.id, newStatus: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ads', async (req, res) => {
  try {
    const ads = await metaAPI.getAds(req.query.adset_id);
    const formatted = ads.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      adsetId: a.adset_id,
      campaignId: a.campaign_id,
      creative: a.creative ? {
        id: a.creative.id,
        title: a.creative.title || '',
        body: a.creative.body || '',
        imageUrl: a.creative.image_url || a.creative.thumbnail_url || '',
        thumbnailUrl: a.creative.thumbnail_url || ''
      } : null,
      insights: a.insights ? {
        spend: a.insights.spend,
        impressions: a.insights.impressions,
        clicks: a.insights.clicks,
        ctr: a.insights.ctr,
        cpc: a.insights.cpc,
        frequency: a.insights.frequency,
        leads: metaAPI.extractLeads(a.insights),
        cpl: metaAPI.extractCPL(a.insights),
        roas: metaAPI.extractROAS(a.insights)
      } : null
    }));
    res.json({ ads: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ads/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await metaAPI.updateStatus(req.params.id, status);
    res.json({ success: true, adId: req.params.id, newStatus: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations', async (req, res) => {
  try {
    const recs = await generateRecommendations();
    res.json({ recommendations: recs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/optimize', async (req, res) => {
  try {
    const apply = req.body.apply === true;
    const results = await runOptimization(apply);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/optimize/log', async (req, res) => {
  try {
    const log = getOptimizeLog();
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
