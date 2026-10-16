/* ============================================================
   STUDY TRACKER — app.js v4
   Sửa:
   - Modal giờ: bỏ checkbox, gõ trực tiếp, có nút ✕ xóa
   - Xóa dữ liệu: theo ngày / theo khoảng / tất cả (yêu cầu gõ DELETE)
   - Stock chart: bắt đầu từ ngày học đầu tiên
   - Timeline: có nút 🗑 xóa từng ngày
============================================================ */
(function () {
'use strict';

/* ═══════════════════════════════════════════════════════════
   1. CONST + STATE
═══════════════════════════════════════════════════════════ */
const STORE = {
  DAYS:    'st_days_v3',
  PROFILE: 'st_profile_v3',
  THEME:   'st_theme_v3',
  ROADMAP: 'st_roadmap_v3',
  BG:      'st_bg_v3',
};

const AVATARS = ['🎓','📚','🚀','⭐','🎯','🧠','💡','🔥','🌱','🎨','💻','📝',
                 '🏆','☕','🦉','🐧','🌈','💎','🍀','⚡','🎵','🔭','🌟','📖'];

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const WEEKDAYS_SHORT = ['CN','T2','T3','T4','T5','T6','T7'];
const WEEKDAYS_LONG  = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];

const State = {
  days:    {},
  roadmap: [],
  profile: { name:'', email:'', phone:'', goal:'', dailyGoal:60, avatar:'🎓', avatarImage:'' },
  theme:   'light',
  bg:      { type: 'default', value: '' },
  today:   '',
  viewYear: 0,
  viewMonth: 0,
  modal:   { date: '', minutes: 0, slots: [] },
};

/* ═══════════════════════════════════════════════════════════
   2. UTILS
═══════════════════════════════════════════════════════════ */
const $  = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

const dateKey = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const parseKey = k => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmtMinutes = min => {
  if (!min) return '0m';
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
};
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

let _toastT;
const toast = msg => {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 1800);
};
const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

/* ═══════════════════════════════════════════════════════════
   3. STORAGE
═══════════════════════════════════════════════════════════ */
const Storage = {
  get(k, fb) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; }
    catch (e) { return fb; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  },

  loadAll() {
    State.days    = this.get(STORE.DAYS, {})    || {};
    State.roadmap = this.get(STORE.ROADMAP, []) || [];
    const p = this.get(STORE.PROFILE, null);
    State.profile = {
      name:        (p && p.name)      || '',
      email:       (p && p.email)     || '',
      phone:       (p && p.phone)     || '',
      goal:        (p && p.goal)      || '',
      dailyGoal:   (p && typeof p.dailyGoal === 'number') ? p.dailyGoal : 60,
      avatar:      (p && p.avatar)    || '🎓',
      avatarImage: (p && p.avatarImage) || '',
    };
    const t = this.get(STORE.THEME, null);
    State.theme = (t === 'dark' || t === 'auto') ? t : 'light';

    const bg = this.get(STORE.BG, null);
    State.bg = (bg && typeof bg === 'object') ? bg : { type: 'default', value: '' };
  },

  saveDays()    { this.set(STORE.DAYS, State.days); },
  saveProfile() { this.set(STORE.PROFILE, State.profile); },
  saveRoadmap() { this.set(STORE.ROADMAP, State.roadmap); },
  saveTheme()   { this.set(STORE.THEME, State.theme); },
  saveBg()      { this.set(STORE.BG, State.bg); },

  getDay(k) {
    return State.days[k] || { minutes: 0, goals: [], notes: '', slots: [] };
  },
  ensureDay(k) {
    if (!State.days[k]) {
      State.days[k] = { minutes: 0, goals: [], notes: '', slots: [] };
    }
    const d = State.days[k];
    if (!Array.isArray(d.goals)) d.goals = [];
    if (!Array.isArray(d.slots)) d.slots = [];
    if (typeof d.notes !== 'string') d.notes = '';
    if (typeof d.minutes !== 'number') d.minutes = 0;

    // Migrate slots: [number] → [{hour, text, done}]
    d.slots = d.slots.map(s => {
      if (typeof s === 'number') return { hour: s, text: '', done: false };
      if (s && typeof s === 'object') {
        return {
          hour: typeof s.hour === 'number' ? s.hour : 0,
          text: typeof s.text === 'string' ? s.text : '',
          done: !!s.done,
        };
      }
      return null;
    }).filter(Boolean);

    return d;
  },
};

/* ═══════════════════════════════════════════════════════════
   4. STATS
═══════════════════════════════════════════════════════════ */
const Stats = {
  dayHasActivity(d) {
    if (!d) return false;
    return (d.minutes || 0) > 0
      || (d.goals && d.goals.length > 0)
      || (d.notes && d.notes.trim())
      || (d.slots && d.slots.length > 0);
  },

  summary() {
    let totalMin = 0, daysStudied = 0;
    Object.keys(State.days).forEach(k => {
      const d = State.days[k];
      if (this.dayHasActivity(d)) {
        daysStudied++;
        totalMin += d.minutes || 0;
      }
    });
    return { totalMin, daysStudied, streak: this.calcStreak() };
  },

  calcStreak() {
    let streak = 0;
    const d = new Date();
    let first = true, guard = 0;
    while (guard++ < 3650) {
      const k = dateKey(d);
      if (this.dayHasActivity(State.days[k])) {
        streak++;
        d.setDate(d.getDate() - 1);
        first = false;
      } else if (first && k === State.today) {
        d.setDate(d.getDate() - 1);
        first = false;
      } else break;
    }
    return streak;
  },

  monthTotal(year, month) {
    let total = 0;
    Object.keys(State.days).forEach(k => {
      const [y, m] = k.split('-').map(Number);
      if (y === year && m === month + 1) total += State.days[k].minutes || 0;
    });
    return total;
  },

  lastNDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(dateKey(d));
    }
    return out;
  },
};

