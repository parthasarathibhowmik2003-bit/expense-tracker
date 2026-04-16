// =========================================
//  EXPENSE TRACKER — CORE APP (app.js)
//  Storage, utilities, shared state
// =========================================

// ---- DEFAULT SAMPLE DATA ----
const DEFAULT_TRANSACTIONS = [
  { id: 't1', type: 'income',  name: 'Monthly Salary',   amount: 5000, category: 'salary',        date: getDateOffset(-30), note: '' },
  { id: 't2', type: 'expense', name: 'Grocery Shopping', amount: 120,  category: 'food',          date: getDateOffset(-28), note: 'Weekly groceries' },
  { id: 't3', type: 'expense', name: 'Netflix',          amount: 15,   category: 'entertainment', date: getDateOffset(-25), note: 'Monthly subscription' },
  { id: 't4', type: 'expense', name: 'Electricity Bill', amount: 85,   category: 'bills',         date: getDateOffset(-22), note: '' },
  { id: 't5', type: 'income',  name: 'Freelance Project', amount: 800, category: 'income',        date: getDateOffset(-20), note: '' },
  { id: 't6', type: 'expense', name: 'Gym Membership',   amount: 45,   category: 'health',        date: getDateOffset(-18), note: '' },
  { id: 't7', type: 'expense', name: 'Restaurant Dinner', amount: 62,  category: 'food',          date: getDateOffset(-15), note: 'Birthday dinner' },
  { id: 't8', type: 'expense', name: 'Uber Rides',       amount: 38,   category: 'travel',        date: getDateOffset(-14), note: '' },
  { id: 't9', type: 'expense', name: 'Amazon Shopping',  amount: 145,  category: 'shopping',      date: getDateOffset(-12), note: '' },
  { id: 't10', type: 'income', name: 'Monthly Salary',   amount: 5000, category: 'salary',        date: getDateOffset(-1),  note: '' },
  { id: 't11', type: 'expense', name: 'Coffee & Snacks', amount: 28,   category: 'food',          date: getDateOffset(-5),  note: '' },
  { id: 't12', type: 'expense', name: 'Phone Bill',      amount: 55,   category: 'bills',         date: getDateOffset(-4),  note: '' },
  { id: 't13', type: 'expense', name: 'Online Course',   amount: 199,  category: 'education',     date: getDateOffset(-3),  note: 'Udemy course' },
  { id: 't14', type: 'expense', name: 'Movie Tickets',   amount: 34,   category: 'entertainment', date: getDateOffset(-2),  note: '' },
  { id: 't15', type: 'expense', name: 'Pharmacy',        amount: 42,   category: 'health',        date: getDateOffset(-1),  note: 'Medicines' },
];

const DEFAULT_BUDGETS = {
  food:          { limit: 400, name: 'Food' },
  travel:        { limit: 150, name: 'Travel' },
  bills:         { limit: 300, name: 'Bills' },
  shopping:      { limit: 250, name: 'Shopping' },
  health:        { limit: 200, name: 'Health' },
  entertainment: { limit: 100, name: 'Entertainment' },
  education:     { limit: 300, name: 'Education' },
  others:        { limit: 100, name: 'Others' },
};

// ---- CATEGORIES ----
const CATEGORIES = {
  food:          { label: 'Food & Dining',    icon: '🍔', class: 'cat-food' },
  travel:        { label: 'Travel',           icon: '✈️', class: 'cat-travel' },
  bills:         { label: 'Bills & Utilities', icon: '💡', class: 'cat-bills' },
  shopping:      { label: 'Shopping',         icon: '🛍️', class: 'cat-shopping' },
  health:        { label: 'Health & Fitness', icon: '💊', class: 'cat-health' },
  entertainment: { label: 'Entertainment',    icon: '🎮', class: 'cat-entertainment' },
  education:     { label: 'Education',        icon: '📚', class: 'cat-education' },
  others:        { label: 'Others',           icon: '📦', class: 'cat-others' },
  salary:        { label: 'Salary',           icon: '💰', class: 'cat-salary' },
  income:        { label: 'Income',           icon: '💵', class: 'cat-income' },
};

