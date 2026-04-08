// Utility functions

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = type || '';

  setTimeout(() => {
    feedback.textContent = '';
    feedback.className = '';
  }, 4000);
}

function formatCurrency(amount) {
  return `$${Number(amount).toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getActionIcon(type) {
  if (type === 'edit') {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    `;
  }

  if (type === 'delete') {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    `;
  }

  return '';
}

function getCategoryIcon(category) {
  const icons = {
    Food: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 3v8" />
        <path d="M7 3v8" />
        <path d="M5.5 11v10" />
        <path d="M12 3v7" />
        <path d="M12 10c0 2 2 2 2 0V3" />
        <path d="M16 3v18" />
      </svg>
    `,
    Transport: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 16V9l2-4h10l2 4v7" />
        <path d="M3 16h18" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </svg>
    `,
    Shopping: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
    `,
    Bills: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    `,
    Entertainment: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M10 9l5 3-5 3V9z" />
      </svg>
    `,
    Health: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
      </svg>
    `,
    Other: `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M3 7l9-4 9 4-9 4-9-4z"/>
  <path d="M3 7v10l9 4 9-4V7"/>
  <path d="M12 11v10"/>
</svg>`
  };

  return icons[category] || icons.Other;
}

function getCategoryColorClass(category) {
  const map = {
    Food: 'category-food',
    Transport: 'category-transport',
    Shopping: 'category-shopping',
    Bills: 'category-bills',
    Entertainment: 'category-entertainment',
    Health: 'category-health',
    Other: 'category-other'
  };

  return map[category] || 'category-other';
}

// Converts an expense date into a YYYY-MM key so expenses can be grouped by month
function getMonthKey(dateString) {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Returns a human-readable label like "Apr 2026" for a "YYYY-MM" key
function formatMonthKey(key) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric'
  });
}

// Builds a unique list of available months from all stored expenses, newest first
function getAvailableMonthKeys() {
  const keys = new Set(allExpenses.map((expense) => getMonthKey(expense.date)));
  return Array.from(keys).sort((a, b) => (a > b ? -1 : 1));
}

// Chart colors by category
const CATEGORY_CHART_COLORS_LIGHT = {
  Food: '#4a7c59',
  Transport: '#4b6cb7',
  Shopping: '#7a5ea8',
  Bills: '#b7791f',
  Entertainment: '#c05672',
  Health: '#c0392b',
  Other: '#6b7280'
};

const CATEGORY_CHART_COLORS_DARK = {
  Food: '#63b15b',
  Transport: '#6da1fc',
  Shopping: '#9a73d1',
  Bills: '#cfa253',
  Entertainment: '#c677a1',
  Health: '#e88080',
  Other: '#bfc6bf'
};

// Uses a different chart colour palette depending on whether dark mode is active
function getCategoryChartColor(category) {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const palette = isDarkMode
    ? CATEGORY_CHART_COLORS_DARK
    : CATEGORY_CHART_COLORS_LIGHT;

  return palette[category] || palette.Other;
}

// Centralises chart colours so Chart.js updates stay consistent across light and dark themes
function getChartThemeColors() {
  const isDarkMode = document.body.classList.contains('dark-mode');

  return {
    barBackground: isDarkMode ? 'rgba(116, 173, 120, 0.72)' : 'rgba(74, 124, 89, 0.72)',
    barBorder: isDarkMode ? '#74ad78' : '#4a7c59',
    gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
    tickColor: isDarkMode ? '#dddddd' : '#6b7280',
    tooltipBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    tooltipText: isDarkMode ? '#fcfcfc' : '#2b2b2b',
    tooltipBorder: isDarkMode ? '#414141' : '#e0e4e1'
  };
}

// App state

let allExpenses = [];
let currentMonthlyBudget = null;
let currentFilter = 'month';
let currentSort = 'newest';

let currentSpecificMonth = null;

// Chart instances
let barChartInstance = null;
let pieChartInstance = null;

// Filter helpers

// Returns the expense list currently visible in the UI based on the selected filter
function getFilteredExpenses() {
  const now = new Date();

  if (currentFilter === 'month') {
    return allExpenses.filter((expense) => {
      const d = new Date(expense.date);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    });
  }

  if (currentFilter === 'week') {
    // Calculates the current week from Monday to Sunday for the This Week filter
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return allExpenses.filter((expense) => {
      const d = new Date(expense.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
  }

  if (currentFilter === 'specific' && currentSpecificMonth) {
    return allExpenses.filter((expense) =>
      getMonthKey(expense.date) === currentSpecificMonth
    );
  }

  return allExpenses;
}

// Keeps the category summary note in sync with the active expense filter
function getFilterLabel() {
  if (currentFilter === 'month') return 'Showing: This Month';
  if (currentFilter === 'week') return 'Showing: This Week';
  if (currentFilter === 'specific' && currentSpecificMonth) {
    return `Showing: ${formatMonthKey(currentSpecificMonth)}`;
  }
  return 'Showing: All';
}

function sortExpenses(expenses) {
  const sortedExpenses = [...expenses];

  if (currentSort === 'oldest') {
    sortedExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (currentSort === 'newest') {
    sortedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentSort === 'highest') {
    sortedExpenses.sort((a, b) => b.amount - a.amount);
  } else if (currentSort === 'lowest') {
    sortedExpenses.sort((a, b) => a.amount - b.amount);
  }

  return sortedExpenses;
}

// Overview calculations

function getCurrentMonthExpenses() {
  const now = new Date();

  return allExpenses.filter((expense) => {
    const d = new Date(expense.date);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    );
  });
}

// Overview cards always summarise the current calendar month, regardless of the table filter
function updateOverviewCards() {
  const now = new Date();
  const currentMonthExpenses = getCurrentMonthExpenses();

  const totalSpent = currentMonthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  document.getElementById('stat-spent').textContent = formatCurrency(totalSpent);

  if (currentMonthExpenses.length === 0) {
    document.getElementById('stat-top-category').textContent = '—';
  } else {
    const categoryTotals = {};

    currentMonthExpenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const topCategory = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );

    document.getElementById('stat-top-category').textContent = topCategory;
  }

  const daysPassed = now.getDate();
  document.getElementById('stat-daily-average').textContent =
    formatCurrency(totalSpent / daysPassed);

  if (!currentMonthlyBudget || currentMonthlyBudget <= 0) {
    document.getElementById('stat-budget-used').textContent = '—';
  } else {
    const percentageUsed = Math.round((totalSpent / currentMonthlyBudget) * 100);
    document.getElementById('stat-budget-used').textContent = `${percentageUsed}%`;
  }
}

// Spending by category 

// Rebuilds the category summary from the same filtered expense set currently shown to the user
function updateCategoryGrid(filteredExpenses) {
  const categoryGrid = document.getElementById('category-grid');
  const categoryViewNote = document.getElementById('category-view-note');

  categoryGrid.innerHTML = '';

  if (categoryViewNote) {
    categoryViewNote.textContent = getFilterLabel();
  }

  if (filteredExpenses.length === 0) {
    return;
  }

  const categoryTotals = {};

  filteredExpenses.forEach((expense) => {
    categoryTotals[expense.category] =
      (categoryTotals[expense.category] || 0) + expense.amount;
  });

  Object.keys(categoryTotals).forEach((category) => {
    const card = document.createElement('div');
    card.className = `category-card ${getCategoryColorClass(category)}`;
    card.innerHTML = `
      <div class="category-card-top">
        <div class="category-icon-circle">
          ${getCategoryIcon(category)}
        </div>
        <p class="category-card-name">${category}</p>
      </div>
      <p class="category-card-amount">${formatCurrency(categoryTotals[category])}</p>
    `;
    categoryGrid.appendChild(card);
  });
}

// Spending trends — Bar chart

// Aggregates expense totals month by month for the selected bar chart range
function buildBarChartData(rangeMonths) {
  const now = new Date();
  const labels = [];
  const totals = [];

  for (let i = rangeMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-AU', {
      month: 'short',
      year: '2-digit'
    });

    const total = allExpenses
      .filter((expense) => getMonthKey(expense.date) === key)
      .reduce((sum, expense) => sum + expense.amount, 0);

    labels.push(label);
    totals.push(total);
  }

  return { labels, totals };
}

// Destroys and recreates the bar chart when data or theme settings change
function renderBarChart(rangeMonths) {
  const canvas = document.getElementById('bar-chart');
  const emptyState = document.getElementById('bar-chart-empty');

  if (!canvas || !emptyState) return;

  const { labels, totals } = buildBarChartData(rangeMonths);
  const hasData = totals.some((total) => total > 0);

  if (!hasData) {
    canvas.hidden = true;
    emptyState.hidden = false;

    if (barChartInstance) {
      barChartInstance.destroy();
      barChartInstance = null;
    }
    return;
  }

  canvas.hidden = false;
  emptyState.hidden = true;

  const colors = getChartThemeColors();

  if (barChartInstance) {
    barChartInstance.destroy();
  }

  barChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Spending',
          data: totals,
          backgroundColor: colors.barBackground,
          borderColor: colors.barBorder,
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (context) => ` ${formatCurrency(context.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: colors.gridColor
          },
          ticks: {
            color: colors.tickColor,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor
          },
          ticks: {
            color: colors.tickColor,
            font: {
              size: 11
            },
            callback: (value) => `$${value}`
          }
        }
      }
    }
  });
}

