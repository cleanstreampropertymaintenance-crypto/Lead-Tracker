const metaAPI = require('./meta-api');
const fs = require('fs');
const path = require('path');

function loadRules() {
  const configPath = path.join(__dirname, '..', 'config', 'default-rules.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function normalize(values) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map(v => (v - min) / (max - min));
}

function scoreAdSets(adsets, rules) {
  const eligible = adsets.filter(a => {
    if (!a.insights) return false;
    const spend = parseFloat(a.insights.spend || 0);
    const impressions = parseInt(a.insights.impressions || 0, 10);
    return spend >= rules.minSpendBeforeEval && impressions >= rules.minImpressions;
  });

  if (eligible.length === 0) return [];

  const ctrs = eligible.map(a => parseFloat(a.insights.ctr || 0));
  const cpls = eligible.map(a => {
    const cpl = metaAPI.extractCPL(a.insights);
    return cpl || 999;
  });
  const cplInverses = cpls.map(c => c > 0 ? 1 / c : 0);
  const roases = eligible.map(a => metaAPI.extractROAS(a.insights) || 0);
  const cpcs = eligible.map(a => parseFloat(a.insights.cpc || 0));

  const nCTR = normalize(ctrs);
  const nCPLInv = normalize(cplInverses);
  const nROAS = normalize(roases);
  const nCPC = normalize(cpcs);

  const w = rules.scoring;

  return eligible.map((adset, i) => {
    const score = (w.ctrWeight * nCTR[i]) +
                  (w.cplInverseWeight * nCPLInv[i]) +
                  (w.roasWeight * nROAS[i]) -
                  (w.cpcPenalty * nCPC[i]);

    const cpl = cpls[i];
    let classification;
    if (cpl > rules.targetCPL * rules.budgetRules.pauseCPLMultiplier) {
      classification = 'loser';
    } else if (cpl < rules.targetCPL) {
      classification = 'winner';
    } else {
      classification = 'average';
    }

    return {
      ...adset,
      score,
      cpl,
      classification
    };
  }).sort((a, b) => b.score - a.score);
}

function generateBudgetActions(scored, rules) {
  const actions = [];
  const br = rules.budgetRules;

  for (const adset of scored) {
    const currentBudget = parseInt(adset.daily_budget || 0, 10);
    if (currentBudget === 0) continue;

    const spend = parseFloat(adset.insights.spend || 0);
    const leads = metaAPI.extractLeads(adset.insights);

    if (adset.classification === 'winner' && adset.cpl < rules.targetCPL) {
      const newBudget = Math.min(
        Math.round(currentBudget * (1 + br.winnerIncrease)),
        Math.round(currentBudget * br.maxBudgetMultiplier)
      );
      if (newBudget > currentBudget) {
        actions.push({
          type: 'increase_budget',
          adsetId: adset.id,
          adsetName: adset.name,
          currentBudget,
          newBudget,
          reason: `Winner: CPL $${adset.cpl.toFixed(2)} is below target $${rules.targetCPL}`,
          priority: 'high'
        });
      }
    }

    if (adset.classification === 'loser') {
      if (adset.cpl > rules.targetCPL * br.pauseCPLMultiplier) {
        actions.push({
          type: 'pause',
          adsetId: adset.id,
          adsetName: adset.name,
          reason: `CPL $${adset.cpl.toFixed(2)} is ${br.pauseCPLMultiplier}x above target`,
          priority: 'high'
        });
      } else if (adset.cpl > rules.targetCPL * br.decreaseCPLMultiplier) {
        const newBudget = Math.max(
          Math.round(currentBudget * (1 - br.loserDecrease)),
          br.minDailyBudgetCents
        );
        if (newBudget < currentBudget) {
          actions.push({
            type: 'decrease_budget',
            adsetId: adset.id,
            adsetName: adset.name,
            currentBudget,
            newBudget,
            reason: `CPL $${adset.cpl.toFixed(2)} is ${br.decreaseCPLMultiplier}x above target`,
            priority: 'medium'
          });
        }
      }
    }

    if (leads === 0 && spend >= br.pauseZeroLeadsSpend) {
      actions.push({
        type: 'pause',
        adsetId: adset.id,
        adsetName: adset.name,
        reason: `$${spend.toFixed(2)} spent with 0 leads`,
        priority: 'high'
      });
    }
  }

  return actions;
}

async function runOptimization(applyChanges = false) {
  const rules = loadRules();
  const adsets = await metaAPI.getAdSets();
  const activeAdsets = adsets.filter(a => a.status === 'ACTIVE');
  const scored = scoreAdSets(activeAdsets, rules);
  const budgetActions = generateBudgetActions(scored, rules);

  const results = {
    timestamp: new Date().toISOString(),
    adsetCount: activeAdsets.length,
    scored: scored.map(s => ({
      id: s.id,
      name: s.name,
      score: s.score.toFixed(3),
      classification: s.classification,
      cpl: s.cpl,
      spend: s.insights ? s.insights.spend : '0',
      ctr: s.insights ? s.insights.ctr : '0'
    })),
    actions: budgetActions,
    applied: false
  };

  if (applyChanges && budgetActions.length > 0) {
    const applied = [];
    for (const action of budgetActions) {
      try {
        if (action.type === 'increase_budget' || action.type === 'decrease_budget') {
          await metaAPI.updateBudget(action.adsetId, action.newBudget);
          applied.push({ ...action, success: true });
        } else if (action.type === 'pause') {
          await metaAPI.updateStatus(action.adsetId, 'PAUSED');
          applied.push({ ...action, success: true });
        }
      } catch (err) {
        applied.push({ ...action, success: false, error: err.message });
      }
    }
    results.actions = applied;
    results.applied = true;
  }

  // Save to action log
  const logPath = path.join(__dirname, '..', 'config', 'optimize-log.json');
  let log = [];
  try { log = JSON.parse(fs.readFileSync(logPath, 'utf-8')); } catch {}
  log.unshift(results);
  if (log.length > 100) log = log.slice(0, 100);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  return results;
}

function getOptimizeLog() {
  const logPath = path.join(__dirname, '..', 'config', 'optimize-log.json');
  try { return JSON.parse(fs.readFileSync(logPath, 'utf-8')); } catch { return []; }
}

module.exports = { loadRules, scoreAdSets, generateBudgetActions, runOptimization, getOptimizeLog };