/* ═══════════════════════════════════════════════════════════
   5. THEME
═══════════════════════════════════════════════════════════ */
const Theme = {
  init() {
    this.apply(State.theme, false);
    $('#themeToggle').addEventListener('click', () => {
      this.setMode(State.theme === 'dark' ? 'light' : 'dark');
    });
    $$('#themeSegment button').forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.themeValue));
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (State.theme === 'auto') this.apply('auto', true);
    });
  },
  setMode(mode) {
    State.theme = mode;
    Storage.saveTheme();
    this.apply(mode, true);
    this.sync();
  },
  apply(mode, animate = true) {
    if (animate) {
      document.body.classList.add('theme-switching');
      setTimeout(() => document.body.classList.remove('theme-switching'), 50);
    }
    let resolved = mode;
    if (mode === 'auto') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  },
  sync() {
    $$('#themeSegment button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeValue === State.theme);
    });
  },
};

/* ═══════════════════════════════════════════════════════════
   6. BACKGROUND
═══════════════════════════════════════════════════════════ */
const Background = {
  init() {
    this.apply();

    $$('#bgOptions .bg-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        State.bg = { type: sw.dataset.bgType, value: sw.dataset.bgValue || '' };
        Storage.saveBg();
        this.apply();
        this.sync();
      });
    });

    $('#bgApplyColorBtn').addEventListener('click', () => {
      State.bg = { type: 'color', value: $('#bgColorPicker').value };
      Storage.saveBg();
      this.apply();
      this.sync();
      toast('✅ Đã đổi màu nền');
    });

    $('#bgUploadBtn').addEventListener('click', () => $('#bgFile').click());
    $('#bgFile').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = evt => {
        State.bg = { type: 'image', value: evt.target.result };
        Storage.saveBg();
        this.apply();
        this.sync();
        toast('🖼️ Đã đổi ảnh nền');
      };
      reader.readAsDataURL(f);
      e.target.value = '';
    });
  },

  apply() {
    const root = document.documentElement;
    const bg = State.bg || { type: 'default', value: '' };

    if (bg.type === 'default') {
      root.style.setProperty('--app-bg', 'var(--bg)');
      root.style.setProperty('--app-bg-image', 'none');
      document.body.classList.remove('has-bg-image');
    } else if (bg.type === 'color') {
      root.style.setProperty('--app-bg', bg.value || 'var(--bg)');
      root.style.setProperty('--app-bg-image', 'none');
      document.body.classList.remove('has-bg-image');
    } else if (bg.type === 'gradient') {
      root.style.setProperty('--app-bg', bg.value || 'var(--bg)');
      root.style.setProperty('--app-bg-image', 'none');
      document.body.classList.remove('has-bg-image');
    } else if (bg.type === 'image') {
      root.style.setProperty('--app-bg', 'var(--bg)');
      root.style.setProperty('--app-bg-image', `url("${bg.value}")`);
      document.body.classList.add('has-bg-image');
    }
  },

  sync() {
    $$('#bgOptions .bg-swatch').forEach(sw => {
      const match = sw.dataset.bgType === State.bg.type
        && (sw.dataset.bgValue || '') === (State.bg.value || '');
      sw.classList.toggle('active', match);
    });
  },
};