// Spending breakdown — Pie chart

// Groups one month's expenses by category for the pie chart
function buildPieChartData(monthKey) {
  const monthExpenses = allExpenses.filter(
    (expense) => getMonthKey(expense.date) === monthKey
  );

  const categoryTotals = {};

  monthExpenses.forEach((expense) => {
    categoryTotals[expense.category] =
      (categoryTotals[expense.category] || 0) + expense.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = labels.map((label) => categoryTotals[label]);
  const colors = labels.map((label) => getCategoryChartColor(label));

  return { labels, data, colors };
}

// Destroys and recreates the pie chart when the selected month or theme changes
function renderPieChart(monthKey) {
  const canvas = document.getElementById('pie-chart');
  const emptyState = document.getElementById('pie-chart-empty');

  if (!canvas || !emptyState) return;

  if (!monthKey) {
    canvas.hidden = true;
    emptyState.hidden = false;

    if (pieChartInstance) {
      pieChartInstance.destroy();
      pieChartInstance = null;
    }
    return;
  }

  const { labels, data, colors } = buildPieChartData(monthKey);
  const hasData = data.length > 0;

  if (!hasData) {
    canvas.hidden = true;
    emptyState.hidden = false;

    if (pieChartInstance) {
      pieChartInstance.destroy();
      pieChartInstance = null;
    }
    return;
  }

  canvas.hidden = false;
  emptyState.hidden = true;

  const chartColors = getChartThemeColors();

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  pieChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: chartColors.tooltipBg,
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '52%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: chartColors.tickColor,
            font: {
              size: 11
            },
            padding: 12,
            boxWidth: 12,
            boxHeight: 12
          }
        },
        tooltip: {
          backgroundColor: chartColors.tooltipBg,
          titleColor: chartColors.tooltipText,
          bodyColor: chartColors.tooltipText,
          borderColor: chartColors.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (context) => ` ${formatCurrency(context.parsed)}`
          }
        }
      }
    }
  });
}

