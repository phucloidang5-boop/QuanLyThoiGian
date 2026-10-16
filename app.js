    /* ═══════════════════════════════════════════════════════════
    STUDY TRACKER — app.js
    Full: Gốc + Giai đoạn 1 + Giai đoạn 2
    ═══════════════════════════════════════════════════════════ */
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
    TODOS:   'st_todos_v1',
    FREEZE:  'st_freeze_v1',
    NOTIF:   'st_notif_v1',
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
        return State.days[k] || { minutes: 0, goals: [], notes: '', slots: [], sessions: [] };
    },
    ensureDay(k) {
        if (!State.days[k]) {
        State.days[k] = { minutes: 0, goals: [], notes: '', slots: [], sessions: [] };
        }
        const d = State.days[k];
        if (!Array.isArray(d.goals)) d.goals = [];
        if (!Array.isArray(d.slots)) d.slots = [];
        if (!Array.isArray(d.sessions)) d.sessions = [];
        if (typeof d.notes !== 'string') d.notes = '';
        if (typeof d.minutes !== 'number') d.minutes = 0;

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
        || (d.slots && d.slots.length > 0)
        || (d.sessions && d.sessions.length > 0);
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
        const dayData = State.days[k];
        const hasActivity = dayData && Stats.dayHasActivity(dayData);
        const isFrozen = (typeof StreakFreeze !== 'undefined' && StreakFreeze.isFrozen)
            ? StreakFreeze.isFrozen(k) : false;

        if (hasActivity || isFrozen) {
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
    7. PROFILE
    ═══════════════════════════════════════════════════════════ */
    const Profile = {
    init() {
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
        version: 5,
        exportedAt: new Date().toISOString(),
        profile: State.profile,
        days:    State.days,
        roadmap: State.roadmap,
        theme:   State.theme,
        bg:      State.bg,
        todos:   (typeof TodoManager !== 'undefined') ? TodoManager.todos : [],
        freeze:  (typeof StreakFreeze !== 'undefined') ? {
            freezes: StreakFreeze.freezes,
            history: StreakFreeze.history,
            autoMode: StreakFreeze.autoMode,
        } : null,
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

            // Todos
            if (Array.isArray(data.todos) && typeof TodoManager !== 'undefined') {
            TodoManager.todos = data.todos;
            TodoManager.save();
            }

            // Freeze
            if (data.freeze && typeof StreakFreeze !== 'undefined') {
            StreakFreeze.freezes = data.freeze.freezes || 3;
            StreakFreeze.history = data.freeze.history || [];
            StreakFreeze.autoMode = !!data.freeze.autoMode;
            StreakFreeze.save();
            }

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

    resetAll() {
        const ans = prompt(
        '⚠️ Sẽ XÓA TẤT CẢ dữ liệu\n' +
        '(bao gồm profile, lộ trình, background, todo)\n\n' +
        'Gõ chính xác chữ: DELETE'
        );
        if (ans !== 'DELETE') { toast('❌ Đã huỷ'); return; }

        try { this.exportJSON(); } catch (e) {}

        State.days = {};
        State.roadmap = [];
        State.profile = { name:'', email:'', phone:'', goal:'', dailyGoal:60, avatar:'🎓', avatarImage:'' };
        State.bg = { type: 'default', value: '' };
        Storage.saveDays(); Storage.saveRoadmap(); Storage.saveProfile(); Storage.saveBg();

        if (typeof TodoManager !== 'undefined') {
        TodoManager.todos = [];
        TodoManager.save();
        }
        if (typeof StreakFreeze !== 'undefined') {
        StreakFreeze.freezes = 3;
        StreakFreeze.history = [];
        StreakFreeze.save();
        }

        Background.apply(); Background.sync();
        this.sync();
        Modules.refreshAll();
        toast('🗑 Đã xoá tất cả');
    },

    deleteOneDay() {
        const k = $('#deleteDateInput').value;
        if (!k) { toast('⚠️ Chọn ngày trước'); return; }
        if (!State.days[k]) { toast('ℹ️ Ngày này không có dữ liệu'); return; }
        if (!confirm(`Xóa dữ liệu ngày ${k}?`)) return;

        const backup = JSON.parse(JSON.stringify(State.days[k]));
        delete State.days[k];
        Storage.saveDays();
        Modules.refreshAll();
        $('#deleteDateInput').value = '';

        Undo.push(`Đã xóa ngày ${k}`, () => {
        State.days[k] = backup;
        Storage.saveDays();
        Modules.refreshAll();
        });
        toast('🗑 Đã xóa ngày ' + k);
    },

    deleteRange() {
        const from = $('#deleteFrom').value;
        const to   = $('#deleteTo').value;
        if (!from || !to) { toast('⚠️ Chọn đủ 2 ngày'); return; }
        if (from > to) { toast('⚠️ Ngày bắt đầu phải trước ngày kết thúc'); return; }

        const toDelete = Object.keys(State.days).filter(k => k >= from && k <= to);
        if (!toDelete.length) { toast('ℹ️ Không có dữ liệu trong khoảng này'); return; }
        if (!confirm(`Xóa ${toDelete.length} ngày (từ ${from} đến ${to})?`)) return;

        const backup = {};
        toDelete.forEach(k => { backup[k] = State.days[k]; delete State.days[k]; });
        Storage.saveDays();
        Modules.refreshAll();
        $('#deleteFrom').value = '';
        $('#deleteTo').value = '';

        Undo.push(`Đã xóa ${toDelete.length} ngày`, () => {
        Object.keys(backup).forEach(k => { State.days[k] = backup[k]; });
        Storage.saveDays();
        Modules.refreshAll();
        });
        toast(`🗑 Đã xóa ${toDelete.length} ngày`);
    },

    renderStockChart() {
        const svg = $('#stockChart');
        const activeKeys = Object.keys(State.days)
        .filter(k => Stats.dayHasActivity(State.days[k]))
        .sort();

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

        let grid = '';
        for (let i = 0; i <= 4; i++) {
        const v = (niceMax / 4) * i;
        const y = yOf(v);
        grid += `
            <line class="grid-line" x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}"/>
            <text class="axis-text" x="${PAD.l - 6}" y="${y + 4}" text-anchor="end">${Math.round(v)}</text>
        `;
        }

        let lineEl = '', areaEl = '';
        if (days.length >= 2) {
        const pts = days.map((k, i) => `${xOf(i)},${yOf(values[i])}`).join(' ');
        const areaPath = `M ${PAD.l},${PAD.t + innerH} L ${pts.split(' ').join(' L ')} L ${W - PAD.r},${PAD.t + innerH} Z`;
        lineEl = `<polyline class="line" points="${pts}"/>`;
        areaEl = `<path class="area" d="${areaPath}"/>`;
        }

        let dotsEl = '';
        days.forEach((k, i) => {
        dotsEl += `<circle class="dot" cx="${xOf(i)}" cy="${yOf(values[i])}" r="3.5">
                    <title>${k}: ${values[i]} phút</title>
                    </circle>`;
        });

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
        Heatmap.render();
        TodoManager.render();
        StreakFreeze.render();
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
        list.innerHTML = '<div class="empty-state"><span class="es-icon">🗺️</span><div class="es-title">Chưa có lộ trình</div><div class="es-desc">Tạo lộ trình học đầu tiên ở trên 👆</div></div>';
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
        const removed = State.roadmap[idx];
        State.roadmap.splice(idx, 1);
        Storage.saveRoadmap();
        this.renderRoadmap();

        Undo.push(`Đã xóa lộ trình "${removed.title}"`, () => {
        State.roadmap.splice(idx, 0, removed);
        Storage.saveRoadmap();
        Home.renderRoadmap();
        });
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
    9. STUDY
    ═══════════════════════════════════════════════════════════ */
    const Study = {
    init() {
        $('#studyDateInput').value = State.today;

        $('#studyAddBtn').addEventListener('click', () => {
        const k = $('#studyDateInput').value || State.today;
        Calendar.openModal(k);
        });

        $('#timeline').addEventListener('click', e => {
        const editBtn = e.target.closest('[data-edit]');
        if (editBtn) {
            Calendar.openModal(editBtn.dataset.edit);
            return;
        }
        const delBtn = e.target.closest('[data-del]');
        if (delBtn) {
            const k = delBtn.dataset.del;
            if (!confirm(`Xóa toàn bộ dữ liệu ngày ${k}?`)) return;
            const backup = JSON.parse(JSON.stringify(State.days[k]));
            delete State.days[k];
            Storage.saveDays();
            Study.render();
            Home.render();
            Calendar.render();
            Modules.refreshHeader();
            Undo.push(`Đã xóa ngày ${k}`, () => {
            State.days[k] = backup;
            Storage.saveDays();
            Study.render(); Home.render(); Calendar.render();
            Modules.refreshHeader();
            });
            toast('🗑 Đã xóa ngày ' + k);
            return;
        }
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
        container.innerHTML = '<div class="empty-state"><span class="es-icon">📖</span><div class="es-title">Chưa có ngày nào được ghi</div><div class="es-desc">Bấm "+ Ghi giờ học" để bắt đầu</div></div>';
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

        let slotsHtml = '';
        if (slots.length) {
        slotsHtml = slots.map(s => `
            <div class="slot-row ${s.done ? 'done' : ''}">
            <div class="slot-time">${String(s.hour).padStart(2,'0')}:00</div>
            <div class="slot-text">${s.text ? escapeHtml(s.text) : '<i style="color:var(--text-mute)">(chưa ghi nội dung)</i>'}</div>
            </div>
        `).join('');
        } else {
        slotsHtml = '<div class="day-empty">Chưa có chi tiết khung giờ</div>';
        }

        const sessions = data.sessions || [];
        let sessionsHtml = '';
        if (sessions.length) {
        sessionsHtml = sessions.map(s => {
            const time = new Date(s.at).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
            const stars = '★'.repeat(s.focus || 0) + '☆'.repeat(5 - (s.focus || 0));
            return `
            <div class="slot-row" style="border-left-color:var(--accent-2)">
                <div class="slot-time" style="color:var(--accent-2)">${time}</div>
                <div class="slot-text">
                <b>${s.minutes}p</b>
                ${s.tag ? `<span class="tag" data-color="blue" style="padding:2px 8px;font-size:11px;display:inline-block;margin-left:6px">${escapeHtml(s.tag)}</span>` : ''}
                <span style="color:#fbbf24;margin-left:6px;font-size:12px">${stars}</span>
                </div>
            </div>
            `;
        }).join('');
        }

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
            ${sessionsHtml}
            ${slotsHtml}
            ${notesHtml}
            </div>
        </div>
        `;

        return day;
    },
    };

    /* ═══════════════════════════════════════════════════════════
    10. CALENDAR
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
        document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeModal();
        });
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
        cell.style.position = 'relative';
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

        // Chấm đỏ deadline (GĐ2)
        if (typeof TodoManager !== 'undefined') {
            const todos = TodoManager.todos.filter(t => t.deadline === k && !t.done);
            if (todos.length > 0) {
            const dot = document.createElement('span');
            dot.className = 'todo-dot';
            if (k < State.today) dot.classList.add('warning');
            cell.appendChild(dot);
            cell.title = `${todos.length} deadline`;
            }
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

    openModal(k) {
        const data = Storage.getDay(k);
        State.modal.date = k;
        State.modal.minutes = data.minutes || 0;
        State.modal.slots = (data.slots || []).map(s => ({
        hour: s.hour, text: s.text, done: !!s.done,
        }));

        const d = parseKey(k);
        $('#modalTitle').textContent = `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        $('#modalSub').textContent = 'Nhập tổng phút học và chi tiết từng khung giờ';
        $('#modalMinutes').value = State.modal.minutes || '';

        this.renderHourList();
        $('#hourModal').classList.add('show');
    },

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
    PAGES: ['home', 'study', 'calendar', 'stats', 'manage'],
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
        if (page === 'stats')    StatsPage.render();
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
            (d.sessions || []).forEach(s => {
            const txt = s.text || '';
            if (txt.toLowerCase().includes(q)) {
                results.push({
                type: `⏱️ Phiên học · ${k}`,
                title: txt,
                preview: s.tag || '',
                page: 'study',
                });
            }
            });
        });

        // Tìm trong Todo (GĐ2)
        if (typeof TodoManager !== 'undefined') {
            TodoManager.todos.forEach(t => {
            if (t.title.toLowerCase().includes(q)) {
                results.push({
                type: '📝 Todo' + (t.done ? ' (xong)' : ''),
                title: t.title,
                preview: t.deadline ? `Deadline: ${t.deadline}` : '',
                page: 'home',
                });
            }
            });
        }

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
        if (Router.current === 'stats')  StatsPage.render();
    },
    };

    /* ═══════════════════════════════════════════════════════════
    14. POMODORO
    ═══════════════════════════════════════════════════════════ */
    const Pomodoro = {
    modes: {
        pomodoro: { min: 25, label: 'Pomodoro · Tập trung', kind: 'work' },
        short:    { min: 5,  label: 'Nghỉ ngắn',           kind: 'break' },
        long:     { min: 15, label: 'Nghỉ dài',            kind: 'break' },
        custom:   { min: 30, label: 'Tuỳ chỉnh',           kind: 'work' },
    },
    state: { mode: 'pomodoro', sec: 25*60, running: false, id: null },
    selectedTag: null,
    selectedStar: 0,

    init() {
        $$('#pomodoroModes .pmode').forEach(btn => {
        btn.addEventListener('click', () => {
            if (this.state.running) { toast('⏸ Dừng trước khi đổi chế độ'); return; }
            this.state.mode = btn.dataset.mode;
            $$('#pomodoroModes .pmode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.setDuration(this.modes[this.state.mode].min);
            this.render();
        });
        });

        $('#pomoStart').addEventListener('click', () => this.start());
        $('#pomoStop').addEventListener('click', () => this.stop());
        $('#pomoReset').addEventListener('click', () => this.reset());
        $('#pomoFull').addEventListener('click', () => this.fullscreen());

        this.initTagPicker();
        this.initStarRating();
        this.render();
    },

    initTagPicker() {
        const tags = [
        { name: 'Toán', color: 'blue' },
        { name: 'Lý',   color: 'green' },
        { name: 'Hóa',  color: 'red' },
        { name: 'Anh',  color: 'yellow' },
        { name: 'Văn',  color: 'purple' },
        { name: 'Sử',   color: 'pink' },
        { name: 'Khác', color: 'gray' },
        ];
        const picker = $('#tagPicker');
        picker.innerHTML = '';
        this.selectedTag = null;
        tags.forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tag';
        b.dataset.color = t.color;
        b.dataset.name = t.name;
        b.textContent = t.name;
        b.addEventListener('click', () => {
            const wasActive = b.classList.contains('active');
            picker.querySelectorAll('.tag').forEach(x => x.classList.remove('active'));
            if (!wasActive) {
            b.classList.add('active');
            this.selectedTag = t.name;
            } else {
            this.selectedTag = null;
            }
        });
        picker.appendChild(b);
        });
    },

    initStarRating() {
        const box = $('#starRating');
        this.selectedStar = 0;
        box.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            this.selectedStar = +b.dataset.star;
            box.querySelectorAll('button').forEach(x => {
            const active = +x.dataset.star <= this.selectedStar;
            x.classList.toggle('active', active);
            x.textContent = active ? '★' : '☆';
            });
        });
        });
    },

    setDuration(min) {
        this.state.sec = min * 60;
        this.render();
    },

    fmt(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    },

    start() {
        if (this.state.running) return;
        this.state.running = true;
        $('#pomoStart').hidden = true;
        $('#pomoStop').hidden = false;
        const card = $('.pomodoro-card');
        card.classList.toggle('running', this.modes[this.state.mode].kind === 'work');
        card.classList.toggle('break', this.modes[this.state.mode].kind === 'break');

        this.state.id = setInterval(() => {
        this.state.sec--;
        this.render();
        if (this.state.sec <= 0) this.finish();
        }, 1000);
    },

    stop() {
        if (!this.state.running) return;
        clearInterval(this.state.id);
        this.state.running = false;
        $('#pomoStart').hidden = false;
        $('#pomoStop').hidden = true;
        $('.pomodoro-card').classList.remove('running', 'break');
    },

    reset() {
        this.stop();
        this.setDuration(this.modes[this.state.mode].min);
    },

    finish() {
        clearInterval(this.state.id);
        this.state.running = false;
        $('#pomoStart').hidden = false;
        $('#pomoStop').hidden = true;
        $('.pomodoro-card').classList.remove('running', 'break');

        const mode = this.modes[this.state.mode];
        if (mode.kind === 'work') {
        const mins = mode.min;
        const today = State.today;
        const day = Storage.ensureDay(today);
        day.minutes = (day.minutes || 0) + mins;
        day.sessions = day.sessions || [];
        const now = new Date();
        day.sessions.push({
            at: now.toISOString(),
            minutes: mins,
            tag: this.selectedTag || 'Khác',
            focus: this.selectedStar || 0,
            text: `Pomodoro ${mins}p${this.selectedTag ? ' · ' + this.selectedTag : ''}`,
        });
        Storage.saveDays();
        toast(`✅ Hoàn thành Pomodoro ${mins}p!`);

        this.selectedStar = 0;
        $$('#starRating button').forEach(x => { x.textContent = '☆'; x.classList.remove('active'); });

        Home.render(); Study.render(); Calendar.render();
        Modules.refreshHeader();
        } else {
        toast('☕ Hết giờ nghỉ!');
        }
        this.setDuration(mode.min);
        this.closeFullscreen();
    },

    render() {
        $('#pomoTime').textContent = this.fmt(this.state.sec);
        $('#pomoLabel').textContent = this.modes[this.state.mode].label;
        const fsTime = document.querySelector('.pomodoro-fullscreen .pomo-time');
        if (fsTime) fsTime.textContent = this.fmt(this.state.sec);
    },

    fullscreen() {
        if (document.querySelector('.pomodoro-fullscreen')) return;
        const el = document.createElement('div');
        el.className = 'pomodoro-fullscreen';
        el.innerHTML = `
        <div class="pomo-time">${this.fmt(this.state.sec)}</div>
        <div class="pomo-label">${this.modes[this.state.mode].label}</div>
        <div class="btn-row">
            <button class="btn primary" id="fsStart" ${this.state.running ? 'hidden' : ''}>▶ Bắt đầu</button>
            <button class="btn danger" id="fsStop" ${this.state.running ? '' : 'hidden'}>⏸ Dừng</button>
            <button class="btn ghost" id="fsClose">✕ Đóng</button>
        </div>
        `;
        document.body.appendChild(el);
        $('#fsStart').addEventListener('click', () => {
        this.start();
        $('#fsStart').hidden = true;
        $('#fsStop').hidden = false;
        });
        $('#fsStop').addEventListener('click', () => {
        this.stop();
        $('#fsStart').hidden = false;
        $('#fsStop').hidden = true;
        });
        $('#fsClose').addEventListener('click', () => this.closeFullscreen());
    },

    closeFullscreen() {
        const el = document.querySelector('.pomodoro-fullscreen');
        if (el) el.remove();
    },
    };

    /* ═══════════════════════════════════════════════════════════
    15. HEATMAP
    ═══════════════════════════════════════════════════════════ */
    const Heatmap = {
    render() {
        const el = $('#heatmap');
        if (!el) return;
        el.innerHTML = '';

        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 364);
        start.setDate(start.getDate() - start.getDay());

        const cells = [];
        const cur = new Date(start);
        while (cur <= today) {
        const k = dateKey(cur);
        const min = State.days[k]?.minutes || 0;
        let lv = 0;
        if (min > 0)    lv = 1;
        if (min >= 30)  lv = 2;
        if (min >= 60)  lv = 3;
        if (min >= 120) lv = 4;

        const cell = document.createElement('div');
        cell.className = `hm-cell lv${lv}`;
        cell.title = `${k}: ${min} phút`;
        cell.dataset.date = k;
        cell.addEventListener('click', () => Calendar.openModal(k));
        cells.push(cell);
        cur.setDate(cur.getDate() + 1);
        }

        const frag = document.createDocumentFragment();
        cells.forEach(c => frag.appendChild(c));
        el.appendChild(frag);
    },
    };

    /* ═══════════════════════════════════════════════════════════
    16. STATS PAGE
    ═══════════════════════════════════════════════════════════ */
    const StatsPage = {
    render() {
        const now = new Date();
        const dow = (now.getDay() + 6) % 7;
        const mondayThis = new Date(now); mondayThis.setDate(now.getDate() - dow);
        const mondayPrev = new Date(mondayThis); mondayPrev.setDate(mondayThis.getDate() - 7);
        const sundayPrev = new Date(mondayThis); sundayPrev.setDate(mondayThis.getDate() - 1);

        let weekThis = 0, weekPrev = 0;
        Object.keys(State.days).forEach(k => {
        const d = parseKey(k);
        const mins = State.days[k].minutes || 0;
        if (d >= mondayThis && d <= now) weekThis += mins;
        if (d >= mondayPrev && d <= sundayPrev) weekPrev += mins;
        });

        $('#statsWeek').textContent = fmtMinutes(weekThis);

        let month = 0;
        Object.keys(State.days).forEach(k => {
        const d = parseKey(k);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            month += State.days[k].minutes || 0;
        }
        });
        $('#statsMonth').textContent = fmtMinutes(month);

        const trend = $('#statsTrend');
        if (weekPrev === 0 && weekThis === 0) { trend.textContent = '—'; trend.style.color = ''; }
        else if (weekPrev === 0) { trend.textContent = '+∞'; trend.style.color = 'var(--success)'; }
        else {
        const pct = Math.round((weekThis - weekPrev) / weekPrev * 100);
        trend.textContent = (pct >= 0 ? '+' : '') + pct + '%';
        trend.style.color = pct >= 0 ? 'var(--success)' : 'var(--danger)';
        }

        this.renderChart14();
        this.renderPie();
        this.renderHourBars();

        // Todo stats (GĐ2)
        if (typeof TodoManager !== 'undefined') {
        TodoManager.renderStats7Days();
        }
    },

    renderChart14() {
        const chart = $('#statsChart');
        if (!chart) return;
        chart.innerHTML = '';
        const days = Stats.lastNDays(14);
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
            <div class="bar-label">${d.getDate()}/${d.getMonth()+1}</div>
        `;
        frag.appendChild(wrap);
        });
        chart.appendChild(frag);
    },

    renderPie() {
        const svg = $('#pieChart');
        const legend = $('#pieLegend');
        if (!svg) return;

        const tagMin = {};
        Object.keys(State.days).forEach(k => {
        const day = State.days[k];
        (day.sessions || []).forEach(s => {
            const tag = s.tag || 'Khác';
            tagMin[tag] = (tagMin[tag] || 0) + (s.minutes || 0);
        });
        });

        const total = Object.values(tagMin).reduce((a, b) => a + b, 0);
        if (total === 0) {
        svg.innerHTML = '';
        legend.innerHTML = '<div class="empty-state"><span class="es-icon">🥧</span><div class="es-title">Chưa có dữ liệu tag</div><div class="es-desc">Chọn tag khi dùng Pomodoro để xem phân bổ</div></div>';
        return;
        }

        const colors = {
        'Toán': '#3b82f6', 'Lý': '#10b981', 'Hóa': '#ef4444',
        'Anh': '#f59e0b', 'Văn': '#8b5cf6', 'Sử': '#ec4899', 'Khác': '#64748b',
        };

        const entries = Object.entries(tagMin).sort((a, b) => b[1] - a[1]);
        let startAngle = -Math.PI / 2;
        let paths = '';
        const cx = 100, cy = 100, r = 90;

        entries.forEach(([tag, val]) => {
        const angle = (val / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const color = colors[tag] || '#64748b';

        paths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" opacity="0.85"/>`;
        startAngle = endAngle;
        });

        svg.innerHTML = paths;

        legend.innerHTML = '';
        entries.forEach(([tag, val]) => {
        const pct = Math.round(val / total * 100);
        const el = document.createElement('div');
        el.className = 'pie-legend-item';
        el.innerHTML = `
            <span class="dot" style="background:${colors[tag] || '#64748b'}"></span>
            <span class="lbl">${tag}</span>
            <span class="val">${fmtMinutes(val)} · ${pct}%</span>
        `;
        legend.appendChild(el);
        });
    },

    renderHourBars() {
        const box = $('#hourBars');
        if (!box) return;
        box.innerHTML = '';

        const hourMin = Array(24).fill(0);
        Object.keys(State.days).forEach(k => {
        const day = State.days[k];
        if (day.slots) {
            day.slots.forEach(s => {
            if (typeof s.hour === 'number') {
                hourMin[s.hour] += 30;
            }
            });
        }
        (day.sessions || []).forEach(s => {
            const h = new Date(s.at).getHours();
            hourMin[h] += s.minutes || 0;
        });
        });

        const maxMin = Math.max(...hourMin, 1);
        const total = hourMin.reduce((a, b) => a + b, 0);

        if (total === 0) {
        box.innerHTML = '<div class="empty-state"><span class="es-icon">🕐</span><div class="es-title">Chưa có dữ liệu giờ học</div><div class="es-desc">Ghi giờ học để xem phân tích</div></div>';
        return;
        }

        const activeHours = hourMin.map((v, h) => ({ h, v })).filter(x => x.v > 0);
        activeHours.sort((a, b) => b.v - a.v);

        const frag = document.createDocumentFragment();
        activeHours.slice(0, 10).forEach(({ h, v }) => {
        const pct = (v / maxMin) * 100;
        const row = document.createElement('div');
        row.className = 'hour-bar-row';
        row.innerHTML = `
            <div class="hour-bar-label">${String(h).padStart(2,'0')}:00</div>
            <div class="hour-bar-track"><div class="hour-bar-fill" style="width:${pct}%"></div></div>
            <div class="hour-bar-val">${v}p</div>
        `;
        frag.appendChild(row);
        });
        box.appendChild(frag);
    },
    };

    /* ═══════════════════════════════════════════════════════════
    17. FAB BUTTON
    ═══════════════════════════════════════════════════════════ */
    const Fab = {
    init() {
        const btn = $('#fabBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
        Router.go('study');
        setTimeout(() => {
            if (Pomodoro && typeof Pomodoro.start === 'function') Pomodoro.start();
        }, 200);
        });
    },
    };

    /* ═══════════════════════════════════════════════════════════
    18. PHÍM TẮT
    ═══════════════════════════════════════════════════════════ */
    const Shortcuts = {
    init() {
        document.addEventListener('keydown', e => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
            if (e.key === 'Escape') e.target.blur();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            $('#globalSearch').focus();
            return;
        }

        if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            Calendar.openModal(State.today);
            return;
        }

        if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            Router.go('home');
            return;
        }

        if (e.key === '/') {
            e.preventDefault();
            $('#globalSearch').focus();
        }
        });
    },
    };

    /* ═══════════════════════════════════════════════════════════
    19. UNDO MANAGER
    ═══════════════════════════════════════════════════════════ */
    const Undo = {
    stack: [],
    timeout: null,
    init() {
        const btn = $('#undoBtn');
        if (!btn) return;
        btn.addEventListener('click', () => this.rollback());
    },
    push(msg, fn) {
        this.stack.push(fn);
        const msgEl = $('#undoMsg');
        const toastEl = $('#undoToast');
        if (msgEl) msgEl.textContent = msg;
        if (toastEl) toastEl.classList.add('show');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.clear(), 6000);
    },
    rollback() {
        const fn = this.stack.pop();
        if (fn) fn();
        this.clear();
        toast('↩ Đã hoàn tác');
    },
    clear() {
        this.stack = [];
        const el = $('#undoToast');
        if (el) el.classList.remove('show');
    },
    };