/* ═══════════════════════════════════════════════════════════
   7. PROFILE  ← sửa: thêm listener 2 nút xóa + 3 hàm xóa + chart mới
═══════════════════════════════════════════════════════════ */
const Profile = {
  init() {
    // Emoji picker
    const picker = $('#emojiPicker');
    picker.innerHTML = '';
    AVATARS.forEach(emo => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = emo;
      b.addEventListener('click', () => {
        State.profile.avatar = emo;
        State.profile.avatarImage = '';
        Storage.saveProfile();
        picker.classList.remove('show');
        this.sync();
        Modules.refreshHeader();
      });
      picker.appendChild(b);
    });

    // Avatar menu
    const menu = $('#avatarMenu');
    $('#avatarBtn').addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    menu.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      menu.classList.remove('show');
      if (act === 'upload') $('#avatarFile').click();
      if (act === 'emoji') picker.classList.toggle('show');
      if (act === 'remove') {
        State.profile.avatarImage = '';
        Storage.saveProfile();
        this.sync();
        Modules.refreshHeader();
        toast('🗑 Đã xoá ảnh đại diện');
      }
    });

    $('#avatarFile').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = evt => {
        State.profile.avatarImage = evt.target.result;
        Storage.saveProfile();
        this.sync();
        Modules.refreshHeader();
        toast('✅ Đã đổi avatar');
      };
      reader.readAsDataURL(f);
      e.target.value = '';
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.avatar-wrap')) menu.classList.remove('show');
      if (!e.target.closest('#emojiPicker') && !e.target.closest('#avatarBtn')) {
        picker.classList.remove('show');
      }
    });

    // Inputs
    const bind = (id, key) => {
      $(id).addEventListener('input', e => {
        State.profile[key] = e.target.value;
        Storage.saveProfile();
        Modules.refreshHeader();
        Home.render();
      });
    };
    bind('#profileName',  'name');
    bind('#profileEmail', 'email');
    bind('#profilePhone', 'phone');
    bind('#profileGoal',  'goal');

    $('#saveDailyGoalBtn').addEventListener('click', () => {
      const v = parseInt($('#dailyGoalInput').value, 10);
      if (isNaN(v) || v < 0) { toast('❌ Số phút không hợp lệ'); return; }
      State.profile.dailyGoal = v;
      Storage.saveProfile();
      toast('✅ Đã lưu mục tiêu');
      Home.render();
    });

    // Data — 3 nút xóa + export/import
    $('#exportBtn').addEventListener('click', () => this.exportJSON());
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => this.importJSON(e));
    $('#resetAllBtn').addEventListener('click', () => this.resetAll());
    $('#deleteDayBtn').addEventListener('click', () => this.deleteOneDay());
    $('#deleteRangeBtn').addEventListener('click', () => this.deleteRange());
  },

  sync() {
    $('#profileName').value  = State.profile.name;
    $('#profileEmail').value = State.profile.email;
    $('#profilePhone').value = State.profile.phone;
    $('#profileGoal').value  = State.profile.goal;
    $('#dailyGoalInput').value = State.profile.dailyGoal;
    this.syncAvatar();
    Theme.sync();
    Background.sync();
  },

  syncAvatar() {
    const el = $('#avatarBtn');
    if (State.profile.avatarImage) {
      el.innerHTML = `<img src="${State.profile.avatarImage}" alt="avatar">`;
      el.style.backgroundImage = '';
    } else {
      el.textContent = State.profile.avatar;
      el.style.backgroundImage = '';
    }
  },

  exportJSON() {
    const payload = {
      version: 4,
      exportedAt: new Date().toISOString(),
      profile: State.profile,
      days:    State.days,
      roadmap: State.roadmap,
      theme:   State.theme,
      bg:      State.bg,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `study-${State.today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('📦 Đã xuất file JSON');
  },

  importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.profile) State.profile = { ...State.profile, ...data.profile };
        if (data.days && typeof data.days === 'object') State.days = data.days;
        if (Array.isArray(data.roadmap)) State.roadmap = data.roadmap;
        if (data.theme) State.theme = data.theme;
        if (data.bg) State.bg = data.bg;
        Storage.saveProfile(); Storage.saveDays();
        Storage.saveRoadmap(); Storage.saveTheme(); Storage.saveBg();
        Theme.apply(State.theme, true);
        Background.apply();
        this.sync();
        Modules.refreshAll();
        toast('✅ Đã nhập dữ liệu');
      } catch (err) {
        console.error(err);
        toast('❌ File không hợp lệ');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  },

  /* ── XÓA TẤT CẢ — yêu cầu gõ DELETE ── */
  resetAll() {
    const ans = prompt(
      '⚠️ Sẽ XÓA TẤT CẢ dữ liệu\n' +
      '(bao gồm profile, lộ trình, background)\n\n' +
      'Gõ chính xác chữ: DELETE'
    );
    if (ans !== 'DELETE') { toast('❌ Đã huỷ'); return; }

    State.days = {};
    State.roadmap = [];
    State.profile = { name:'', email:'', phone:'', goal:'', dailyGoal:60, avatar:'🎓', avatarImage:'' };
    State.bg = { type: 'default', value: '' };
    Storage.saveDays(); Storage.saveRoadmap(); Storage.saveProfile(); Storage.saveBg();
    Background.apply(); Background.sync();
    this.sync();
    Modules.refreshAll();
    toast('🗑 Đã xoá tất cả');
  },

  /* ── XÓA 1 NGÀY ── */
  deleteOneDay() {
    const k = $('#deleteDateInput').value;
    if (!k) { toast('⚠️ Chọn ngày trước'); return; }
    if (!State.days[k]) { toast('ℹ️ Ngày này không có dữ liệu'); return; }
    if (!confirm(`Xóa dữ liệu ngày ${k}?`)) return;
    delete State.days[k];
    Storage.saveDays();
    Modules.refreshAll();
    $('#deleteDateInput').value = '';
    toast('🗑 Đã xóa ngày ' + k);
  },

  /* ── XÓA THEO KHOẢNG ── */
  deleteRange() {
    const from = $('#deleteFrom').value;
    const to   = $('#deleteTo').value;
    if (!from || !to) { toast('⚠️ Chọn đủ 2 ngày'); return; }
    if (from > to) { toast('⚠️ Ngày bắt đầu phải trước ngày kết thúc'); return; }

    const toDelete = Object.keys(State.days).filter(k => k >= from && k <= to);
    if (!toDelete.length) { toast('ℹ️ Không có dữ liệu trong khoảng này'); return; }
    if (!confirm(`Xóa ${toDelete.length} ngày (từ ${from} đến ${to})?`)) return;

    toDelete.forEach(k => delete State.days[k]);
    Storage.saveDays();
    Modules.refreshAll();
    $('#deleteFrom').value = '';
    $('#deleteTo').value = '';
    toast(`🗑 Đã xóa ${toDelete.length} ngày`);
  },

  /* ── BIỂU ĐỒ: bắt đầu từ ngày học đầu tiên ── */
  renderStockChart() {
    const svg = $('#stockChart');

    // Tất cả ngày có hoạt động
    const activeKeys = Object.keys(State.days)
      .filter(k => Stats.dayHasActivity(State.days[k]))
      .sort();

    // Chưa có gì → thông báo
    if (!activeKeys.length) {
      svg.innerHTML = `
        <text x="400" y="120" text-anchor="middle"
              fill="#768390" font-size="14" font-family="sans-serif">
          Chưa có dữ liệu học tập
        </text>`;
      return;
    }

    const firstDate = parseKey(activeKeys[0]);
    const todayDate = new Date(State.today);
    const totalDays = Math.floor((todayDate - firstDate) / 86400000) + 1;

    // ≤ 30 ngày → từ ngày đầu đến hôm nay
    // > 30 ngày → 30 ngày gần nhất
    const showDays = Math.min(totalDays, 30);
    const days = [];
    for (let i = showDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(dateKey(d));
    }

    const W = 800, H = 240;
    const PAD = { l: 44, r: 16, t: 16, b: 28 };
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;

    const values = days.map(k => (State.days[k]?.minutes || 0));
    const maxV = Math.max(...values, 30);
    const niceMax = Math.ceil(maxV / 30) * 30;

    const xOf = i => days.length === 1
      ? PAD.l + innerW / 2
      : PAD.l + (innerW * i) / (days.length - 1);
    const yOf = v => PAD.t + innerH - (innerH * v) / niceMax;

    // Grid ngang
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const v = (niceMax / 4) * i;
      const y = yOf(v);
      grid += `
        <line class="grid-line" x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}"/>
        <text class="axis-text" x="${PAD.l - 6}" y="${y + 4}" text-anchor="end">${Math.round(v)}</text>
      `;
    }

    // Đường + vùng
    let lineEl = '', areaEl = '';
    if (days.length >= 2) {
      const pts = days.map((k, i) => `${xOf(i)},${yOf(values[i])}`).join(' ');
      const areaPath = `M ${PAD.l},${PAD.t + innerH} L ${pts.split(' ').join(' L ')} L ${W - PAD.r},${PAD.t + innerH} Z`;
      lineEl = `<polyline class="line" points="${pts}"/>`;
      areaEl = `<path class="area" d="${areaPath}"/>`;
    }

    // Dots
    let dotsEl = '';
    days.forEach((k, i) => {
      dotsEl += `<circle class="dot" cx="${xOf(i)}" cy="${yOf(values[i])}" r="3.5">
                   <title>${k}: ${values[i]} phút</title>
                 </circle>`;
    });

    // Nhãn trục X — giãn cách hợp lý
    let xLabels = '';
    const step = Math.max(1, Math.ceil(days.length / 8));
    days.forEach((k, i) => {
      if (i % step === 0 || i === days.length - 1) {
        const d = parseKey(k);
        xLabels += `<text class="axis-text" x="${xOf(i)}" y="${H - 8}" text-anchor="middle">
          ${d.getDate()}/${d.getMonth()+1}
        </text>`;
      }
    });

    svg.innerHTML = `
      <defs>
        <linearGradient id="stockGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grid}
      ${areaEl}
      ${lineEl}
      ${dotsEl}
      ${xLabels}
    `;
  },
};

/* ═══════════════════════════════════════════════════════════
   8. HOME
═══════════════════════════════════════════════════════════ */
const Home = {
  init() {
    $('#addRoadmapBtn').addEventListener('click', () => this.addRoadmap());
    $('#roadmapInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.addRoadmap(); }
    });
    $('#roadmapTotal').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.addRoadmap(); }
    });

    $('#roadmapList').addEventListener('click', e => {
      const item = e.target.closest('.roadmap-item');
      if (!item) return;
      const id = item.dataset.id;
      const act = e.target.dataset.act;
      if (!act) return;
      if (act === 'del')  this.removeRoadmap(id);
      if (act === 'done') this.completeSession(id);
      if (act === 'undo') this.undoSession(id);
    });
  },

  render() {
    this.renderGreeting();
    this.renderGoalNotif();
    this.renderRoadmap();
    this.renderStats();
    this.renderChart();
  },

  renderGreeting() {
    const h = new Date().getHours();
    let g = 'Xin chào';
    if (h < 11) g = 'Chào buổi sáng';
    else if (h < 14) g = 'Chào buổi trưa';
    else if (h < 18) g = 'Chào buổi chiều';
    else g = 'Chào buổi tối';
    const name = State.profile.name ? `, ${State.profile.name}` : '';
    $('#heroGreeting').textContent = `${g}${name} 👋`;
    const d = new Date();
    $('#heroDate').textContent = `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth()+1}, ${d.getFullYear()}`;
  },

  renderGoalNotif() {
    const goal = State.profile.dailyGoal || 0;
    const todayMin = State.days[State.today]?.minutes || 0;
    const pct = goal > 0 ? Math.min((todayMin / goal) * 100, 100) : 0;
    const remain = Math.max(goal - todayMin, 0);
    const over = todayMin - goal;

    const fill = $('#goalFill');
    fill.style.width = pct + '%';
    fill.classList.toggle('done', pct >= 100 && over <= 0);
    fill.classList.toggle('over', over > 0);

    let msg;
    if (goal === 0) {
      msg = `<span>Chưa đặt mục tiêu. Vào <b>Quản lí</b> để thiết lập.</span>`;
    } else if (remain > 0) {
      msg = `<span>Đã học <b>${todayMin}</b>/${goal} phút — cần thêm <b class="goal-warn">${remain} phút</b> nữa 🎯</span>`;
    } else {
      msg = `<span>🎉 Đã đạt mục tiêu! <b>${todayMin}</b>/${goal} phút${over > 0 ? ` (vượt ${over}p)` : ''}</span>`;
    }
    $('#goalInfo').innerHTML = msg;
  },

  renderRoadmap() {
    const list = $('#roadmapList');
    list.innerHTML = '';
    if (!State.roadmap.length) {
      list.innerHTML = '<div class="empty" style="color:var(--text-mute);text-align:center;padding:14px;font-style:italic;font-size:13px">Chưa có lộ trình. Tạo ở trên 👆</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    State.roadmap.forEach(r => {
      const total = Math.max(1, r.totalSessions || 1);
      const done  = Math.max(0, Math.min(total, r.completedSessions || 0));
      const pct   = Math.round((done / total) * 100);
      const item = document.createElement('div');
      item.className = 'roadmap-item';
      item.dataset.id = r.id;
      item.innerHTML = `
        <div class="roadmap-head">
          <div class="roadmap-info">
            <div class="roadmap-title">${escapeHtml(r.title)}</div>
            <div class="roadmap-meta">
              <span>📚 Buổi: <b>${done}/${total}</b></span>
              <span>✅ Hoàn thành: <b>${pct}%</b></span>
            </div>
          </div>
        </div>
        <div class="roadmap-progress">
          <div class="roadmap-fill ${pct >= 100 ? 'done' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="roadmap-actions">
          <button data-act="done" class="done-btn" ${done >= total ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>+ Hoàn thành 1 buổi</button>
          <button data-act="undo" ${done <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>− Hủy 1 buổi</button>
          <button data-act="del" class="del">🗑 Xoá</button>
        </div>
      `;
      frag.appendChild(item);
    });
    list.appendChild(frag);
  },

  addRoadmap() {
    const inp = $('#roadmapInput');
    const totalInp = $('#roadmapTotal');
    const t = inp.value.trim();
    const total = parseInt(totalInp.value, 10);
    if (!t) { toast('⚠️ Nhập tên lộ trình'); return; }
    if (!total || total < 1) { toast('⚠️ Nhập tổng số buổi'); return; }
    State.roadmap.unshift({
      id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: t,
      totalSessions: total,
      completedSessions: 0,
      createdAt: new Date().toISOString(),
    });
    inp.value = '';
    totalInp.value = '';
    Storage.saveRoadmap();
    this.renderRoadmap();
    toast('🗺️ Đã thêm lộ trình');
  },

  removeRoadmap(id) {
    const idx = State.roadmap.findIndex(r => r.id === id);
    if (idx < 0) return;
    if (!confirm(`Xoá lộ trình "${State.roadmap[idx].title}"?`)) return;
    State.roadmap.splice(idx, 1);
    Storage.saveRoadmap();
    this.renderRoadmap();
    toast('🗑 Đã xoá');
  },

  completeSession(id) {
    const r = State.roadmap.find(x => x.id === id);
    if (!r) return;
    const total = r.totalSessions || 0;
    if ((r.completedSessions || 0) >= total) return;
    r.completedSessions = (r.completedSessions || 0) + 1;
    Storage.saveRoadmap();
    this.renderRoadmap();
    toast(`✅ ${r.completedSessions}/${total} buổi`);
  },

  undoSession(id) {
    const r = State.roadmap.find(x => x.id === id);
    if (!r) return;
    if ((r.completedSessions || 0) <= 0) return;
    r.completedSessions--;
    Storage.saveRoadmap();
    this.renderRoadmap();
    toast(`↩️ Còn ${r.completedSessions}/${r.totalSessions} buổi`);
  },

  renderStats() {
    const s = Stats.summary();
    $('#homeStreak').textContent = s.streak;
    $('#homeDays').textContent = s.daysStudied;
    $('#homeHours').textContent = fmtMinutes(s.totalMin);
    $('#homeAvg').textContent = s.daysStudied ? Math.round(s.totalMin / s.daysStudied) + 'm' : '0m';
  },

  renderChart() {
    const chart = $('#homeChart');
    chart.innerHTML = '';
    const days = Stats.lastNDays(7);
    const maxMin = Math.max(...days.map(k => State.days[k]?.minutes || 0), 1);
    const frag = document.createDocumentFragment();
    days.forEach(k => {
      const min = State.days[k]?.minutes || 0;
      const pct = min > 0 ? Math.max((min / maxMin) * 100, 6) : 2;
      const isToday = k === State.today;
      const d = parseKey(k);
      const wrap = document.createElement('div');
      wrap.className = 'bar-wrap';
      wrap.title = `${k}: ${min} phút`;
      wrap.innerHTML = `
        <div class="bar-val">${min > 0 ? min : ''}</div>
        <div class="bar${isToday ? ' today' : ''}" style="height:${pct}%"></div>
        <div class="bar-label">${WEEKDAYS_SHORT[d.getDay()]}</div>
      `;
      frag.appendChild(wrap);
    });
    chart.appendChild(frag);
  },
};

/* ═══════════════════════════════════════════════════════════
   9. STUDY — timeline  ← sửa: thêm handler nút 🗑
═══════════════════════════════════════════════════════════ */
const Study = {
  init() {
    $('#studyDateInput').value = State.today;

    $('#studyAddBtn').addEventListener('click', () => {
      const k = $('#studyDateInput').value || State.today;
      Calendar.openModal(k);
    });

    // Delegation
    $('#timeline').addEventListener('click', e => {
      // Nút Sửa → mở modal (phải check TRƯỚC header)
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) {
        Calendar.openModal(editBtn.dataset.edit);
        return;
      }
      // Nút Xóa ngày
      const delBtn = e.target.closest('[data-del]');
      if (delBtn) {
        const k = delBtn.dataset.del;
        if (!confirm(`Xóa toàn bộ dữ liệu ngày ${k}?`)) return;
        delete State.days[k];
        Storage.saveDays();
        Study.render();
        Home.render();
        Calendar.render();
        Modules.refreshHeader();
        toast('🗑 Đã xóa ngày ' + k);
        return;
      }
      // Click header (không phải nút) → expand/collapse
      const header = e.target.closest('.day-header');
      if (header) {
        const day = header.closest('.timeline-day');
        day.classList.toggle('expanded');
      }
    });
  },

  render() {
    this.renderSummary();
    this.renderTimeline();
  },

  renderSummary() {
    const s = Stats.summary();
    $('#studyStreak').textContent = s.streak;
    $('#studyHours').textContent = fmtMinutes(s.totalMin);
    $('#studyDays').textContent = s.daysStudied;
  },

  renderTimeline() {
    const container = $('#timeline');
    container.innerHTML = '';

    const activeKeys = Object.keys(State.days)
      .filter(k => Stats.dayHasActivity(State.days[k]))
      .sort((a, b) => b.localeCompare(a));

    if (!activeKeys.length) {
      container.innerHTML = '<div class="card" style="text-align:center;color:var(--text-mute);font-size:14px;padding:30px">Chưa có ngày nào được ghi. Bấm <b>+ Ghi giờ học</b> để bắt đầu 👆</div>';
      return;
    }

    const monthsMap = {};
    activeKeys.forEach(k => {
      const [y, m] = k.split('-');
      const key = `${y}-${m}`;
      if (!monthsMap[key]) monthsMap[key] = [];
      monthsMap[key].push(k);
    });

    const sortedMonths = Object.keys(monthsMap).sort((a, b) => b.localeCompare(a));

    const frag = document.createDocumentFragment();
    sortedMonths.forEach(mKey => {
      const [y, m] = mKey.split('-').map(Number);
      const monthBox = document.createElement('div');
      monthBox.className = 'timeline-month';
      monthBox.innerHTML = `
        <div class="timeline-month-title">📅 ${MONTHS[m - 1]} ${y}</div>
        <div class="timeline-month-body"></div>
      `;
      const body = monthBox.querySelector('.timeline-month-body');

      monthsMap[mKey].forEach(k => {
        body.appendChild(this.buildDay(k));
      });

      frag.appendChild(monthBox);
    });

    container.appendChild(frag);
  },

  buildDay(k) {
    const d = parseKey(k);
    const data = Storage.getDay(k);
    const isToday = k === State.today;
    const minutes = data.minutes || 0;
    const slots = (data.slots || []).slice().sort((a, b) => a.hour - b.hour);

    const day = document.createElement('div');
    day.className = 'timeline-day' + (isToday ? ' today' : '');

    const weekday = WEEKDAYS_SHORT[d.getDay()];
    const dateLabel = `${weekday}, ${d.getDate()}/${d.getMonth()+1}`;

    const slotsHtml = slots.length
      ? slots.map(s => `
          <div class="slot-row ${s.done ? 'done' : ''}">
            <div class="slot-time">${String(s.hour).padStart(2,'0')}:00</div>
            <div class="slot-text">${s.text ? escapeHtml(s.text) : '<i style="color:var(--text-mute)">(chưa ghi nội dung)</i>'}</div>
          </div>
        `).join('')
      : '<div class="day-empty">Chưa có chi tiết khung giờ</div>';

    const notesHtml = data.notes
      ? `<div class="slot-row" style="border-left-color:var(--warning)">
           <div class="slot-time" style="color:var(--warning)">📝</div>
           <div class="slot-text">${escapeHtml(data.notes).replace(/\n/g, '<br>')}</div>
         </div>`
      : '';

    day.innerHTML = `
      <div class="day-header">
        <div class="day-date">${dateLabel}</div>
        ${isToday ? '<div class="day-badge done">Hôm nay</div>' : ''}
        ${minutes > 0 ? `<div class="day-badge">⏱️ ${fmtMinutes(minutes)}</div>` : ''}
        <div class="day-meta">
          <span>${slots.length} khung giờ</span>
          <button class="btn ghost" style="padding:4px 10px;font-size:12px" data-edit="${k}">✏️ Sửa</button>
          <button class="btn ghost" style="padding:4px 10px;font-size:12px;color:var(--danger)" data-del="${k}">🗑</button>
          <span class="day-toggle">▶</span>
        </div>
      </div>
      <div class="day-body">
        <div class="day-body-inner">
          ${slotsHtml}
          ${notesHtml}
        </div>
      </div>
    `;

    return day;
  },
};

/* ═══════════════════════════════════════════════════════════
   10. CALENDAR  ← sửa: modal giờ mới
═══════════════════════════════════════════════════════════ */
const Calendar = {
  init() {
    $('#prevMonth').addEventListener('click', () => this.change(-1));
    $('#nextMonth').addEventListener('click', () => this.change(1));
    $('#todayBtn').addEventListener('click', () => this.goToday());

    $('#calGrid').addEventListener('click', e => {
      const cell = e.target.closest('.cell');
      if (!cell) return;
      this.openModal(cell.dataset.date);
    });

    $$('#hourModal [data-close]').forEach(el => el.addEventListener('click', () => this.closeModal()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });
    $('#modalSave').addEventListener('click', () => this.saveModal());
  },

  render() {
    this.renderSummary();
    this.renderGrid();
  },

  renderSummary() {
    const s = Stats.summary();
    $('#calStreak').textContent = s.streak;
    $('#calHours').textContent = fmtMinutes(s.totalMin);
    $('#calMonthHours').textContent = fmtMinutes(Stats.monthTotal(State.viewYear, State.viewMonth));
  },

  renderGrid() {
    $('#calTitle').textContent = `${MONTHS[State.viewMonth]} ${State.viewYear}`;
    const grid = $('#calGrid');
    grid.innerHTML = '';

    const first = new Date(State.viewYear, State.viewMonth, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth  = new Date(State.viewYear, State.viewMonth + 1, 0).getDate();
    const daysPrev     = new Date(State.viewYear, State.viewMonth, 0).getDate();

    const frag = document.createDocumentFragment();
    for (let i = 0; i < 42; i++) {
      const idx = i - startWeekday;
      let cellDate, other = false;
      if (idx < 0) {
        cellDate = new Date(State.viewYear, State.viewMonth - 1, daysPrev + idx + 1);
        other = true;
      } else if (idx >= daysInMonth) {
        cellDate = new Date(State.viewYear, State.viewMonth + 1, idx - daysInMonth + 1);
        other = true;
      } else {
        cellDate = new Date(State.viewYear, State.viewMonth, idx + 1);
      }

      const k = dateKey(cellDate);
      const data = State.days[k];
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.date = k;
      if (other) cell.classList.add('other');
      if (k === State.today) cell.classList.add('today');

      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = cellDate.getDate();
      cell.appendChild(num);

      if (data) {
        const chips = document.createElement('div');
        chips.className = 'chips';
        if ((data.minutes || 0) > 0) {
          chips.insertAdjacentHTML('beforeend', `<div class="chip t">⏱️ ${fmtMinutes(data.minutes)}</div>`);
        }
        if (data.slots && data.slots.length) {
          chips.insertAdjacentHTML('beforeend', `<div class="chip n">🕐 ${data.slots.length} giờ</div>`);
        }
        cell.appendChild(chips);
      }
      frag.appendChild(cell);
    }
    grid.appendChild(frag);
  },

  change(delta) {
    State.viewMonth += delta;
    if (State.viewMonth < 0)  { State.viewMonth = 11; State.viewYear--; }
    if (State.viewMonth > 11) { State.viewMonth = 0;  State.viewYear++; }
    this.render();
  },

  goToday() {
    const now = new Date();
    State.viewYear = now.getFullYear();
    State.viewMonth = now.getMonth();
    this.render();
  },

  /* ───── MODAL ───── */
  openModal(k) {
    const data = Storage.getDay(k);
    State.modal.date = k;
    State.modal.minutes = data.minutes || 0;
    State.modal.slots = (data.slots || []).map(s => ({
      hour: s.hour,
      text: s.text,
      done: !!s.done,
    }));

    const d = parseKey(k);
    $('#modalTitle').textContent = `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    $('#modalSub').textContent = 'Nhập tổng phút học và chi tiết từng khung giờ';
    $('#modalMinutes').value = State.modal.minutes || '';

    this.renderHourList();
    $('#hourModal').classList.add('show');
  },

  /* ── HÀM MỚI: gõ trực tiếp, có nút ✕ ── */
  renderHourList() {
    const list = $('#hourList');
    list.innerHTML = '';
    const slotMap = {};
    State.modal.slots.forEach(s => { slotMap[s.hour] = s; });

    for (let h = 0; h < 24; h++) {
      const slot = slotMap[h];
      const row = document.createElement('div');
      row.className = 'hour-item';
      row.innerHTML = `
        <span class="hour-label">${String(h).padStart(2,'0')}:00</span>
        <input type="text" data-h="${h}" placeholder="Gõ nội dung giờ này..."
               value="${slot ? escapeHtml(slot.text) : ''}">
        <button type="button" class="hour-clear" data-h="${h}" title="Xóa giờ này">✕</button>
      `;
      list.appendChild(row);
    }

    // Gõ → thêm/cập nhật slot
    list.querySelectorAll('input[type="text"]').forEach(txt => {
      txt.addEventListener('input', () => {
        const h = +txt.dataset.h;
        const val = txt.value.trim();
        const idx = State.modal.slots.findIndex(s => s.hour === h);
        if (val) {
          if (idx >= 0) {
            State.modal.slots[idx].text = val;
            State.modal.slots[idx].done = true;
          } else {
            State.modal.slots.push({ hour: h, text: val, done: true });
          }
        } else if (idx >= 0) {
          State.modal.slots.splice(idx, 1);
        }
      });
    });

    // Nút ✕ → xóa
    list.querySelectorAll('.hour-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const h = +btn.dataset.h;
        const txt = list.querySelector(`input[type="text"][data-h="${h}"]`);
        txt.value = '';
        State.modal.slots = State.modal.slots.filter(s => s.hour !== h);
        txt.focus();
      });
    });
  },

  /* ── HÀM MỚI: đọc từ DOM cho chắc ── */
  saveModal() {
    const k = State.modal.date;
    const mins = Math.max(0, parseInt($('#modalMinutes').value, 10) || 0);

    const list = $('#hourList');
    const slots = [];
    list.querySelectorAll('input[type="text"]').forEach(txt => {
      const val = txt.value.trim();
      if (val) slots.push({ hour: +txt.dataset.h, text: val, done: true });
    });

    const dayData = Storage.ensureDay(k);
    dayData.minutes = mins;
    dayData.slots = slots.sort((a, b) => a.hour - b.hour);

    Storage.saveDays();
    this.closeModal();
    this.render();
    Study.render();
    Home.render();
    Modules.refreshHeader();
    toast('✅ Đã lưu');
  },

  closeModal() {
    $('#hourModal').classList.remove('show');
  },
};