// Dropdown population - Months

// Populates the pie chart month dropdown from the expense data currently stored in MongoDB
function populatePieMonthDropdown() {
  const select = document.getElementById('pie-chart-month');

  if (!select) return;

  const monthKeys = getAvailableMonthKeys();
  const currentValue = select.value;

  select.innerHTML = '';

  if (monthKeys.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No data';
    select.appendChild(option);
    renderPieChart(null);
    return;
  }

  monthKeys.forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = formatMonthKey(key);
    select.appendChild(option);
  });

  if (monthKeys.includes(currentValue)) {
    select.value = currentValue;
  } else {
    select.value = monthKeys[0];
  }

  renderPieChart(select.value);
}

// Populates the table's Specific Month filter using the same available month list
function populateSpecificMonthDropdown() {
  const select = document.getElementById('specific-month-select');

  if (!select) return;

  const monthKeys = getAvailableMonthKeys();
  const currentValue = select.value;

  select.innerHTML = '';

  if (monthKeys.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No data';
    select.appendChild(option);
    currentSpecificMonth = null;
    return;
  }

  monthKeys.forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = formatMonthKey(key);
    select.appendChild(option);
  });

  if (monthKeys.includes(currentValue)) {
    select.value = currentValue;
    currentSpecificMonth = currentValue;
  } else {
    select.value = monthKeys[0];
    currentSpecificMonth = monthKeys[0];
  }
}

// Dashboard update

function updateCharts() {
  const barRangeSelect = document.getElementById('bar-chart-range');
  const pieMonthSelect = document.getElementById('pie-chart-month');

  if (barRangeSelect) {
    const rangeMonths = parseInt(barRangeSelect.value, 10);
    renderBarChart(rangeMonths);
  }

  if (pieMonthSelect) {
    renderPieChart(pieMonthSelect.value || null);
  }
}

// Central dashboard refresh used after data loads, filter changes, sorting, and CRUD actions
function updateDashboard() {
  const filteredExpenses = getFilteredExpenses();
  const sortedExpenses = sortExpenses(filteredExpenses);

  updateOverviewCards();
  renderExpenses(sortedExpenses);
  updateCategoryGrid(filteredExpenses);
}

// Renders the expense table based on the provided expenses array

