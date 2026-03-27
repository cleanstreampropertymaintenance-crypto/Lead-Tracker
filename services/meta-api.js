const META_BASE = 'https://graph.facebook.com/v21.0';

function getToken() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token || token === 'your_meta_access_token_here') {
    throw new Error('META_ACCESS_TOKEN not configured. See .env.example for setup instructions.');
  }
  return token;
}

function getAccountId() {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id || id === 'act_your_ad_account_id_here') {
    throw new Error('META_AD_ACCOUNT_ID not configured. See .env.example for setup instructions.');
  }
  return id;
}

async function metaFetch(endpoint, options = {}) {
  const token = getToken();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${META_BASE}${endpoint}${separator}access_token=${token}`;

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json();
  if (data.error) {
    const msg = data.error.message || 'Meta API error';
    const err = new Error(msg);
    err.statusCode = data.error.code;
    throw err;
  }
  return data;
}

async function getCampaigns() {
  const accountId = getAccountId();
  const fields = 'name,status,objective,daily_budget,lifetime_budget,budget_remaining';
  const campaigns = await metaFetch(`/${accountId}/campaigns?fields=${fields}&limit=50`);

  const withInsights = await Promise.all(
    (campaigns.data || []).map(async (campaign) => {
      try {
        const insights = await getInsights(campaign.id, 'last_7d');
        return { ...campaign, insights: insights[0] || null };
      } catch {
        return { ...campaign, insights: null };
      }
    })
  );

  return withInsights;
}

async function getAdSets(campaignId) {
  const accountId = getAccountId();
  const fields = 'name,status,daily_budget,lifetime_budget,budget_remaining,optimization_goal,campaign_id,targeting';
  const endpoint = campaignId
    ? `/${campaignId}/adsets?fields=${fields}&limit=100`
    : `/${accountId}/adsets?fields=${fields}&limit=100`;
  const adsets = await metaFetch(endpoint);

  const withInsights = await Promise.all(
    (adsets.data || []).map(async (adset) => {
      try {
        const insights = await getInsights(adset.id, 'last_7d');
        return { ...adset, insights: insights[0] || null };
      } catch {
        return { ...adset, insights: null };
      }
    })
  );

  return withInsights;
}

async function getAds(adsetId) {
  const accountId = getAccountId();
  const fields = 'name,status,creative{id,thumbnail_url,body,title,image_url,object_story_spec},adset_id,campaign_id';
  const endpoint = adsetId
    ? `/${adsetId}/ads?fields=${fields}&limit=100`
    : `/${accountId}/ads?fields=${fields}&limit=100`;
  const ads = await metaFetch(endpoint);

  const withInsights = await Promise.all(
    (ads.data || []).map(async (ad) => {
      try {
        const insights = await getInsights(ad.id, 'last_7d');
        return { ...ad, insights: insights[0] || null };
      } catch {
        return { ...ad, insights: null };
      }
    })
  );

  return withInsights;
}

async function getInsights(objectId, datePreset = 'last_7d') {
  const fields = 'impressions,reach,clicks,ctr,cpc,spend,actions,cost_per_action_type,frequency,conversions,purchase_roas';
  const data = await metaFetch(`/${objectId}/insights?fields=${fields}&date_preset=${datePreset}`);
  return data.data || [];
}

async function getInsightsByDay(objectId, datePreset = 'last_7d') {
  const fields = 'impressions,reach,clicks,ctr,cpc,spend,actions,cost_per_action_type,frequency';
  const data = await metaFetch(`/${objectId}/insights?fields=${fields}&date_preset=${datePreset}&time_increment=1`);
  return data.data || [];
}

async function updateBudget(adsetId, dailyBudgetCents) {
  return metaFetch(`/${adsetId}`, {
    method: 'POST',
    body: { daily_budget: dailyBudgetCents }
  });
}

async function updateStatus(objectId, status) {
  if (!['ACTIVE', 'PAUSED'].includes(status)) {
    throw new Error('Status must be ACTIVE or PAUSED');
  }
  return metaFetch(`/${objectId}`, {
    method: 'POST',
    body: { status }
  });
}

function extractLeads(insights) {
  if (!insights) return 0;
  const actions = insights.actions || [];
  const leadAction = actions.find(a =>
    a.action_type === 'lead' ||
    a.action_type === 'offsite_conversion.fb_pixel_lead' ||
    a.action_type === 'onsite_conversion.lead_grouped'
  );
  return leadAction ? parseInt(leadAction.value, 10) : 0;
}

function extractCPL(insights) {
  if (!insights) return null;
  const costs = insights.cost_per_action_type || [];
  const leadCost = costs.find(c =>
    c.action_type === 'lead' ||
    c.action_type === 'offsite_conversion.fb_pixel_lead' ||
    c.action_type === 'onsite_conversion.lead_grouped'
  );
  return leadCost ? parseFloat(leadCost.value) : null;
}

function extractROAS(insights) {
  if (!insights) return null;
  const roas = insights.purchase_roas;
  if (roas && roas.length > 0) return parseFloat(roas[0].value);
  return null;
}

module.exports = {
  getCampaigns,
  getAdSets,
  getAds,
  getInsights,
  getInsightsByDay,
  updateBudget,
  updateStatus,
  extractLeads,
  extractCPL,
  extractROAS
};