/* ═══════════════════════════════════════════════════════════
   11. ROUTER
═══════════════════════════════════════════════════════════ */
const Router = {
  current: 'home',
  PAGES: ['home', 'study', 'calendar', 'manage'],
  init() {
    $$('.nav-link').forEach(btn => {
      btn.addEventListener('click', () => this.go(btn.dataset.page));
    });
    $('#navUser').addEventListener('click', () => this.go('manage'));
    const hash = location.hash.replace('#', '');
    if (this.PAGES.includes(hash)) this.go(hash, false);
  },
  go(page, updateHash = true) {
    if (!this.PAGES.includes(page)) page = 'home';
    if (page === this.current && updateHash) return;
    this.current = page;

    $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $$('.page').forEach(p => p.classList.remove('active'));
    const el = $('#page-' + page);
    if (el) el.classList.add('active');

    if (page === 'home')     Home.render();
    if (page === 'study')    Study.render();
    if (page === 'calendar') Calendar.render();
    if (page === 'manage') {
      Profile.sync();
      requestAnimationFrame(() => Profile.renderStockChart());
    }

    if (updateHash) location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};

/* ═══════════════════════════════════════════════════════════
   12. SEARCH
═══════════════════════════════════════════════════════════ */
const Search = {
  init() {
    const inp = $('#globalSearch');
    const box = $('#searchResults');

    inp.addEventListener('input', debounce(() => {
      const q = inp.value.trim().toLowerCase();
      if (!q) { box.classList.remove('show'); return; }

      const results = [];

      State.roadmap.forEach(r => {
        if (r.title.toLowerCase().includes(q)) {
          results.push({
            type: '🗺️ Lộ trình',
            title: r.title,
            preview: `${r.completedSessions || 0}/${r.totalSessions || 1} buổi`,
            page: 'home',
          });
        }
      });

      Object.keys(State.days).forEach(k => {
        const d = State.days[k];
        if (!d) return;
        if (d.notes && d.notes.toLowerCase().includes(q)) {
          results.push({
            type: '📝 Ghi chú · ' + k,
            title: d.notes.slice(0, 60) + (d.notes.length > 60 ? '...' : ''),
            preview: '',
            page: 'study',
          });
        }
        (d.slots || []).forEach(s => {
          if (s.text && s.text.toLowerCase().includes(q)) {
            results.push({
              type: `🕐 ${String(s.hour).padStart(2,'0')}:00 · ${k}`,
              title: s.text,
              preview: '',
              page: 'study',
            });
          }
        });
      });

      box.innerHTML = '';
      if (!results.length) {
        box.innerHTML = '<div class="search-empty">Không tìm thấy kết quả</div>';
      } else {
        results.slice(0, 20).forEach(r => {
          const el = document.createElement('div');
          el.className = 'search-item';
          el.innerHTML = `
            <div class="si-type">${escapeHtml(r.type)}</div>
            <div class="si-title">${escapeHtml(r.title)}</div>
            ${r.preview ? `<div class="si-preview">${escapeHtml(r.preview)}</div>` : ''}
          `;
          el.addEventListener('click', () => {
            Router.go(r.page);
            box.classList.remove('show');
            inp.value = '';
          });
          box.appendChild(el);
        });
      }
      box.classList.add('show');
    }, 180));

    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-search')) box.classList.remove('show');
    });
  },
};

