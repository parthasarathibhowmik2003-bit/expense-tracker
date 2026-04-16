// =========================================
//  AI ENGINE (ai.js)
//  Smart insights, predictions, suggestions
// =========================================

const AIEngine = {

  // ---- Generate Smart Insights ----
  generateInsights() {
    const insights = [];
    const currentMonthTxs = AppState.getFiltered({ period: 'month', type: 'expense' });
    const lastMonthTxs = AppState.getFiltered({ period: 'custom', month: getLastMonth(), type: 'expense' });

    const currentTotal = currentMonthTxs.reduce((s, t) => s + t.amount, 0);
    const lastTotal    = lastMonthTxs.reduce((s, t) => s + t.amount, 0);

    // 1) Month-over-month change
    if (lastTotal > 0) {
      const change = ((currentTotal - lastTotal) / lastTotal) * 100;
      if (Math.abs(change) > 5) {
        insights.push({
          icon: change > 0 ? '📈' : '📉',
          title: change > 0
            ? `Spending up ${Math.abs(change).toFixed(0)}% vs last month`
            : `Great job! Spending down ${Math.abs(change).toFixed(0)}% vs last month`,
          detail: `This month: ${AppState.formatAmount(currentTotal)} | Last month: ${AppState.formatAmount(lastTotal)}`
        });
      }
    }

    // 2) Top spending category
    const catTotals = AppState.getCategoryTotals(currentMonthTxs);
    const topCat = Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0];
    if (topCat) {
      const [cat, amt] = topCat;
      const catInfo = CATEGORIES[cat] || { label: cat, icon: '📦' };
      insights.push({
        icon: catInfo.icon,
        title: `Highest spend: ${catInfo.label}`,
        detail: `${AppState.formatAmount(amt)} this month (${currentTotal > 0 ? Math.round(amt/currentTotal*100) : 0}% of expenses)`
      });
    }

    // 3) Category comparison vs last month
    const lastCatTotals = AppState.getCategoryTotals(lastMonthTxs);
    for (const [cat, amt] of Object.entries(catTotals)) {
      const lastAmt = lastCatTotals[cat] || 0;
      if (lastAmt > 0) {
        const pct = ((amt - lastAmt) / lastAmt) * 100;
        if (pct >= 30) {
          const catInfo = CATEGORIES[cat] || { label: cat, icon: '📦' };
          insights.push({
            icon: '⚠️',
            title: `${catInfo.label} spending up ${pct.toFixed(0)}%`,
            detail: `Last month: ${AppState.formatAmount(lastAmt)} → This month: ${AppState.formatAmount(amt)}`
          });
          break; // max 1 category alert
        }
      }
    }

    // 4) Budget status
    const budgetWarnings = this.getBudgetStatus();
    budgetWarnings.slice(0,2).forEach(w => insights.push(w));

    // 5) Savings rate
    const allMonth = AppState.getFiltered({ period: 'month' });
    const summary = AppState.getSummary(allMonth);
    if (summary.income > 0) {
      const savingRate = ((summary.income - summary.expenses) / summary.income) * 100;
      if (savingRate > 0) {
        insights.push({
          icon: '💰',
          title: `Saving ${savingRate.toFixed(0)}% of income`,
          detail: `${AppState.formatAmount(summary.income - summary.expenses)} saved this month`
        });
      } else {
        insights.push({
          icon: '🚨',
          title: `Spending exceeds income by ${Math.abs(savingRate).toFixed(0)}%`,
          detail: 'Consider reducing expenses or adding income'
        });
      }
    }

    return insights.slice(0, 6);
  },

  // ---- Budget Status ----
  getBudgetStatus() {
    const currentMonthTxs = AppState.getFiltered({ period: 'month', type: 'expense' });
    const catTotals = AppState.getCategoryTotals(currentMonthTxs);
    const warnings = [];

    for (const [cat, budget] of Object.entries(AppState.budgets)) {
      const spent = catTotals[cat] || 0;
      const pct = (spent / budget.limit) * 100;
      if (pct >= 90) {
        const catInfo = CATEGORIES[cat] || { label: cat, icon: '📦' };
        warnings.push({
          icon: pct >= 100 ? '🔴' : '🟡',
          title: pct >= 100
            ? `${catInfo.label} budget exceeded!`
            : `${catInfo.label} budget at ${pct.toFixed(0)}%`,
          detail: `${AppState.formatAmount(spent)} of ${AppState.formatAmount(budget.limit)} spent`
        });
      }
    }
    return warnings;
  },

  // ---- Predict Next Month ----
  predictNextMonth() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const txs = AppState.getFiltered({ period: 'custom', month: mKey, type: 'expense' });
      const total = txs.reduce((s,t) => s+t.amount, 0);
      months.push(total);
    }

    // Simple linear regression
    const n = months.length;
    const xMean = (n-1)/2;
    const yMean = months.reduce((a,b)=>a+b,0)/n;
    let num = 0, den = 0;
    months.forEach((y,x) => {
      num += (x - xMean)*(y - yMean);
      den += (x - xMean)**2;
    });
    const slope = den !== 0 ? num/den : 0;
    const intercept = yMean - slope * xMean;
    const predicted = Math.max(0, intercept + slope * n);

    return {
      predicted: Math.round(predicted),
      trend: slope > 10 ? 'increasing' : slope < -10 ? 'decreasing' : 'stable',
      history: months,
    };
  },

  // ---- Budget Suggestions (50/30/20 Rule) ----
  suggestBudgets() {
    const monthTxs = AppState.getFiltered({ period: 'month' });
    const summary  = AppState.getSummary(monthTxs);
    const income   = summary.income || 5000;

    const needs  = income * 0.50;
    const wants  = income * 0.30;
    const savings = income * 0.20;

    const needsCats  = ['bills', 'health', 'food'];
    const wantsCats  = ['travel', 'shopping', 'entertainment', 'education'];
    const othersCats = ['others'];

    const suggestions = {};
    needsCats.forEach(c => suggestions[c] = Math.round(needs / needsCats.length));
    wantsCats.forEach(c => suggestions[c] = Math.round(wants / wantsCats.length));
    othersCats.forEach(c => suggestions[c] = Math.round((income - needs - wants) / othersCats.length));

    return { income, needs, wants, savings, suggestions };
  },

  // ---- Weekly Pattern Analysis ----
  getWeeklyPattern() {
    const txs = AppState.getFiltered({ period: 'month', type: 'expense' });
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const totals = Array(7).fill(0);
    const counts = Array(7).fill(0);

    txs.forEach(t => {
      const day = new Date(t.date + 'T00:00:00').getDay();
      totals[day] += t.amount;
      counts[day]++;
    });

    const maxDay = totals.indexOf(Math.max(...totals));
    return {
      labels: days,
      totals,
      counts,
      highestDay: days[maxDay],
      highestAmount: totals[maxDay],
    };
  },

  // ---- Anomaly Detection ----
  detectAnomalies() {
    const txs = AppState.getFiltered({ period: 'all', type: 'expense' });
    if (txs.length < 5) return [];

    const amounts = txs.map(t => t.amount);
    const mean   = amounts.reduce((a,b)=>a+b,0) / amounts.length;
    const std    = Math.sqrt(amounts.map(a=>(a-mean)**2).reduce((a,b)=>a+b,0) / amounts.length);
    const threshold = mean + 2 * std;

    return txs
      .filter(t => t.amount > threshold)
      .slice(0, 3)
      .map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        zScore: ((t.amount - mean) / std).toFixed(1),
      }));
  },
};

// ---- Render Insights Panel ----
function renderInsights(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<div class="ai-loading"><div class="spinner"></div> AI is analyzing your finances…</div>`;

  setTimeout(() => {
    const insights = AIEngine.generateInsights();
    if (!insights.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🤖</div><p>Add more transactions for AI insights!</p></div>`;
      return;
    }
    container.innerHTML = insights.map(ins => `
      <div class="insight-card animate-slideUp">
        <div class="insight-icon">${ins.icon}</div>
        <div class="insight-text">
          <h4>${ins.title}</h4>
          <p>${ins.detail}</p>
        </div>
      </div>
    `).join('');
  }, 600);
}