/* ═══════════════════════════════════════════════════════════
   20. TODO MANAGER (GIAI ĐOẠN 2)
═══════════════════════════════════════════════════════════ */
const TodoManager = {
  todos: [],
  filter: 'all',
  editingId: null,
  selectedTag: '',

  init() {
    this.load();

    const addBtn = $('#addTodoBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.openModal());

    $$('#todoFilters .tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#todoFilters .tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.filter;
        this.render();
      });
    });

    $$('#todoModal [data-close-todo]').forEach(el => {
      el.addEventListener('click', () => this.closeModal());
    });

    const saveBtn = $('#todoSave');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveModal());

    this.initTagPicker();

    const titleInput = $('#todoTitle');
    if (titleInput) {
      titleInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.saveModal();
      });
    }

    this.render();
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE.TODOS);
      this.todos = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.todos)) this.todos = [];
    } catch (e) { this.todos = []; }
  },

  save() {
    try { localStorage.setItem(STORE.TODOS, JSON.stringify(this.todos)); } catch (e) {}
  },

  initTagPicker() {
    const tags = ['Toán', 'Lý', 'Hóa', 'Anh', 'Văn', 'Sử', 'Khác'];
    const colors = ['blue','green','red','yellow','purple','pink','gray'];
    const picker = $('#todoTagPicker');
    if (!picker) return;
    picker.innerHTML = '';
    this.selectedTag = '';
    tags.forEach((tag, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tag';
      b.dataset.color = colors[i] || 'gray';
      b.textContent = tag;
      b.addEventListener('click', () => {
        const was = b.classList.contains('active');
        picker.querySelectorAll('.tag').forEach(x => x.classList.remove('active'));
        if (!was) { b.classList.add('active'); this.selectedTag = tag; }
        else { this.selectedTag = ''; }
      });
      picker.appendChild(b);
    });
  },

  openModal(id) {
    this.editingId = id || null;
    const modal = $('#todoModal');
    const title = $('#todoModalTitle');
    if (!modal) return;

    $('#todoTitle').value = '';
    $('#todoDesc').value = '';
    $('#todoDeadline').value = '';
    $('#todoPriority').value = 'normal';
    this.selectedTag = '';
    $$('#todoTagPicker .tag').forEach(t => t.classList.remove('active'));

    if (id) {
      const todo = this.todos.find(t => t.id === id);
      if (todo) {
        title.textContent = 'Sửa việc cần làm';
        $('#todoTitle').value = todo.title || '';
        $('#todoDesc').value = todo.desc || '';
        $('#todoDeadline').value = todo.deadline || '';
        $('#todoPriority').value = todo.priority || 'normal';
        if (todo.tag) {
          this.selectedTag = todo.tag;
          const tagBtn = $$('#todoTagPicker .tag').find(t => t.textContent === todo.tag);
          if (tagBtn) tagBtn.classList.add('active');
        }
      }
    } else {
      title.textContent = 'Thêm việc cần làm';
    }
    modal.classList.add('show');
    setTimeout(() => $('#todoTitle').focus(), 100);
  },

  closeModal() {
    const modal = $('#todoModal');
    if (modal) modal.classList.remove('show');
    this.editingId = null;
  },

  saveModal() {
    const title = $('#todoTitle').value.trim();
    if (!title) { toast('⚠️ Nhập tên việc'); return; }

    const data = {
      title: title,
      desc: $('#todoDesc').value.trim(),
      deadline: $('#todoDeadline').value || '',
      priority: $('#todoPriority').value || 'normal',
      tag: this.selectedTag || '',
    };

    if (this.editingId) {
      const todo = this.todos.find(t => t.id === this.editingId);
      if (todo) Object.assign(todo, data);
      toast('✅ Đã cập nhật');
    } else {
      this.todos.unshift({
        id: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: data.title,
        desc: data.desc,
        deadline: data.deadline,
        priority: data.priority,
        tag: data.tag,
        done: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
      toast('✅ Đã thêm việc');
    }

    this.save();
    this.closeModal();
    this.render();
    Calendar.render();
  },

  toggleDone(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;
    todo.done = !todo.done;
    todo.completedAt = todo.done ? new Date().toISOString() : null;
    this.save();
    this.render();
    Calendar.render();
  },

  removeTodo(id) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx < 0) return;
    const removed = this.todos[idx];
    if (!confirm(`Xoá "${removed.title}"?`)) return;
    this.todos.splice(idx, 1);
    this.save();
    this.render();
    Calendar.render();

    Undo.push(`Đã xóa "${removed.title}"`, () => {
      this.todos.splice(idx, 0, removed);
      this.save();
      this.render();
      Calendar.render();
    });
    toast('🗑 Đã xoá');
  },

  deadlineStatus(todo) {
    if (!todo.deadline) return { cls: '', text: '' };
    if (todo.done) return { cls: 'done-tag', text: '✅ Đã xong' };

    const today = new Date(State.today);
    const dl = parseKey(todo.deadline);
    const diffDays = Math.round((dl - today) / 86400000);

    if (diffDays < 0) return { cls: 'overdue', text: `⚠️ Quá hạn ${Math.abs(diffDays)} ngày` };
    if (diffDays === 0) return { cls: 'today', text: `🔥 Hôm nay` };
    if (diffDays === 1) return { cls: 'soon', text: `⏰ Còn 1 ngày` };
    if (diffDays <= 3) return { cls: 'soon', text: `⏰ Còn ${diffDays} ngày` };
    if (diffDays <= 7) return { cls: '', text: `📅 Còn ${diffDays} ngày` };
    return { cls: '', text: `📅 ${todo.deadline}` };
  },

  filteredTodos() {
    const today = State.today;
    return this.todos.filter(t => {
      if (this.filter === 'pending') return !t.done;
      if (this.filter === 'done') return t.done;
      if (this.filter === 'today') {
        if (t.done) return false;
        if (!t.deadline) return false;
        return t.deadline <= today;
      }
      if (this.filter === 'overdue') {
        if (t.done) return false;
        if (!t.deadline) return false;
        return t.deadline < today;
      }
      return true;
    });
  },

  render() {
    const list = $('#todoList');
    if (!list) return;
    list.innerHTML = '';

    const items = this.filteredTodos();
    if (items.length === 0) {
      let msg = 'Chưa có việc nào. Bấm "+ Thêm" để tạo.';
      if (this.filter === 'today') msg = 'Không có việc nào cho hôm nay 🎉';
      if (this.filter === 'overdue') msg = 'Không có việc quá hạn 🎉';
      if (this.filter === 'done') msg = 'Chưa có việc nào hoàn thành.';
      if (this.filter === 'pending') msg = 'Không có việc đang chờ 🎉';
      list.innerHTML = `<div class="empty-state" style="padding:20px"><span class="es-icon">📝</span><div class="es-desc">${msg}</div></div>`;
      return;
    }

    items.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.deadline && b.deadline) {
        if (a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
      } else if (a.deadline) return -1;
      else if (b.deadline) return 1;
      const prioOrder = { high: 0, normal: 1, low: 2 };
      return (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1);
    });

    const frag = document.createDocumentFragment();
    items.forEach(todo => this.renderItem(todo, frag));
    list.appendChild(frag);
  },

  renderItem(todo, frag) {
    const dl = this.deadlineStatus(todo);
    const today = State.today;
    const isOverdue = !todo.done && todo.deadline && todo.deadline < today;

    const item = document.createElement('div');
    item.className = `todo-item priority-${todo.priority || 'normal'}`;
    if (todo.done) item.classList.add('done');
    if (isOverdue) item.classList.add('overdue');

    item.innerHTML = `
      <input type="checkbox" class="todo-check" ${todo.done ? 'checked' : ''}>
      <div class="todo-body">
        <div class="todo-title">${escapeHtml(todo.title)}</div>
        ${todo.desc ? `<div class="todo-desc">${escapeHtml(todo.desc)}</div>` : ''}
        <div class="todo-meta">
          ${todo.deadline ? `<span class="deadline ${dl.cls}">${dl.text}</span>` : ''}
          ${todo.tag ? `<span class="tag-mini">${escapeHtml(todo.tag)}</span>` : ''}
          ${todo.priority === 'high' ? '<span>🔴 Cao</span>' : ''}
        </div>
      </div>
      <div class="todo-actions">
        <button class="edit" title="Sửa">✏️</button>
        <button class="del" title="Xóa">🗑</button>
      </div>
    `;

    item.querySelector('.todo-check').addEventListener('change', () => this.toggleDone(todo.id));
    item.querySelector('.edit').addEventListener('click', (e) => { e.stopPropagation(); this.openModal(todo.id); });
    item.querySelector('.del').addEventListener('click', (e) => { e.stopPropagation(); this.removeTodo(todo.id); });

    frag.appendChild(item);
  },

  countSoon(days = 1) {
    const today = State.today;
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const limitKey = dateKey(limit);
    return this.todos.filter(t =>
      !t.done && t.deadline && t.deadline >= today && t.deadline <= limitKey
    );
  },

  countOverdue() {
    const today = State.today;
    return this.todos.filter(t => !t.done && t.deadline && t.deadline < today).length;
  },

  renderStats7Days() {
    const box = $('#todoStats');
    if (!box) return;
    box.innerHTML = '';

    const days = Stats.lastNDays(7);
    const frag = document.createDocumentFragment();

    days.forEach(k => {
      const created = this.todos.filter(t => t.createdAt && t.createdAt.slice(0,10) === k);
      const done = created.filter(t => t.done).length;
      const total = created.length;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      const d = parseKey(k);

      const row = document.createElement('div');
      row.className = 'todo-stat-row';
      row.innerHTML = `
        <div class="todo-stat-label">${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</div>
        <div class="todo-stat-track"><div class="todo-stat-fill" style="width:${pct}%"></div></div>
        <div class="todo-stat-val">${done}/${total}</div>
      `;
      frag.appendChild(row);
    });

    if (this.todos.length === 0) {
      box.innerHTML = '<div class="empty-state"><span class="es-icon">✅</span><div class="es-title">Chưa có Todo nào</div><div class="es-desc">Thêm việc ở trang chủ để xem thống kê</div></div>';
      return;
    }
    box.appendChild(frag);
  },
};