/* ═══════════════════════════════════════════════════════════
   13. MODULES
═══════════════════════════════════════════════════════════ */
const Modules = {
  refreshHeader() {
    $('#navUserName').textContent = State.profile.name || 'Khách';
    const s = Stats.summary();
    $('#navUserStreak').textContent = `🔥 ${s.streak} ngày`;

    const av = $('#navAvatar');
    if (State.profile.avatarImage) {
      av.innerHTML = `<img src="${State.profile.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      av.style.background = 'transparent';
    } else {
      av.textContent = State.profile.avatar;
      av.style.background = '';
    }
  },
  refreshAll() {
    this.refreshHeader();
    Home.render();
    Study.render();
    Calendar.render();
    Profile.sync();
    if (Router.current === 'manage') Profile.renderStockChart();
  },
};

/* ═══════════════════════════════════════════════════════════
   14. INIT
═══════════════════════════════════════════════════════════ */
function init() {
  const now = new Date();
  State.today = dateKey(now);
  State.viewYear = now.getFullYear();
  State.viewMonth = now.getMonth();

  Storage.loadAll();

  Theme.init();
  Background.init();
  Profile.init();
  Home.init();
  Study.init();
  Calendar.init();
  Search.init();
  Router.init();

  Modules.refreshAll();

  window.addEventListener('beforeunload', () => {
    Storage.saveDays();
    Storage.saveProfile();
    Storage.saveRoadmap();
    Storage.saveBg();
  });

  console.log('%c✅ Study Tracker v4 ready!', 'color:#4f46e5;font-weight:bold;font-size:13px;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();