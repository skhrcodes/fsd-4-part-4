/* ---------- Accessible Tabs ---------- */
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const STORAGE_KEYS = {
  activeTab: 'dash.activeTab',
  tasks: 'dash.tasks',
  theme: 'dash.theme',
  settings: 'dash.settings'
};

function setActiveTab(id, { focus = true } = {}) {
  tabs.forEach((t) => {
    const selected = t.id === id;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((p) => {
    const match = p.id === document.getElementById(id).getAttribute('aria-controls');
    p.classList.toggle('hidden', !match);
  });
  localStorage.setItem(STORAGE_KEYS.activeTab, id);
  if (focus) document.getElementById(id).focus();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveTab(tab.id));
  tab.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(tab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(i + 1) % tabs.length];
      setActiveTab(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(i - 1 + tabs.length) % tabs.length];
      setActiveTab(prev.id);
    }
  });
});

/* Restore last active tab */
const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);
if (savedTab && document.getElementById(savedTab)) {
  setActiveTab(savedTab, { focus: false });
}

/* ---------- Theme Toggle ---------- */
const themeToggle = document.getElementById('themeToggle');
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.setAttribute('data-theme', 'light');
    themeToggle.setAttribute('aria-pressed', 'true');
  } else {
    document.body.removeAttribute('data-theme');
    themeToggle.setAttribute('aria-pressed', 'false');
  }
}
applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'light'); // default light for clarity
themeToggle.addEventListener('click', () => {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(STORAGE_KEYS.theme, next);
});

/* ---------- Activity Table (mock data) ---------- */
const activityData = [
  { time: '08:05', user: 'Shikhar', action: 'Logged in', status: 'Success' },
  { time: '08:18', user: 'Admin', action: 'Updated pricing', status: 'Pending' },
  { time: '09:02', user: 'Priya', action: 'Exported report', status: 'Success' },
  { time: '09:10', user: 'Aman', action: 'Reset password', status: 'Failed' },
  { time: '10:22', user: 'Meera', action: 'Invited user', status: 'Success' },
];
const activityBody = document.getElementById('activityBody');
function statusBadgeClass(s) {
  if (s === 'Success') return 'badge ok';
  if (s === 'Pending') return 'badge warn';
  return 'badge bad';
}
function renderActivity() {
  activityBody.innerHTML = activityData.map(row => `
    <tr>
      <td>${row.time}</td>
      <td>${row.user}</td>
      <td>${row.action}</td>
      <td><span class="${statusBadgeClass(row.status)}">${row.status}</span></td>
    </tr>
  `).join('');
}
renderActivity();

/* ---------- Tasks (CRUD with localStorage) ---------- */
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const clearDoneBtn = document.getElementById('clearDone');
const clearAllBtn = document.getElementById('clearAll');

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');

function saveTasks() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}
function renderTasks() {
  if (!tasks.length) {
    taskList.innerHTML = `<li class="muted">No tasks yet. Add your first task!</li>`;
    return;
  }
  taskList.innerHTML = tasks.map((t, idx) => `
    <li class="task-item" data-index="${idx}">
      <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Mark ${t.name} done">
      <span class="name ${t.done ? 'done' : ''}">${t.name}</span>
      <button class="btn ghost small delete" title="Delete task">Delete</button>
    </li>
  `).join('');
}
renderTasks();

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = taskInput.value.trim();
  if (!name) return;
  tasks.push({ name, done: false });
  taskInput.value = '';
  saveTasks(); renderTasks();
});

taskList.addEventListener('click', (e) => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const idx = Number(item.dataset.index);
  if (e.target.matches('input[type="checkbox"]')) {
    tasks[idx].done = e.target.checked;
    saveTasks(); renderTasks();
  } else if (e.target.matches('.delete')) {
    tasks.splice(idx, 1);
    saveTasks(); renderTasks();
  }
});

clearDoneBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  saveTasks(); renderTasks();
});
clearAllBtn.addEventListener('click', () => {
  if (confirm('Clear all tasks?')) {
    tasks = []; saveTasks(); renderTasks();
  }
});

/* ---------- Settings (persist) ---------- */
const settingsForm = document.getElementById('settingsForm');
const displayName = document.getElementById('displayName');
const email = document.getElementById('email');
const emailOptIn = document.getElementById('emailOptIn');
const settingsMsg = document.getElementById('settingsMsg');

function loadSettings() {
  const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
  displayName.value = s.displayName || '';
  email.value = s.email || '';
  emailOptIn.checked = !!s.emailOptIn;
}
function saveSettings(e) {
  e.preventDefault();
  const s = {
    displayName: displayName.value.trim(),
    email: email.value.trim(),
    emailOptIn: emailOptIn.checked
  };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(s));
  settingsMsg.textContent = 'Saved!';
  setTimeout(() => (settingsMsg.textContent = ''), 1500);
}
loadSettings();
settingsForm.addEventListener('submit', saveSettings);

/* ---------- Utilities ---------- */
/* Ensure overview panel visible when JS loads and if savedTab invalid */
if (!savedTab || !document.getElementById(savedTab)) {
  setActiveTab('tab-overview', { focus: false });
}
