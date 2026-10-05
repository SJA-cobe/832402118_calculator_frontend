'use strict';

const apiBase = window.CALCULATOR_API;
const expression = document.querySelector('#expression');
const result = document.querySelector('#result');
const message = document.querySelector('#message');
const historyMessage = document.querySelector('#history-message');
const equals = document.querySelector('#equals');
let page = 1;
let searchQuery = '';
let historyRequest = 0;
let lastRecordId = null;
let memoryBusy = false;
const angleMode = document.querySelector('#angle-mode');

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${apiBase}${path}`, {...options, signal: controller.signal});
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Request failed');
    }
    document.querySelector('#connection').textContent = 'Connected';
    return payload;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) {
      document.querySelector('#connection').textContent = 'Disconnected';
      throw new Error('Cannot reach the server. Start the backend or check your connection.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('error', isError);
}

async function loadHistory() {
  const requestId = ++historyRequest;
  try {
    const params = new URLSearchParams({page, page_size: 5, q: searchQuery});
    const {data} = await request(`/api/history?${params}`);
    if (requestId !== historyRequest) return;
    // If the last item on a later page was deleted, move to the previous page.
    if (page > 1 && !data.items.length) {
      page = Math.max(1, Math.ceil(data.total / 5));
      return loadHistory();
    }
    const list = document.querySelector('#history-list');
    list.replaceChildren();
    document.querySelector('#count').textContent = `${data.total} records`;
    document.querySelector('#page-label').textContent = `Page ${page} of ${Math.max(1, Math.ceil(data.total / 5))}`;
    document.querySelector('#previous').disabled = page === 1;
    document.querySelector('#next').disabled = page * 5 >= data.total;
    if (!data.items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = searchQuery ? 'No matching records' : 'No history yet. Try your first calculation.';
      list.append(empty);
    }
    for (const record of data.items) {
      const row = document.createElement('article');
      row.className = 'record';
      const content = document.createElement('div');
      content.className = 'record-content';
      const reuse = document.createElement('button');
      reuse.type = 'button';
      reuse.className = 'reuse';
      reuse.textContent = record.expression;
      reuse.title = 'Edit this expression again';
      reuse.addEventListener('click', () => {
        expression.value = record.expression;
        angleMode.value = record.angle_mode || 'DEG';
        expression.focus();
        invalidateResult();
      });
      const value = document.createElement('div');
      value.className = 'record-result';
      value.textContent = `= ${record.result}`;
      const time = document.createElement('time');
      time.dateTime = record.created_at;
      time.textContent = `${new Date(record.created_at).toLocaleString('en-US', {hour12: false})} · ${record.angle_mode || 'DEG'}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete record ${record.id}`);
      remove.addEventListener('click', async () => {
        if (!confirm(`Delete the record "${record.expression}"?`)) return;
        remove.disabled = true;
        try {
          await request(`/api/history/${record.id}`, {method: 'DELETE'});
          await loadHistory();
        } catch (error) {
          setMessage(historyMessage, error.message, true);
          remove.disabled = false;
        }
      });
      content.append(reuse, value, time);
      row.append(content, remove);
      list.append(row);
    }
    setMessage(historyMessage, '');
  } catch (error) {
    if (requestId === historyRequest) {
      setMessage(historyMessage, `${error.message}; the displayed history may be out of date`, true);
      document.querySelector('#next').disabled = true;
      document.querySelector('#previous').disabled = true;
    }
  }
}

function invalidateResult() {
  result.textContent = '—';
  setMessage(message, 'Supports parentheses, decimals, and signed numbers');
}

expression.addEventListener('input', invalidateResult);
document.querySelector('#calculate-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (equals.disabled) return;
  const submittedExpression = expression.value;
  const submittedMode = angleMode.value;
  equals.disabled = true;
  result.textContent = '—';
  setMessage(message, 'Calculating...');
  try {
    const {data} = await request('/api/calculate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({expression: submittedExpression, angle_mode: submittedMode}),
    });
    lastRecordId = data.id;
    if (expression.value === submittedExpression && angleMode.value === submittedMode) {
      result.textContent = data.result;
      setMessage(message, 'Calculated and saved to history');
    }
    page = 1;
    await loadHistory();
  } catch (error) {
    if (expression.value === submittedExpression) setMessage(message, error.message, true);
  } finally {
    equals.disabled = false;
  }
});

document.querySelectorAll('.input-keys').forEach((keys) => keys.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.type === 'submit') return;
  if (button.dataset.action === 'clear') {
    expression.value = '';
  } else {
    const start = expression.selectionStart;
    const end = expression.selectionEnd;
    if (button.dataset.action === 'backspace') {
      const from = start === end ? Math.max(0, start - 1) : start;
      expression.setRangeText('', from, end, 'end');
    } else if (expression.value.length - (end - start) + button.dataset.value.length <= 500) {
      expression.setRangeText(button.dataset.value, start, end, 'end');
    }
  }
  expression.focus();
  invalidateResult();
}));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    expression.value = '';
    expression.focus();
    invalidateResult();
  }
});
document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  searchQuery = document.querySelector('#search').value.trim();
  page = 1;
  loadHistory();
});
document.querySelector('#refresh').addEventListener('click', loadHistory);
document.querySelector('#previous').addEventListener('click', () => { page--; loadHistory(); });
document.querySelector('#next').addEventListener('click', () => { page++; loadHistory(); });
document.querySelector('#theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});
request('/api/health').catch(() => {});
loadHistory();

angleMode.addEventListener('change', invalidateResult);

async function loadMemory() {
  try {
    const {data} = await request('/api/memory');
    document.querySelector('#memory-value').textContent = `M = ${data.value}`;
  } catch (error) {
    setMessage(document.querySelector('#memory-message'), error.message, true);
  }
}

document.querySelectorAll('[data-memory]').forEach((button) => {
  button.addEventListener('click', async () => {
    if (memoryBusy) return;
    if (button.dataset.memory !== 'clear' && lastRecordId === null) {
      setMessage(document.querySelector('#memory-message'), 'Complete a successful calculation first', true);
      return;
    }
    memoryBusy = true;
    document.querySelectorAll('[data-memory]').forEach((item) => { item.disabled = true; });
    try {
      const {data} = await request('/api/memory', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: button.dataset.memory, record_id: lastRecordId}),
      });
      document.querySelector('#memory-value').textContent = `M = ${data.value}`;
      setMessage(document.querySelector('#memory-message'), 'Memory updated and saved across reloads and restarts');
    } catch (error) {
      setMessage(document.querySelector('#memory-message'), error.message, true);
    } finally {
      memoryBusy = false;
      document.querySelectorAll('[data-memory]').forEach((item) => { item.disabled = false; });
    }
  });
});

document.querySelector('#memory-recall').addEventListener('click', () => {
  const start = expression.selectionStart;
  const end = expression.selectionEnd;
  if (expression.value.length - (end - start) + 3 <= 500) {
    expression.setRangeText('mem', start, end, 'end');
    expression.focus();
    invalidateResult();
  }
});

document.querySelector('#export').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const {data} = await request('/api/history/export');
    // This only formats database records; no calculation is performed here.
    const csvCell = (value) => {
      let text = String(value);
      if (/^[=+@\-]/.test(text.trimStart())) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows = [['ID', 'Expression', 'Result', 'UTC time', 'Angle mode'],
      ...data.items.map((record) => [record.id, record.expression, record.result,
        record.created_at, record.angle_mode || 'DEG'])];
    const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calculator-history.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(historyMessage, `Exported all ${data.items.length} records across all pages`);
  } catch (error) {
    setMessage(historyMessage, error.message, true);
  } finally {
    button.disabled = false;
  }
});
loadMemory();