/* ═══════════════════════════════════════════════════════════
   21. STREAK FREEZE (GIAI ĐOẠN 2)
═══════════════════════════════════════════════════════════ */
const StreakFreeze = {
  max: 3,
  freezes: 3,
  history: [],
  autoMode: false,
  lastRefillWeek: '',

  init() {
    this.load();
    this.checkRefill();

    const useBtn = $('#useFreezeBtn');
    if (useBtn) useBtn.addEventListener('click', () => this.use());

    const autoBox = $('#autoFreeze');
    if (autoBox) {
      autoBox.checked = this.autoMode;
      autoBox.addEventListener('change', () => {
        this.autoMode = autoBox.checked;
        this.save();
      });
    }

    this.render();
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE.FREEZE);
      const d = raw ? JSON.parse(raw) : {};
      this.freezes = typeof d.freezes === 'number' ? d.freezes : 3;
      this.history = Array.isArray(d.history) ? d.history : [];
      this.autoMode = !!d.autoMode;
      this.lastRefillWeek = d.lastRefillWeek || '';
    } catch (e) {
      this.freezes = 3;
      this.history = [];
      this.autoMode = false;
      this.lastRefillWeek = '';
    }
  },

  save() {
    try {
      localStorage.setItem(STORE.FREEZE, JSON.stringify({
        freezes: this.freezes,
        history: this.history,
        autoMode: this.autoMode,
        lastRefillWeek: this.lastRefillWeek,
      }));
    } catch (e) {}
  },

  checkRefill() {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setDate(now.getDate() - dow);
    const weekKey = dateKey(monday);

    if (this.lastRefillWeek !== weekKey) {
      if (this.freezes < this.max) this.freezes = Math.min(this.max, this.freezes + 1);
      this.lastRefillWeek = weekKey;
      this.save();
    }
  },

  use(dateKeyStr) {
    const k = dateKeyStr || State.today;
    if (this.freezes <= 0) { toast('❌ Hết lượt Freeze'); return false; }
    if (this.history.some(h => h.date === k)) { toast('ℹ️ Ngày này đã dùng Freeze'); return false; }

    this.freezes--;
    this.history.unshift({ date: k, reason: 'Dùng thủ công', at: new Date().toISOString() });
    this.save();

    const day = Storage.ensureDay(k);
    day.frozen = true;
    Storage.saveDays();

    this.render();
    Home.render();
    Modules.refreshHeader();
    toast('❄️ Đã đóng băng streak ngày ' + k);
    return true;
  },

  isFrozen(k) {
    return this.history.some(h => h.date === k);
  },

  needsFreeze() {
    if (this.freezes <= 0) return false;
    if (this.isFrozen(State.today)) return false;
    const s = Stats.calcStreak();
    if (s === 0) return false;
    const todayData = State.days[State.today];
    const hasToday = todayData && Stats.dayHasActivity(todayData);
    return !hasToday;
  },

  render() {
    const countEl = $('#freezeCount');
    if (countEl) countEl.textContent = this.freezes;

    const alert = $('#freezeAlert');
    if (alert) {
      const need = this.needsFreeze();
      if (need) alert.removeAttribute('hidden');
      else alert.setAttribute('hidden', '');
    }

    const hist = $('#freezeHistory');
    if (hist) {
      hist.innerHTML = '';
      if (this.history.length === 0) {
        hist.innerHTML = '<div class="empty-state" style="padding:12px"><div class="es-desc">Chưa dùng Freeze lần nào</div></div>';
      } else {
        this.history.slice(0, 5).forEach(h => {
          const el = document.createElement('div');
          el.className = 'freeze-history-item';
          el.innerHTML = `
            <span class="date">❄️ ${h.date}</span>
            <span class="reason">${escapeHtml(h.reason)}</span>
          `;
          hist.appendChild(el);
        });
      }
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   22. NOTIFICATION MANAGER (GIAI ĐOẠN 2)
═══════════════════════════════════════════════════════════ */
const NotifManager = {
  dailyTime: '20:00',
  deadlineNotif: true,
  sound: true,
  lastNotifiedDate: '',
  timerId: null,

  init() {
    this.load();

    const permBtn = $('#notifPermBtn');
    if (permBtn) permBtn.addEventListener('click', () => this.requestPermission());

    const timeInput = $('#notifTime');
    if (timeInput) timeInput.value = this.dailyTime;

    const saveTimeBtn = $('#saveNotifTimeBtn');
    if (saveTimeBtn) saveTimeBtn.addEventListener('click', () => {
      this.dailyTime = $('#notifTime').value || '20:00';
      this.save();
      toast('✅ Đã lưu giờ nhắc: ' + this.dailyTime);
    });

    const dlBox = $('#notifDeadline');
    if (dlBox) {
      dlBox.checked = this.deadlineNotif;
      dlBox.addEventListener('change', () => {
        this.deadlineNotif = dlBox.checked;
        this.save();
      });
    }

    const sndBox = $('#notifSound');
    if (sndBox) {
      sndBox.checked = this.sound;
      sndBox.addEventListener('change', () => {
        this.sound = sndBox.checked;
        this.save();
      });
    }

    this.renderStatus();
    this.startChecker();
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE.NOTIF);
      const d = raw ? JSON.parse(raw) : {};
      this.dailyTime = d.dailyTime || '20:00';
      this.deadlineNotif = d.deadlineNotif !== false;
      this.sound = d.sound !== false;
      this.lastNotifiedDate = d.lastNotifiedDate || '';
    } catch (e) {}
  },

  save() {
    try {
      localStorage.setItem(STORE.NOTIF, JSON.stringify({
        dailyTime: this.dailyTime,
        deadlineNotif: this.deadlineNotif,
        sound: this.sound,
        lastNotifiedDate: this.lastNotifiedDate,
      }));
    } catch (e) {}
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      toast('❌ Trình duyệt không hỗ trợ thông báo');
      return;
    }
    const perm = await window.Notification.requestPermission();
    this.renderStatus();
    if (perm === 'granted') {
      toast('✅ Đã bật thông báo');
      this.send('Study Tracker', 'Thông báo đã được bật!');
    } else {
      toast('❌ Bạn đã từ chối thông báo');
    }
  },

  renderStatus() {
    const el = $('#notifStatus');
    if (!el) return;
    if (!('Notification' in window)) {
      el.textContent = '⚠️ Trình duyệt không hỗ trợ thông báo';
      el.className = 'notif-status';
      return;
    }
    const p = window.Notification.permission;
    if (p === 'granted') {
      el.textContent = '✅ Đã bật thông báo';
      el.className = 'notif-status granted';
    } else if (p === 'denied') {
      el.textContent = '❌ Bạn đã chặn thông báo — mở cài đặt trình duyệt để bật lại';
      el.className = 'notif-status denied';
    } else {
      el.textContent = '🔔 Chưa bật — bấm "Xin quyền" để bật';
      el.className = 'notif-status';
    }
  },

  send(title, body) {
    if (!('Notification' in window) || window.Notification.permission !== 'granted') return;
    try {
      new window.Notification(title, {
        body: body,
        tag: 'study-' + Date.now(),
      });
      if (this.sound) this.playSound();
    } catch (e) {}
  },

  playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },

  startChecker() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.check(), 60000);
    setTimeout(() => this.check(), 5000);
  },

  check() {
    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const todayKey = dateKey(now);

    // 1. Nhắc học mỗi ngày
    if (hhmm === this.dailyTime && this.lastNotifiedDate !== todayKey) {
      const goal = State.profile.dailyGoal || 0;
      const done = State.days[todayKey]?.minutes || 0;
      if (goal > 0 && done < goal) {
        this.send('📚 Đến giờ học rồi!', `Hôm nay bạn mới học ${done}/${goal} phút. Cố lên nhé!`);
      } else if (done === 0) {
        this.send('📚 Đến giờ học rồi!', 'Hôm nay bạn chưa học gì. Bắt đầu ngay nào!');
      }
      this.lastNotifiedDate = todayKey;
      this.save();
    }

    // 2. Nhắc deadline sắp đến
    if (this.deadlineNotif) {
      const soon = TodoManager.countSoon(1);
      const overdue = TodoManager.countOverdue();
      const notifiedKey = 'notif_dl_' + todayKey;
      if (!sessionStorage.getItem(notifiedKey)) {
        if (overdue > 0) {
          this.send('⚠️ Có việc quá hạn!', `${overdue} việc đã quá hạn. Kiểm tra ngay!`);
          sessionStorage.setItem(notifiedKey, '1');
        } else if (soon.length > 0) {
          this.send('⏰ Deadline sắp đến', `${soon.length} việc sẽ đến hạn trong 24h tới.`);
          sessionStorage.setItem(notifiedKey, '1');
        }
      }
    }

    // 3. Nhắc streak sắp mất (sau 22h)
    if (now.getHours() >= 22 && StreakFreeze.needsFreeze()) {
      const notifiedKey = 'notif_streak_' + todayKey;
      if (!sessionStorage.getItem(notifiedKey)) {
        this.send('🔥 Streak sắp mất!', 'Bạn chưa học hôm nay. Học nhanh hoặc dùng Freeze nhé!');
        sessionStorage.setItem(notifiedKey, '1');
      }
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   23. HOOKS — Bổ sung module mới vào hệ thống
═══════════════════════════════════════════════════════════ */

// 23.1. Wrap Modules.refreshAll
const _origRefreshAll = Modules.refreshAll.bind(Modules);
Modules.refreshAll = function () {
  _origRefreshAll();
  if (typeof Heatmap !== 'undefined' && Heatmap.render) Heatmap.render();
  if (Router.current === 'stats' && typeof StatsPage !== 'undefined') {
    StatsPage.render();
  }
};

// 23.2. Wrap Router.go
const _origGo = Router.go.bind(Router);
Router.go = function (page, updateHash = true) {
  _origGo(page, updateHash);
  if (page === 'stats' && typeof StatsPage !== 'undefined') {
    requestAnimationFrame(() => StatsPage.render());
  }
  if (page === 'home' && typeof Heatmap !== 'undefined') {
    requestAnimationFrame(() => Heatmap.render());
  }
};

/* ═══════════════════════════════════════════════════════════
   24. INIT — Khởi động toàn bộ
═══════════════════════════════════════════════════════════ */
function init() {
  const now = new Date();
  State.today = dateKey(now);
  State.viewYear = now.getFullYear();
  State.viewMonth = now.getMonth();

  Storage.loadAll();

  // GĐ gốc
  Theme.init();
  Background.init();
  Profile.init();
  Home.init();
  Study.init();
  Calendar.init();
  Search.init();
  Router.init();

  // GĐ1
  Pomodoro.init();
  Fab.init();
  Shortcuts.init();
  Undo.init();

  // GĐ2
  TodoManager.init();
  StreakFreeze.init();
  NotifManager.init();

  // Render toàn bộ
  Modules.refreshAll();

  window.addEventListener('beforeunload', () => {
    Storage.saveDays();
    Storage.saveProfile();
    Storage.saveRoadmap();
    Storage.saveBg();
    if (typeof TodoManager !== 'undefined') TodoManager.save();
    if (typeof StreakFreeze !== 'undefined') StreakFreeze.save();
  });

  console.log('%c✅ Study Tracker v5 ready!', 'color:#4f46e5;font-weight:bold;font-size:13px;');
  console.log('%c📦 GĐ1: Pomodoro · Heatmap · Stats · FAB · Shortcuts · Undo', 'color:#64748b;font-size:11px;');
  console.log('%c📦 GĐ2: Todo · Deadline · Notification · Streak Freeze', 'color:#64748b;font-size:11px;');
}

// Khởi động
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();