// ---- CURRENCIES ----
const CURRENCIES = {
  USD: { symbol: '$',  name: 'US Dollar',       rate: 1 },
  EUR: { symbol: '€',  name: 'Euro',            rate: 0.92 },
  GBP: { symbol: '£',  name: 'British Pound',   rate: 0.79 },
  INR: { symbol: '₹',  name: 'Indian Rupee',    rate: 83.5 },
  JPY: { symbol: '¥',  name: 'Japanese Yen',    rate: 149.5 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 1.35 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
};

// ---- KEYWORD → CATEGORY MAP (AI Auto-Categorize) ----
const CATEGORY_KEYWORDS = {
  food: ['food','eat','restaurant','pizza','burger','coffee','cafe','grocery','groceries','lunch','dinner','breakfast','snack','meal','donut','sushi','chicken','bakery','swiggy','zomato','uber eats','delivery'],
  travel: ['uber','ola','taxi','cab','flight','airline','hotel','airbnb','train','bus','metro','fuel','petrol','gas','parking','toll','travel','trip','vacation','holiday'],
  bills: ['bill','electric','electricity','water','internet','wifi','broadband','rent','mortgage','insurance','subscription','netflix','spotify','amazon prime','phone','mobile','gas bill','utility'],
  shopping: ['amazon','flipkart','shopping','clothes','dress','shirt','shoes','bag','watch','apparel','myntra','mall','store','buy','purchase','zara','h&m'],
  health: ['doctor','hospital','pharmacy','medicine','drug','gym','fitness','yoga','health','medical','clinic','dental','optician','therapy'],
  entertainment: ['movie','cinema','netflix','game','gaming','concert','event','ticket','theatre','sport','streaming','disney','hulu'],
  education: ['course','class','workshop','book','tuition','school','college','university','udemy','coursera','learning','study'],
  salary: ['salary','paycheck','payroll','wage'],
};

// ---- UTILITY FUNCTIONS ----
function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function generateId() {
  return 't' + Date.now() + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getMonthYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function getCurrentMonth() {
  return getMonthYear(getToday());
}

function getLastMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// ---- STORAGE ----
class Storage {
  static get(key, defaultVal = null) {
    try {
      const v = localStorage.getItem('exptrack_' + key);
      return v !== null ? JSON.parse(v) : defaultVal;
    } catch { return defaultVal; }
  }
  static set(key, value) {
    try { localStorage.setItem('exptrack_' + key, JSON.stringify(value)); } catch {}
  }
}

// ---- APP STATE ----
const AppState = {
  transactions: [],
  budgets: {},
  settings: {},
  currency: 'USD',

  init() {
    this.transactions = Storage.get('transactions', DEFAULT_TRANSACTIONS);
    this.budgets      = Storage.get('budgets', DEFAULT_BUDGETS);
    this.settings     = Storage.get('settings', { theme: 'dark', name: 'User', currency: 'USD', notifications: true });
    this.currency     = this.settings.currency || 'USD';

    // Apply saved theme
    document.documentElement.setAttribute('data-theme', this.settings.theme || 'dark');
    this.updateThemeIcon();
  },

  save() {
    Storage.set('transactions', this.transactions);
    Storage.set('budgets', this.budgets);
    Storage.set('settings', this.settings);
  },

  addTransaction(tx) {
    tx.id = generateId();
    this.transactions.unshift(tx);
    this.save();
    checkBudgetAlerts(tx);
    return tx;
  },

  updateTransaction(id, updates) {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx > -1) {
      this.transactions[idx] = { ...this.transactions[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  },

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.save();
  },

  getFiltered({ type, category, period, month, search, minAmount, maxAmount } = {}) {
    let txs = [...this.transactions];

    if (type && type !== 'all') txs = txs.filter(t => t.type === type);
    if (category && category !== 'all') txs = txs.filter(t => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(t => t.name.toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q));
    }
    if (minAmount !== undefined && minAmount !== '') txs = txs.filter(t => t.amount >= Number(minAmount));
    if (maxAmount !== undefined && maxAmount !== '') txs = txs.filter(t => t.amount <= Number(maxAmount));

    if (period === 'today') {
      const today = getToday();
      txs = txs.filter(t => t.date === today);
    } else if (period === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      const cutoff = d.toISOString().split('T')[0];
      txs = txs.filter(t => t.date >= cutoff);
    } else if (period === 'month' || !period) {
      const m = month || getCurrentMonth();
      txs = txs.filter(t => getMonthYear(t.date) === m);
    } else if (period === 'year') {
      const y = new Date().getFullYear().toString();
      txs = txs.filter(t => t.date.startsWith(y));
    } else if (period === 'all') {
      // no filter
    } else if (period === 'custom' && month) {
      txs = txs.filter(t => getMonthYear(t.date) === month);
    }

    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getSummary(txs) {
    let income = 0, expenses = 0;
    txs.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    });
    return { income, expenses, balance: income - expenses };
  },

  getCategoryTotals(txs) {
    const cats = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return cats;
  },

  updateThemeIcon() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = this.settings.theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    this.updateThemeIcon();
    this.save();
  },

  formatAmount(amount) {
    const cur = CURRENCIES[this.currency] || CURRENCIES.USD;
    const converted = amount * cur.rate;
    return cur.symbol + converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  setCurrency(code) {
    this.currency = code;
    this.settings.currency = code;
    this.save();
  }
};

// ---- AI AUTO-CATEGORIZE ----
function autoCategorize(name) {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'others';
}

// ---- BUDGET ALERTS ----
function checkBudgetAlerts(newTx) {
  if (newTx.type !== 'expense') return;
  const budget = AppState.budgets[newTx.category];
  if (!budget || !AppState.settings.notifications) return;

  const monthTxs = AppState.getFiltered({ period: 'month', category: newTx.category, type: 'expense' });
  const total = monthTxs.reduce((s, t) => s + t.amount, 0);
  const pct = (total / budget.limit) * 100;
  const catInfo = CATEGORIES[newTx.category] || { label: newTx.category, icon: '📦' };

  if (pct >= 100) {
    showToast('⚠️ Budget Exceeded!', `${catInfo.label} budget exceeded! (${AppState.formatAmount(total)} / ${AppState.formatAmount(budget.limit)})`, 'error');
  } else if (pct >= 80) {
    showToast('⚠️ Budget Warning', `${catInfo.label} is at ${Math.round(pct)}% of limit`, 'warning');
  }
}

// ---- TOAST SYSTEM ----
function showToast(title, msg = '', type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---- MODAL HELPERS ----
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ---- ACTIVE NAV ----
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

// ---- RENDER SIDEBAR ----
function renderSidebar(activePage) {
  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;

  const pages = [
    { href: 'index.html',    icon: '🏠', label: 'Home' },
    { href: 'dashboard.html', icon: '📊', label: 'Dashboard' },
    { href: 'expenses.html',  icon: '💸', label: 'Expenses' },
    { href: 'reports.html',   icon: '📈', label: 'Reports' },
    { href: 'settings.html',  icon: '⚙️', label: 'Settings' },
  ];

  const navItems = pages.map(p => `
    <a href="${p.href}" class="nav-item ${activePage === p.href ? 'active' : ''}">
      <span class="nav-icon">${p.icon}</span>
      <span class="nav-label">${p.label}</span>
    </a>
  `).join('');

  const userName = AppState.settings.name || 'User';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">💎</div>
      <div class="logo-text">
        <span>FinTrack</span>
        <span>AI Expense Manager</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <span class="nav-section-label">Menu</span>
      ${navItems}
      <span class="nav-section-label">Tools</span>
      <a href="#" class="nav-item" onclick="exportCSV(); return false;">
        <span class="nav-icon">📥</span>
        <span class="nav-label">Export CSV</span>
      </a>
      <a href="#" class="nav-item" onclick="exportPDF(); return false;">
        <span class="nav-icon">📄</span>
        <span class="nav-label">Export PDF</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-currency">
        <span>Currency</span>
        <select class="currency-select-sm" id="sidebarCurrency" onchange="changeCurrencySidebar(this.value)">
          ${Object.entries(CURRENCIES).map(([code, cur]) =>
            `<option value="${code}" ${AppState.currency === code ? 'selected' : ''}>${code} ${cur.symbol}</option>`
          ).join('')}
        </select>
      </div>
      <div class="user-profile">
        <div class="avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${userName}</div>
          <div class="user-role">Personal Account</div>
        </div>
        <span class="user-chevron">›</span>
      </div>
    </div>
  `;
}

function changeCurrencySidebar(code) {
  AppState.setCurrency(code);
  location.reload();
}

// ---- MOBILE SIDEBAR TOGGLE ----
function initMobileSidebar() {
  const btn = document.getElementById('mobilMenuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('appSidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay && overlay.classList.toggle('active');
  });
  overlay && overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

// ---- THEME TOGGLE ----
function initThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.addEventListener('click', () => AppState.toggleTheme());
}

// ---- MOBILE TAB BAR ----
function renderMobileTabBar(activePage) {
  const bar = document.getElementById('mobileTabBar');
  if (!bar) return;
  const tabs = [
    { href: 'index.html',     icon: '🏠', label: 'Home' },
    { href: 'dashboard.html', icon: '📊', label: 'Dashboard' },
    { href: 'expenses.html',  icon: '💸', label: 'Expenses' },
    { href: 'reports.html',   icon: '📈', label: 'Reports' },
    { href: 'settings.html',  icon: '⚙️', label: 'Settings' },
  ];
  bar.innerHTML = tabs.map(t => `
    <a href="${t.href}" class="mobile-tab-btn ${activePage === t.href ? 'active' : ''}">
      <span class="tab-icon">${t.icon}</span>
      <span>${t.label}</span>
    </a>
  `).join('');
}

// ---- INIT SHARED (called by each page) ----
function initShared(activePage) {
  AppState.init();
  renderSidebar(activePage);
  renderMobileTabBar(activePage);
  initMobileSidebar();
  initThemeToggle();
}

// ---- NUMBER ANIMATION ----
function animateNumber(el, target, prefix = '', suffix = '', duration = 900) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = prefix + current.toFixed(2) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