function renderExpenses(expenses) {
  const expenseTableBody = document.getElementById('expense-table-body');
  const emptyState = document.getElementById('empty-state');

  expenseTableBody.innerHTML = '';

  if (!expenses.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  expenses.forEach((expense) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${expense.title}</td>
      <td>${formatDate(expense.date)}</td>
      <td>${expense.category}</td>
      <td>${expense.description || '—'}</td>
      <td>${expense.paymentMethod || '—'}</td>
      <td>${formatCurrency(expense.amount)}</td>
      <td>
        <div class="actions-cell">
          <button
            class="btn-icon edit-btn"
            data-id="${expense._id}"
            data-title="${expense.title}"
            data-date="${expense.date}"
            data-category="${expense.category}"
            data-description="${expense.description || ''}"
            data-payment-method="${expense.paymentMethod || ''}"
            data-amount="${expense.amount}"
            aria-label="Edit expense"
          >${getActionIcon('edit')}</button>
          <button
            class="btn-icon btn-danger delete-btn"
            data-id="${expense._id}"
            data-title="${expense.title}"
            aria-label="Delete expense"
          >${getActionIcon('delete')}</button>
        </div>
      </td>
    `;

    expenseTableBody.appendChild(row);
  });
}

// DOM ready

document.addEventListener('DOMContentLoaded', () => {
  const introOverlay = document.getElementById('intro-overlay');
  const mainApp = document.getElementById('main-app');
  const themeToggle = document.getElementById('theme-toggle');
  const budgetInputError = document.getElementById('budget-input-error');

  const budgetInput = document.getElementById('budget-input');
  const saveBudgetBtn = document.getElementById('save-budget-btn');
  const clearBudgetBtn = document.getElementById('clear-budget-btn');
  const budgetForm = document.getElementById('budget-form');
  const budgetDisplay = document.getElementById('budget-display');
  const budgetValue = document.getElementById('budget-value');
  const editBudgetBtn = document.getElementById('edit-budget-btn');
  const backToTopBtn = document.getElementById('back-to-top-btn');

  const expenseForm = document.getElementById('expense-form');
  const expenseTitleInput = document.getElementById('expense-title');
  const expenseDateInput = document.getElementById('expense-date');
  const expenseCategoryInput = document.getElementById('expense-category');
  const expenseDescriptionInput = document.getElementById('expense-description');
  const expensePaymentMethodInput = document.getElementById('expense-payment-method');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseAmountError = document.getElementById('expense-amount-error');
  const addExpenseBtn = document.getElementById('add-expense-btn');
  const clearFormBtn = document.getElementById('clear-form-btn');
  const updateExpenseBtn = document.getElementById('update-expense-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const addModeActions = document.getElementById('add-mode-actions');
  const editActions = document.getElementById('edit-actions');
  const expenseTitleError = document.getElementById('expense-title-error');
  const expenseDateError = document.getElementById('expense-date-error');
  const expenseCategoryError = document.getElementById('expense-category-error');

  const deleteModal = document.getElementById('delete-modal');
  const deleteModalMessage = document.getElementById('delete-modal-message');
  const deleteModalTitle = document.getElementById('delete-modal-title');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  const expenseFilter = document.getElementById('expense-filter');
  const specificMonthArea = document.getElementById('specific-month-area');
  const specificMonthSelect = document.getElementById('specific-month-select');
  const expenseSort = document.getElementById('expense-sort');

  const barChartRange = document.getElementById('bar-chart-range');
  const pieChartMonthSelect = document.getElementById('pie-chart-month');

  const calculatorToggleBtn = document.getElementById('calculator-toggle-btn');
  const calculatorCloseBtn = document.getElementById('calculator-close-btn');
  const calculatorPanel = document.getElementById('calculator-panel');
  const calculatorDisplay = document.getElementById('calculator-display');
  const useCalculatorResultBtn = document.getElementById('use-calculator-result-btn');

  let currentEditId = null;
  let pendingDeleteExpense = null;

  let calculatorExpression = '0';
  let calculatorJustEvaluated = false;

  // Theme helpers

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  function loadSavedTheme() {
    const savedTheme = localStorage.getItem('vault-theme') || 'light';
    applyTheme(savedTheme);
  }

  function toggleTheme() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const nextTheme = isDarkMode ? 'light' : 'dark';

  applyTheme(nextTheme);
  localStorage.setItem('vault-theme', nextTheme);

  updateCharts();
}

  // BUdget button state helper

  function updateBudgetButtonStates() {
  const rawValue = budgetInput.value.trim();
  const isValid = validateBudgetInput();

  saveBudgetBtn.disabled = !isValid;
  clearBudgetBtn.disabled = rawValue === '';
}

  // BUdget display helpers

  function showBudgetDisplay(amount) {
    budgetValue.textContent = formatCurrency(amount);
    budgetForm.hidden = true;
    budgetDisplay.hidden = false;
  }

  function showBudgetForm(prefillValue = '') {
  budgetInput.value = prefillValue;
  budgetForm.hidden = false;
  budgetDisplay.hidden = true;
  budgetInput.classList.remove('input-error');
  budgetInputError.hidden = true;
  updateBudgetButtonStates();
}

  function validateBudgetInput() {
  const rawValue = budgetInput.value.trim();
  const parsedValue = parseFloat(rawValue);

  if (rawValue === '') {
    budgetInput.classList.remove('input-error');
    budgetInputError.hidden = true;
    return false;
  }

  if (!parsedValue || parsedValue <= 0) {
    budgetInput.classList.add('input-error');
    budgetInputError.hidden = false;
    budgetInputError.textContent = 'Budget must be greater than 0.';
    return false;
  }

  budgetInput.classList.remove('input-error');
  budgetInputError.hidden = true;
  return true;
}

  // Paymeent method helper

  function updatePaymentMethodColor() {
    if (expensePaymentMethodInput.value === '') {
      expensePaymentMethodInput.classList.remove('has-value');
    } else {
      expensePaymentMethodInput.classList.add('has-value');
    }
  }

  function openDeleteModal(id, title) {
  pendingDeleteExpense = { id, title };
  deleteModalTitle.textContent = `Delete "${title}"?`;
  deleteModalMessage.textContent = 'This cannot be undone.';
  deleteModal.hidden = false;
}

  function closeDeleteModal() {
    pendingDeleteExpense = null;
    deleteModal.hidden = true;
  }

  updateCalculatorDisplay();

if (calculatorToggleBtn) {
  calculatorToggleBtn.addEventListener('click', toggleCalculator);
}

if (calculatorCloseBtn) {
  calculatorCloseBtn.addEventListener('click', closeCalculator);
}

if (calculatorPanel) {
  calculatorPanel.addEventListener('click', (event) => {
    const button = event.target.closest('.calc-btn');
    if (!button) return;

    const { value, action } = button.dataset;

    if (calculatorExpression === 'Error' && action !== 'clear') {
      calculatorExpression = '0';
    }

    if (action === 'clear') {
      clearCalculator();
      return;
    }

    if (action === 'backspace') {
      backspaceCalculator();
      return;
    }

    if (action === 'equals') {
      evaluateCalculator();
      return;
    }

    if (calculatorJustEvaluated && /[0-9.]/.test(value)) {
      calculatorExpression = '0';
      calculatorJustEvaluated = false;
    }

    appendToCalculator(value);
  });
}

if (useCalculatorResultBtn) {
  useCalculatorResultBtn.addEventListener('click', () => {
    if (calculatorExpression === 'Error') return;

    expenseAmountInput.value = calculatorExpression;
    updateExpenseButtonStates();
    closeCalculator();
  });
}

  // Fetch and display budget on load

  async function loadBudget() {
    try {
      const response = await fetch('/api/budget');
      const data = await response.json();

      if (data && data.monthlyBudget) {
        currentMonthlyBudget = data.monthlyBudget;
        showBudgetDisplay(data.monthlyBudget);
      } else {
        currentMonthlyBudget = null;
        showBudgetForm();
      }

      updateDashboard();
    } catch (error) {
      currentMonthlyBudget = null;
      showBudgetForm();
      showFeedback('Could not load budget. Please try again.', 'error');
    }
  }

  // Save budget

  async function saveBudget() {
    const amount = parseFloat(budgetInput.value);

    if (!amount || amount <= 0) {
      showFeedback('Please enter a valid budget amount greater than 0.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudget: amount })
      });

      const data = await response.json();

      if (!response.ok) {
        showFeedback(data.error || 'Failed to save budget.', 'error');
        return;
      }

      currentMonthlyBudget = data.monthlyBudget;
      showBudgetDisplay(data.monthlyBudget);
      updateDashboard();
      showFeedback('Budget saved successfully.', 'success');
    } catch (error) {
      showFeedback('Something went wrong. Please try again.', 'error');
    }
  }

  // Expense form button state helper

  function areRequiredFieldsValid() {
  const title = expenseTitleInput.value.trim() !== '';
  const date = expenseDateInput.value.trim() !== '';
  const category = expenseCategoryInput.value.trim() !== '';

  const amountText = expenseAmountInput.value.trim();
  const amount = parseFloat(amountText);
  const amountValid = amountText !== '' && amount > 0;

  return title && date && category && amountValid;
}

// Enables or disables form buttons based on required fields and whether the user has entered any values
  function updateExpenseButtonStates() {
    const valid = areRequiredFieldsValid();

    const anyValueEntered =
      expenseTitleInput.value.trim() !== '' ||
      expenseDateInput.value.trim() !== '' ||
      expenseCategoryInput.value !== '' ||
      expenseDescriptionInput.value.trim() !== '' ||
      expensePaymentMethodInput.value !== '' ||
      expenseAmountInput.value.trim() !== '';

    addExpenseBtn.disabled = !valid;
    clearFormBtn.disabled = !anyValueEntered;
    updateExpenseBtn.disabled = !valid;
    cancelEditBtn.disabled = false;
  }

  // Form mode helpers

  function switchToAddMode() {
    currentEditId = null;
    addModeActions.hidden = false;
    editActions.hidden = true;
    updateExpenseButtonStates();
  }

  function switchToEditMode() {
    addModeActions.hidden = true;
    editActions.hidden = false;
    updateExpenseButtonStates();
  }

  function clearExpenseForm() {
    expenseTitleInput.value = '';
    expenseDateInput.value = '';
    expenseCategoryInput.value = '';
    expenseDescriptionInput.value = '';
    expensePaymentMethodInput.value = '';
    expenseAmountInput.value = '';
    expenseAmountInput.classList.remove('input-error');
    expenseAmountError.hidden = true;
    updatePaymentMethodColor();
    switchToAddMode();

    expenseTitleInput.classList.remove('input-error');
    expenseDateInput.classList.remove('input-error');
    expenseCategoryInput.classList.remove('input-error');
    expenseAmountInput.classList.remove('input-error');

    expenseTitleError.hidden = true;
    expenseDateError.hidden = true;
    expenseCategoryError.hidden = true;
    expenseAmountError.hidden = true;
  }

  function populateFormForEdit(expense) {
    expenseTitleInput.value = expense.title;
    expenseDateInput.value = expense.date.substring(0, 10);
    expenseCategoryInput.value = expense.category;
    expenseDescriptionInput.value = expense.description || '';
    expensePaymentMethodInput.value = expense.paymentMethod || '';
    expenseAmountInput.value = expense.amount;
    updatePaymentMethodColor();
    updateExpenseButtonStates();
  }

function updateCalculatorDisplay() {
  calculatorDisplay.textContent = calculatorExpression;
}

function openCalculator() {
  calculatorPanel.hidden = false;
  calculatorToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeCalculator() {
  calculatorPanel.hidden = true;
  calculatorToggleBtn.setAttribute('aria-expanded', 'false');
}

function toggleCalculator() {
  if (calculatorPanel.hidden) {
    openCalculator();
  } else {
    closeCalculator();
  }
}

function appendToCalculator(value) {
  if (calculatorExpression === '0' && value !== '.') {
    calculatorExpression = value;
  } else {
    calculatorExpression += value;
  }
  calculatorJustEvaluated = false;
  updateCalculatorDisplay();
}

function clearCalculator() {
  calculatorExpression = '0';
  calculatorJustEvaluated = false;
  updateCalculatorDisplay();
}

function backspaceCalculator() {
  if (calculatorJustEvaluated) {
    clearCalculator();
    return;
  }

  calculatorExpression = calculatorExpression.slice(0, -1);
  if (!calculatorExpression) {
    calculatorExpression = '0';
  }
  updateCalculatorDisplay();
}

// Evaluates the calculator expression and safely falls back to an Error state if parsing fails
function evaluateCalculator() {
  try {
    const safeExpression = calculatorExpression.replace(/%/g, '/100');
    const result = Function(`"use strict"; return (${safeExpression})`)();

    if (!Number.isFinite(result)) {
      throw new Error('Invalid result');
    }

    calculatorExpression = String(Number(result.toFixed(6)));
    calculatorJustEvaluated = true;
    updateCalculatorDisplay();
  } catch (error) {
    calculatorExpression = 'Error';
    calculatorJustEvaluated = true;
    updateCalculatorDisplay();
  }
}

function validateExpenseAmount() {
  const amountText = expenseAmountInput.value.trim();
  const amount = parseFloat(amountText);

  if (amountText === '') {
    expenseAmountInput.classList.add('input-error');
    expenseAmountError.hidden = false;
    expenseAmountError.textContent = 'Amount is required.';
    return false;
  }

  if (!amount || amount <= 0) {
    expenseAmountInput.classList.add('input-error');
    expenseAmountError.hidden = false;
    expenseAmountError.textContent = 'Amount must be greater than 0.';
    return false;
  }

  expenseAmountInput.classList.remove('input-error');
  expenseAmountError.hidden = true;
  return true;
}

function validateExpenseTitle() {
  const title = expenseTitleInput.value.trim();
  const isValid = title !== '';

  expenseTitleInput.classList.toggle('input-error', !isValid);
  expenseTitleError.hidden = isValid;

  return isValid;
}

function validateExpenseDate() {
  const date = expenseDateInput.value.trim();
  const isValid = date !== '';

  expenseDateInput.classList.toggle('input-error', !isValid);
  expenseDateError.hidden = isValid;

  return isValid;
}

function validateExpenseCategory() {
  const category = expenseCategoryInput.value.trim();
  const isValid = category !== '';

  expenseCategoryInput.classList.toggle('input-error', !isValid);
  expenseCategoryError.hidden = isValid;

  return isValid;
}


  // Date helpers

  // Prevents users from selecting future dates directly in the browser date picker
  function setExpenseDateLimit() {
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.setAttribute('max', today);
  }

  // Extra safeguard in case a future date is still submitted manually or bypasses the picker
  function isFutureDate(dateString) {
    if (!dateString) return false;

    const selectedDate = new Date(dateString);
    const today = new Date();

    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selectedDate > today;
  }

  // Fetch expenses and initialize dashboard

  function initializeChartControlsAndRender() {
  const barChartRange = document.getElementById('bar-chart-range');
  const pieChartMonthSelect = document.getElementById('pie-chart-month');

  if (barChartRange) {
    if (!barChartRange.value) {
      barChartRange.value = '6';
    }
    renderBarChart(parseInt(barChartRange.value, 10));
  }

  if (pieChartMonthSelect) {
    renderPieChart(pieChartMonthSelect.value || null);
  }
}

  async function loadExpenses() {
  try {
    const response = await fetch('/api/expenses');
    const expenses = await response.json();

    allExpenses = expenses;

    populatePieMonthDropdown();
    populateSpecificMonthDropdown();

    updateDashboard();

    // Defers chart initialisation until the DOM has finished reflecting the latest dropdown updates
    requestAnimationFrame(() => {
      initializeChartControlsAndRender();
    });
  } catch (error) {
    showFeedback('Could not load expenses. Please try again.', 'error');
  }
}

  // Add expense

  async function addExpense() {
    if (isFutureDate(expenseDateInput.value)) {
      showFeedback('Future dates are not allowed for expenses.', 'error');
      return;
    }

    const payload = {
      title: expenseTitleInput.value.trim(),
      date: expenseDateInput.value,
      category: expenseCategoryInput.value,
      description: expenseDescriptionInput.value.trim(),
      paymentMethod: expensePaymentMethodInput.value || '',
      amount: parseFloat(expenseAmountInput.value)
    };

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showFeedback(data.error || 'Failed to add expense.', 'error');
        return;
      }

      clearExpenseForm();
      await loadExpenses();
      showFeedback('Expense added successfully.', 'success');
    } catch (error) {
      showFeedback('Something went wrong. Please try again.', 'error');
    }
  }

  // Update expense

  async function updateExpense() {
  
  if (!currentEditId) return;

  if (isFutureDate(expenseDateInput.value)) {
    showFeedback('Future dates are not allowed for expenses.', 'error');
    return;
  }

  const payload = {
    title: expenseTitleInput.value.trim(),
    date: expenseDateInput.value,
    category: expenseCategoryInput.value,
    description: expenseDescriptionInput.value.trim(),
    paymentMethod: expensePaymentMethodInput.value || '',
    amount: parseFloat(expenseAmountInput.value)
  };

  try {
    const response = await fetch(`/api/expenses/${currentEditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showFeedback(data.error || 'Failed to update expense.', 'error');
      return;
    }

    clearExpenseForm();
    await loadExpenses();
    showFeedback('Expense updated successfully.', 'success');
  } catch (error) {
    showFeedback('Something went wrong. Please try again.', 'error');
  }
}

  // Delete expense

  async function deleteExpense(id, title) {
  try {
    const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (!response.ok) {
      showFeedback(data.error || 'Failed to delete expense.', 'error');
      return;
    }

    await loadExpenses();
    showFeedback('Expense deleted successfully.', 'success');
  } catch (error) {
    showFeedback('Something went wrong. Please try again.', 'error');
  }
}

  // Event listeners

  loadSavedTheme();

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  budgetInput.addEventListener('input', updateBudgetButtonStates);
  budgetInput.addEventListener('blur', validateBudgetInput);

  budgetForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (saveBudgetBtn.disabled) return;

  saveBudget();
});

  clearBudgetBtn.addEventListener('click', () => {
  budgetInput.value = '';
  budgetInput.classList.remove('input-error');
  budgetInputError.hidden = true;
  updateBudgetButtonStates();
});

  editBudgetBtn.addEventListener('click', () => {
    const currentAmount = budgetValue.textContent.replace(/[^0-9.]/g, '');
    showBudgetForm(currentAmount);
  });

  [
    expenseTitleInput,
    expenseDateInput,
    expenseCategoryInput,
    expenseDescriptionInput,
    expensePaymentMethodInput,
    expenseAmountInput
  ].forEach((field) => {
    field.addEventListener('input', updateExpenseButtonStates);
    field.addEventListener('change', updateExpenseButtonStates);
  });

  expensePaymentMethodInput.addEventListener('change', updatePaymentMethodColor);

  clearFormBtn.addEventListener('click', clearExpenseForm);
  cancelEditBtn.addEventListener('click', clearExpenseForm);

  expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (currentEditId) {
    if (updateExpenseBtn.disabled) return;
    updateExpense();
  } else {
    if (addExpenseBtn.disabled) return;
    addExpense();
  }
});

  expenseFilter.addEventListener('change', () => {
  currentFilter = expenseFilter.value;

  if (currentFilter === 'specific') {
    specificMonthArea.hidden = false;
    currentSpecificMonth = specificMonthSelect.value || null;
  } else {
    specificMonthArea.hidden = true;
    currentSpecificMonth = null;
  }

  updateDashboard();
});

