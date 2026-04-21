/* ===== Takkie — app.js ===== */

// ── Service worker registratie ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registratie mislukt:', err);
    });
  });
}

// ── Kleur configuratie ──────────────────────────────────────────────────────
const COLORS = [
  { key: 'coral',  label: 'Rood',   fill: '#F0997B', bg: '#FAECE7', txt: '#D85A30' },
  { key: 'teal',   label: 'Groen',  fill: '#5DCAA5', bg: '#E1F5EE', txt: '#0F6E56' },
  { key: 'amber',  label: 'Geel',   fill: '#EF9F27', bg: '#FAEEDA', txt: '#BA7517' },
  { key: 'purple', label: 'Paars',  fill: '#7F77DD', bg: '#EEEDFE', txt: '#534AB7' },
  { key: 'pink',   label: 'Roze',   fill: '#D4537E', bg: '#FBEAF0', txt: '#993556' },
];

// ── State ───────────────────────────────────────────────────────────────────
let tasks    = JSON.parse(localStorage.getItem('takkie') || '[]');
let filter   = 'alle';
let modalMode = null;   // 'task' | 'sub' | 'subsub'
let editCtx  = null;    // { ti } or { ti, si }
let selColor = 'coral';

// ── Persistence ─────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('takkie', JSON.stringify(tasks));
}

// ── Utilities ───────────────────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function checkSVG() {
  return `<svg viewBox="0 0 10 8"><polyline points="1,4 3.5,7 9,1"/></svg>`;
}

// Count done/total across subtask tree
function countProgress(subs) {
  let tot = 0, done = 0;
  subs.forEach(s => {
    if (s.subs && s.subs.length) {
      s.subs.forEach(ss => { tot++; if (ss.done) done++; });
    } else {
      tot++; if (s.done) done++;
    }
  });
  return { tot, done };
}

// ── Render filters ───────────────────────────────────────────────────────────
function renderFilters() {
  const opts = ['alle', 'actief', 'klaar'];
  document.getElementById('filterBar').innerHTML = opts
    .map(o => `<button class="chip${filter === o ? ' active' : ''}" data-filter="${o}">
      ${o.charAt(0).toUpperCase() + o.slice(1)}
    </button>`)
    .join('');
}

