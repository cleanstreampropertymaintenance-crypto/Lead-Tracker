const AdsManager = (() => {
  let adsState = {
    loading: false,
    error: null,
    campaigns: [],
    adsets: [],
    ads: [],
    recommendations: [],
    config: null,
    expandedCampaigns: {},
    activeSection: 'overview',
    confirmAction: null,
    optimizeLog: []
  };

  let initialized = false;

  function setAdsState(updates) {
    Object.assign(adsState, updates);
    renderAds();
  }

  async function init() {
    if (initialized && adsState.campaigns.length > 0) {
      renderAds();
      return;
    }
    initialized = true;
    await loadData();
  }

  async function loadData() {
    setAdsState({ loading: true, error: null });
    try {
      const [campRes, adsetRes, adsRes, recsRes, config] = await Promise.all([
        API.getCampaigns(),
        API.getAdSets(),
        API.getAds(),
        API.getRecommendations(),
        API.getConfig()
      ]);
      setAdsState({
        loading: false,
        campaigns: campRes.campaigns || [],
        adsets: adsetRes.adsets || [],
        ads: adsRes.ads || [],
        recommendations: recsRes.recommendations || [],
        config
      });
    } catch (err) {
      setAdsState({ loading: false, error: err.message });
    }
  }

  function fmtMoney(val) {
    if (val === null || val === undefined) return '--';
    return '$' + parseFloat(val).toFixed(2);
  }

  function fmtNum(val) {
    if (val === null || val === undefined) return '--';
    return parseInt(val, 10).toLocaleString();
  }

  function fmtPct(val) {
    if (val === null || val === undefined) return '--';
    return parseFloat(val).toFixed(2) + '%';
  }

  function getTotals() {
    let spend = 0, leads = 0, clicks = 0, impressions = 0;
    for (const c of adsState.campaigns) {
      if (!c.insights) continue;
      spend += parseFloat(c.insights.spend || 0);
      leads += c.insights.leads || 0;
      clicks += parseInt(c.insights.clicks || 0, 10);
      impressions += parseInt(c.insights.impressions || 0, 10);
    }
    const cpl = leads > 0 ? spend / leads : null;
    const ctr = impressions > 0 ? (clicks / impressions * 100) : null;
    const cpc = clicks > 0 ? spend / clicks : null;
    return { spend, leads, clicks, impressions, cpl, ctr, cpc };
  }

  function renderMetrics() {
    const t = getTotals();
    const cplClass = t.cpl !== null ? (t.cpl <= (adsState.config?.targetCPL || 25) ? 'positive' : 'negative') : '';
    return `
      <div class="metrics-row">
        <div class="metric-card"><div class="metric-label">Spend (7d)</div><div class="metric-value">${fmtMoney(t.spend)}</div></div>
        <div class="metric-card"><div class="metric-label">Leads (7d)</div><div class="metric-value positive">${t.leads}</div></div>
        <div class="metric-card"><div class="metric-label">Cost/Lead</div><div class="metric-value ${cplClass}">${fmtMoney(t.cpl)}</div></div>
        <div class="metric-card"><div class="metric-label">CTR</div><div class="metric-value">${fmtPct(t.ctr)}</div></div>
        <div class="metric-card"><div class="metric-label">CPC</div><div class="metric-value">${fmtMoney(t.cpc)}</div></div>
        <div class="metric-card"><div class="metric-label">Impressions</div><div class="metric-value">${fmtNum(t.impressions)}</div></div>
      </div>`;
  }

  function renderCampaigns() {
    if (adsState.campaigns.length === 0) {
      return '<div class="card card-empty">No campaigns found</div>';
    }
    return adsState.campaigns.map(c => {
      const expanded = adsState.expandedCampaigns[c.id];
      const campAdsets = adsState.adsets.filter(a => a.campaignId === c.id);
      const statusColor = c.status === 'ACTIVE' ? '#10B981' : c.status === 'PAUSED' ? '#F59E0B' : '#64748B';

      let adsetsHTML = '';
      if (expanded) {
        if (campAdsets.length === 0) {
          adsetsHTML = '<div style="padding:14px;color:#475569;font-size:13px">No ad sets</div>';
        } else {
          adsetsHTML = campAdsets.map(a => {
            const ins = a.insights || {};
            const isActive = a.status === 'ACTIVE';
            return `
              <div class="adset-row">
                <div class="adset-info">
                  <div class="adset-name">${a.name}</div>
                  <div class="adset-meta">
                    <span>Spend: ${fmtMoney(ins.spend)}</span>
                    <span>Leads: ${ins.leads || 0}</span>
                    <span>CPL: ${fmtMoney(ins.cpl)}</span>
                    <span>CTR: ${fmtPct(ins.ctr)}</span>
                  </div>
                </div>
                <div class="adset-controls">
                  <button class="budget-btn" onclick="AdsManager.adjustBudget('${a.id}',${a.dailyBudgetCents},-500)">-</button>
                  <div class="budget-display">${fmtMoney(a.dailyBudget)}/d</div>
                  <button class="budget-btn" onclick="AdsManager.adjustBudget('${a.id}',${a.dailyBudgetCents},500)">+</button>
                  <label class="toggle-switch">
                    <input type="checkbox" ${isActive ? 'checked' : ''} onchange="AdsManager.toggleAdSet('${a.id}',this.checked)">
                    <div class="toggle-track"></div>
                    <div class="toggle-knob"></div>
                  </label>
                </div>
              </div>`;
          }).join('');
        }
      }

      return `
        <div class="campaign-card">
          <div class="campaign-header" onclick="AdsManager.toggleCampaign('${c.id}')">
            <div>
              <div class="campaign-name">
                <span class="badge" style="background:${statusColor}22;color:${statusColor};margin-right:6px">${c.status}</span>
                ${c.name}
              </div>
              <div class="campaign-objective">${c.objective || ''} ${c.dailyBudget ? '| Budget: ' + fmtMoney(c.dailyBudget) + '/day' : ''}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px">
              <div class="campaign-metrics">
                <span><span class="cm-label">Spend</span><span class="cm-value">${c.insights ? fmtMoney(c.insights.spend) : '--'}</span></span>
                <span><span class="cm-label">Leads</span><span class="cm-value">${c.insights ? c.insights.leads : '--'}</span></span>
                <span><span class="cm-label">CPL</span><span class="cm-value">${c.insights ? fmtMoney(c.insights.cpl) : '--'}</span></span>
              </div>
              <span class="campaign-expand ${expanded ? 'open' : ''}">&#9662;</span>
            </div>
          </div>
          ${expanded ? '<div class="adset-list">' + adsetsHTML + '</div>' : ''}
        </div>`;
    }).join('');
  }

  function renderCreatives() {
    const adsWithInsights = adsState.ads.filter(a => a.insights && a.status === 'ACTIVE');
    if (adsWithInsights.length === 0) {
      return '<div class="card card-empty">No active ads with performance data</div>';
    }

    const sorted = [...adsWithInsights].sort((a, b) => {
      const cplA = a.insights.cpl || 999;
      const cplB = b.insights.cpl || 999;
      return cplA - cplB;
    });

    return `<div class="creative-grid">${sorted.map(ad => {
      const c = ad.creative || {};
      const ins = ad.insights;
      const freq = parseFloat(ins.frequency || 0);
      const freqColor = freq >= 3 ? '#EF4444' : freq >= 2 ? '#F59E0B' : '#E2E8F0';

      return `
        <div class="creative-card">
          ${c.imageUrl
            ? `<img class="creative-img" src="${c.imageUrl}" alt="${c.title}" onerror="this.outerHTML='<div class=\\'creative-img-placeholder\\'>No Preview</div>'">`
            : '<div class="creative-img-placeholder">No Preview</div>'}
          <div class="creative-body">
            <div class="creative-title">${ad.name}</div>
            <div class="creative-text">${c.body || 'No ad copy'}</div>
            <div class="creative-stats">
              <div class="creative-stat">
                <div class="creative-stat-label">CTR</div>
                <div class="creative-stat-value">${fmtPct(ins.ctr)}</div>
              </div>
              <div class="creative-stat">
                <div class="creative-stat-label">CPL</div>
                <div class="creative-stat-value">${fmtMoney(ins.cpl)}</div>
              </div>
              <div class="creative-stat">
                <div class="creative-stat-label">Leads</div>
                <div class="creative-stat-value">${ins.leads || 0}</div>
              </div>
              <div class="creative-stat">
                <div class="creative-stat-label">Freq</div>
                <div class="creative-stat-value" style="color:${freqColor}">${freq.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>`;
    }).join('')}</div>`;
  }

  function renderRecommendations() {
    if (adsState.recommendations.length === 0) {
      return '<div class="card card-empty">No recommendations right now. Data needs time to accumulate.</div>';
    }

    return adsState.recommendations.map((rec, i) => {
      const typeLabel = rec.type.replace(/_/g, ' ');
      let actionBtn = '';
      if (rec.actionable) {
        if (rec.action.type === 'pause_ad') {
          actionBtn = `<button class="rec-apply-btn" onclick="AdsManager.confirmApply('pause','${rec.action.adId}','${rec.affectedAds[0]?.name || ''}')">Pause Ad</button>`;
        } else if (rec.action.type === 'run_optimizer') {
          actionBtn = `<button class="rec-apply-btn" onclick="AdsManager.runOptimize()">Run Optimizer</button>`;
        }
      }

      return `
        <div class="rec-card priority-${rec.priority}">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div class="rec-type ${rec.type}">${typeLabel}</div>
            <span class="badge" style="background:${rec.priority === 'high' ? '#EF444422' : rec.priority === 'medium' ? '#F59E0B22' : '#3B82F622'};color:${rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : '#3B82F6'}">${rec.priority}</span>
          </div>
          <div class="rec-message">${rec.message}</div>
          ${actionBtn}
        </div>`;
    }).join('');
  }

  function renderSettings() {
    const cfg = adsState.config;
    if (!cfg) return '<div class="card card-empty">Loading config...</div>';

    return `
      <div class="settings-panel">
        <div class="settings-row">
          <div>
            <div class="settings-label">Auto-Optimize</div>
            <div class="settings-desc">Automatically apply budget changes</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${cfg.autoOptimize ? 'checked' : ''} onchange="AdsManager.updateSetting('autoOptimize',this.checked)">
            <div class="toggle-track"></div>
            <div class="toggle-knob"></div>
          </label>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-label">Target CPL</div>
            <div class="settings-desc">Your ideal cost per lead</div>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <span style="color:#64748B;font-size:13px">$</span>
            <input class="settings-input" type="number" value="${cfg.targetCPL}" onchange="AdsManager.updateSetting('targetCPL',parseFloat(this.value))">
          </div>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-label">Min Spend Before Eval</div>
            <div class="settings-desc">Minimum spend before judging performance</div>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <span style="color:#64748B;font-size:13px">$</span>
            <input class="settings-input" type="number" value="${cfg.minSpendBeforeEval}" onchange="AdsManager.updateSetting('minSpendBeforeEval',parseFloat(this.value))">
          </div>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-label">Min Impressions</div>
            <div class="settings-desc">Minimum impressions before judging</div>
          </div>
          <input class="settings-input" type="number" value="${cfg.minImpressions}" onchange="AdsManager.updateSetting('minImpressions',parseInt(this.value,10))">
        </div>
      </div>

      <div class="ads-section-header">
        <div class="ads-section-title">Optimization Log</div>
      </div>
      ${renderOptimizeLog()}
    `;
  }

  function renderOptimizeLog() {
    if (adsState.optimizeLog.length === 0) {
      return '<div class="card card-empty">No optimization runs yet</div>';
    }
    return adsState.optimizeLog.slice(0, 10).map(entry => {
      const date = new Date(entry.timestamp).toLocaleString();
      const actionsSummary = entry.actions.length === 0
        ? 'No changes needed'
        : `${entry.actions.length} action(s)${entry.applied ? ' applied' : ' suggested'}`;
      return `
        <div class="log-entry">
          <div class="log-timestamp">${date}</div>
          <div class="log-action">
            <span>${actionsSummary} | ${entry.adsetCount} ad sets evaluated</span>
            <span class="${entry.applied ? 'success' : ''}">${entry.applied ? 'Applied' : 'Preview'}</span>
          </div>
          ${entry.actions.map(a => `<div style="margin-top:4px;padding-left:8px;color:${a.success === false ? '#EF4444' : '#94A3B8'};font-size:11px">${a.type}: ${a.adsetName} - ${a.reason}${a.success === false ? ' (FAILED: ' + a.error + ')' : ''}</div>`).join('')}
        </div>`;
    }).join('');
  }

  function renderConfirmModal() {
    const ca = adsState.confirmAction;
    if (!ca) return '';
    return `
      <div class="confirm-overlay">
        <div class="confirm-modal">
          <p>${ca.message}</p>
          <div class="confirm-actions">
            <button onclick="AdsManager.cancelConfirm()" style="background:transparent;border:1px solid #334155;color:#94A3B8">Cancel</button>
            <button onclick="AdsManager.executeConfirm()" style="background:${ca.color || '#3B82F6'};border:none;color:#fff">${ca.label}</button>
          </div>
        </div>
      </div>`;
  }

  function renderAds() {
    const app = document.getElementById('ads-app');
    if (!app) return;

    if (adsState.loading) {
      app.innerHTML = '<div class="ads-loading"><div class="spinner"></div>Loading your Meta ads data...</div>';
      return;
    }

    if (adsState.error) {
      app.innerHTML = `
        <div class="ads-error">
          <div class="error-msg">${adsState.error}</div>
          <button class="btn btn-primary" style="margin-top:12px" onclick="AdsManager.reload()">Retry</button>
        </div>`;
      return;
    }

    const sections = [
      { id: 'overview', label: 'Overview' },
      { id: 'creatives', label: 'Creatives' },
      { id: 'recommendations', label: 'Actions' },
      { id: 'settings', label: 'Settings' }
    ];

    const sectionNav = `
      <div style="display:flex;gap:0;border-bottom:1px solid #1E293B;padding:0 20px;overflow-x:auto">
        ${sections.map(s => `
          <button onclick="AdsManager.setSection('${s.id}')" style="padding:10px 16px;border:none;background:transparent;color:${adsState.activeSection === s.id ? '#3B82F6' : '#64748B'};font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid ${adsState.activeSection === s.id ? '#3B82F6' : 'transparent'};white-space:nowrap">${s.label}${s.id === 'recommendations' && adsState.recommendations.length > 0 ? ` (${adsState.recommendations.length})` : ''}</button>
        `).join('')}
      </div>`;

    let sectionContent = '';
    switch (adsState.activeSection) {
      case 'overview':
        sectionContent = `
          ${renderMetrics()}
          <div class="ads-section">
            <div class="ads-section-header">
              <div class="ads-section-title">Campaigns</div>
              <span class="ads-section-badge">Last 7 days</span>
            </div>
            ${renderCampaigns()}
          </div>`;
        break;
      case 'creatives':
        sectionContent = `
          <div class="ads-section">
            <div class="ads-section-header">
              <div class="ads-section-title">Creative Performance</div>
              <span class="ads-section-badge">Sorted by CPL (best first)</span>
            </div>
            ${renderCreatives()}
          </div>`;
        break;
      case 'recommendations':
        sectionContent = `
          <div class="ads-section">
            <div class="ads-section-header">
              <div class="ads-section-title">Recommendations</div>
              <button class="btn btn-primary" onclick="AdsManager.runOptimize()" style="font-size:12px;padding:6px 12px">Run Optimizer</button>
            </div>
            ${renderRecommendations()}
          </div>`;
        break;
      case 'settings':
        sectionContent = `
          <div class="ads-section">
            <div class="ads-section-header">
              <div class="ads-section-title">Optimization Settings</div>
            </div>
            ${renderSettings()}
          </div>`;
        break;
    }

    const recsCount = adsState.recommendations.filter(r => r.priority === 'high').length;

    app.innerHTML = `
      <div class="ads-header">
        <div>
          <h1>Meta Ads Manager</h1>
          <span style="font-size:12px;color:#64748B">${adsState.campaigns.length} campaign${adsState.campaigns.length !== 1 ? 's' : ''} ${recsCount > 0 ? `| <span style="color:#EF4444">${recsCount} action${recsCount !== 1 ? 's' : ''} needed</span>` : ''}</span>
        </div>
        <button class="btn btn-outline" onclick="AdsManager.reload()">Refresh</button>
      </div>
      ${sectionNav}
      ${sectionContent}
      ${renderConfirmModal()}
    `;
  }

  // Public methods
  function toggleCampaign(id) {
    const expanded = { ...adsState.expandedCampaigns };
    expanded[id] = !expanded[id];
    setAdsState({ expandedCampaigns: expanded });
  }

  async function adjustBudget(adsetId, currentCents, deltaCents) {
    const newBudget = Math.max(100, (currentCents || 0) + deltaCents);
    const msg = `Change daily budget to $${(newBudget / 100).toFixed(2)}?`;
    setAdsState({
      confirmAction: {
        message: msg,
        label: 'Update Budget',
        color: '#3B82F6',
        execute: async () => {
          try {
            await API.updateBudget(adsetId, newBudget);
            await loadData();
          } catch (err) {
            alert('Budget update failed: ' + err.message);
          }
        }
      }
    });
  }

  async function toggleAdSet(adsetId, checked) {
    const newStatus = checked ? 'ACTIVE' : 'PAUSED';
    const msg = `${checked ? 'Enable' : 'Pause'} this ad set?`;
    setAdsState({
      confirmAction: {
        message: msg,
        label: checked ? 'Enable' : 'Pause',
        color: checked ? '#10B981' : '#F59E0B',
        execute: async () => {
          try {
            await API.updateAdSetStatus(adsetId, newStatus);
            await loadData();
          } catch (err) {
            alert('Status update failed: ' + err.message);
          }
        }
      }
    });
  }

  function confirmApply(type, id, name) {
    if (type === 'pause') {
      setAdsState({
        confirmAction: {
          message: `Pause ad "${name}"?`,
          label: 'Pause',
          color: '#F59E0B',
          execute: async () => {
            try {
              await API.updateAdStatus(id, 'PAUSED');
              await loadData();
            } catch (err) {
              alert('Failed: ' + err.message);
            }
          }
        }
      });
    }
  }

  async function runOptimize() {
    const autoApply = adsState.config?.autoOptimize || false;
    setAdsState({
      confirmAction: {
        message: autoApply
          ? 'Run optimizer and automatically apply changes?'
          : 'Run optimizer in preview mode? (No changes will be made)',
        label: autoApply ? 'Optimize & Apply' : 'Run Preview',
        color: autoApply ? '#10B981' : '#3B82F6',
        execute: async () => {
          try {
            await API.post('/meta/optimize', { apply: autoApply });
            // Refresh log
            const logRes = await API.get('/meta/optimize/log');
            setAdsState({ optimizeLog: logRes.log || [] });
            await loadData();
          } catch (err) {
            alert('Optimization failed: ' + err.message);
          }
        }
      }
    });
  }

  async function updateSetting(key, value) {
    try {
      const updated = await API.updateConfig({ [key]: value });
      setAdsState({ config: updated });
    } catch (err) {
      alert('Failed to save setting: ' + err.message);
    }
  }

  function cancelConfirm() {
    setAdsState({ confirmAction: null });
  }

  async function executeConfirm() {
    const action = adsState.confirmAction;
    setAdsState({ confirmAction: null });
    if (action && action.execute) {
      await action.execute();
    }
  }

  function setSection(id) {
    setAdsState({ activeSection: id });
    if (id === 'settings' && adsState.optimizeLog.length === 0) {
      API.get('/meta/optimize/log').then(res => {
        setAdsState({ optimizeLog: res.log || [] });
      }).catch(() => {});
    }
  }

  function reload() {
    initialized = false;
    loadData();
  }

  return {
    init,
    reload,
    toggleCampaign,
    adjustBudget,
    toggleAdSet,
    confirmApply,
    runOptimize,
    updateSetting,
    cancelConfirm,
    executeConfirm,
    setSection
  };
})();