specificMonthSelect.addEventListener('change', () => {
  currentSpecificMonth = specificMonthSelect.value;
  updateDashboard();
});

expenseSort.addEventListener('change', () => {
  currentSort = expenseSort.value;
  updateDashboard();
});

barChartRange.addEventListener('change', () => {
  renderBarChart(parseInt(barChartRange.value, 10));
});

pieChartMonthSelect.addEventListener('change', () => {
  renderPieChart(pieChartMonthSelect.value || null);
});

// Uses event delegation so edit and delete actions continue to work after the table is re-rendered
  document.getElementById('expense-table-body').addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-btn');
    const deleteButton = event.target.closest('.delete-btn');

    if (editButton) {
      const expense = {
        _id: editButton.dataset.id,
        title: editButton.dataset.title,
        date: editButton.dataset.date,
        category: editButton.dataset.category,
        description: editButton.dataset.description,
        paymentMethod: editButton.dataset.paymentMethod,
        amount: editButton.dataset.amount
      };

      currentEditId = expense._id;
      populateFormForEdit(expense);
      switchToEditMode();
      document.getElementById('add-expense-section').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (deleteButton) {
  openDeleteModal(deleteButton.dataset.id, deleteButton.dataset.title);
  }
  });

  setExpenseDateLimit();
  updatePaymentMethodColor();

  //NEW LINE
  if (specificMonthArea) {
  specificMonthArea.hidden = true;
}

  if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