// ── Render tasks ─────────────────────────────────────────────────────────────
function renderTasks() {
  const el = document.getElementById('main');
  let list = tasks;
  if (filter === 'actief') list = tasks.filter(t => !t.done);
  if (filter === 'klaar')  list = tasks.filter(t =>  t.done);

  if (!list.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📋</div>
        <p>Geen taken hier!<br>Tik + om te beginnen.</p>
      </div>`;
    return;
  }

  el.innerHTML = list.map(t => taskHTML(t, tasks.indexOf(t))).join('');
}

// ── Task HTML ────────────────────────────────────────────────────────────────
function taskHTML(t, ti) {
  const subs = t.subs || [];
  const { tot, done } = countProgress(subs);
  const pct = tot ? Math.round(done / tot * 100) : 0;
  const color = COLORS.find(c => c.key === t.color) || COLORS[0];

  const progressBar = tot
    ? `<div class="progress-wrap">
         <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
         <span class="progress-txt">${done}/${tot}</span>
       </div>`
    : '';

  const subsHTML = t.open
    ? subs.map((s, si) => subHTML(t, ti, s, si)).join('') +
      `<button class="add-sub-btn" data-action="addSub" data-ti="${ti}">＋ Subtaak toevoegen</button>`
    : '';

  return `
<div class="task-card${t.done ? ' done' : ''}" id="tc-${t.id}">
  <div class="task-row" data-action="toggleExpand" data-ti="${ti}">
    <div class="check-wrap">
      <div class="check${t.done ? ' done' : ''}" data-action="toggleTask" data-ti="${ti}">
        ${checkSVG()}
      </div>
    </div>
    <div class="task-main">
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-meta">
        <span class="badge" style="background:${color.bg};color:${color.txt}">${color.label}</span>
      </div>
      ${progressBar}
    </div>
    <div class="task-actions">
      <button class="icon-btn" data-action="deleteTask" data-ti="${ti}" aria-label="Verwijder taak">✕</button>
      <span class="expand-icon" style="transform:rotate(${t.open ? 90 : 0}deg)">▶</span>
    </div>
  </div>
  ${t.open ? `<div class="subtasks">${subsHTML}</div>` : ''}
</div>`;
}

// ── Subtask HTML ─────────────────────────────────────────────────────────────
function subHTML(t, ti, s, si) {
  const ssubs = s.subs || [];
  const ssubsHTML = ssubs.map((ss, ssi) => ssubHTML(ti, si, ss, ssi)).join('');

  return `
<div class="subtask-row">
  <div class="mini-check${s.done ? ' done' : ''}" data-action="toggleSub" data-ti="${ti}" data-si="${si}">
    ${checkSVG()}
  </div>
  <div class="subtask-main">
    <div class="subtask-title${s.done ? ' done' : ''}">${esc(s.title)}</div>
    <div class="subsubtasks">
      ${ssubsHTML}
      <button class="add-subsub-btn" data-action="addSubSub" data-ti="${ti}" data-si="${si}">＋ Sub-subtaak toevoegen</button>
    </div>
  </div>
  <button class="icon-btn" data-action="deleteSub" data-ti="${ti}" data-si="${si}" aria-label="Verwijder subtaak">✕</button>
</div>`;
}

// ── Sub-subtask HTML ──────────────────────────────────────────────────────────
function ssubHTML(ti, si, ss, ssi) {
  return `
<div class="subsubtask-row">
  <div class="mini-check${ss.done ? ' done' : ''}" data-action="toggleSSub" data-ti="${ti}" data-si="${si}" data-ssi="${ssi}">
    ${checkSVG()}
  </div>
  <span class="subsubtask-title${ss.done ? ' done' : ''}">${esc(ss.title)}</span>
  <button class="icon-btn" data-action="deleteSSub" data-ti="${ti}" data-si="${si}" data-ssi="${ssi}" aria-label="Verwijder sub-subtaak">✕</button>
</div>`;
}

// ── Event delegation ──────────────────────────────────────────────────────────
document.getElementById('main').addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const action = el.dataset.action;
  const ti  = el.dataset.ti  !== undefined ? +el.dataset.ti  : undefined;
  const si  = el.dataset.si  !== undefined ? +el.dataset.si  : undefined;
  const ssi = el.dataset.ssi !== undefined ? +el.dataset.ssi : undefined;

  switch (action) {
    case 'toggleExpand': {
      // Don't expand when clicking check/delete
      if (e.target.closest('[data-action="toggleTask"]') ||
          e.target.closest('[data-action="deleteTask"]')) break;
      tasks[ti].open = !tasks[ti].open;
      save(); renderTasks();
      break;
    }
    case 'toggleTask': {
      e.stopPropagation();
      tasks[ti].done = !tasks[ti].done;
      save(); renderTasks();
      break;
    }
    case 'toggleSub': {
      tasks[ti].subs[si].done = !tasks[ti].subs[si].done;
      save(); renderTasks();
      break;
    }
    case 'toggleSSub': {
      tasks[ti].subs[si].subs[ssi].done = !tasks[ti].subs[si].subs[ssi].done;
      save(); renderTasks();
      break;
    }
    case 'deleteTask': {
      e.stopPropagation();
      if (confirm('Taak verwijderen?')) {
        tasks.splice(ti, 1);
        save(); renderTasks();
      }
      break;
    }
    case 'deleteSub': {
      tasks[ti].subs.splice(si, 1);
      save(); renderTasks();
      break;
    }
    case 'deleteSSub': {
      tasks[ti].subs[si].subs.splice(ssi, 1);
      save(); renderTasks();
      break;
    }
    case 'addSub': {
      e.stopPropagation();
      openSubModal(ti);
      break;
    }
    case 'addSubSub': {
      e.stopPropagation();
      openSubSubModal(ti, si);
      break;
    }
  }
});

document.getElementById('filterBar').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  filter = chip.dataset.filter;
  renderFilters();
  renderTasks();
});

// ── Modal ─────────────────────────────────────────────────────────────────────
function buildColorRow() {
  document.getElementById('colorRow').innerHTML = COLORS
    .map(c => `<div class="color-dot${selColor === c.key ? ' sel' : ''}"
                    style="background:${c.fill}"
                    data-color="${c.key}"
                    title="${c.label}">
               </div>`)
    .join('');
}

document.getElementById('colorRow').addEventListener('click', e => {
  const dot = e.target.closest('.color-dot');
  if (!dot) return;
  selColor = dot.dataset.color;
  buildColorRow();
});

function openModal(title, showColors) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('taskInput').value = '';
  document.getElementById('colorRow').style.display = showColors ? 'flex' : 'none';
  if (showColors) buildColorRow();
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('taskInput').focus(), 150);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function openTaskModal() {
  modalMode = 'task';
  editCtx = null;
  selColor = 'coral';
  openModal('Nieuwe taak', true);
}

function openSubModal(ti) {
  modalMode = 'sub';
  editCtx = { ti };
  openModal('Nieuwe subtaak', false);
}

function openSubSubModal(ti, si) {
  modalMode = 'subsub';
  editCtx = { ti, si };
  openModal('Nieuwe sub-subtaak', false);
}

function saveTask() {
  const val = document.getElementById('taskInput').value.trim();
  if (!val) {
    document.getElementById('taskInput').focus();
    return;
  }

  if (modalMode === 'task') {
    tasks.unshift({
      id: uid(), title: val, color: selColor,
      done: false, open: true, subs: []
    });
  } else if (modalMode === 'sub') {
    const { ti } = editCtx;
    tasks[ti].subs.push({ id: uid(), title: val, done: false, subs: [] });
    tasks[ti].open = true;
  } else if (modalMode === 'subsub') {
    const { ti, si } = editCtx;
    tasks[ti].subs[si].subs.push({ id: uid(), title: val, done: false });
  }

  save();
  closeModal();
  renderTasks();
}

// ── Modal button listeners ────────────────────────────────────────────────────
document.getElementById('addBtn').addEventListener('click', openTaskModal);
document.getElementById('saveBtn').addEventListener('click', saveTask);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});
document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveTask();
  if (e.key === 'Escape') closeModal();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
renderFilters();
renderTasks();
