// =========================================
//  CHARTS (charts.js)
//  Chart.js wrappers for all chart types
// =========================================

const ChartDefaults = {
  fontFamily: "'Inter', sans-serif",
  gridColor: () => getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#E2E8F0',
  textColor: () => getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94A3B8',

  baseOptions() {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: this.textColor(),
            font: { family: this.fontFamily, size: 12, weight: '500' },
            boxWidth: 12,
            padding: 16,
          }
        },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#1E293B',
          titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#F1F5F9',
          bodyColor:  getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94A3B8',
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1E2A3A',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${AppState.formatAmount(ctx.parsed.y ?? ctx.parsed)}`
          }
        }
      }
    };
  }
};

// ---- ACTIVE CHARTS REGISTRY ----
const ActiveCharts = {};

function destroyChart(id) {
  if (ActiveCharts[id]) {
    ActiveCharts[id].destroy();
    delete ActiveCharts[id];
  }
}

// ---- MONTHLY BAR CHART ----
function renderMonthlyBarChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const months = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    const txs = AppState.getFiltered({ period: 'custom', month: mKey });
    const summary = AppState.getSummary(txs);
    months.push(label);
    incomeData.push(summary.income);
    expenseData.push(summary.expenses);
  }

  const opts = ChartDefaults.baseOptions();
  ActiveCharts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(16,185,129,0.75)',
          borderColor: '#10B981',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(124,58,237,0.75)',
          borderColor: '#7C3AED',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      ...opts,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: ChartDefaults.textColor(), font: { family: ChartDefaults.fontFamily, size: 11 } }
        },
        y: {
          grid: { color: ChartDefaults.gridColor(), drawBorder: false },
          ticks: {
            color: ChartDefaults.textColor(),
            font: { family: ChartDefaults.fontFamily, size: 11 },
            callback: v => AppState.formatAmount(v)
          },
          beginAtZero: true,
        }
      },
      plugins: {
        ...opts.plugins,
        legend: { ...opts.plugins.legend, position: 'top' },
        tooltip: {
          ...opts.plugins.tooltip,
          callbacks: { label: ctx => ` ${AppState.formatAmount(ctx.parsed.y)}` }
        }
      }
    }
  });
}

// ---- CATEGORY DONUT CHART ----
function renderCategoryDonutChart(canvasId, period = 'month', month = null) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const txs = AppState.getFiltered({ period, type: 'expense', month: month || undefined });
  const catTotals = AppState.getCategoryTotals(txs);
  const entries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);

  if (!entries.length) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = ChartDefaults.textColor();
    ctx.font = `14px ${ChartDefaults.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('No expense data', canvas.width/2, canvas.height/2);
    return;
  }

  const COLORS = [
    '#7C3AED','#3B82F6','#10B981','#F59E0B',
    '#EF4444','#EC4899','#06B6D4','#8B5CF6',
    '#14B8A6','#F97316'
  ];

  const labels = entries.map(([cat]) => (CATEGORIES[cat]?.label || cat) + ' ' + (CATEGORIES[cat]?.icon || ''));
  const data   = entries.map(([,amt]) => amt);
  const colors = entries.map((_,i) => COLORS[i % COLORS.length]);

  const opts = ChartDefaults.baseOptions();
  ActiveCharts[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      ...opts,
      cutout: '68%',
      plugins: {
        ...opts.plugins,
        legend: {
          ...opts.plugins.legend,
          position: 'bottom',
          labels: { ...opts.plugins.legend.labels, boxWidth: 10, padding: 12 }
        },
        tooltip: {
          ...opts.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${AppState.formatAmount(ctx.parsed)} (${Math.round(ctx.parsed/data.reduce((a,b)=>a+b,0)*100)}%)`
          }
        }
      }
    }
  });
}

// ---- SPENDING TREND LINE CHART ----
function renderSpendingTrendChart(canvasId, days = 14) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const labels = [];
  const expenseData = [];
  const incomeData  = [];

  for (let i = days-1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTxs  = AppState.transactions.filter(t => t.date === dateStr);
    const expenses = dayTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const income   = dayTxs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    labels.push(d.toLocaleDateString('en-US', { month:'short', day:'numeric' }));
    expenseData.push(expenses);
    incomeData.push(income);
  }

  const opts = ChartDefaults.baseOptions();
  ActiveCharts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#7C3AED',
          backgroundColor: 'rgba(124,58,237,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#7C3AED',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }
      ]
    },
    options: {
      ...opts,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: ChartDefaults.textColor(),
            font: { family: ChartDefaults.fontFamily, size: 10 },
            maxTicksLimit: 7,
          }
        },
        y: {
          grid: { color: ChartDefaults.gridColor(), drawBorder: false },
          ticks: {
            color: ChartDefaults.textColor(),
            font: { family: ChartDefaults.fontFamily, size: 10 },
            callback: v => AppState.formatAmount(v)
          },
          beginAtZero: true,
        }
      },
      plugins: {
        ...opts.plugins,
        legend: { ...opts.plugins.legend, position: 'top' }
      }
    }
  });
}

// ---- WEEKLY PATTERN BAR ----
function renderWeeklyPatternChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const pattern = AIEngine.getWeeklyPattern();
  const opts = ChartDefaults.baseOptions();

  ActiveCharts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: pattern.labels,
      datasets: [{
        label: 'Spending',
        data: pattern.totals,
        backgroundColor: pattern.totals.map((v,i) =>
          v === Math.max(...pattern.totals) ? '#7C3AED' : 'rgba(124,58,237,0.35)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      ...opts,
      scales: {
        x: { grid:{display:false}, ticks:{color:ChartDefaults.textColor(),font:{family:ChartDefaults.fontFamily,size:11}} },
        y: { grid:{color:ChartDefaults.gridColor(),drawBorder:false}, ticks:{color:ChartDefaults.textColor(),callback:v=>AppState.formatAmount(v)}, beginAtZero:true }
      },
      plugins: { ...opts.plugins, legend: { display: false } }
    }
  });
}

// ---- PREDICTION CHART ----
function renderPredictionChart(canvasId) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const pred = AIEngine.predictNextMonth();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }
  months.push('Next →');

  const allData = [...pred.history, pred.predicted];
  const opts = ChartDefaults.baseOptions();

  ActiveCharts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Expenses',
        data: pred.history,
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124,58,237,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#7C3AED',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },{
        label: 'Predicted',
        data: [...Array(6).fill(null), pred.predicted],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 8,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderDash: [6,3],
      }]
    },
    options: {
      ...opts,
      scales: {
        x: { grid:{display:false}, ticks:{color:ChartDefaults.textColor(),font:{family:ChartDefaults.fontFamily,size:11}} },
        y: { grid:{color:ChartDefaults.gridColor(),drawBorder:false}, ticks:{color:ChartDefaults.textColor(),callback:v=>AppState.formatAmount(v)}, beginAtZero:true }
      }
    }
  });

  return pred;
}
