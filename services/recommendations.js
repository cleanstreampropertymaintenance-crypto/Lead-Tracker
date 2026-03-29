const metaAPI = require('./meta-api');
const { loadRules } = require('./optimizer');

async function generateRecommendations() {
  const rules = loadRules();
  const recommendations = [];

  let ads, adsets;
  try {
    ads = await metaAPI.getAds();
    adsets = await metaAPI.getAdSets();
  } catch (err) {
    return [{ type: 'error', priority: 'high', message: `Could not fetch ad data: ${err.message}`, affectedAds: [] }];
  }

  const activeAds = ads.filter(a => a.status === 'ACTIVE' && a.insights);
  const activeAdsets = adsets.filter(a => a.status === 'ACTIVE' && a.insights);

  // 1. Creative fatigue detection (high frequency)
  for (const ad of activeAds) {
    const freq = parseFloat(ad.insights.frequency || 0);
    if (freq >= rules.creativeRules.fatigueFrequencyThreshold) {
      recommendations.push({
        type: 'creative_refresh',
        priority: 'high',
        message: `"${ad.name}" has frequency ${freq.toFixed(1)} - your audience is seeing this ad too many times. Create a new version with fresh imagery or copy.`,
        affectedAds: [{ id: ad.id, name: ad.name }],
        actionable: false
      });
    }
  }

  // 2. Low CTR detection
  if (activeAds.length >= 2) {
    const ctrs = activeAds.map(a => parseFloat(a.insights.ctr || 0));
    const avgCTR = ctrs.reduce((s, c) => s + c, 0) / ctrs.length;
    const threshold = avgCTR * (rules.creativeRules.lowCTRPercentOfAvg / 100);

    for (const ad of activeAds) {
      const ctr = parseFloat(ad.insights.ctr || 0);
      if (ctr < threshold && ctr > 0) {
        recommendations.push({
          type: 'pause_low_performer',
          priority: 'medium',
          message: `"${ad.name}" CTR is ${ctr.toFixed(2)}% vs account avg ${avgCTR.toFixed(2)}%. Consider pausing this ad.`,
          affectedAds: [{ id: ad.id, name: ad.name }],
          actionable: true,
          action: { type: 'pause_ad', adId: ad.id }
        });
      }
    }
  }

  // 3. Format performance analysis
  const formatGroups = {};
  for (const ad of activeAds) {
    const creative = ad.creative || {};
    let format = 'image';
    if (creative.object_story_spec) {
      const spec = creative.object_story_spec;
      if (spec.video_data) format = 'video';
      else if (spec.template_data && spec.template_data.child_attachments) format = 'carousel';
    }
    if (!formatGroups[format]) formatGroups[format] = [];
    formatGroups[format].push(ad);
  }

  if (Object.keys(formatGroups).length >= 2) {
    const formatStats = {};
    for (const [format, fAds] of Object.entries(formatGroups)) {
      const cpls = fAds.map(a => metaAPI.extractCPL(a.insights)).filter(c => c !== null);
      const ctrs = fAds.map(a => parseFloat(a.insights.ctr || 0));
      formatStats[format] = {
        count: fAds.length,
        avgCPL: cpls.length > 0 ? cpls.reduce((s, c) => s + c, 0) / cpls.length : null,
        avgCTR: ctrs.reduce((s, c) => s + c, 0) / ctrs.length
      };
    }

    const sortedFormats = Object.entries(formatStats)
      .filter(([, s]) => s.avgCPL !== null)
      .sort((a, b) => a[1].avgCPL - b[1].avgCPL);

    if (sortedFormats.length >= 2) {
      const best = sortedFormats[0];
      const worst = sortedFormats[sortedFormats.length - 1];
      if (best[1].avgCPL < worst[1].avgCPL * 0.7) {
        recommendations.push({
          type: 'format_recommendation',
          priority: 'medium',
          message: `${best[0].charAt(0).toUpperCase() + best[0].slice(1)} ads have ${((1 - best[1].avgCPL / worst[1].avgCPL) * 100).toFixed(0)}% lower CPL than ${worst[0]} ads ($${best[1].avgCPL.toFixed(2)} vs $${worst[1].avgCPL.toFixed(2)}). Create more ${best[0]} content.`,
          affectedAds: [],
          actionable: false
        });
      }
    }
  }

  // 4. Zero-lead ads spending money
  for (const ad of activeAds) {
    const spend = parseFloat(ad.insights.spend || 0);
    const leads = metaAPI.extractLeads(ad.insights);
    if (leads === 0 && spend >= rules.budgetRules.pauseZeroLeadsSpend) {
      recommendations.push({
        type: 'pause_no_leads',
        priority: 'high',
        message: `"${ad.name}" has spent $${spend.toFixed(2)} with 0 leads. Pause and redirect budget.`,
        affectedAds: [{ id: ad.id, name: ad.name }],
        actionable: true,
        action: { type: 'pause_ad', adId: ad.id }
      });
    }
  }

  // 5. Budget reallocation suggestions
  const winners = activeAdsets.filter(a => {
    const cpl = metaAPI.extractCPL(a.insights);
    return cpl !== null && cpl < rules.targetCPL;
  });
  const losers = activeAdsets.filter(a => {
    const cpl = metaAPI.extractCPL(a.insights);
    return cpl !== null && cpl > rules.targetCPL * rules.budgetRules.decreaseCPLMultiplier;
  });

  if (winners.length > 0 && losers.length > 0) {
    const loserBudget = losers.reduce((s, a) => s + parseInt(a.daily_budget || 0, 10), 0);
    const savingsPerDay = (loserBudget * rules.budgetRules.loserDecrease / 100).toFixed(2);
    recommendations.push({
      type: 'budget_reallocation',
      priority: 'high',
      message: `${winners.length} winning ad set(s) could use more budget. Shift spend from ${losers.length} underperforming ad set(s) to maximize leads.`,
      affectedAds: [...winners.map(a => ({ id: a.id, name: a.name, role: 'winner' })), ...losers.map(a => ({ id: a.id, name: a.name, role: 'loser' }))],
      actionable: true,
      action: { type: 'run_optimizer' }
    });
  }

  // 6. Top performing creative callout
  const adsWithCPL = activeAds
    .map(a => ({ ...a, cpl: metaAPI.extractCPL(a.insights) }))
    .filter(a => a.cpl !== null)
    .sort((a, b) => a.cpl - b.cpl);

  if (adsWithCPL.length >= 3) {
    const best = adsWithCPL[0];
    const creative = best.creative || {};
    recommendations.push({
      type: 'top_creative',
      priority: 'low',
      message: `Your best performing ad is "${best.name}" at $${best.cpl.toFixed(2)} CPL. Create similar variations of this creative to scale results.`,
      affectedAds: [{ id: best.id, name: best.name }],
      actionable: false,
      creativeDetails: {
        title: creative.title || '',
        body: creative.body || '',
        imageUrl: creative.image_url || creative.thumbnail_url || ''
      }
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  return recommendations;
}

module.exports = { generateRecommendations };
