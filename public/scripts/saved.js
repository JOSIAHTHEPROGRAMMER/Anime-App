import { Watchlist, Auth } from './api.js';
import { showToast, renderEmpty } from './ui.js';

const body         = document.getElementById('watchlistBody');
const tabs         = document.getElementById('watchlistTabs');
const tableWrap    = document.getElementById('watchlistTableWrap');
const loginPrompt  = document.getElementById('loginPrompt');
const summary      = document.getElementById('watchlistSummary');

const STATUS_LABELS = {
  watching:  'Watching',
  completed: 'Completed',
  planning:  'Plan to Watch',
  paused:    'On Hold',
  dropped:   'Dropped',
};

const STATUS_CLASSES = {
  watching:  'status-badge--watching',
  completed: 'status-badge--completed',
  planning:  'status-badge--planning',
  paused:    'status-badge--paused',
  dropped:   'status-badge--dropped',
};

let allEntries   = [];
let activeStatus = '';

// Show login prompt if not logged in
if (!Auth.isLoggedIn()) {
  tableWrap.style.display  = 'none';
  loginPrompt.style.display = '';
} else {
  loadList();
}

async function loadList() {
  body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-faint)">Loading…</td></tr>';
  try {
    const res  = await Watchlist.getAll();
    allEntries = res?.data ?? [];
    renderSummary();
    renderTable(activeStatus);
  } catch {
    showToast('Failed to load your list.', 'error');
  }
}

function renderSummary() {
  const counts = Object.fromEntries(
    Object.keys(STATUS_LABELS).map(s => [s, allEntries.filter(e => e.status === s).length])
  );
  summary.innerHTML = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `<span class="status-badge ${STATUS_CLASSES[s]}">${STATUS_LABELS[s]} · ${n}</span>`)
    .join('');
}

function renderTable(status) {
  const entries = status ? allEntries.filter(e => e.status === status) : allEntries;

  if (!entries.length) {
    body.innerHTML = '';
    // put empty state inside tbody
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;padding:48px 0;color:var(--text-faint)">
      Nothing here yet. <a href="./browse.html" style="color:var(--red)">Browse anime</a> to add some.
    </td>`;
    body.appendChild(tr);
    return;
  }

  body.innerHTML = entries.map(entry => {
    const pct      = entry.totalEpisodes ? Math.round((entry.progress / entry.totalEpisodes) * 100) : 0;
    const badge    = `<span class="status-badge ${STATUS_CLASSES[entry.status] ?? ''}">${STATUS_LABELS[entry.status] ?? entry.status}</span>`;
    const progress = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:0.8rem;color:var(--text-muted)">${entry.progress ?? 0} / ${entry.totalEpisodes || '?'}</span>
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${pct}%"></div>
        </div>
      </div>`;

    return `
      <tr data-id="${entry.malId}">
        <td>
          <div class="watchlist-anime-thumb">
            <img src="${entry.imageUrl ?? ''}" alt="${entry.title}" />
            <a href="./anime.html?id=${entry.malId}"><span>${entry.title}</span></a>
          </div>
        </td>
        <td>
          <select class="status-select" data-id="${entry.malId}" style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);padding:4px 8px;font-size:0.8rem;">
            ${Object.entries(STATUS_LABELS).map(([val, label]) =>
              `<option value="${val}" ${entry.status === val ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </td>
        <td>${progress}</td>
        <td>
          <input type="number" class="progress-input" data-id="${entry.malId}"
            min="0" max="${entry.totalEpisodes || 9999}"
            value="${entry.progress ?? 0}"
            style="width:56px;padding:4px 6px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:0.8rem;" />
        </td>
        <td>
          <button class="btn btn--icon remove-btn" data-id="${entry.malId}" title="Remove">✕</button>
        </td>
      </tr>
    `;
  }).join('');

  // Status change
  body.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = parseInt(sel.dataset.id, 10);
      try {
        await Watchlist.update(id, { status: sel.value });
        const entry = allEntries.find(e => e.malId === id);
        if (entry) entry.status = sel.value;
        renderSummary();
        showToast('Status updated.', 'success');
      } catch {
        showToast('Failed to update status.', 'error');
      }
    });
  });

  // Progress change
  body.querySelectorAll('.progress-input').forEach(inp => {
    inp.addEventListener('change', async () => {
      const id  = parseInt(inp.dataset.id, 10);
      const val = parseInt(inp.value, 10);
      try {
        await Watchlist.update(id, { progress: val });
        const entry = allEntries.find(e => e.malId === id);
        if (entry) entry.progress = val;
        // refresh row progress bar
        const row  = body.querySelector(`tr[data-id="${id}"]`);
        const fill = row?.querySelector('.progress-bar__fill');
        const entry2 = allEntries.find(e => e.malId === id);
        if (fill && entry2?.totalEpisodes) {
          fill.style.width = `${Math.round((val / entry2.totalEpisodes) * 100)}%`;
        }
      } catch {
        showToast('Failed to update progress.', 'error');
      }
    });
  });

  // Remove
  body.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id, 10);
      try {
        await Watchlist.remove(id);
        allEntries = allEntries.filter(e => e.malId !== id);
        renderSummary();
        renderTable(activeStatus);
        showToast('Removed from list.', 'info');
      } catch {
        showToast('Failed to remove.', 'error');
      }
    });
  });
}

// Tab switching
tabs?.addEventListener('click', (e) => {
  const tab = e.target.closest('.watchlist-tab');
  if (!tab) return;
  tabs.querySelectorAll('.watchlist-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeStatus = tab.dataset.status;
  renderTable(activeStatus);
});