confirmDeleteBtn.addEventListener('click', async () => {
  if (!pendingDeleteExpense) return;

  const { id, title } = pendingDeleteExpense;
  closeDeleteModal();
  await deleteExpense(id, title);
});

deleteModal.addEventListener('click', (event) => {
  if (event.target === deleteModal) {
    closeDeleteModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !deleteModal.hidden) {
    closeDeleteModal();
  }
});

// Field-level validation helpers for inline expense form errors
expenseAmountInput.addEventListener('blur', validateExpenseAmount);
expenseTitleInput.addEventListener('blur', validateExpenseTitle);
expenseDateInput.addEventListener('blur', validateExpenseDate);
expenseCategoryInput.addEventListener('blur', validateExpenseCategory);
expenseCategoryInput.addEventListener('change', validateExpenseCategory);
expenseAmountInput.addEventListener('input', validateExpenseAmount);

  // Intro overlay fade out and initial data load

  // Delays the main app until the intro overlay finishes, then loads budget and expense data
  setTimeout(() => {
    introOverlay.style.opacity = '0';

    introOverlay.addEventListener(
      'transitionend',
      () => {
        introOverlay.hidden = true;
      },
      { once: true }
    );

    mainApp.removeAttribute('hidden');
    loadBudget();
    loadExpenses();
  }, 2000);
});