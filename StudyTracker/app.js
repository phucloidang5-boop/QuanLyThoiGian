/* ═══════════════════════════════════════════════════════════
    STUDY TRACKER — app.js
    Bản v5 + SQLite integration + Worker Pomodoro
    FIXED: Hiển thị Tag trên Lịch, màu riêng biệt, Undo 30s
    ═══════════════════════════════════════════════════════════ */
    (function () {
    'use strict';

    /* ═══════ 1. CONST + STATE ═══════ */
    const STORE = {
    DAYS:    'st_days_v3',
    PROFILE: 'st_profile_v3',
    THEME:   'st_theme_v3',
    ROADMAP: 'st_roadmap_v3',
    BG:      'st_bg_v3',
    TODOS:   'st_todos_v1',
    FREEZE:  'st_freeze_v1',
    NOTIF:   'st_notif_v1',
    SUBJECTS:'st_subjects_v1',
    POMODORO:'st_pomodoro_state_v1',
    ONBOARD: 'st_onboarded_v1',
    BACKUP:  'st_last_backup_v1',
    };

    const AVATARS = ['🎓','📚','🚀','⭐','🎯','🧠','💡','🔥','🌱','🎨','💻','📝',
                    '🏆','☕','🦉','🐧','🌈','💎','🍀','⚡','🎵','🔭','🌟','📖'];

    const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    const WEEKDAYS_SHORT = ['CN','T2','T3','T4','T5','T6','T7'];
    const WEEKDAYS_LONG  = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];

    /* ═══════════════════════════════════════════════════════════
       NGÀY LỄ — CHỈ THEO DANH SÁCH USER GỬI (Mỹ + VN)
       ═══════════════════════════════════════════════════════════ */
    const VN_HOLIDAYS_FIXED = {
        '01-01': { name: 'Tết Dương lịch / New Year\'s Day', type: 'major', theme: 'newyear', region: 'vn' },
        '08-03': { name: 'Quốc tế Phụ nữ', type: 'minor', theme: 'flowers', region: 'vn' },
        '30-04': { name: 'Giải phóng miền Nam, Thống nhất đất nước', type: 'major', theme: 'national', region: 'vn' },
        '01-05': { name: 'Quốc tế Lao động', type: 'major', theme: 'national', region: 'vn' },
        '01-06': { name: 'Quốc tế Thiếu nhi', type: 'minor', theme: 'kids', region: 'vn' },
        '02-09': { name: 'Quốc khánh nước CHXHCN Việt Nam', type: 'major', theme: 'national', region: 'vn' },
        '20-10': { name: 'Phụ nữ Việt Nam', type: 'minor', theme: 'flowers', region: 'vn' },
        '20-11': { name: 'Nhà giáo Việt Nam', type: 'minor', theme: 'flowers', region: 'vn' },
        '25-12': { name: 'Giáng sinh / Christmas Day', type: 'minor', theme: 'christmas', region: 'vn' },
        '19-06': { name: 'Juneteenth (Mỹ)', type: 'minor', theme: 'default', region: 'us' },
        '04-07': { name: 'Quốc khánh Mỹ / Independence Day', type: 'minor', theme: 'default', region: 'us' },
        '11-11': { name: 'Cựu chiến binh / Veterans Day (Mỹ)', type: 'minor', theme: 'default', region: 'us' },
        '31-10': { name: 'Halloween', type: 'minor', theme: 'halloween', region: 'us' },
    };

    const VN_HOLIDAYS_LUNAR = {
        '2024': {
            '02-02': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '02-10': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '02-11': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '02-12': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '02-13': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '02-24': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-18': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-22': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '08-18': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '09-17': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
        '2025': {
            '01-22': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '01-29': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '01-30': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '01-31': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '02-01': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '02-12': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-07': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-12': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '09-06': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '10-06': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
        '2026': {
            '02-10': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '02-17': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '02-18': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '02-19': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '02-20': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '03-03': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-26': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-31': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '08-27': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '09-25': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
        '2027': {
            '01-30': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '02-06': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '02-07': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '02-08': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '02-09': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '02-20': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-16': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-20': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '08-15': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '09-15': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
        '2028': {
            '01-19': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '01-26': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '01-27': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '01-28': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '01-29': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '02-09': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-04': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-09': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '09-03': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '10-03': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
        '2029': {
            '02-06': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '02-13': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '02-14': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '02-15': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '02-16': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '02-27': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-23': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-27': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '08-24': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '09-22': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
        '2030': {
            '01-27': { name: 'Ông Công Ông Táo', type: 'minor', theme: 'tet' },
            '02-03': { name: 'Tết Nguyên Đán (Mùng 1)', type: 'major', theme: 'tet' },
            '02-04': { name: 'Tết Nguyên Đán (Mùng 2)', type: 'major', theme: 'tet' },
            '02-05': { name: 'Tết Nguyên Đán (Mùng 3)', type: 'major', theme: 'tet' },
            '02-06': { name: 'Tết Nguyên Đán (Mùng 4)', type: 'major', theme: 'tet' },
            '02-17': { name: 'Tết Nguyên Tiêu', type: 'minor', theme: 'lantern' },
            '04-13': { name: 'Giỗ Tổ Hùng Vương', type: 'major', theme: 'national' },
            '05-17': { name: 'Lễ Phật Đản', type: 'minor', theme: 'default' },
            '08-12': { name: 'Lễ Vu Lan', type: 'minor', theme: 'default' },
            '09-12': { name: 'Tết Trung Thu', type: 'minor', theme: 'midautumn' },
        },
    };

    function getNthWeekday(year, month, weekday, n) {
        const first = new Date(year, month - 1, 1);
        const offset = (weekday - first.getDay() + 7) % 7;
        return new Date(year, month - 1, 1 + offset + (n - 1) * 7);
    }
    function getLastWeekday(year, month, weekday) {
        const last = new Date(year, month, 0);
        const offset = (last.getDay() - weekday + 7) % 7;
        return new Date(year, month - 1, last.getDate() - offset);
    }
    function toMMDD(d) {
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function calcEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    function buildVariableHolidays(year) {
        const out = {};
        const add = (date, info) => {
            const key = toMMDD(date);
            const existing = out[key];
            if (!existing) {
                out[key] = info;
            } else if (info.region === 'vn' && existing.region !== 'vn') {
                out[key] = info;
            }
        };

        add(getNthWeekday(year, 1, 1, 3),   { name: 'Martin Luther King Jr. Day (Mỹ)', type: 'minor', theme: 'default',  region: 'us' });
        add(getNthWeekday(year, 2, 1, 3),   { name: 'Presidents\' Day (Mỹ)',           type: 'minor', theme: 'default',  region: 'us' });
        add(getLastWeekday(year, 5, 1),     { name: 'Memorial Day (Mỹ)',               type: 'minor', theme: 'default',  region: 'us' });
        add(getNthWeekday(year, 9, 1, 1),   { name: 'Labor Day (Mỹ)',                  type: 'minor', theme: 'default',  region: 'us' });
        add(getNthWeekday(year, 10, 1, 2),  { name: 'Columbus Day (Mỹ)',               type: 'minor', theme: 'default',  region: 'us' });
        const thanksgiving = getNthWeekday(year, 11, 4, 4);
        add(thanksgiving, { name: 'Thanksgiving Day (Mỹ)', type: 'minor', theme: 'default', region: 'us' });
        const blackFriday = new Date(thanksgiving); blackFriday.setDate(blackFriday.getDate() + 1);
        add(blackFriday, { name: 'Black Friday (Mỹ)', type: 'minor', theme: 'shopping', region: 'us' });
        add(calcEaster(year), { name: 'Lễ Phục sinh / Easter', type: 'minor', theme: 'flowers', region: 'us' });

        return out;
    }

    function getHolidayInfo(date) {
        const year = date.getFullYear();
        const mmdd = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
        const fixed = VN_HOLIDAYS_FIXED[mmdd];
        const lunar = VN_HOLIDAYS_LUNAR[year];
        const lunarHoliday = lunar ? lunar[mmdd] : null;

        if (lunarHoliday && lunarHoliday.type === 'major') return lunarHoliday;
        if (fixed && fixed.type === 'major') return fixed;
        if (lunarHoliday) return lunarHoliday;
        if (fixed) return fixed;

        const variable = buildVariableHolidays(year);
        if (variable[mmdd]) return variable[mmdd];
        return null;
    }

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

    /* ═══════ 2. UTILS ═══════ */
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
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastT);
    _toastT = setTimeout(() => el.classList.remove('show'), 2200);
    };
    const debounce = (fn, ms = 200) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    };

    /* ═══════ 3. STORAGE — local + SQLite mirror ═══════ */
    const Storage = {
    _useSQL() {
        return typeof window.DB !== 'undefined' && window.DB && window.DB.ready;
    },

    get(k, fb) {
        try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; }
        catch (e) { return fb; }
    },
    set(k, v) {
        try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    },

    loadAll() {
        if (this._useSQL()) {
        const dbDays = this._loadDaysFromSQL();
        if (dbDays && Object.keys(dbDays).length > 0) {
            State.days = dbDays;
            this.set(STORE.DAYS, State.days);
        } else {
            State.days = this.get(STORE.DAYS, {}) || {};
        }
        } else {
        State.days = this.get(STORE.DAYS, {}) || {};
        }

        if (this._useSQL()) {
        const dbRoadmap = this._loadRoadmapFromSQL();
        if (dbRoadmap && dbRoadmap.length > 0) {
            State.roadmap = dbRoadmap;
            this.set(STORE.ROADMAP, State.roadmap);
        } else {
            State.roadmap = this.get(STORE.ROADMAP, []) || [];
        }
        } else {
        State.roadmap = this.get(STORE.ROADMAP, []) || [];
        }

        State.roadmap = State.roadmap.map(r => {
        if (!Array.isArray(r.completedDates)) {
            r.completedDates = [];
            const n = Math.max(0, Math.min(
            typeof r.completedSessions === 'number' ? r.completedSessions : 0,
            typeof r.totalSessions === 'number' ? r.totalSessions : 0
            ));
            const today = new Date();
            for (let i = n; i >= 1; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            r.completedDates.push(dateKey(d));
            }
        }
        r.completedSessions = Math.min(r.completedDates.length, r.totalSessions || 0);
        return r;
        });

        let profile = null;
        if (this._useSQL() && window.DB.getMeta) {
        profile = window.DB.getMeta('profile', null);
        }
        if (!profile) profile = this.get(STORE.PROFILE, null);
        State.profile = {
        name:        (profile && profile.name)      || '',
        email:       (profile && profile.email)     || '',
        phone:       (profile && profile.phone)     || '',
        goal:        (profile && profile.goal)      || '',
        dailyGoal:   (profile && typeof profile.dailyGoal === 'number') ? profile.dailyGoal : 60,
        avatar:      (profile && profile.avatar)    || '🎓',
        avatarImage: (profile && profile.avatarImage) || '',
        };

        let theme = null;
        if (this._useSQL() && window.DB.getMeta) {
        theme = window.DB.getMeta('theme', null);
        }
        if (!theme) theme = this.get(STORE.THEME, null);
        State.theme = (theme === 'dark' || theme === 'auto') ? theme : 'light';

        let bg = null;
        if (this._useSQL() && window.DB.getMeta) {
        bg = window.DB.getMeta('bg', null);
        }
        if (!bg) bg = this.get(STORE.BG, null);
        State.bg = (bg && typeof bg === 'object') ? bg : { type: 'default', value: '' };
    },

    _loadDaysFromSQL() {
        if (!window.DB || !window.DB.ready) return null;
        try {
        const rows = window.DB.query('SELECT * FROM days');
        const sessionRows = window.DB.query('SELECT * FROM sessions ORDER BY at ASC');
        const out = {};

        rows.forEach(r => {
            let goals = [], slots = [], work = {};
            try { goals = JSON.parse(r.goals_json || '[]'); } catch (e) {}
            try { slots = JSON.parse(r.slots_json || '[]'); } catch (e) {}
            try { work = JSON.parse(r.work_json || '{}') || {}; } catch (e) {}
            out[r.date] = {
            minutes: r.minutes || 0,
            notes:   r.notes || '',
            subject: r.subject || '',
            frozen:  !!r.frozen,
            goals,
            slots,
            work,
            sessions: [],
            };
        });

        sessionRows.forEach(s => {
            if (!out[s.date]) out[s.date] = { minutes: 0, goals: [], notes: '', slots: [], sessions: [] };
            out[s.date].sessions.push({
            id:       s.id,
            at:       s.at,
            minutes:  s.minutes,
            tag:      s.tag || 'Khác',
            tagColor: s.tag_color || '#64748b',
            focus:    s.focus || 0,
            text:     s.text || '',
            source:   s.source || 'pomodoro',
            });
        });

        return out;
        } catch (e) {
        console.warn('[Storage] loadDaysFromSQL failed:', e);
        return null;
        }
    },

    _loadRoadmapFromSQL() {
        if (!window.DB || !window.DB.ready) return null;
        try {
        const rows = window.DB.query('SELECT * FROM roadmaps ORDER BY created_at DESC');
        return rows.map(r => {
            let completedDates = [];
            try {
            const parsed = JSON.parse(r.completed_dates_json || '[]');
            if (Array.isArray(parsed)) completedDates = parsed;
            } catch (e) {}
            return {
            id: r.id,
            title: r.title,
            totalSessions: r.total_sessions,
            completedSessions: r.completed_sessions,
            completedDates,
            createdAt: r.created_at,
            };
        });
        } catch (e) {
        return null;
        }
    },

    saveDays() {
        this.set(STORE.DAYS, State.days);
        if (this._useSQL() && window.DB.syncDays) {
        try { window.DB.syncDays(State.days); } catch (e) {}
        }
    },
    saveProfile() {
        this.set(STORE.PROFILE, State.profile);
        if (this._useSQL() && window.DB.setMeta) {
        try { window.DB.setMeta('profile', State.profile); } catch (e) {}
        }
    },
    saveRoadmap() {
        this.set(STORE.ROADMAP, State.roadmap);
        if (this._useSQL() && window.DB.syncRoadmaps) {
        try { window.DB.syncRoadmaps(State.roadmap); } catch (e) {}
        }
    },
    saveTheme() {
        this.set(STORE.THEME, State.theme);
        if (this._useSQL() && window.DB.setMeta) {
        try { window.DB.setMeta('theme', State.theme); } catch (e) {}
        }
    },
    saveBg() {
        this.set(STORE.BG, State.bg);
        if (this._useSQL() && window.DB.setMeta) {
        try { window.DB.setMeta('bg', State.bg); } catch (e) {}
        }
    },
    saveSubjects(subjects) {
        this.set(STORE.SUBJECTS, subjects);
        if (this._useSQL() && window.DB.syncSubjects) {
        try { window.DB.syncSubjects(subjects); } catch (e) {}
        }
    },
    saveTodos(todos) {
        this.set(STORE.TODOS, todos);
        if (this._useSQL() && window.DB.syncTodos) {
        try { window.DB.syncTodos(todos); } catch (e) {}
        }
    },
    saveFreeze(data) {
        this.set(STORE.FREEZE, data);
        if (this._useSQL() && window.DB.setMeta) {
        try { window.DB.setMeta('freeze', data); } catch (e) {}
        }
    },
    saveNotif(data) {
        this.set(STORE.NOTIF, data);
        if (this._useSQL() && window.DB.setMeta) {
        try { window.DB.setMeta('notif', data); } catch (e) {}
        }
    },

    getDay(k) {
        return State.days[k] || { minutes: 0, goals: [], notes: '', slots: [], sessions: [] };
    },
    ensureDay(k) {
        if (!State.days[k]) {
        State.days[k] = { minutes: 0, goals: [], notes: '', slots: [], sessions: [], work: {} };
        }
        const d = State.days[k];
        if (!Array.isArray(d.goals)) d.goals = [];
        if (!Array.isArray(d.slots)) d.slots = [];
        if (!Array.isArray(d.sessions)) d.sessions = [];
        if (typeof d.notes !== 'string') d.notes = '';
        if (typeof d.minutes !== 'number') d.minutes = 0;

        if (!d.work || typeof d.work !== 'object') d.work = {};
        if (typeof d.work.hours !== 'number') d.work.hours = 0;
        if (typeof d.work.startTime !== 'string') d.work.startTime = '';
        if (typeof d.work.endTime !== 'string') d.work.endTime = '';
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

    /* ═══════ 4. STATS ═══════ */
    const Stats = {
    MIN_MINUTES_PER_DAY: 5,

    dayHasActivity(d) {
        if (!d) return false;
        if ((d.minutes || 0) >= this.MIN_MINUTES_PER_DAY) return true;
        if (d.sessions && d.sessions.length > 0) {
        const total = d.sessions.reduce((s, x) => s + (x.minutes || 0), 0);
        if (total >= this.MIN_MINUTES_PER_DAY) return true;
        }
        if (d.frozen) return true;
        return false;
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
        const hasActivity = dayData && this.dayHasActivity(dayData);
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

    /* ═══════ 5. THEME ═══════ */
    const Theme = {
    init() {
        this.apply(State.theme, false);
        const toggle = $('#themeToggle');
        if (toggle) {
        toggle.addEventListener('click', () => {
            this.setMode(State.theme === 'dark' ? 'light' : 'dark');
        });
        }
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
        const label = $('#currentThemeLabel');
        if (label) {
        const map = { light: '☀️ Sáng', dark: '🌙 Tối', auto: '💻 Tự động' };
        label.textContent = map[State.theme] || '☀️ Sáng';
        }
    },
    };

    /* ═══════ 6. BACKGROUND ═══════ */
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
        const applyBtn = $('#bgApplyColorBtn');
        if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            State.bg = { type: 'color', value: $('#bgColorPicker').value };
            Storage.saveBg();
            this.apply();
            this.sync();
            toast('✅ Đã đổi màu nền');
        });
        }
        const uploadBtn = $('#bgUploadBtn');
        if (uploadBtn) uploadBtn.addEventListener('click', () => $('#bgFile').click());
        const bgFile = $('#bgFile');
        if (bgFile) {
        bgFile.addEventListener('change', async e => {
            const f = e.target.files[0];
            if (!f) return;
            toast('⏳ Đang xử lý ảnh nền...');
            try {
            const result = await ImageUtils.compress(f, 1920, 0.82);
            State.bg = { type: 'image', value: result.dataUrl };
            Storage.saveBg();
            this.apply();
            this.sync();
            const savedMB = ((result.originalSize - result.newSize) / 1024 / 1024).toFixed(2);
            toast(`🖼️ Đã đổi ảnh nền (tiết kiệm ~${savedMB}MB)`);
            if (typeof DataManager !== 'undefined') DataManager.renderBackupStatus();
            } catch (err) {
            toast('❌ ' + (err.message || 'Không thể xử lý ảnh'));
            }
            e.target.value = '';
        });
        }
    },
    apply() {
        const root = document.documentElement;
        const bg = State.bg || { type: 'default', value: '' };
        if (bg.type === 'default') {
        root.style.setProperty('--app-bg', 'var(--bg)');
        root.style.setProperty('--app-bg-image', 'none');
        document.body.classList.remove('has-bg-image');
        } else if (bg.type === 'color' || bg.type === 'gradient') {
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

    /* ═══════ 7. PROFILE ═══════ */
    const Profile = {
    init() {
        const picker = $('#emojiPicker');
        if (picker) {
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
        }
        const menu = $('#avatarMenu');
        const avatarBtn = $('#avatarBtn');
        if (avatarBtn && menu) {
        avatarBtn.addEventListener('click', e => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        menu.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const act = btn.dataset.act;
            menu.classList.remove('show');
            if (act === 'upload') $('#avatarFile').click();
            if (act === 'emoji' && picker) picker.classList.toggle('show');
            if (act === 'remove') {
            State.profile.avatarImage = '';
            Storage.saveProfile();
            this.sync();
            Modules.refreshHeader();
            toast('🗑 Đã xóa ảnh đại diện');
            }
        });
        }
        const avatarFile = $('#avatarFile');
        if (avatarFile) {
        avatarFile.addEventListener('change', async e => {
            const f = e.target.files[0];
            if (!f) return;
            toast('⏳ Đang xử lý ảnh...');
            try {
            const result = await ImageUtils.compress(f, 400, 0.85);
            State.profile.avatarImage = result.dataUrl;
            Storage.saveProfile();
            this.sync();
            Modules.refreshHeader();
            const savedKB = Math.round((result.originalSize - result.newSize) / 1024);
            toast(`✅ Đã đổi avatar (tiết kiệm ~${savedKB}KB)`);
            if (typeof DataManager !== 'undefined') DataManager.renderBackupStatus();
            } catch (err) {
            toast('❌ ' + (err.message || 'Không thể xử lý ảnh'));
            }
            e.target.value = '';
        });
        }
        document.addEventListener('click', e => {
        if (!e.target.closest('.avatar-wrap') && menu) menu.classList.remove('show');
        if (!e.target.closest('#emojiPicker') && !e.target.closest('#avatarBtn') && picker) {
            picker.classList.remove('show');
        }
        });
        const bind = (id, key) => {
        const el = $(id);
        if (!el) return;
        el.addEventListener('input', e => {
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

        const saveGoalBtn = $('#saveDailyGoalBtn');
        if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', () => {
            const v = parseInt($('#dailyGoalInput').value, 10);
            if (isNaN(v) || v < 0) { toast('❌ Số phút không hợp lệ'); return; }
            if (v > 1440) { toast('❌ Mục tiêu không thể vượt 24h/ngày (1440 phút)'); return; }
            State.profile.dailyGoal = v;
            Storage.saveProfile();
            toast('✅ Đã lưu mục tiêu');
            Home.render();
        });
        }
        const exportBtn = $('#exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportJSON());
        const importBtn = $('#importBtn');
        if (importBtn) importBtn.addEventListener('click', () => $('#importFile').click());
        const resetBtn = $('#resetAllBtn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAll());
        const delDayBtn = $('#deleteDayBtn');
        if (delDayBtn) delDayBtn.addEventListener('click', () => this.deleteOneDay());

        const goStatsBtn = $('#goToStatsBtn');
        if (goStatsBtn) goStatsBtn.addEventListener('click', () => Router.go('stats'));

        const rerunBtn = $('#rerunOnboardingBtn');
        if (rerunBtn) rerunBtn.addEventListener('click', () => {
        if (typeof Onboarding !== 'undefined') Onboarding.reset();
        });

        const exportSqliteBtn = $('#exportSqliteBtn');
        if (exportSqliteBtn) exportSqliteBtn.addEventListener('click', () => {
        if (window.DB && window.DB.ready) {
            window.DB.exportFile();
            toast('💾 Đã xuất file .sqlite');
        } else {
            toast('⏳ Database chưa sẵn sàng');
        }
        });
        const importSqliteBtn = $('#importSqliteBtn');
        if (importSqliteBtn) importSqliteBtn.addEventListener('click', () => $('#importSqliteFile').click());
        const importSqliteFile = $('#importSqliteFile');
        if (importSqliteFile) {
        importSqliteFile.addEventListener('change', async e => {
            const f = e.target.files[0];
            if (!f) return;
            if (!window.DB || !window.DB.ready) { toast('⏳ Database chưa sẵn sàng'); return; }
            if (!confirm('Nhập file .sqlite sẽ GHI ĐÈ toàn bộ database hiện tại. Tiếp tục?')) {
            e.target.value = '';
            return;
            }
            try {
            await window.DB.importFile(f);
            toast('✅ Đã nhập database — đang tải lại...');
            setTimeout(() => location.reload(), 800);
            } catch (err) {
            toast('❌ ' + (err.message || 'File không hợp lệ'));
            }
            e.target.value = '';
        });
        }
        const migrateToSqlBtn = $('#migrateToSqlBtn');
        if (migrateToSqlBtn) {
        migrateToSqlBtn.addEventListener('click', async () => {
            if (!window.DB || !window.DB.ready) { toast('⏳ Database chưa sẵn sàng'); return; }
            if (!confirm('Chuyển dữ liệu từ localStorage sang SQLite?\n\nDữ liệu hiện tại trong SQLite sẽ bị ghi đè.')) return;
            try {
            const stats = await window.DB.migrateFromLocalStorage();
            toast(`✅ Đã chuyển: ${stats.days} ngày, ${stats.sessions} phiên`);
            setTimeout(() => location.reload(), 1000);
            } catch (err) {
            toast('❌ Migration failed: ' + (err.message || ''));
            }
        });
        }
    },

    sync() {
        const fields = {
        '#profileName': State.profile.name,
        '#profileEmail': State.profile.email,
        '#profilePhone': State.profile.phone,
        '#profileGoal': State.profile.goal,
        '#dailyGoalInput': State.profile.dailyGoal,
        };
        Object.keys(fields).forEach(sel => {
        const el = $(sel);
        if (el) el.value = fields[sel];
        });
        this.syncAvatar();
        Theme.sync();
        Background.sync();
    },

    syncAvatar() {
        const el = $('#avatarBtn');
        if (!el) return;
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
        if (typeof DataManager !== 'undefined') {
        DataManager.setLastBackupDate();
        DataManager.renderBackupStatus();
        }
        toast('📦 Đã xuất file JSON');
    },

    async resetAll() {
        const ans = prompt(
        '⚠️ Sẽ XÓA TẤT CẢ dữ liệu\n' +
        '(bao gồm profile, lộ trình, background, todo, SQLite)\n\n' +
        'Gõ chính xác chữ: DELETE'
        );
        if (ans !== 'DELETE') { toast('❌ Đã hủy'); return; }

        try { this.exportJSON(); } catch (e) {}

        State.days = {};
        State.roadmap = [];
        State.profile = { name:'', email:'', phone:'', goal:'', dailyGoal:60, avatar:'🎓', avatarImage:'' };
        State.bg = { type: 'default', value: '' };
        Storage.saveDays(); Storage.saveRoadmap(); Storage.saveProfile(); Storage.saveBg();

        if (typeof TodoManager !== 'undefined') {
        TodoManager.todos = [];
        Storage.saveTodos([]);
        }
        if (typeof StreakFreeze !== 'undefined') {
        StreakFreeze.freezes = 3;
        StreakFreeze.history = [];
        Storage.saveFreeze({ freezes: 3, history: [], autoMode: false });
        }

        if (window.DB && window.DB.ready) {
        try { await window.DB.reset(); } catch (e) {}
        }

        Background.apply(); Background.sync();
        this.sync();
        Modules.refreshAll();
        toast('🗑 Đã xóa tất cả');
    },

    deleteOneDay() {
        const el = $('#deleteDateInput');
        if (!el) return;
        const k = el.value;
        if (!k) { toast('⚠️ Chọn ngày trước'); return; }
        if (!State.days[k]) { toast('ℹ️ Ngày này không có dữ liệu'); return; }
        if (!confirm(`Xóa dữ liệu ngày ${k}?`)) return;

        const backup = JSON.parse(JSON.stringify(State.days[k]));
        delete State.days[k];
        Storage.saveDays();
        Modules.refreshAll();
        el.value = '';

        Undo.push(`Đã xóa ngày ${k}`, () => {
        State.days[k] = backup;
        Storage.saveDays();
        Modules.refreshAll();
        });
        toast('🗑 Đã xóa ngày ' + k);
    },
    };

    /* ═══════ 8. HOME ═══════ */
    const Home = {
    init() {
        const addBtn = $('#addRoadmapBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.addRoadmap());
        ['#roadmapInput', '#roadmapTotal'].forEach(sel => {
        const el = $(sel);
        if (el) el.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); this.addRoadmap(); }
        });
        });
        const list = $('#roadmapList');
        if (list) {
        list.addEventListener('click', e => {
            const item = e.target.closest('.roadmap-item');
            if (!item) return;
            const id = item.dataset.id;
            const act = e.target.dataset.act;
            if (!act) return;
            if (act === 'del')  this.removeRoadmap(id);
            if (act === 'done') this.completeSession(id);
            if (act === 'undo') this.undoSession(id);
        });
        }
    },

    render() {
        this.renderGreeting();
        this.renderGoalNotif();
        this.renderRoadmap();
        this.renderStats();
        this.renderChart();
        if (typeof Heatmap !== 'undefined') Heatmap.render();
        if (typeof TodoManager !== 'undefined') TodoManager.render();
        if (typeof StreakFreeze !== 'undefined') StreakFreeze.render();
    },

    renderGreeting() {
        const h = new Date().getHours();
        let g = 'Xin chào';
        if (h < 11) g = 'Chào buổi sáng';
        else if (h < 14) g = 'Chào buổi trưa';
        else if (h < 18) g = 'Chào buổi chiều';
        else g = 'Chào buổi tối';
        const name = State.profile.name ? `, ${State.profile.name}` : '';
        const greetEl = $('#heroGreeting');
        if (greetEl) greetEl.textContent = `${g}${name} 👋`;
        const d = new Date();
        const dateEl = $('#heroDate');
        if (dateEl) {
        dateEl.textContent = `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth()+1}, ${d.getFullYear()}`;
        }
        const hintEl = $('#heroHint');
        if (hintEl) {
        const todayMin = State.days[State.today]?.minutes || 0;
        const goal = State.profile.dailyGoal || 0;
        let hint = '';
        if (todayMin === 0) {
            hint = '👋 Nhấn nút ➕ góc phải để bắt đầu phiên học đầu tiên trong ngày.';
        } else if (goal > 0 && todayMin < goal) {
            hint = `📚 Hôm nay bạn đã học ${todayMin} phút. Cố thêm ${goal - todayMin} phút nữa để đạt mục tiêu!`;
        } else if (goal > 0 && todayMin >= goal) {
            hint = `🎉 Hôm nay bạn đã vượt mục tiêu. Nghỉ ngơi hoặc học thêm tùy thích nhé!`;
        } else {
            hint = '💡 Vào Quản lý để đặt mục tiêu học mỗi ngày.';
        }
        hintEl.textContent = hint;
        }
    },

    renderGoalNotif() {
        const goal = State.profile.dailyGoal || 0;
        const todayMin = State.days[State.today]?.minutes || 0;
        const pct = goal > 0 ? Math.min((todayMin / goal) * 100, 100) : 0;
        const remain = Math.max(goal - todayMin, 0);
        const over = todayMin - goal;
        const fill = $('#goalFill');
        if (fill) {
        fill.style.width = pct + '%';
        fill.classList.toggle('done', pct >= 100 && over <= 0);
        fill.classList.toggle('over', over > 0);
        }
        let msg;
        if (goal === 0) {
        msg = `<span>Chưa đặt mục tiêu. Vào <b>Quản lý</b> để thiết lập.</span>`;
        } else if (remain > 0) {
        msg = `<span>Đã học <b>${todayMin}</b>/${goal} phút — cần thêm <b class="goal-warn">${remain} phút</b> nữa 🎯</span>`;
        } else {
        msg = `<span>🎉 Đã đạt mục tiêu! <b>${todayMin}</b>/${goal} phút${over > 0 ? ` (vượt ${over}p)` : ''}</span>`;
        }
        const info = $('#goalInfo');
        if (info) info.innerHTML = msg;

        const workLine = $('#homeWorkLine');
        if (workLine) {
        const today = State.days[State.today];
        const w = today?.work;
        if (w && w.hours > 0) {
            let timeRange = '';
            if (w.startTime && w.endTime) timeRange = ` <span style="opacity:.7">(${w.startTime}–${w.endTime})</span>`;
            workLine.hidden = false;
            workLine.innerHTML = `💼 Hôm nay đi làm: <b>${w.hours}h</b>${timeRange}`;
        } else {
            workLine.hidden = true;
        }
        }
    },

    renderRoadmap() {
        const list = $('#roadmapList');
        if (!list) return;
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
            <button data-act="del" class="del">🗑 Xóa</button>
            </div>
        `;
        frag.appendChild(item);
        });
        list.appendChild(frag);
    },

    addRoadmap() {
        const inp = $('#roadmapInput');
        const totalInp = $('#roadmapTotal');
        if (!inp || !totalInp) return;
        const t = inp.value.trim();
        const total = parseInt(totalInp.value, 10);
        if (!t) { toast('⚠️ Nhập tên lộ trình'); return; }
        if (!total || total < 1) { toast('⚠️ Nhập tổng số buổi'); return; }
        State.roadmap.unshift({
        id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: t,
        totalSessions: total,
        completedSessions: 0,
        completedDates: [],
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
        if (!confirm(`Xóa lộ trình "${State.roadmap[idx].title}"?`)) return;
        const removed = State.roadmap[idx];
        State.roadmap.splice(idx, 1);
        Storage.saveRoadmap();
        this.renderRoadmap();
        Undo.push(`Đã xóa lộ trình "${removed.title}"`, () => {
        State.roadmap.splice(idx, 0, removed);
        Storage.saveRoadmap();
        Home.renderRoadmap();
        });
        toast('🗑 Đã xóa');
    },

    completeSession(id) {
        const r = State.roadmap.find(x => x.id === id);
        if (!r) return;
        if (!Array.isArray(r.completedDates)) r.completedDates = [];
        const total = r.totalSessions || 0;
        if (r.completedDates.length >= total) {
        toast('⚠️ Đã hoàn thành hết buổi');
        return;
        }

        const todayKey = State.today;
        let targetDate = null;

        if (!r.completedDates.includes(todayKey)) {
        targetDate = todayKey;
        } else {
        for (let i = 1; i <= 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const k = dateKey(d);
            if (!r.completedDates.includes(k)) {
            targetDate = k;
            break;
            }
        }
        if (targetDate) {
            const dd = parseKey(targetDate);
            const label = `${WEEKDAYS_SHORT[dd.getDay()]}, ${dd.getDate()}/${dd.getMonth()+1}/${dd.getFullYear()}`;
            if (!confirm(`Hôm nay đã được đánh dấu cho lộ trình này.\n\nĐánh dấu cho ngày gần nhất chưa có?\n👉 ${label}`)) {
            return;
            }
        }
        }

        if (!targetDate) {
        toast('⚠️ Không còn ngày trống để đánh dấu');
        return;
        }

        r.completedDates.push(targetDate);
        r.completedSessions = Math.min(r.completedDates.length, total);
        Storage.saveRoadmap();
        this.renderRoadmap();
        Calendar.render();
        toast(`✅ Đánh dấu buổi ngày ${targetDate} (${r.completedDates.length}/${total})`);
    },

    undoSession(id) {
        const r = State.roadmap.find(x => x.id === id);
        if (!r) return;
        if (!Array.isArray(r.completedDates) || r.completedDates.length === 0) {
        toast('ℹ️ Không có buổi nào để hủy');
        return;
        }
        r.completedDates.sort((a, b) => b.localeCompare(a));
        const removed = r.completedDates.shift();
        r.completedSessions = Math.min(r.completedDates.length, r.totalSessions || 0);
        Storage.saveRoadmap();
        this.renderRoadmap();
        Calendar.render();
        toast(`↩️ Đã bỏ đánh dấu ngày ${removed} (${r.completedDates.length}/${r.totalSessions})`);
    },

    renderStats() {
        const s = Stats.summary();
        const els = {
        '#homeStreak': s.streak,
        '#homeDays': s.daysStudied,
        '#homeHours': fmtMinutes(s.totalMin),
        '#homeAvg': s.daysStudied ? Math.round(s.totalMin / s.daysStudied) + 'm' : '0m',
        };
        Object.keys(els).forEach(sel => {
        const el = $(sel);
        if (el) el.textContent = els[sel];
        });
    },

    renderChart() {
        const chart = $('#homeChart');
        if (!chart) return;
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

    /* ═══════ 9. STUDY ═══════ */
    const Study = {
    init() {
        const dateInput = $('#studyDateInput');
        if (dateInput) dateInput.value = State.today;
        if (typeof Guards !== 'undefined') Guards.applyDateLimits();
        const addBtn = $('#studyAddBtn');
        if (addBtn) {
        addBtn.addEventListener('click', () => {
            const k = ($('#studyDateInput')?.value) || State.today;
            if (k > State.today) {
            toast('⚠️ Không thể ghi vào ngày tương lai');
            return;
            }
            Calendar.openModal(k);
        });
        }
        const timeline = $('#timeline');
        if (timeline) {
        timeline.addEventListener('click', e => {
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
        }
    },

    render() {
        this.renderSummary();
        this.renderTimeline();
        if (typeof SessionManager !== 'undefined') SessionManager.render();
    },

    renderSummary() {
        const todaySessions = (State.days[State.today]?.sessions || []).length;
        const el1 = $('#studyTodaySessions');
        if (el1) el1.textContent = todaySessions;
        const week = Stats.lastNDays(7);
        const tagCount = {};
        week.forEach(k => {
        const day = State.days[k];
        if (!day || !day.sessions) return;
        day.sessions.forEach(s => {
            const tag = s.tag || 'Khác';
            tagCount[tag] = (tagCount[tag] || 0) + (s.minutes || 0);
        });
        });
        let topTag = '—';
        let topMin = 0;
        Object.entries(tagCount).forEach(([tag, min]) => {
        if (min > topMin) { topMin = min; topTag = tag; }
        });
        const el2 = $('#studyTopSubject');
        if (el2) el2.textContent = topTag;
        let focusSum = 0, focusCount = 0;
        Object.keys(State.days).forEach(k => {
        (State.days[k].sessions || []).forEach(s => {
            if (s.focus > 0) { focusSum += s.focus; focusCount++; }
        });
        });
        const el3 = $('#studyFocusAvg');
        if (el3) {
        if (focusCount === 0) el3.textContent = '—';
        else el3.textContent = (focusSum / focusCount).toFixed(1) + '★';
        }
    },

    renderTimeline() {
        const container = $('#timeline');
        if (!container) return;
        container.innerHTML = '';
        const activeKeys = Object.keys(State.days)
        .filter(k => Stats.dayHasActivity(State.days[k]) || (State.days[k].sessions?.length > 0))
        .sort((a, b) => b.localeCompare(a));
        if (!activeKeys.length) {
        container.innerHTML = '<div class="empty-state"><span class="es-icon">📖</span><div class="es-title">Chưa có ngày nào được ghi</div><div class="es-desc">Nhấn "+ Ghi giờ học" để bắt đầu</div></div>';
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
        monthsMap[mKey].forEach(k => body.appendChild(this.buildDay(k)));
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
        const sessions = data.sessions || [];
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
        let sessionsHtml = '';
        if (sessions.length) {
        sessionsHtml = sessions.map(s => {
            const time = new Date(s.at).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
            const stars = '★'.repeat(s.focus || 0) + '☆'.repeat(5 - (s.focus || 0));
            // ✅ Ưu tiên lấy màu mới nhất từ SubjectManager
            const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(s.tag) : (s.tagColor || '#64748b');
            return `
            <div class="slot-row" style="border-left-color:${color}">
                <div class="slot-time" style="color:${color}">${time}</div>
                <div class="slot-text">
                <b>${s.minutes}p</b>
                ${s.tag ? `<span style="background:${color}22;color:${color};display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${escapeHtml(s.tag)}</span>` : ''}
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
        ${data.subject ? (() => {
            const subColor = (typeof SubjectManager !== 'undefined')
            ? SubjectManager.getColor(data.subject) : '#4f46e5';
            return `<span class="day-badge" style="background:${subColor}20;color:${subColor}">📚 ${escapeHtml(data.subject)}</span>`;
        })() : ''}
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

    /* ═══════ 10. CALENDAR ═══════ */
    const Calendar = {
    filterSubject: '',
    init() {
        const prev = $('#prevMonth');
        const next = $('#nextMonth');
        const today = $('#todayBtn');
        if (prev)  prev.addEventListener('click', () => this.change(-1));
        if (next)  next.addEventListener('click', () => this.change(1));
        if (today) today.addEventListener('click', () => this.goToday());
        const grid = $('#calGrid');
        if (grid) {
        grid.addEventListener('click', e => {
            const chipDeadline = e.target.closest('.chip.deadline[data-todo-id]');
            if (chipDeadline) {
            e.stopPropagation();
            if (typeof TodoManager !== 'undefined') {
                TodoManager.openModal(chipDeadline.dataset.todoId);
            }
            return;
            }
            const cell = e.target.closest('.cell');
            if (!cell) return;
            this.openModal(cell.dataset.date);
        });
        }
        $$('#hourModal [data-close]').forEach(el => {
        el.addEventListener('click', () => this.closeModal());
        });
        document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeModal();
        });
        const saveBtn = $('#modalSave');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveModal());

        const filterSel = $('#calSubjectFilter');
        if (filterSel) {
        filterSel.addEventListener('change', () => {
            this.filterSubject = filterSel.value;
            this.render();
        });
        }
    },

    render() {
        this.renderSummary();
        this.renderGrid();
    },

    renderSummary() {
        const monthEl = $('#calMonthHours');
        if (monthEl) monthEl.textContent = fmtMinutes(Stats.monthTotal(State.viewYear, State.viewMonth));
        let activeDays = 0;
        Object.keys(State.days).forEach(k => {
        const [y, m] = k.split('-').map(Number);
        if (y === State.viewYear && m === State.viewMonth + 1) {
            if (Stats.dayHasActivity(State.days[k])) activeDays++;
        }
        });
        const daysEl = $('#calActiveDays');
        if (daysEl) daysEl.textContent = activeDays;
        let upcoming = 0;
        if (typeof TodoManager !== 'undefined') {
        upcoming = TodoManager.countSoon(7).length;
        }
        const upEl = $('#calUpcoming');
        if (upEl) upEl.textContent = upcoming;
    },

    renderGrid() {
        const title = $('#calTitle');
        if (title) title.textContent = `${MONTHS[State.viewMonth]} ${State.viewYear}`;
        const grid = $('#calGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const activeFilter = this.filterSubject || '';
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

        // ✅ Ngày lễ — Theme + Icon nền + Data cho popup
        const holiday = getHolidayInfo(cellDate);
        let holidayIcon = '';
        if (holiday) {
            cell.classList.add('theme-' + (holiday.theme || 'default'));
            if (holiday.type === 'major') cell.classList.add('holiday-major');
            if (holiday.region) cell.classList.add('holiday-' + holiday.region);

            if (holiday.theme === 'halloween')  holidayIcon = '🎃';
            else if (holiday.theme === 'tet')        holidayIcon = '🧨';
            else if (holiday.theme === 'midautumn')  holidayIcon = '🏮';
            else if (holiday.theme === 'lantern')    holidayIcon = '🏮';
            else if (holiday.theme === 'christmas')  holidayIcon = '🎄';
            else if (holiday.theme === 'valentine')  holidayIcon = '❤️';
            else if (holiday.theme === 'national')   holidayIcon = '⭐';
            else if (holiday.theme === 'shopping')   holidayIcon = '🛒';
            else if (holiday.theme === 'flowers')    holidayIcon = '🌸';
            else if (holiday.theme === 'newyear')    holidayIcon = '🎆';
            else if (holiday.theme === 'kids')       holidayIcon = '🎈';
            else                                     holidayIcon = '🎉';

            const bgIcon = document.createElement('span');
            bgIcon.className = 'holiday-bg-icon';
            bgIcon.textContent = holidayIcon;
            bgIcon.setAttribute('aria-hidden', 'true');
            cell.appendChild(bgIcon);

            cell.dataset.holiday       = '1';
            cell.dataset.holidayName   = holiday.name;
            cell.dataset.holidayType   = holiday.type || 'minor';
            cell.dataset.holidayTheme  = holiday.theme || 'default';
            cell.title = `🎉 ${holiday.name}${holiday.type === 'major' ? ' (Ngày lễ lớn)' : ''}`;
        }

        const num = document.createElement('div');
        num.className = 'num';
        num.textContent = cellDate.getDate();
        cell.appendChild(num);

        if (holidayIcon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'holiday-icon';
            iconEl.textContent = holidayIcon;
            iconEl.setAttribute('aria-hidden', 'true');
            cell.appendChild(iconEl);
        }

        const chips = document.createElement('div');
        chips.className = 'chips';
        chips.style.cssText = 'max-height: 110px; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; display: flex; flex-direction: column; gap: 3px; margin-top: 4px;';

        const daySubject = (data && data.subject) || '';
        const sessions = (data && data.sessions) ? data.sessions : [];
        const planSlots = (data && data.slots) ? data.slots : [];

        // 1. KẾ HOẠCH (Có nền màu nhạt)
        const showPlan = planSlots.length > 0 && (!activeFilter || daySubject === activeFilter);
        if (showPlan) {
            const planColor = daySubject ? SubjectManager.getColor(daySubject) : 'var(--accent)';
            const planText = daySubject ? escapeHtml(daySubject) : `Kế hoạch`;
            chips.insertAdjacentHTML('beforeend',
            `<div class="chip plan" style="background:${planColor}33 !important; border: 1px dashed ${planColor} !important; color:${planColor} !important; padding: 4px; border-radius: 6px; font-weight: 700; font-size: 10px; text-align: center;" title="${planSlots.length} khung giờ dự định">${planText}</div>`);
        }

        // 2. GIỜ HỌC THỰC TẾ (Nền đặc, chữ trắng - GIỐNG ẢNH)
        const subjectStats = {};
        sessions.forEach(s => {
            const tag = s.tag || 'Khác';
            if (activeFilter && tag !== activeFilter) return;
            if (!subjectStats[tag]) subjectStats[tag] = 0;
            subjectStats[tag] += (s.minutes || 0);
        });
        if (daySubject && sessions.length === 0 && (!activeFilter || daySubject === activeFilter)) {
            subjectStats[daySubject] = (subjectStats[daySubject] || 0) + (data.minutes || 0);
        }

        let totalActualMins = 0;
        Object.entries(subjectStats).forEach(([tag, mins]) => {
            if (mins <= 0) return;
            totalActualMins += mins;
            const color = SubjectManager.getColor(tag);
            // ✅ Chỉ hiện tên môn, nền đặc, chữ trắng, bo góc y hệt ảnh
            chips.insertAdjacentHTML('beforeend',
            `<div class="chip actual" style="background:${color} !important; border:none !important; color: #fff !important; padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 10px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" title="${mins} phút đã học">${escapeHtml(tag)}</div>`);
        });

        // 3. TODO (Việc cần làm) - Hiển thị từng cái, chỉ hiện tên môn
        if (typeof TodoManager !== 'undefined') {
            const todos = TodoManager.todos.filter(t => {
                if (t.deadline !== k) return false;
                if (activeFilter && t.tag !== activeFilter) return false;
                return true;
            });
            
            if (todos.length > 0) {
                const isSoon = k >= State.today;
                todos.forEach(t => {
                    const tagName = t.tag || '';
                    let todoColor = (typeof SubjectManager !== 'undefined' && tagName)
                        ? SubjectManager.getColor(tagName)
                        : (isSoon ? 'var(--accent)' : 'var(--danger)');
                    
                    const opacity = t.done ? 'opacity: 0.5; text-decoration: line-through;' : '';
                    const displayText = tagName ? escapeHtml(tagName) : 'Cần làm';

                    // ✅ Ép thành 1 dòng duy nhất, ghi đè CSS flex-direction: column cũ
                    chips.insertAdjacentHTML('beforeend',
                    `<div class="chip deadline ${isSoon ? '' : 'overdue'}" 
                        style="background:${todoColor} !important; border:none !important; color: #fff !important; ${opacity}; display: flex !important; flex-direction: row !important; justify-content: center !important; align-items: center !important; padding: 4px 8px !important; border-radius: 999px !important; font-size: 10px !important; font-weight: 700 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" 
                        data-todo-id="${t.id}" 
                        title="${t.done ? 'Đã xong' : 'Chưa xong'}: ${escapeHtml(t.title)}">
                        ${displayText}
                    </div>`);
                });
            }
        }

        // 4. LỘ TRÌNH
        if (Array.isArray(State.roadmap)) {
            State.roadmap.forEach(r => {
            const dates = Array.isArray(r.completedDates) ? r.completedDates : [];
            if (dates.includes(k)) {
                chips.insertAdjacentHTML('beforeend',
                `<div class="chip roadmap" style="background:#8b5cf6 !important; border:none !important; color:#fff !important; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" title="Lộ trình: ${escapeHtml(r.title)}">${escapeHtml(r.title.slice(0, 15))}${r.title.length > 15 ? '…' : ''}</div>`);
            }
            });
        }

        if (chips.children.length > 0) cell.appendChild(chips);
        if (planSlots.length > 0 && totalActualMins > 0) cell.classList.add('has-both');
        if (chips.children.length > 0) cell.appendChild(chips);
        if (planSlots.length > 0 && totalActualMins > 0) cell.classList.add('has-both');
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
        const isFuture = k > State.today;
        this.renderHolidayBanner(k);

        const data = Storage.getDay(k);
        State.modal.date = k;
        State.modal.minutes = data.minutes || 0;
        State.modal.slots = (data.slots || []).map(s => ({
        hour: s.hour, text: s.text, done: !!s.done,
        }));
        const d = parseKey(k);
        const title = $('#modalTitle');
        if (title) title.textContent = `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const sub = $('#modalSub');
        if (sub) sub.textContent = isFuture
            ? '🔮 Ngày tương lai — chỉ xem thông tin, không thể ghi giờ'
            : 'Nhập giờ học, giờ làm và chi tiết từng khung giờ';
        const mins = $('#modalMinutes');
        if (mins) { mins.value = State.modal.minutes || ''; mins.disabled = isFuture; }

        const work = data.work || {};
        const wStart = $('#modalWorkStart');
        const wEnd = $('#modalWorkEnd');
        const wHours = $('#modalWorkHours');
        if (wStart) { wStart.value = work.startTime || ''; wStart.disabled = isFuture; }
        if (wEnd) { wEnd.value = work.endTime || ''; wEnd.disabled = isFuture; }
        if (wHours) { wHours.value = (work.hours > 0) ? work.hours : ''; wHours.disabled = isFuture; }
        this._bindWorkCalc();

        if (typeof SubjectManager !== 'undefined') SubjectManager.renderModalSelect();
        const subjSel = $('#modalSubject');
        if (subjSel) { subjSel.value = data.subject || ''; subjSel.disabled = isFuture; }
        this.renderHourList();
        if (isFuture) {
        $$('#hourList input').forEach(inp => inp.disabled = true);
        $$('#hourList .hour-clear').forEach(btn => btn.disabled = true);
        }
        this.renderModalRoadmaps(k);
        if (isFuture) {
        $$('#modalRoadmaps input').forEach(inp => inp.disabled = true);
        }

        const saveBtn = $('#modalSave');
        if (saveBtn) saveBtn.style.display = isFuture ? 'none' : '';

        const modal = $('#hourModal');
        if (modal) modal.classList.add('show');
    },

    renderHolidayBanner(k) {
        const banner = $('#modalHolidayBanner');
        if (!banner) return;

        const date    = parseKey(k);
        const holiday = getHolidayInfo(date);

        if (!holiday) {
            banner.hidden = true;
            banner.innerHTML = '';
            return;
        }

        const icons = {
            tet: '🧨', midautumn: '🏮', lantern: '🏮', christmas: '🎄',
            valentine: '❤️', national: '⭐', shopping: '🛒', flowers: '🌸',
            newyear: '🎆', kids: '🎈', halloween: '🎃', default: '🎉'
        };
        const icon       = icons[holiday.theme] || '🎉';
        const majorLabel = holiday.type === 'major' ? '🎊 Ngày lễ lớn' : '🎉 Ngày lễ';
        const regionLbl  = holiday.region === 'us' ? '🇺🇸' : (holiday.region === 'vn' ? '🇻🇳' : '');

        banner.hidden    = false;
        banner.className = 'holiday-banner theme-' + (holiday.theme || 'default');
        banner.innerHTML = `
            <div class="hb-icon">${icon}</div>
            <div class="hb-content">
                <div class="hb-type">${regionLbl} ${majorLabel}</div>
                <div class="hb-name">${escapeHtml(holiday.name)}</div>
                <div class="hb-date">${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}</div>
            </div>
        `;
    },

    _bindWorkCalc() {
        const wStart = $('#modalWorkStart');
        const wEnd = $('#modalWorkEnd');
        const wHours = $('#modalWorkHours');
        if (!wStart || !wEnd || !wHours) return;
        if (wStart.dataset.bound) return;
        wStart.dataset.bound = '1';

        const recalc = () => {
        if (!wStart.value || !wEnd.value) return;
        const [sh, sm] = wStart.value.split(':').map(Number);
        const [eh, em] = wEnd.value.split(':').map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        wHours.value = (mins / 60).toFixed(1);
        };

        wStart.addEventListener('change', recalc);
        wEnd.addEventListener('change', recalc);
    },

    renderHourList() {
        const list = $('#hourList');
        if (!list) return;
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
        if (k > State.today) { toast('⚠️ Không thể ghi vào ngày tương lai'); return; }
        const mins = Math.max(0, parseInt($('#modalMinutes')?.value, 10) || 0);
        const subjectSel = $('#modalSubject');
        const subject = subjectSel ? subjectSel.value : '';
        const list = $('#hourList');
        const slots = [];
        if (list) {
        list.querySelectorAll('input[type="text"]').forEach(txt => {
            const val = txt.value.trim();
            if (val) slots.push({ hour: +txt.dataset.h, text: val, done: true });
        });
        }
        if (typeof Guards !== 'undefined') {
        const mismatch = Guards.checkMinutesMismatch(mins, slots);
        if (mismatch && !confirm(`⚠️ ${mismatch.msg}\n\nVẫn tiếp tục lưu?`)) return;
        const day = Storage.getDay(k);
        if (day.sessions && day.sessions.length && slots.length) {
            const dups = [];
            slots.forEach(slot => {
            const dup = Guards.checkTimeDuplicate(k, slot.hour, 0);
            if (dup) {
                const t = new Date(dup.at);
                dups.push(`${String(slot.hour).padStart(2,'0')}:00 trùng phiên ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')} (${dup.minutes}p)`);
            }
            });
            if (dups.length && !confirm(`⚠️ Phát hiện trùng giờ:\n\n${dups.join('\n')}\n\nVẫn tiếp tục lưu?`)) return;
        }
        }
        const dayData = Storage.ensureDay(k);
        dayData.minutes = mins;
        dayData.slots = slots.sort((a, b) => a.hour - b.hour);
        if (subject) dayData.subject = subject;

        const workStart = $('#modalWorkStart')?.value || '';
        const workEnd = $('#modalWorkEnd')?.value || '';
        const workHours = parseFloat($('#modalWorkHours')?.value) || 0;
        if (workStart || workEnd || workHours > 0) {
        dayData.work = { startTime: workStart, endTime: workEnd, hours: workHours };
        } else {
        delete dayData.work;
        }

        Storage.saveDays();
        this.closeModal();
        this.render();
        Study.render();
        Home.render();
        Modules.refreshHeader();
        if (typeof SessionManager !== 'undefined') SessionManager.render();
        toast('✅ Đã lưu');
    },

    closeModal() {
        const modal = $('#hourModal');
        if (modal) modal.classList.remove('show');
        const banner = $('#modalHolidayBanner');
        if (banner) { banner.hidden = true; banner.innerHTML = ''; }
        ['#modalMinutes', '#modalWorkStart', '#modalWorkEnd', '#modalWorkHours', '#modalSubject'].forEach(sel => {
        const el = $(sel); if (el) el.disabled = false;
        });
        const saveBtn = $('#modalSave');
        if (saveBtn) saveBtn.style.display = '';
    },

    renderModalRoadmaps(dateKey) {
        const modal = $('#hourModal');
        if (!modal) return;

        let section = modal.querySelector('#modalRoadmapsSection');
        if (!section) {
        section = document.createElement('div');
        section.id = 'modalRoadmapsSection';
        section.innerHTML = `
            <label class="field-label" style="margin-top:14px">🗺️ Đánh dấu buổi lộ trình</label>
            <div id="modalRoadmaps" class="roadmap-check-list"></div>
        `;
        const actions = modal.querySelector('.modal-actions');
        if (actions) actions.parentNode.insertBefore(section, actions);
        else modal.querySelector('.modal-content')?.appendChild(section);
        }

        const list = section.querySelector('#modalRoadmaps');
        if (!list) return;
        list.innerHTML = '';

        if (!State.roadmap.length) {
        list.innerHTML = '<p style="font-size:12px;color:var(--text-mute);margin:0;font-style:italic">Chưa có lộ trình nào. Tạo ở Trang chủ.</p>';
        return;
        }

        State.roadmap.forEach(r => {
        const dates = Array.isArray(r.completedDates) ? r.completedDates : [];
        const checked = dates.includes(dateKey);
        const done = dates.length;
        const total = r.totalSessions || 1;
        const isFull = done >= total && !checked;

        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--surface-2);border-radius:8px;cursor:pointer;margin-bottom:6px;transition:background .15s;border:1.5px solid transparent;';
        label.innerHTML = `
            <input type="checkbox" data-roadmap-id="${r.id}" ${checked ? 'checked' : ''} ${isFull ? 'disabled' : ''} style="width:18px;height:18px;accent-color:#8b5cf6;flex-shrink:0;cursor:pointer;">
            <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:13px;word-break:break-word;color:var(--text)">${escapeHtml(r.title)}</div>
            <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">${done}/${total} buổi${isFull ? ' · Đã đầy' : ''}</div>
            </div>
            <span style="font-size:16px;color:${checked ? 'var(--success)' : 'var(--text-mute)'}">${checked ? '✅' : '⚪'}</span>
        `;

        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
            this.toggleRoadmapDate(r.id, dateKey, cb.checked);
            this.renderModalRoadmaps(dateKey);
        });

        list.appendChild(label);
        });
    },

    toggleRoadmapDate(roadmapId, dateKey, checked) {
        const r = State.roadmap.find(x => x.id === roadmapId);
        if (!r) return;
        if (!Array.isArray(r.completedDates)) r.completedDates = [];

        const wasChecked = r.completedDates.includes(dateKey);
        if (wasChecked === checked) return;

        if (checked) {
        if (r.completedDates.length >= (r.totalSessions || 0)) {
            toast('⚠️ Lộ trình đã đủ số buổi');
            return;
        }
        r.completedDates.push(dateKey);
        } else {
        r.completedDates = r.completedDates.filter(d => d !== dateKey);
        }
        r.completedSessions = Math.min(r.completedDates.length, r.totalSessions || 0);

        Storage.saveRoadmap();
        Home.renderRoadmap();
        Calendar.render();

        Undo.push(
        checked ? `Đánh dấu "${r.title}" ngày ${dateKey}` : `Bỏ đánh dấu "${r.title}" ngày ${dateKey}`,
        () => {
            if (checked) {
            r.completedDates = r.completedDates.filter(d => d !== dateKey);
            } else {
            if (!r.completedDates.includes(dateKey)) r.completedDates.push(dateKey);
            }
            r.completedSessions = Math.min(r.completedDates.length, r.totalSessions || 0);
            Storage.saveRoadmap();
            Home.renderRoadmap();
            Calendar.render();
            if (State.modal.date === dateKey) this.renderModalRoadmaps(dateKey);
        }
        );

        toast(checked ? `✅ Đã đánh dấu buổi lộ trình (${r.completedDates.length}/${r.totalSessions})` : `↩️ Đã bỏ đánh dấu (${r.completedDates.length}/${r.totalSessions})`);
    },
    };

    /* ═══════ 11. ROUTER ═══════ */
    const Router = {
    current: 'home',
    PAGES: ['home', 'study', 'calendar', 'stats', 'manage'],
    init() {
        $$('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => this.go(btn.dataset.page));
        });
        const navUser = $('#navUser');
        if (navUser) navUser.addEventListener('click', () => this.go('manage'));
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
        if (page === 'manage')   Profile.sync();
        if (updateHash) location.hash = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (page === 'stats') {
        requestAnimationFrame(() => StatsPage.render());
        }
        if (page === 'home' && typeof Heatmap !== 'undefined') {
        requestAnimationFrame(() => Heatmap.render());
        }
    },
    };

    /* ═══════ 12. SEARCH ═══════ */
    const Search = {
    init() {
        const inp = $('#globalSearch');
        const box = $('#searchResults');
        if (!inp || !box) return;
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

    /* ═══════ 13. MODULES ═══════ */
    const Modules = {
    refreshHeader() {
        const nameEl = $('#navUserName');
        if (nameEl) nameEl.textContent = State.profile.name || 'Khách';
        const streakEl = $('#navUserStreak');
        if (streakEl) {
        const s = Stats.summary();
        let text = '';
        if (s.streak > 0) {
            text = `🔥 ${s.streak} ngày`;
            if (typeof StreakFreeze !== 'undefined' && StreakFreeze.freezes > 0) {
            text += ` · ❄️ ${StreakFreeze.freezes}`;
            }
            streakEl.style.opacity = '1';
        } else {
            text = '📚 Bắt đầu học';
            streakEl.style.opacity = '.7';
        }
        streakEl.textContent = text;
        }
        const av = $('#navAvatar');
        if (!av) return;
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
        if (Router.current === 'stats')  StatsPage.render();
        if (typeof A11y !== 'undefined') {
        setTimeout(() => A11y.autoLabelAll(), 100);
        }
    },
    };

    /* ═══════ 14. SUBJECT MANAGER ═══════ */
    const SubjectManager = {
    subjects: [],
    editingId: null,
    DEFAULT_COLORS: [
        '#4f46e5', '#10b981', '#ef4444', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
    ],

    init() {
        this.load();
        const addBtn = $('#addSubjectBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.add());
        const nameInput = $('#subjectNameInput');
        if (nameInput) {
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); this.add(); }
        });
        }
        // ✅ Tự động chọn màu random khi mở trang để mỗi môn thêm vào có màu khác nhau
        const colorInput = $('#subjectColorInput');
        if (colorInput) colorInput.value = this.getRandomColor();

        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
    },

    load() {
        try {
        if (window.DB && window.DB.ready) {
            const rows = window.DB.query('SELECT * FROM subjects ORDER BY created_at ASC');
            if (rows.length > 0) {
            this.subjects = rows.map(r => ({
                id: r.id, name: r.name, color: r.color, createdAt: r.created_at,
            }));
            return;
            }
        }
        const raw = localStorage.getItem(STORE.SUBJECTS);
        this.subjects = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.subjects)) this.subjects = [];
        if (this.subjects.length === 0) {
            const defaults = ['Toán', 'Lý', 'Hóa', 'Anh', 'Văn', 'Sử', 'Khác'];
            this.subjects = defaults.map((name, i) => ({
            id: 'sub_' + Date.now() + '_' + i,
            name: name,
            color: this.DEFAULT_COLORS[i] || '#64748b',
            createdAt: new Date().toISOString(),
            }));
            this.save();
        }
        } catch (e) { this.subjects = []; }
    },

    save() {
        Storage.saveSubjects(this.subjects);
    },

    getRandomColor() {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 20) + 70;
        let   l = Math.floor(Math.random() * 15) + 45;
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    },

    add() {
        const nameInput = $('#subjectNameInput');
        const colorInput = $('#subjectColorInput');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        
        let color = (colorInput && colorInput.value) ? colorInput.value : this.getRandomColor();
        
        let attempts = 0;
        while (this.subjects.some(s => s.color === color) && attempts < 20) {
            color = this.getRandomColor();
            attempts++;
        }

        if (!name) { toast('⚠️ Nhập tên môn'); return; }
        if (this.subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            toast('⚠️ Môn này đã có'); return;
        }
        
        this.subjects.push({
            id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            name: name, color: color, createdAt: new Date().toISOString(),
        });
        
        this.save();
        nameInput.value = '';
        if (colorInput) colorInput.value = this.getRandomColor();
        
        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
        toast('✅ Đã thêm môn ' + name);
    },

    edit(id) {
        const sub = this.subjects.find(s => s.id === id);
        if (!sub) return;
        const newName = prompt('Sửa tên môn:', sub.name);
        if (newName === null) return;
        const trimmed = newName.trim();
        if (!trimmed) { toast('⚠️ Tên không được trống'); return; }
        if (this.subjects.some(s => s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase())) {
        toast('⚠️ Trùng tên với môn khác'); return;
        }
        const oldName = sub.name;
        sub.name = trimmed;
        // ✅ Cập nhật tên môn trong tất cả sessions
        if (oldName !== trimmed) {
            let updated = 0;
            Object.keys(State.days).forEach(k => {
                (State.days[k].sessions || []).forEach(s => {
                    if (s.tag === oldName) { s.tag = trimmed; updated++; }
                });
            });
            if (updated > 0) Storage.saveDays();
        }
        this.save();
        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
        toast('✅ Đã sửa môn');
    },

    // ✅ SỬA LỖI: Đổi màu môn sẽ đổi toàn bộ màu ở mọi nơi (Lịch, Học tập, Todo)
    changeColor(id, newColor) {
        const sub = this.subjects.find(s => s.id === id);
        if (!sub) return;
        const oldColor = sub.color;
        if (oldColor === newColor) { toast('ℹ️ Màu không đổi'); return; }

        sub.color = newColor;
        this.save();
        this.render();
        this.renderTagPicker();
        this.renderModalSelect();

        // Cập nhật tagColor cho TẤT CẢ session đang dùng môn này
        let updated = 0;
        Object.keys(State.days).forEach(k => {
            (State.days[k].sessions || []).forEach(s => {
                if (s.tag === sub.name) { s.tagColor = newColor; updated++; }
            });
        });
        if (updated > 0) Storage.saveDays();

        // Ép toàn bộ giao diện vẽ lại
        if (typeof Calendar    !== 'undefined') Calendar.render();
        if (typeof Study       !== 'undefined') Study.render();
        if (typeof Home        !== 'undefined') Home.render();
        if (typeof TodoManager !== 'undefined') TodoManager.render();

        // Hoàn tác 30s
        Undo.push(`🎨 Đã đổi màu "${sub.name}"`, () => {
            const s2 = this.subjects.find(s => s.id === id);
            if (!s2) return;
            s2.color = oldColor;
            Object.keys(State.days).forEach(k => {
                (State.days[k].sessions || []).forEach(s => {
                    if (s.tag === sub.name) { s.tagColor = oldColor; }
                });
            });
            Storage.saveDays();
            this.save();
            this.render();
            this.renderTagPicker();
            this.renderModalSelect();
            if (typeof Calendar    !== 'undefined') Calendar.render();
            if (typeof Study       !== 'undefined') Study.render();
            if (typeof Home        !== 'undefined') Home.render();
            if (typeof TodoManager !== 'undefined') TodoManager.render();
        }, 30000);

        toast(`🎨 Đã đổi màu "${sub.name}" — bấm ↩ Hoàn tác nếu sai`);
    },

    remove(id) {
        const idx = this.subjects.findIndex(s => s.id === id);
        if (idx < 0) return;
        const sub = this.subjects[idx];
        let usedCount = 0;
        Object.keys(State.days).forEach(k => {
        (State.days[k].sessions || []).forEach(s => {
            if (s.tag === sub.name) usedCount++;
        });
        });
        let msg = `Xóa môn "${sub.name}"?`;
        if (usedCount > 0) {
        msg += `\n\n⚠️ Có ${usedCount} phiên học đang dùng môn này.`;
        }
        if (!confirm(msg)) return;
        this.subjects.splice(idx, 1);
        this.save();
        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
        Undo.push(`Đã xóa môn "${sub.name}"`, () => {
        this.subjects.splice(idx, 0, sub);
        this.save();
        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
        });
        toast('🗑 Đã xóa môn');
    },

    render() {
        const list = $('#subjectList');
        if (!list) return;
        list.innerHTML = '';
        if (this.subjects.length === 0) {
        list.innerHTML = '<div class="subject-empty">Chưa có môn nào. Thêm ở dưới 👇</div>';
        return;
        }
        const frag = document.createDocumentFragment();
        this.subjects.forEach(sub => {
        let count = 0;
        Object.keys(State.days).forEach(k => {
            (State.days[k].sessions || []).forEach(s => {
            if (s.tag === sub.name) count++;
            });
        });
        const item = document.createElement('div');
        item.className = 'subject-item';
        item.style.borderLeftColor = sub.color;
        item.innerHTML = `
            <span class="subject-color-dot" style="background:${sub.color}"></span>
            <span class="subject-name">${escapeHtml(sub.name)}</span>
            <span class="subject-count">${count} phiên</span>
            <div class="subject-actions">
            <button class="color-btn" title="Đổi màu" aria-label="Đổi màu">🎨</button>
            <button class="assign-btn" title="Gán môn này cho Todos" aria-label="Gán môn cho Todos">📌</button>
            <button class="edit-btn" title="Sửa tên" aria-label="Sửa tên">✏️</button>
            <button class="del" title="Xóa" aria-label="Xóa">🗑</button>
            </div>
        `;
        item.querySelector('.color-btn').addEventListener('click', () => {
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = sub.color;
            colorInput.style.position = 'absolute';
            colorInput.style.opacity = '0';
            colorInput.style.pointerEvents = 'none';
            document.body.appendChild(colorInput);
            colorInput.addEventListener('change', () => {
            this.changeColor(sub.id, colorInput.value);
            if (colorInput.parentNode) document.body.removeChild(colorInput);
            });
            colorInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (colorInput.parentNode) document.body.removeChild(colorInput);
            }, 200);
            });
            colorInput.click();
        });
        item.querySelector('.assign-btn').addEventListener('click', () => this.assignToTodos(sub));
        item.querySelector('.edit-btn').addEventListener('click', () => this.edit(sub.id));
        item.querySelector('.del').addEventListener('click', () => this.remove(sub.id));
        frag.appendChild(item);
        });
        list.appendChild(frag);
    },
    
    // ✅ SỬA: Đổi môn cho TẤT CẢ Todo (không chỉ cái trống)
    assignToTodos(sub) {
        if (typeof TodoManager === 'undefined' || !TodoManager.todos.length) {
            toast('ℹ️ Chưa có Todo nào'); return;
        }
        const total = TodoManager.todos.length;
        const changed = TodoManager.todos.filter(t => t.tag !== sub.name).length;
        if (changed === 0) {
            toast(`ℹ️ Tất cả ${total} Todo đã có môn "${sub.name}"`);
            return;
        }
        if (!confirm(
            `Đổi môn của TẤT CẢ ${total} Todo sang "${sub.name}"?\n\n` +
            `✔ ${changed} Todo sẽ được cập nhật\n` +
            `✖ ${total - changed} Todo đã đúng môn (giữ nguyên)`
        )) return;

        const backup = TodoManager.todos.map(t => ({ id: t.id, tag: t.tag }));
        TodoManager.todos.forEach(t => { t.tag = sub.name; });
        TodoManager.save();
        TodoManager.render();
        if (typeof Calendar !== 'undefined') Calendar.render();

        Undo.push(`Đã đổi ${changed} Todo sang "${sub.name}"`, () => {
            backup.forEach(b => {
                const td = TodoManager.todos.find(t => t.id === b.id);
                if (td) td.tag = b.tag;
            });
            TodoManager.save();
            TodoManager.render();
            if (typeof Calendar !== 'undefined') Calendar.render();
        }, 30000);

        toast(`✅ Đã đổi "${sub.name}" cho ${changed} Todo`);
    },

    renderTagPicker() {
        const picker = $('#tagPicker');
        if (!picker) return;
        
        const prevSelectedTag = (typeof Pomodoro !== 'undefined') ? Pomodoro.selectedTag : null;
        
        picker.innerHTML = '';
        if (typeof Pomodoro !== 'undefined') Pomodoro.selectedTag = null;
        if (this.subjects.length === 0) {
        picker.innerHTML = '<span style="color:var(--text-mute);font-size:13px">Chưa có môn — vào Quản lý để thêm</span>';
        return;
        }
        this.subjects.forEach(sub => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tag';
        b.style.background = sub.color;
        b.style.color = '#fff';
        b.style.border = '2px solid transparent';
        b.textContent = sub.name;
        b.dataset.subjectId = sub.id;
        b.addEventListener('click', () => {
            const wasActive = b.classList.contains('active');
            picker.querySelectorAll('.tag').forEach(x => {
            x.classList.remove('active');
            const sid = x.dataset.subjectId;
            const s = this.subjects.find(z => z.id === sid);
            if (s) {
                x.style.background = s.color;
                x.style.color = '#fff';
                x.style.border = '2px solid transparent';
                x.style.boxShadow = 'none';
            }
            });
            if (!wasActive) {
            b.classList.add('active');
            b.style.background = sub.color;
            b.style.color = '#fff';
            b.style.border = '2px solid #fff';
            b.style.boxShadow = '0 0 0 2px ' + sub.color;
            if (typeof Pomodoro !== 'undefined') Pomodoro.selectedTag = sub.name;
            } else {
            if (typeof Pomodoro !== 'undefined') Pomodoro.selectedTag = null;
            }
        });
        if (prevSelectedTag && sub.name === prevSelectedTag) {
            b.classList.add('active');
            b.style.background = sub.color;
            b.style.color = '#fff';
            b.style.border = '2px solid #fff';
            b.style.boxShadow = '0 0 0 2px ' + sub.color;
            if (typeof Pomodoro !== 'undefined') Pomodoro.selectedTag = sub.name;
        }
        picker.appendChild(b);
        });
    },

    renderModalSelect() {
        const sel = $('#modalSubject');
        if (!sel) return;
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">— Không chọn —</option>';
        this.subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.name;
        opt.textContent = sub.name;
        sel.appendChild(opt);
        });
        if (currentVal) sel.value = currentVal;
        const sSel = $('#sessionSubject');
        if (sSel) {
        const sVal = sSel.value;
        sSel.innerHTML = '<option value="">— Không chọn —</option>';
        this.subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name;
            opt.textContent = sub.name;
            sSel.appendChild(opt);
        });
        if (sVal) sSel.value = sVal;
        }

        const calFilter = $('#calSubjectFilter');
        if (calFilter) {
        const cVal = calFilter.value;
        calFilter.innerHTML = '<option value="">— Tất cả môn —</option>';
        this.subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name;
            opt.textContent = sub.name;
            calFilter.appendChild(opt);
        });
        if (cVal && this.subjects.some(s => s.name === cVal)) {
            calFilter.value = cVal;
        }
        }
    },

    getColor(name) {
        if (!name) return '#64748b';
        const sub = this.subjects.find(s => s.name === name);
        if (sub) return sub.color;
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        
        const s = 70, l = 55;
        const lDecimal = l / 100;
        const a = s * Math.min(lDecimal, 1 - lDecimal) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = lDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    },
    };

    /* ═══════ 15. POMODORO ═══════ */
    const Pomodoro = {
    modes: {
        pomodoro: { min: 25, label: 'Pomodoro · Tập trung', kind: 'work' },
        short:    { min: 5,  label: 'Nghỉ ngắn',           kind: 'break' },
        long:     { min: 15, label: 'Nghỉ dài',            kind: 'break' },
        custom:   { min: 30, label: 'Tùy chỉnh',           kind: 'work' },
    },
    state: {
        mode: 'pomodoro', remaining: 25 * 60,
        running: false, paused: false, endAt: 0, id: null, sessionStartAt: 0,
    },
    selectedTag: null,
    selectedStar: 0,
    _worker: null,

    init() {
        $$('#pomodoroModes .pmode').forEach(btn => {
        btn.addEventListener('click', () => {
            if (this.state.running) { toast('⏸ Dừng trước khi đổi chế độ'); return; }
            this.state.mode = btn.dataset.mode;
            $$('#pomodoroModes .pmode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.setDuration(this.modes[this.state.mode].min);
        });
        });

        const startBtn = $('#pomoStart');
        const pauseBtn = $('#pomoPause');
        const stopBtn = $('#pomoStop');
        const resetBtn = $('#pomoReset');
        const fullBtn = $('#pomoFull');
        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopAndSave());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (fullBtn) fullBtn.addEventListener('click', () => this.fullscreen());

        this.initCustomTime();
        this.initStarRating();
        if (typeof SubjectManager !== 'undefined') SubjectManager.renderTagPicker();
        this.restore();
        this.syncMinutesInput();
        this.syncCustomTimeDisabled();

        window.addEventListener('beforeunload', (e) => {
        if (this.state.running || this.state.paused) {
            const msg = 'Đang có phiên Pomodoro. Bạn có chắc muốn rời đi?';
            e.preventDefault();
            e.returnValue = msg;
            return msg;
        }
        });
        this.render();
        this.renderButtons();
    },

    _ensureWorker() {
        if (this._worker) return true;
        if (typeof Worker === 'undefined') return false;
        try {
        this._worker = new Worker('timer-worker.js');
        this._worker.onmessage = (e) => {
            if (e.data === 'tick' && this.state.running) {
                this._tick();
            }
        };
        this._worker.onerror = (err) => {
            console.warn('[Pomodoro] Worker error, fallback to setInterval:', err.message);
            this._worker = null;
        };
        return true;
        } catch (e) {
        console.warn('[Pomodoro] Worker init failed:', e.message);
        this._worker = null;
        return false;
        }
    },

    _tick() {
        if (!this.state.running) return;
        const remain = Math.max(0, Math.round((this.state.endAt - Date.now()) / 1000));
        if (remain === this.state.remaining) return;
        this.state.remaining = remain;
        this.render();
        if (remain <= 0) this.finish();
    },

    startTick() {
        if (this.state.id) { clearInterval(this.state.id); this.state.id = null; }
        if (this._ensureWorker() && this._worker) {
            try { this._worker.postMessage('start'); } catch (e) {}
        }
        this.state.id = setInterval(() => {
            if (!this.state.running) return;
            this._tick();
        }, 500);
    },

    stopTick() {
        if (this.state.id) { clearInterval(this.state.id); this.state.id = null; }
        if (this._worker) {
            try { this._worker.postMessage('stop'); } catch (e) {}
        }
    },

    initCustomTime() {
        const input = $('#pomoMinutesInput');
        const minusBtn = $('#pomoMinus');
        const plusBtn = $('#pomoPlus');
        const applyBtn = $('#pomoApplyTime');
        if (!input) return;

        const apply = () => {
            if (this.state.running || this.state.paused) {
                toast('⏸ Dừng phiên hiện tại trước khi đổi thời gian');
                return;
            }
            const mins = parseInt(input.value, 10);
            if (!mins || mins < 1 || mins > 999) {
                toast('⚠️ Số phút phải từ 1 đến 999');
                input.value = this.modes[this.state.mode].min;
                return;
            }
            this.modes[this.state.mode].min = mins;
            this.setDuration(mins);
            toast(`✅ Đã đặt ${mins} phút`);
        };

        if (applyBtn) applyBtn.addEventListener('click', apply);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); apply(); }
        });
        if (minusBtn) minusBtn.addEventListener('click', () => {
            const cur = parseInt(input.value, 10) || 25;
            input.value = Math.max(1, cur - 5);
        });
        if (plusBtn) plusBtn.addEventListener('click', () => {
            const cur = parseInt(input.value, 10) || 25;
            input.value = Math.min(999, cur + 5);
        });
    },

    buildLabel(mode, mins) {
        const labels = {
            pomodoro: 'Pomodoro · Tập trung',
            short:    'Nghỉ ngắn',
            long:     'Nghỉ dài',
            custom:   'Tùy chỉnh',
        };
        return `${labels[mode] || 'Học'} · ${mins} phút`;
    },

    syncMinutesInput() {
        const input = $('#pomoMinutesInput');
        const label = $('#pomoLabel');
        if (input) input.value = this.modes[this.state.mode].min;
        this.modes[this.state.mode].label = this.buildLabel(this.state.mode, this.modes[this.state.mode].min);
        if (label) label.textContent = this.modes[this.state.mode].label;
    },

    syncCustomTimeDisabled() {
        const box = $('#pomoCustomTime');
        if (!box) return;
        box.classList.toggle('disabled', this.state.running || this.state.paused);
    },

    initStarRating() {
        const box = $('#starRating');
        if (!box) return;
        this.selectedStar = 0;
        box.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const star = +b.dataset.star;
            if (this.selectedStar === star) this.selectedStar = 0;
            else this.selectedStar = star;
            box.querySelectorAll('button').forEach(x => {
            const active = +x.dataset.star <= this.selectedStar;
            x.classList.toggle('active', active);
            x.textContent = active ? '★' : '☆';
            });
            this.saveState();
        });
        });
    },

    setDuration(min) {
        this.state.remaining = min * 60;
        this.state.endAt = 0;
        this.render();
        this.saveState();
        this.syncMinutesInput();
    },

    fmt(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    },

    start() {
        if (this.state.running) return;
        if (this.state.paused) {
        this.state.paused = false;
        this.state.running = true;
        this.state.endAt = Date.now() + this.state.remaining * 1000;
        if (!this.state.sessionStartAt) this.state.sessionStartAt = Date.now();
        } else {
        this.state.running = true;
        this.state.paused = false;
        this.state.endAt = Date.now() + this.state.remaining * 1000;
        this.state.sessionStartAt = Date.now();
        }
        this.startTick();
        this.renderButtons();
        this.render();
        this.saveState();
        this.syncCustomTimeDisabled();
        const card = $('.pomodoro-card');
        if (card) {
        card.classList.toggle('running', this.modes[this.state.mode].kind === 'work');
        card.classList.toggle('break', this.modes[this.state.mode].kind === 'break');
        card.classList.remove('paused');
        }
        this.renderFullscreenButtons();
    },

    pause() {
        if (!this.state.running) return;
        this.state.running = false;
        this.state.paused = true;
        this.stopTick();
        const remain = Math.max(0, Math.round((this.state.endAt - Date.now()) / 1000));
        this.state.remaining = remain;
        const card = $('.pomodoro-card');
        if (card) {
        card.classList.remove('running', 'break');
        card.classList.add('paused');
        }
        this.renderButtons();
        this.saveState();
        this.syncCustomTimeDisabled();
        this.renderFullscreenButtons();
        toast('⏸ Đã tạm dừng');
    },

    reset() {
        if (this.state.running || this.state.paused) {
        if (!confirm('Đang có phiên. Reset sẽ hủy phiên. Tiếp tục?')) return;
        }
        this._forceReset();
    },

    _forceReset() {
        this.stopTick();
        this.state.running = false;
        this.state.paused = false;
        this.state.endAt = 0;
        this.state.sessionStartAt = 0;
        this.setDuration(this.modes[this.state.mode].min);
        const card = $('.pomodoro-card');
        if (card) card.classList.remove('running', 'break', 'paused');
        this.renderButtons();
        this.clearSavedState();
        this.syncCustomTimeDisabled();
        this.renderFullscreenButtons();
    },

    stopAndSave() {
        if (!this.state.running && !this.state.paused) return;
        const fullSec = this.modes[this.state.mode].min * 60;
        const elapsed = Math.round((fullSec - this.state.remaining) / 60);
        if (elapsed <= 0) {
        toast('ℹ️ Chưa học phút nào');
        this._forceReset();
        return;
        }
        if (!confirm(`Dừng và lưu ${elapsed} phút đã học?`)) return;
        this.saveWorkSession(elapsed);
        this._forceReset();
    },

    saveWorkSession(mins, dateOverride) {
        if (this.modes[this.state.mode].kind !== 'work') return;
        const sessionDate = dateOverride || State.today;
        const isToday = sessionDate === State.today;
        
        if (isToday && typeof Guards !== 'undefined') {
        const now = new Date();
        const dup = Guards.checkTimeDuplicate(sessionDate, now.getHours(), now.getMinutes());
        if (dup) {
            const t = new Date(dup.at);
            const tStr = String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0');
            if (!confirm(`⚠️ Đã có phiên lúc ${tStr} (${dup.minutes}p). Ghi thêm?`)) return;
        }
        }
        const day = Storage.ensureDay(sessionDate);
        day.minutes = (day.minutes || 0) + mins;
        day.sessions = day.sessions || [];
        const tagName = this.selectedTag || 'Khác';
        const tagColor = (typeof SubjectManager !== 'undefined')
        ? SubjectManager.getColor(tagName) : '#64748b';
        
        const at = (dateOverride && this.state.sessionStartAt)
            ? new Date(this.state.sessionStartAt).toISOString()
            : new Date().toISOString();
        
        day.sessions.push({
        id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        at: at,
        minutes: mins,
        tag: tagName,
        tagColor: tagColor,
        focus: this.selectedStar || 0,
        text: `Pomodoro ${mins}p${tagName ? ' · ' + tagName : ''}`,
        source: 'pomodoro',
        });
        Storage.saveDays();
        this.selectedStar = 0;
        $$('#starRating button').forEach(x => { x.textContent = '☆'; x.classList.remove('active'); });
        Home.render();
        Study.render();
        Calendar.render();
        Modules.refreshHeader();
    },

    finish() {
        this.stopTick();
        const mode = this.modes[this.state.mode];
        const fullMin = mode.min;
        this.state.running = false;
        this.state.paused = false;
        const card = $('.pomodoro-card');
        if (card) card.classList.remove('running', 'break', 'paused');
        this.playAlarm();
        if (mode.kind === 'work') {
        this.saveWorkSession(fullMin);
        toast(`✅ Hoàn thành Pomodoro ${fullMin}p!`);
        if (typeof NotifManager !== 'undefined' && NotifManager.send) {
            NotifManager.send('🍅 Hết giờ Pomodoro!', `Bạn đã học ${fullMin} phút. Nghỉ ngắn 5 phút nhé!`, 'success');
        }
        setTimeout(() => {
            this.state.mode = 'short';
            $$('#pomodoroModes .pmode').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === 'short');
            });
            this.setDuration(this.modes.short.min);
            this.renderButtons();
        }, 100);
        } else {
        toast('☕ Hết giờ nghỉ!');
        if (typeof NotifManager !== 'undefined' && NotifManager.send) {
            NotifManager.send('☕ Hết giờ nghỉ', 'Quay lại học thôi!', 'info');
        }
        setTimeout(() => {
            this.state.mode = 'pomodoro';
            $$('#pomodoroModes .pmode').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === 'pomodoro');
            });
            this.setDuration(this.modes.pomodoro.min);
            this.renderButtons();
        }, 100);
        }
        this.state.sessionStartAt = 0;
        this.clearSavedState();
        this.syncCustomTimeDisabled();
        this.closeFullscreen();
    },

    playAlarm() {
        try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.4, 0.8].forEach(delay => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.3);
        });
        } catch (e) {}
    },

    render() {
        const t = $('#pomoTime');
        if (t) t.textContent = this.fmt(this.state.remaining);
        const lbl = $('#pomoLabel');
        if (lbl) lbl.textContent = this.modes[this.state.mode].label;
        const fsTime = document.querySelector('.pomodoro-fullscreen .pomo-time');
        if (fsTime) fsTime.textContent = this.fmt(this.state.remaining);
    },

    renderButtons() {
        const startBtn = $('#pomoStart');
        const pauseBtn = $('#pomoPause');
        const stopBtn = $('#pomoStop');
        if (!startBtn) return;
        if (this.state.running) {
        startBtn.hidden = true;
        if (pauseBtn) pauseBtn.hidden = false;
        if (stopBtn) stopBtn.hidden = false;
        startBtn.textContent = '▶ Bắt đầu';
        } else if (this.state.paused) {
        startBtn.hidden = false;
        startBtn.textContent = '▶ Tiếp tục';
        if (pauseBtn) pauseBtn.hidden = true;
        if (stopBtn) stopBtn.hidden = false;
        } else {
        startBtn.hidden = false;
        startBtn.textContent = '▶ Bắt đầu';
        if (pauseBtn) pauseBtn.hidden = true;
        if (stopBtn) stopBtn.hidden = true;
        }
    },

    fullscreen() {
        if (document.querySelector('.pomodoro-fullscreen')) return;
        const el = document.createElement('div');
        el.className = 'pomodoro-fullscreen';
        el.innerHTML = `
        <div class="pomo-time">${this.fmt(this.state.remaining)}</div>
        <div class="pomo-label">${this.modes[this.state.mode].label}</div>
        <div class="btn-row">
            <button class="btn primary" id="fsStart" ${this.state.running ? 'hidden' : ''}>${this.state.paused ? '▶ Tiếp tục' : '▶ Bắt đầu'}</button>
            <button class="btn warning" id="fsPause" ${this.state.running ? '' : 'hidden'}>⏸ Tạm dừng</button>
            <button class="btn danger" id="fsStop" ${(this.state.running || this.state.paused) ? '' : 'hidden'}>⏹ Dừng</button>
            <button class="btn ghost" id="fsClose">✕ Đóng</button>
        </div>
        `;
        document.body.appendChild(el);
        $('#fsStart').addEventListener('click', () => { this.start(); this.renderFullscreenButtons(); });
        $('#fsPause').addEventListener('click', () => { this.pause(); this.renderFullscreenButtons(); });
        $('#fsStop').addEventListener('click', () => { this.stopAndSave(); this.renderFullscreenButtons(); });
        $('#fsClose').addEventListener('click', () => this.closeFullscreen());
    },

    renderFullscreenButtons() {
        const fsStart = $('#fsStart');
        const fsPause = $('#fsPause');
        const fsStop = $('#fsStop');
        if (!fsStart) return;
        if (this.state.running) {
        fsStart.hidden = true;
        fsPause.hidden = false;
        fsStop.hidden = false;
        } else if (this.state.paused) {
        fsStart.hidden = false;
        fsStart.textContent = '▶ Tiếp tục';
        fsPause.hidden = true;
        fsStop.hidden = false;
        } else {
        fsStart.hidden = false;
        fsStart.textContent = '▶ Bắt đầu';
        fsPause.hidden = true;
        fsStop.hidden = true;
        }
    },

    closeFullscreen() {
        const el = document.querySelector('.pomodoro-fullscreen');
        if (el) el.remove();
    },

    saveState() {
        try {
        if (!this.state.running && !this.state.paused) {
            this.clearSavedState();
            return;
        }
        localStorage.setItem(STORE.POMODORO, JSON.stringify({
            mode: this.state.mode,
            modes: this.modes,
            remaining: this.state.remaining,
            running: this.state.running,
            paused: this.state.paused,
            endAt: this.state.endAt,
            sessionStartAt: this.state.sessionStartAt,
            selectedTag: this.selectedTag,
            selectedStar: this.selectedStar,
        }));
        } catch (e) {}
    },

    clearSavedState() {
        try { localStorage.removeItem(STORE.POMODORO); } catch (e) {}
    },

    restore() {
        try {
        const raw = localStorage.getItem(STORE.POMODORO);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (!d) return;

        if (d.modes && typeof d.modes === 'object') {
            Object.keys(d.modes).forEach(k => {
            if (this.modes[k] && d.modes[k] && typeof d.modes[k].min === 'number') {
                this.modes[k].min = d.modes[k].min;
            }
            });
        }

        if (d.mode) {
            this.state.mode = d.mode;
            $$('#pomodoroModes .pmode').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === d.mode);
            });
        }
        if (d.selectedTag) {
            this.selectedTag = d.selectedTag;
            const tagBtn = $$('#tagPicker .tag').find(t => t.textContent === d.selectedTag);
            if (tagBtn) {
            tagBtn.classList.add('active');
            if (typeof SubjectManager !== 'undefined') {
                const sub = SubjectManager.subjects.find(s => s.name === d.selectedTag);
                if (sub) {
                tagBtn.style.background = sub.color;
                tagBtn.style.color = '#fff';
                tagBtn.style.border = '2px solid #fff';
                tagBtn.style.boxShadow = '0 0 0 2px ' + sub.color;
                }
            }
            }
        }
        if (typeof d.selectedStar === 'number') {
            this.selectedStar = d.selectedStar;
            $$('#starRating button').forEach(x => {
            const active = +x.dataset.star <= d.selectedStar;
            x.classList.toggle('active', active);
            x.textContent = active ? '★' : '☆';
            });
        }
        if (d.running && d.endAt) {
            const remain = Math.max(0, Math.round((d.endAt - Date.now()) / 1000));
            if (remain <= 0) {
            if (this.modes[this.state.mode].kind === 'work') {
                try {
                if (d.sessionStartAt) this.state.sessionStartAt = d.sessionStartAt;
                const sessionDate = d.sessionStartAt
                    ? dateKey(new Date(d.sessionStartAt))
                    : State.today;
                this.saveWorkSession(this.modes[this.state.mode].min, sessionDate);
                toast(`✅ Đã lưu phiên ${this.modes[this.state.mode].min}p (${sessionDate}) — hoàn thành lúc đóng tab`);
                } catch (e) {
                console.warn('[Pomodoro] Failed to save restored session:', e);
                }
            }
            this.state.remaining = this.modes[this.state.mode].min * 60;
            this.state.running = false;
            this.state.paused = false;
            this.clearSavedState();
            } else {
            this.state.remaining = remain;
            this.state.running = true;
            this.state.paused = false;
            this.state.endAt = d.endAt;
            this.state.sessionStartAt = d.sessionStartAt || Date.now();
            this.startTick();
            const card = $('.pomodoro-card');
            if (card) {
                card.classList.toggle('running', this.modes[this.state.mode].kind === 'work');
                card.classList.toggle('break', this.modes[this.state.mode].kind === 'break');
            }
            toast('▶ Đã khôi phục phiên đang chạy');
            }
        } else if (d.paused) {
            this.state.remaining = d.remaining || this.modes[this.state.mode].min * 60;
            this.state.running = false;
            this.state.paused = true;
            this.state.endAt = 0;
            const card = $('.pomodoro-card');
            if (card) card.classList.add('paused');
        } else if (typeof d.remaining === 'number') {
            this.state.remaining = d.remaining;
        }
        this.render();
        this.renderButtons();
        } catch (e) {
        console.warn('Không khôi phục được Pomodoro:', e);
        }
    },
    };

    /* ═══════ 16. ONBOARDING ═══════ */
    const Onboarding = {
    currentStep: 1,
    data: { name: '', dailyGoal: 60, subject: '' },
    init() {
        if (this.isDone()) return;
        setTimeout(() => this.show(), 400);
    },
    isDone() {
        try {
        if (window.DB && window.DB.ready && window.DB.getMeta) {
            const v = window.DB.getMeta('onboarded', null);
            if (v === '1' || v === true || v === 1) return true;
        }
        return localStorage.getItem(STORE.ONBOARD) === '1';
        } catch (e) { return false; }
    },
    markDone() {
        try { localStorage.setItem(STORE.ONBOARD, '1'); } catch (e) {}
        try {
        if (window.DB && window.DB.ready && window.DB.setMeta) {
            window.DB.setMeta('onboarded', '1');
        }
        } catch (e) {}
    },
    reset() {
        try { localStorage.removeItem(STORE.ONBOARD); } catch (e) {}
        try {
        if (window.DB && window.DB.ready && window.DB.setMeta) {
            window.DB.setMeta('onboarded', 0);
        }
        } catch (e) {}
        this.currentStep = 1;
        this.data = { name: '', dailyGoal: 60, subject: '' };
        this.show();
    },
    show() {
        const modal = $('#onboardingModal');
        if (!modal) return;
        this.currentStep = 1;
        this.data = { name: '', dailyGoal: 60, subject: '' };
        const nameEl = $('#obName'); if (nameEl) nameEl.value = '';
        const goalEl = $('#obGoal'); if (goalEl) goalEl.value = '';
        const subjEl = $('#obSubject'); if (subjEl) subjEl.value = '';
        $$('.ob-chip').forEach(c => c.classList.remove('active'));
        $$('.ob-chip-subject').forEach(c => c.classList.remove('active'));
        const def = $$('.ob-chip').find(c => c.dataset.min === '60');
        if (def) def.classList.add('active');
        this.renderStep();
        this.bindEvents();
        modal.classList.add('show');
    },
    bindEvents() {
        const nextBtn = $('#obNext');
        const backBtn = $('#obBack');
        const skipBtn = $('#obSkip');
        if (nextBtn) {
        const n = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(n, nextBtn);
        n.addEventListener('click', () => this.next());
        }
        if (backBtn) {
        const n = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(n, backBtn);
        n.addEventListener('click', () => this.back());
        }
        if (skipBtn) {
        const n = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(n, skipBtn);
        n.addEventListener('click', () => this.skip());
        }
        $$('.ob-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('.ob-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const g = $('#obGoal');
            if (g) g.value = chip.dataset.min;
        });
        });
        $$('.ob-chip-subject').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('.ob-chip-subject').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const s = $('#obSubject');
            if (s) s.value = chip.dataset.name;
        });
        });
        ['#obName', '#obGoal', '#obSubject'].forEach(sel => {
        const el = $(sel);
        if (!el) return;
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); this.next(); }
        });
        });
    },
    next() {
        if (this.currentStep === 1) {
        const name = ($('#obName')?.value || '').trim();
        if (!name) { toast('⚠️ Nhập tên để tiếp tục'); $('#obName')?.focus(); return; }
        this.data.name = name;
        } else if (this.currentStep === 2) {
        const goal = parseInt($('#obGoal')?.value, 10);
        if (isNaN(goal) || goal < 0) { toast('⚠️ Nhập số phút hợp lệ'); $('#obGoal')?.focus(); return; }
        this.data.dailyGoal = goal;
        }
        if (this.currentStep < 3) {
        this.currentStep++;
        this.renderStep();
        } else {
        this.finish();
        }
    },
    back() {
        if (this.currentStep > 1) {
        this.currentStep--;
        this.renderStep();
        }
    },
    renderStep() {
        $$('.ob-step-dot').forEach(dot => {
        const s = +dot.dataset.step;
        dot.classList.toggle('active', s === this.currentStep);
        dot.classList.toggle('done', s < this.currentStep);
        });
        $$('.ob-step').forEach(step => {
        step.classList.toggle('active', +step.dataset.step === this.currentStep);
        });
        const backBtn = $('#obBack');
        const nextBtn = $('#obNext');
        if (backBtn) backBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.textContent = this.currentStep === 3 ? '✓ Bắt đầu học' : 'Tiếp tục ▶';
        if (this.currentStep === 1 && this.data.name) { const e = $('#obName'); if (e) e.value = this.data.name; }
        if (this.currentStep === 2 && this.data.dailyGoal) {
        const e = $('#obGoal'); if (e) e.value = this.data.dailyGoal;
        $$('.ob-chip').forEach(c => c.classList.toggle('active', +c.dataset.min === this.data.dailyGoal));
        }
        if (this.currentStep === 3 && this.data.subject) { const e = $('#obSubject'); if (e) e.value = this.data.subject; }
        setTimeout(() => {
        if (this.currentStep === 1) $('#obName')?.focus();
        else if (this.currentStep === 2) $('#obGoal')?.focus();
        else if (this.currentStep === 3) $('#obSubject')?.focus();
        }, 100);
    },
    skip() {
        if (!confirm('Bỏ qua hướng dẫn? Bạn có thể chạy lại trong Quản lý.')) return;
        this.markDone();
        this.close();
        toast('👋 Bạn có thể thiết lập sau trong Quản lý');
    },
    finish() {
        const subject = ($('#obSubject')?.value || '').trim() || 'Khác';
        State.profile.name = this.data.name;
        State.profile.dailyGoal = this.data.dailyGoal;
        Storage.saveProfile();
        if (typeof SubjectManager !== 'undefined') {
        const exists = SubjectManager.subjects.some(
            s => s.name.toLowerCase() === subject.toLowerCase()
        );
        if (!exists) {
            const colors = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];
            SubjectManager.subjects.push({
            id: 'sub_' + Date.now(),
            name: subject,
            color: colors[SubjectManager.subjects.length % colors.length],
            createdAt: new Date().toISOString(),
            });
            SubjectManager.save();
            SubjectManager.render();
            SubjectManager.renderTagPicker();
            SubjectManager.renderModalSelect();
        }
        }
        Modules.refreshHeader();
        Home.render();
        Profile.sync();
        this.markDone();
        this.close();
        toast(`🎉 Chào mừng ${this.data.name}! Bắt đầu học thôi.`);
    },
    close() {
        const modal = $('#onboardingModal');
        if (modal) modal.classList.remove('show');
    },
    };

    /* ═══════ 17. SESSION MANAGER ═══════ */
    const SessionManager = {
    editing: null,
    filterDays: 30,
    selectedStar: 0,
    init() {
        const saveBtn = $('#sessionSave');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveEdit());
        $$('#sessionModal [data-close-session]').forEach(el => {
        el.addEventListener('click', () => this.closeModal());
        });
        const filterSel = $('#sessionListFilter');
        if (filterSel) {
        filterSel.addEventListener('change', () => {
            this.filterDays = filterSel.value === 'all' ? 'all' : +filterSel.value;
            this.render();
        });
        }
        const starBox = $('#sessionStar');
        if (starBox) {
        starBox.querySelectorAll('button').forEach(b => {
            b.addEventListener('click', () => {
            const star = +b.dataset.star;
            this.selectedStar = (this.selectedStar === star) ? 0 : star;
            starBox.querySelectorAll('button').forEach(x => {
                const active = +x.dataset.star <= this.selectedStar;
                x.classList.toggle('active', active);
                x.textContent = active ? '★' : '☆';
            });
            });
        });
        }
        document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeModal();
        });
    },
    getAllSessions() {
        const out = [];
        Object.keys(State.days).forEach(k => {
        const day = State.days[k];
        (day.sessions || []).forEach((s, idx) => {
            out.push({
            dateKey: k, index: idx, at: s.at,
            minutes: s.minutes || 0, tag: s.tag || '',
            tagColor: s.tagColor || '', focus: s.focus || 0,
            text: s.text || '', source: s.source || 'pomodoro',
            });
        });
        });
        out.sort((a, b) => new Date(b.at) - new Date(a.at));
        return out;
    },
    render() {
        const box = $('#sessionList');
        if (!box) return;
        box.innerHTML = '';
        let all = this.getAllSessions();
        if (this.filterDays !== 'all') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.filterDays);
        all = all.filter(s => new Date(s.at) >= cutoff);
        }
        if (all.length === 0) {
        box.innerHTML = '<div class="session-empty">Chưa có phiên học nào. Dùng Pomodoro hoặc ghi giờ để bắt đầu.</div>';
        return;
        }
        const frag = document.createDocumentFragment();
        all.slice(0, 100).forEach(s => frag.appendChild(this.buildRow(s)));
        box.appendChild(frag);
    },
    buildRow(s) {
        const row = document.createElement('div');
        row.className = 'session-row ' + (s.source === 'manual' ? 'manual' : 'pomodoro');
        // ✅ Ưu tiên lấy màu mới nhất từ SubjectManager
        const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(s.tag) : (s.tagColor || '#64748b');
        row.style.borderLeftColor = color;
        const time = new Date(s.at);
        const timeStr = time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const d = parseKey(s.dateKey);
        const today = State.today;
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yKey = dateKey(yesterday);
        let dateLabel = `${d.getDate()}/${d.getMonth()+1}`;
        if (s.dateKey === today) dateLabel = 'Hôm nay';
        else if (s.dateKey === yKey) dateLabel = 'Hôm qua';
        const stars = s.focus > 0 ? '★'.repeat(s.focus) : '';
        row.innerHTML = `
        <div>
            <div class="session-time">${timeStr}</div>
            <div class="session-date-label">${dateLabel}</div>
        </div>
        <div class="session-body">
            <div class="session-title">${escapeHtml(s.text || 'Không có ghi chú')}</div>
            <div class="session-meta">
            <span class="session-min">${s.minutes} phút</span>
${s.tag ? `<span class="session-tag" style="background:${color}22;color:${color};border:1px solid ${color}50;padding:2px 10px">📚 ${escapeHtml(s.tag)}</span>` : ''}
            ${stars ? `<span class="session-stars">${stars}</span>` : ''}
            <span style="opacity:.6">${s.source === 'manual' ? '✍️ Thủ công' : '🍅 Pomodoro'}</span>
            </div>
        </div>
        <div class="session-actions">
            <button class="edit" title="Sửa" aria-label="Sửa phiên">✏️</button>
            <button class="del" title="Xóa" aria-label="Xóa phiên">🗑</button>
        </div>
        `;
        row.querySelector('.edit').addEventListener('click', () => this.openEdit(s.dateKey, s.index));
        row.querySelector('.del').addEventListener('click', () => this.remove(s.dateKey, s.index));
        return row;
    },
    openEdit(dateKey, index) {
        const day = State.days[dateKey];
        if (!day || !day.sessions || !day.sessions[index]) return;
        const s = day.sessions[index];
        this.editing = { dateKey, index };
        const time = new Date(s.at);
        const hhmm = String(time.getHours()).padStart(2, '0') + ':' + String(time.getMinutes()).padStart(2, '0');
        if ($('#sessionTime')) $('#sessionTime').value = hhmm;
        if ($('#sessionMinutes')) $('#sessionMinutes').value = s.minutes || 25;
        if ($('#sessionText')) $('#sessionText').value = s.text || '';
        this.selectedStar = s.focus || 0;
        const starBox = $('#sessionStar');
        if (starBox) {
        starBox.querySelectorAll('button').forEach(x => {
            const active = +x.dataset.star <= this.selectedStar;
            x.classList.toggle('active', active);
            x.textContent = active ? '★' : '☆';
        });
        }
        const sel = $('#sessionSubject');
        if (sel) {
        sel.innerHTML = '<option value="">— Không chọn —</option>';
        if (typeof SubjectManager !== 'undefined') {
            SubjectManager.subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name;
            opt.textContent = sub.name;
            sel.appendChild(opt);
            });
        }
        sel.value = s.tag || '';
        }
        const d = parseKey(dateKey);
        const weekday = WEEKDAYS_SHORT[d.getDay()];
        if ($('#sessionModalTitle')) $('#sessionModalTitle').textContent = 'Sửa phiên học';
        if ($('#sessionModalSub')) $('#sessionModalSub').textContent = `${weekday}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        $('#sessionModal')?.classList.add('show');
        setTimeout(() => $('#sessionMinutes')?.focus(), 100);
    },
    saveEdit() {
        if (!this.editing) return;
        const { dateKey, index } = this.editing;
        const day = State.days[dateKey];
        if (!day || !day.sessions || !day.sessions[index]) return;
        const timeStr = $('#sessionTime')?.value || '00:00';
        const mins = parseInt($('#sessionMinutes')?.value, 10) || 0;
        const text = ($('#sessionText')?.value || '').trim();
        const subject = $('#sessionSubject')?.value || '';
        if (mins < 1 || mins > 1440) { toast('⚠️ Số phút phải từ 1 đến 1440'); return; }
        const d = parseKey(dateKey);
        const [hh, mm] = timeStr.split(':').map(Number);
        d.setHours(hh, mm, 0, 0);
        if (d > new Date()) { toast('⚠️ Không thể đặt giờ ở tương lai'); return; }
        const s = day.sessions[index];
        const oldMins = s.minutes || 0;
        s.at = d.toISOString();
        s.minutes = mins;
        s.text = text || `Phiên học ${mins}p`;
        s.tag = subject || 'Khác';
        s.focus = this.selectedStar || 0;
        if (typeof SubjectManager !== 'undefined') s.tagColor = SubjectManager.getColor(s.tag);
        day.minutes = Math.max(0, (day.minutes || 0) - oldMins + mins);
        Storage.saveDays();
        this.closeModal();
        this.render();
        Study.render();
        Home.render();
        Calendar.render();
        Modules.refreshHeader();
        toast('✅ Đã lưu phiên học');
    },
    remove(dateKey, index) {
        const day = State.days[dateKey];
        if (!day || !day.sessions || !day.sessions[index]) return;
        const s = day.sessions[index];
        const time = new Date(s.at);
        const timeStr = time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        if (!confirm(`Xóa phiên lúc ${timeStr} — ${s.minutes} phút?`)) return;
        const backup = JSON.parse(JSON.stringify(s));
        const oldMins = s.minutes || 0;
        day.sessions.splice(index, 1);
        day.minutes = Math.max(0, (day.minutes || 0) - oldMins);
        Storage.saveDays();
        this.render();
        Study.render();
        Home.render();
        Calendar.render();
        Modules.refreshHeader();
        Undo.push(`Đã xóa phiên ${timeStr}`, () => {
        if (!State.days[dateKey].sessions) State.days[dateKey].sessions = [];
        State.days[dateKey].sessions.splice(index, 0, backup);
        State.days[dateKey].minutes = (State.days[dateKey].minutes || 0) + oldMins;
        Storage.saveDays();
        this.render();
        Study.render();
        Home.render();
        Calendar.render();
        Modules.refreshHeader();
        });
        toast('🗑 Đã xóa phiên học');
    },
    closeModal() {
        const m = $('#sessionModal');
        if (m) m.classList.remove('show');
        this.editing = null;
    },
    };

    /* ═══════ 18. GUARDS ═══════ */
    const Guards = {
    applyDateLimits() {
        const today = State.today;
        const maxInputs = ['#studyDateInput', '#deleteDateInput', '#deleteFrom', '#deleteTo'];
        maxInputs.forEach(sel => {
        const el = $(sel);
        if (!el) return;
        el.setAttribute('max', today);
        if (!el.dataset.maxBound) {
            el.dataset.maxBound = '1';
            el.addEventListener('change', () => {
            if (el.value && el.value > today) {
                toast('⚠️ Không thể chọn ngày tương lai');
                el.value = today;
            }
            });
        }
        });
        const dlInput = $('#todoDeadline');
        if (dlInput) {
        dlInput.setAttribute('min', today);
        if (!dlInput.dataset.minBound) {
            dlInput.dataset.minBound = '1';
            dlInput.addEventListener('change', () => {
            if (dlInput.value && dlInput.value < today) {
                toast('⚠️ Deadline không thể ở quá khứ');
                dlInput.value = today;
            }
            });
        }
        }
    },
    checkTimeDuplicate(dateKey, hour, minutes, excludeIndex) {
        const day = State.days[dateKey];
        if (!day || !day.sessions) return null;
        const targetMin = hour * 60 + (minutes || 0);
        for (let i = 0; i < day.sessions.length; i++) {
        if (i === excludeIndex) continue;
        const s = day.sessions[i];
        const t = new Date(s.at);
        const sMin = t.getHours() * 60 + t.getMinutes();
        if (Math.abs(sMin - targetMin) < 5) return s;
        }
        return null;
    },
    checkMinutesMismatch(totalMin, slots) {
        if (!slots || !slots.length) return null;
        const slotCount = slots.length;
        const estMin = slotCount * 60;
        if (totalMin > 0 && (totalMin < estMin * 0.2 || totalMin > estMin * 3)) {
        return { msg: `Bạn có ${slotCount} khung giờ nhưng tổng ${totalMin} phút. Kiểm tra lại nhé!` };
        }
        return null;
    },
    };

    /* ═══════ 19. HEATMAP ═══════ */
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
        if (typeof HeatmapScroll !== 'undefined') {
        setTimeout(() => HeatmapScroll.scrollToToday(), 100);
        }
    },
    };

    /* ═══════ 20. STATS PAGE ═══════ */
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
        const weekEl = $('#statsWeek');
        if (weekEl) weekEl.textContent = weekThis > 0 ? fmtMinutes(weekThis) : 'Chưa có';
        let month = 0;
        Object.keys(State.days).forEach(k => {
        const d = parseKey(k);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            month += State.days[k].minutes || 0;
        }
        });
        const monthEl = $('#statsMonth');
        if (monthEl) monthEl.textContent = month > 0 ? fmtMinutes(month) : 'Chưa có';
        const trend = $('#statsTrend');
        if (trend) {
        trend.classList.remove('empty');
        if (weekPrev === 0 && weekThis === 0) {
            trend.textContent = 'Chưa đủ dữ liệu';
            trend.classList.add('empty');
            trend.style.color = '';
        } else if (weekPrev === 0) {
            trend.textContent = '+∞';
            trend.style.color = 'var(--success)';
        } else {
            const pct = Math.round((weekThis - weekPrev) / weekPrev * 100);
            trend.textContent = (pct >= 0 ? '+' : '') + pct + '%';
            trend.style.color = pct >= 0 ? 'var(--success)' : 'var(--danger)';
        }
        }
        this.renderMetaStats();
        this.renderChart14();
        this.renderPie();
        this.renderHourBars();
        if (typeof TodoManager !== 'undefined') TodoManager.renderStats7Days();
    },
    renderMetaStats() {
        const allKeys = Object.keys(State.days);
        let totalMin = 0, activeDays = 0, firstKey = null;
        allKeys.forEach(k => {
        const day = State.days[k];
        if (!Stats.dayHasActivity(day)) return;
        activeDays++;
        totalMin += day.minutes || 0;
        if (!firstKey || k < firstKey) firstKey = k;
        });
        const totalEl = $('#statsTotalTime');
        if (totalEl) {
        if (totalMin === 0) { totalEl.textContent = 'Chưa có'; totalEl.classList.add('empty'); }
        else { totalEl.textContent = fmtMinutes(totalMin); totalEl.classList.remove('empty'); }
        }
        const activeEl = $('#statsActiveDays');
        if (activeEl) activeEl.textContent = activeDays;
        const avgActiveEl = $('#statsAvgPerActive');
        if (avgActiveEl) {
        if (activeDays === 0) { avgActiveEl.textContent = 'Chưa đủ dữ liệu'; avgActiveEl.classList.add('empty'); }
        else { avgActiveEl.textContent = Math.round(totalMin / activeDays) + ' phút'; avgActiveEl.classList.remove('empty'); }
        }
        const avgDayEl = $('#statsAvgPerDay');
        if (avgDayEl) {
        if (!firstKey) { avgDayEl.textContent = 'Chưa đủ dữ liệu'; avgDayEl.classList.add('empty'); }
        else {
            const first = parseKey(firstKey);
            const today = parseKey(State.today);
            const diffDays = Math.round((today - first) / 86400000) + 1;
            const avg = Math.round(totalMin / diffDays);
            avgDayEl.textContent = avg + ' phút/ngày';
            avgDayEl.classList.remove('empty');
        }
        }
        const streakEl = $('#statsStreakVal');
        if (streakEl) streakEl.textContent = Stats.calcStreak() + ' ngày';
        const goalEl = $('#statsGoalDays');
        if (goalEl) {
        const goal = State.profile.dailyGoal || 0;
        if (goal === 0) { goalEl.textContent = 'Chưa đặt mục tiêu'; goalEl.classList.add('empty'); }
        else {
            let goalDays = 0;
            allKeys.forEach(k => {
            const day = State.days[k];
            if (!Stats.dayHasActivity(day)) return;
            if ((day.minutes || 0) >= goal) goalDays++;
            });
            goalEl.textContent = goalDays + ' ngày';
            goalEl.classList.remove('empty');
        }
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
        const wrap = svg.closest('.pie-wrap');
        
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
        if (wrap) wrap.classList.add('is-empty');
        svg.innerHTML = '';
        if (legend) legend.innerHTML = '<div class="empty-state"><span class="es-icon">🥧</span><div class="es-title">Chưa có dữ liệu môn</div><div class="es-desc">Chọn môn khi dùng Pomodoro để xem phân bổ</div></div>';
        return;
        }
        
        if (wrap) wrap.classList.remove('is-empty');
        const colors = { 'Toán': '#3b82f6', 'Lý': '#10b981', 'Hóa': '#ef4444',
        'Anh': '#f59e0b', 'Văn': '#8b5cf6', 'Sử': '#ec4899', 'Khác': '#64748b' };
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
        const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(tag) : (colors[tag] || '#64748b');
        paths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" opacity="0.9" stroke="var(--surface)" stroke-width="2" stroke-linejoin="round"/>`;
        startAngle = endAngle;
        });
        svg.innerHTML = paths;
        if (legend) {
        legend.innerHTML = '';
        entries.forEach(([tag, val]) => {
            const pct = Math.round(val / total * 100);
            const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(tag) : (colors[tag] || '#64748b');
            const el = document.createElement('div');
            el.className = 'pie-legend-item';
            el.innerHTML = `
            <span class="dot" style="background:${color}"></span>
            <span class="lbl">${escapeHtml(tag)}</span>
            <span class="val">${fmtMinutes(val)} · ${pct}%</span>
            `;
            legend.appendChild(el);
        });
        }
    },
    renderHourBars() {
        const box = $('#hourBars');
        if (!box) return;
        box.innerHTML = '';
        const hourMin = Array(24).fill(0);
        let sessionCount = 0;
        Object.keys(State.days).forEach(k => {
        const day = State.days[k];
        (day.sessions || []).forEach(s => {
            if (!s.at) return;
            const h = new Date(s.at).getHours();
            hourMin[h] += s.minutes || 0;
            sessionCount++;
        });
        });
        if (sessionCount === 0) {
        box.innerHTML = `<div class="empty-state">
            <span class="es-icon">🕐</span>
            <div class="es-title">Chưa đủ dữ liệu</div>
            <div class="es-desc">Cần ít nhất 1 phiên học để phân tích khung giờ hiệu quả.</div>
        </div>`;
        return;
        }
        const maxMin = Math.max(...hourMin, 1);
        const total = hourMin.reduce((a, b) => a + b, 0);
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
        const note = document.createElement('p');
        note.style.cssText = 'font-size:11px;color:var(--text-mute);margin-top:12px;text-align:center;font-style:italic';
        note.textContent = `Dựa trên ${sessionCount} phiên · Tổng ${fmtMinutes(total)}`;
        box.appendChild(note);
    },
    };

    /* ═══════ 21. TODO MANAGER ═══════ */
    const TodoManager = {
    todos: [],
    filter: 'all',
    editingId: null,
    selectedTag: '',
    lastUsedTag: '',
    _midnightTimer: null,
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
        // ✅ Nút "Áp dụng tag cho tất cả Todo"
        const applyAllBtn = $('#todoApplyAllTags');
        if (applyAllBtn) applyAllBtn.addEventListener('click', () => this.applyTagToAll());
        // ✅ Nút Reset Todo (được gọi ở init)
        const resetBtn = $('#resetTodoTagsBtn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAllTodoTags());
        
        this.initTagPicker();
        const titleInput = $('#todoTitle');
        if (titleInput) {
        titleInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.saveModal();
        });
        }
        try { this.lastUsedTag = localStorage.getItem('st_last_todo_tag') || ''; }
        catch (e) { this.lastUsedTag = ''; }

        this.render();
        this.syncMidnight();
    },
    load() {
        try {
        if (window.DB && window.DB.ready) {
            const rows = window.DB.query('SELECT * FROM todos ORDER BY created_at DESC');
            if (rows.length > 0) {
            this.todos = rows.map(r => ({
                id: r.id, title: r.title, desc: r.desc_text || '',
                deadline: r.deadline || '', priority: r.priority || 'normal',
                tag: r.tag || '', done: !!r.done,
                createdAt: r.created_at, completedAt: r.completed_at,
            }));
            return;
            }
        }
        const raw = localStorage.getItem(STORE.TODOS);
        this.todos = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.todos)) this.todos = [];
        } catch (e) { this.todos = []; }
    },
    save() {
        Storage.saveTodos(this.todos);
    },
    syncMidnight() {
        if (this._midnightTimer) clearTimeout(this._midnightTimer);
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
        const delay = tomorrow - now;
        this._midnightTimer = setTimeout(() => {
        State.today = dateKey(new Date());
        Home.render();
        Study.render();
        Calendar.render();
        if (typeof StatsPage !== 'undefined' && Router.current === 'stats') StatsPage.render();
        Modules.refreshHeader();
        toast('🌅 Ngày mới bắt đầu!');
        this.syncMidnight();
        }, delay);
    },
    // ✅ SỬA: Đổi môn cho TẤT CẢ Todo (không chỉ cái trống)
    applyTagToAll() {
        if (!this.selectedTag) {
            toast('⚠️ Chọn môn trước rồi bấm nút này');
            return;
        }
        const tag = this.selectedTag;
        const total = this.todos.length;
        if (total === 0) {
            toast('ℹ️ Chưa có Todo nào');
            return;
        }
        const changed = this.todos.filter(t => t.tag !== tag).length;
        if (changed === 0) {
            toast(`ℹ️ Tất cả ${total} Todo đã có môn "${tag}"`);
            return;
        }
        if (!confirm(
            `Đổi môn của TẤT CẢ ${total} Todo sang "${tag}"?\n\n` +
            `✔ ${changed} Todo sẽ được cập nhật\n` +
            `✖ ${total - changed} Todo đã đúng môn (giữ nguyên)`
        )) return;

        const backup = this.todos.map(t => ({ id: t.id, tag: t.tag }));
        this.todos.forEach(t => { t.tag = tag; });

        this.save();
        this.render();
        if (typeof Calendar !== 'undefined') Calendar.render();
        if (typeof SubjectManager !== 'undefined') SubjectManager.render();

        Undo.push(`Đã đổi ${changed} Todo sang "${tag}"`, () => {
            backup.forEach(b => {
                const td = this.todos.find(t => t.id === b.id);
                if (td) td.tag = b.tag;
            });
            this.save();
            this.render();
            if (typeof Calendar !== 'undefined') Calendar.render();
        }, 30000);

        toast(`✅ Đã đổi "${tag}" cho ${changed} Todo`);
    },
    
    // 🆘 Reset tất cả Todo về "không có môn" (fix lỗi bấm nhầm)
    resetAllTodoTags() {
        const total = this.todos.length;
        if (total === 0) { toast('ℹ️ Không có Todo nào'); return; }
        if (!confirm(`Xóa HẾT môn đang gán cho ${total} Todo?\n\nSau đó bạn có thể gán lại từng cái.`)) return;

        const backup = this.todos.map(t => ({ id: t.id, tag: t.tag }));
        this.todos.forEach(t => { t.tag = ''; });
        this.save();
        this.render();
        if (typeof Calendar !== 'undefined') Calendar.render();

        Undo.push(`Đã xóa môn của ${total} Todo`, () => {
            backup.forEach(b => {
                const td = this.todos.find(t => t.id === b.id);
                if (td) td.tag = b.tag;
            });
            this.save();
            this.render();
            if (typeof Calendar !== 'undefined') Calendar.render();
        }, 30000);

        toast(`🆘 Đã reset môn của ${total} Todo — bấm Hoàn tác nếu lỡ`);
    },
    initTagPicker() {
        const tags = (typeof SubjectManager !== 'undefined')
        ? SubjectManager.subjects.map(s => s.name)
        : ['Toán', 'Lý', 'Hóa', 'Anh', 'Văn', 'Sử', 'Khác'];
        const picker = $('#todoTagPicker');
        if (!picker) return;
        picker.innerHTML = '';
        this.selectedTag = '';
        
        // ✅ THÊM NÚT "KHÔNG CHỌN" MÔN
        const noneBtn = document.createElement('button');
        noneBtn.type = 'button';
        noneBtn.className = 'tag';
        noneBtn.style.background = 'var(--surface-2)';
        noneBtn.style.color = 'var(--text-2)';
        noneBtn.style.border = '2px solid transparent';
        noneBtn.textContent = '❌ Không chọn';
        noneBtn.addEventListener('click', () => {
            picker.querySelectorAll('.tag').forEach(x => {
                x.classList.remove('active');
                const t = x.textContent;
                const c = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(t) : '#64748b';
                x.style.background = c;
                x.style.color = '#fff';
                x.style.border = '2px solid transparent';
                x.style.boxShadow = 'none';
            });
            noneBtn.style.background = 'var(--accent)';
            noneBtn.style.color = '#fff';
            this.selectedTag = '';
        });
        picker.appendChild(noneBtn);

        tags.forEach(tag => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tag';
        const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(tag) : '#64748b';
        b.style.background = color;
        b.style.color = '#fff';
        b.style.border = '2px solid transparent';
        b.textContent = tag;
        b.addEventListener('click', () => {
            const was = b.classList.contains('active');
            picker.querySelectorAll('.tag').forEach(x => {
            x.classList.remove('active');
            const t = x.textContent;
            const c = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(t) : '#64748b';
            x.style.background = c;
            x.style.color = '#fff';
            x.style.border = '2px solid transparent';
            x.style.boxShadow = 'none';
            });
            // reset noneBtn
            noneBtn.style.background = 'var(--surface-2)';
            noneBtn.style.color = 'var(--text-2)';
            
            if (!was) { 
                b.classList.add('active'); 
                b.style.background = color; 
                b.style.color = '#fff'; 
                b.style.border = '2px solid #fff';
                b.style.boxShadow = '0 0 0 2px ' + color;
                this.selectedTag = tag; 
            } else {
                this.selectedTag = '';
            }
        });
        picker.appendChild(b);
        });
    },
    openModal(id) {
        this.editingId = id || null;
        const modal = $('#todoModal');
        const title = $('#todoModalTitle');
        if (!modal) return;
        if ($('#todoTitle')) $('#todoTitle').value = '';
        if ($('#todoDesc')) $('#todoDesc').value = '';
        if ($('#todoDeadline')) $('#todoDeadline').value = '';
        if ($('#todoPriority')) $('#todoPriority').value = 'normal';
        this.selectedTag = '';
        $$('#todoTagPicker .tag').forEach(t => {
        t.classList.remove('active');
        const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(t.textContent) : '#64748b';
        t.style.background = color;
        t.style.color = '#fff';
        t.style.border = '2px solid transparent';
        t.style.boxShadow = 'none';
        });
        if (id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            if (title) title.textContent = 'Sửa việc cần làm';
            if ($('#todoTitle')) $('#todoTitle').value = todo.title || '';
            if ($('#todoDesc')) $('#todoDesc').value = todo.desc || '';
            if ($('#todoDeadline')) $('#todoDeadline').value = todo.deadline || '';
            if ($('#todoPriority')) $('#todoPriority').value = todo.priority || 'normal';
            if (todo.tag) {
            this.selectedTag = todo.tag;
            const tagBtn = $$('#todoTagPicker .tag').find(t => t.textContent === todo.tag);
            if (tagBtn) {
                tagBtn.classList.add('active');
                const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(todo.tag) : '#64748b';
                tagBtn.style.background = color;
                tagBtn.style.color = '#fff';
                tagBtn.style.border = '2px solid #fff';
                tagBtn.style.boxShadow = '0 0 0 2px ' + color;
            }
            }
        }
        const delBtn = $('#todoDelete');
        if (delBtn) {
            delBtn.style.display = 'inline-flex';
            if (!delBtn.dataset.bound) {
            delBtn.dataset.bound = '1';
            delBtn.addEventListener('click', () => {
                if (this.editingId) {
                this.closeModal();
                this.removeTodo(this.editingId);
                }
            });
            }
        }
        } else {
        if (title) title.textContent = 'Thêm việc cần làm';
        const delBtn = $('#todoDelete');
        if (delBtn) delBtn.style.display = 'none';

        if (this.lastUsedTag) {
            const tagBtn = $$('#todoTagPicker .tag').find(t => t.textContent === this.lastUsedTag);
            if (tagBtn) {
            this.selectedTag = this.lastUsedTag;
            tagBtn.classList.add('active');
            const color = (typeof SubjectManager !== 'undefined') ? SubjectManager.getColor(this.lastUsedTag) : '#64748b';
            tagBtn.style.background = color;
            tagBtn.style.color = '#fff';
            tagBtn.style.border = '2px solid #fff';
            tagBtn.style.boxShadow = '0 0 0 2px ' + color;
            }
        }
        }
        modal.classList.add('show');
        setTimeout(() => $('#todoTitle')?.focus(), 100);
    },
    closeModal() {
        const modal = $('#todoModal');
        if (modal) modal.classList.remove('show');
        this.editingId = null;
    },
    saveModal() {
        const titleRaw = $('#todoTitle')?.value || '';
        const title = titleRaw.trim();
        if (!title) { toast('⚠️ Nhập tên việc'); $('#todoTitle')?.focus(); return; }
        if (title.length > 200) { toast('⚠️ Tên quá dài'); return; }
        const deadline = $('#todoDeadline')?.value || '';
        if (deadline) {
        const dlDate = parseKey(deadline);
        const todayDate = parseKey(State.today);
        if (dlDate < todayDate) {
            toast('⚠️ Deadline không thể ở quá khứ');
            $('#todoDeadline')?.focus();
            return;
        }
        }
        const data = {
        title: title,
        desc: ($('#todoDesc')?.value || '').trim(),
        deadline: deadline,
        priority: $('#todoPriority')?.value || 'normal',
        tag: this.selectedTag || '',
        };
        if (this.editingId) {
        const todo = this.todos.find(t => t.id === this.editingId);
        if (todo) Object.assign(todo, data);
        toast('✅ Đã cập nhật');
        } else {
        this.todos.unshift({
            id: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            ...data, done: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
        });
        toast('✅ Đã thêm việc');
        }
        try {
        localStorage.setItem('st_last_todo_tag', this.selectedTag || '');
        this.lastUsedTag = this.selectedTag || '';
        } catch (e) {}

        this.save();
        this.closeModal();
        this.render();
        Calendar.render();
        if (typeof Study !== 'undefined') Study.render();
        if (typeof Home !== 'undefined') Home.render();
    },
    toggleDone(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        const oldDone = todo.done;
        const oldCompletedAt = todo.completedAt;
        
        todo.done = !todo.done;
        todo.completedAt = todo.done ? new Date().toISOString() : null;
        this.save();
        this.render();
        Calendar.render();
        
        const msg = todo.done ? `Đã xong: "${todo.title}"` : `Đã khôi phục: "${todo.title}"`;
        Undo.push(msg, () => {
            todo.done = oldDone;
            todo.completedAt = oldCompletedAt;
            this.save();
            this.render();
            Calendar.render();
        });
    },
    removeTodo(id) {
        const idx = this.todos.findIndex(t => t.id === id);
        if (idx < 0) return;
        const removed = this.todos[idx];
        if (!confirm(`Xóa "${removed.title}"?`)) return;
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
        toast('🗑 Đã xóa');
    },
        deadlineStatus(todo) {
        if (!todo.deadline) return { cls: '', text: '', color: '#94a3b8' };
        if (todo.done) return { cls: 'done-tag', text: '✅ Đã xong', color: '#10b981' };

        const now = new Date();
        const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dl = parseKey(todo.deadline);
        const dlMid = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
        const diffDays = Math.round((dlMid - todayMid) / 86400000);

        const color = (todo.tag && typeof SubjectManager !== 'undefined')
            ? SubjectManager.getColor(todo.tag)
            : '#64748b';

        if (diffDays < 0)   return { cls: 'overdue', text: `⚠️ Quá hạn ${Math.abs(diffDays)} ngày`, color };
        if (diffDays === 0) return { cls: 'today',   text: `🔥 Hôm nay`,                              color };
        if (diffDays === 1) return { cls: 'soon',    text: `⏰ Còn 1 ngày`,                            color };
        if (diffDays <= 3)  return { cls: 'soon',    text: `⏰ Còn ${diffDays} ngày`,                  color };
        if (diffDays <= 7)  return { cls: '',        text: `📅 Còn ${diffDays} ngày`,                  color };
        if (diffDays <= 30) return { cls: '',        text: `📅 Còn ${diffDays} ngày`,                  color };
        return { cls: '', text: `📅 ${todo.deadline}`, color };
        },
    filteredTodos() {
        const now = new Date();
        const today = dateKey(now);
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
        
        let tagHtml = '';
        if (todo.tag) {
            const tagColor = (typeof SubjectManager !== 'undefined')
                ? SubjectManager.getColor(todo.tag) : '#ef4444';
            tagHtml = `<span style="background:${tagColor}; color:#ffffff; border: 2px solid #ffffff; outline: 1px solid ${tagColor}; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; white-space: nowrap; display: inline-block; margin-left: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">${escapeHtml(todo.tag)}</span>`;
        }

        let restoreBtn = '';
        if (todo.done) {
            restoreBtn = `<button class="restore" title="Khôi phục" aria-label="Khôi phục">🔄</button>`;
        }

        item.innerHTML = `
        <input type="checkbox" class="todo-check" ${todo.done ? 'checked' : ''}>
        <div class="todo-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; width:100%;">
                <div class="todo-title" style="flex:1;">${escapeHtml(todo.title)}</div>
                ${tagHtml}
            </div>
            ${todo.desc ? `<div class="todo-desc">${escapeHtml(todo.desc)}</div>` : ''}
            <div class="todo-meta">
                ${todo.deadline ? `<span class="deadline ${dl.cls}" style="background:${dl.color}18;color:${dl.color};border:1.5px solid ${dl.color}50;font-weight:700">${dl.text}</span>` : ''}
                ${todo.priority === 'high' ? '<span>🔴 Cao</span>' : ''}
            </div>
        </div>
        <div class="todo-actions">
            ${restoreBtn}
            <button class="edit" title="Sửa" aria-label="Sửa">✏️</button>
            <button class="del" title="Xóa" aria-label="Xóa">🗑</button>
        </div>
        `;
        
        item.querySelector('.todo-check').addEventListener('change', () => this.toggleDone(todo.id));
        
        if (todo.done) {
            item.querySelector('.restore').addEventListener('click', (e) => { 
                e.stopPropagation(); 
                this.toggleDone(todo.id); 
            });
        }
        
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

    /* ═══════ 22. STREAK FREEZE ═══════ */
    const StreakFreeze = {
    max: 3, freezes: 3, history: [], autoMode: false, alertEnabled: true,
    lastRefillWeek: '', lastAutoCheck: '',
    init() {
        this.load();
        this.checkWeeklyRefill();
        this.checkAutoFreeze();
        const useBtn = $('#useFreezeBtn');
        if (useBtn) useBtn.addEventListener('click', () => this.use());
        const autoBox = $('#autoFreeze');
        if (autoBox) {
        autoBox.checked = this.autoMode;
        autoBox.addEventListener('change', () => {
            this.autoMode = autoBox.checked;
            this.save();
            toast(this.autoMode ? '✅ Đã bật tự động Freeze' : '⏸ Đã tắt tự động Freeze');
        });
        }
        const alertBox = $('#freezeAlertToggle');
        if (alertBox) {
        alertBox.checked = this.alertEnabled;
        alertBox.addEventListener('change', () => {
            this.alertEnabled = alertBox.checked;
            this.save();
            Home.render();
        });
        }
        document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            this.checkWeeklyRefill();
            this.checkAutoFreeze();
        }
        });
        this.render();
    },
    load() {
        try {
        let d = null;
        if (window.DB && window.DB.ready && window.DB.getMeta) {
            d = window.DB.getMeta('freeze', null);
        }
        if (!d) {
            const raw = localStorage.getItem(STORE.FREEZE);
            d = raw ? JSON.parse(raw) : {};
        }
        this.freezes = typeof d.freezes === 'number' ? Math.min(d.freezes, this.max) : 3;
        this.history = Array.isArray(d.history) ? d.history : [];
        this.autoMode = !!d.autoMode;
        this.alertEnabled = d.alertEnabled !== false;
        this.lastRefillWeek = d.lastRefillWeek || '';
        this.lastAutoCheck = d.lastAutoCheck || '';
        } catch (e) {
        this.freezes = 3; this.history = []; this.autoMode = false;
        this.alertEnabled = true; this.lastRefillWeek = ''; this.lastAutoCheck = '';
        }
    },
    save() {
        Storage.saveFreeze({
        freezes: this.freezes,
        history: this.history.slice(0, 30),
        autoMode: this.autoMode,
        alertEnabled: this.alertEnabled,
        lastRefillWeek: this.lastRefillWeek,
        lastAutoCheck: this.lastAutoCheck,
        });
    },
    getMondayOf(d) {
        const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dow = (local.getDay() + 6) % 7;
        local.setDate(local.getDate() - dow);
        return local;
    },
    checkWeeklyRefill() {
        const now = new Date();
        const thisMonday = this.getMondayOf(now);
        const weekKey = dateKey(thisMonday);
        if (this.lastRefillWeek === weekKey) return;
        if (!this.lastRefillWeek) {
        this.lastRefillWeek = weekKey;
        this.save();
        return;
        }
        const oldWeekDate = parseKey(this.lastRefillWeek);
        const diffWeeks = Math.floor((thisMonday - oldWeekDate) / (7 * 86400000));
        if (diffWeeks >= 1) {
        const addAmount = Math.min(diffWeeks, this.max - this.freezes);
        if (addAmount > 0) {
            this.freezes += addAmount;
            this.history.unshift({
            date: dateKey(now), reason: `Nạp tuần (${addAmount} lượt)`,
            type: 'refill', delta: addAmount, at: now.toISOString(),
            });
            toast(`❄️ +${addAmount} lượt Freeze (nạp tuần)`);
        }
        this.lastRefillWeek = weekKey;
        this.save();
        this.render();
        }
    },
    checkAutoFreeze() {
        if (!this.autoMode) return;
        const now = new Date();
        const today = dateKey(now);
        if (this.lastAutoCheck === today) return;
        let used = 0;
        for (let i = 1; i <= 7 && this.freezes > 0; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = dateKey(d);
        const dayData = State.days[k];
        if (dayData && Stats.dayHasActivity(dayData)) continue;
        if (this.isFrozen(k)) continue;
        const dayBefore = new Date(d);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const kB = dateKey(dayBefore);
        const dayBeforeHas = State.days[kB] && Stats.dayHasActivity(State.days[kB]);
        const dayBeforeFrozen = this.isFrozen(kB);
        if (!dayBeforeHas && !dayBeforeFrozen) continue;
        this.freezes--;
        this.history.unshift({
            date: k, reason: `Tự động (bỏ lỡ ngày ${k})`,
            type: 'use', delta: -1, at: now.toISOString(),
        });
        used++;
        const dayToFreeze = Storage.ensureDay(k);
        dayToFreeze.frozen = true;
        Storage.saveDays();
        }
        this.lastAutoCheck = today;
        this.save();
        if (used > 0) {
        toast(`❄️ Đã tự dùng ${used} lượt Freeze để giữ streak`);
        this.render();
        Home.render();
        Modules.refreshHeader();
        }
    },
    use() {
        const k = State.today;
        if (this.freezes <= 0) { toast('❌ Hết lượt Freeze — tuần sau sẽ nạp thêm'); return false; }
        if (this.isFrozen(k)) { toast('ℹ️ Hôm nay đã dùng Freeze'); return false; }
        if (State.days[k] && Stats.dayHasActivity(State.days[k])) {
        toast('ℹ️ Hôm nay đã học — không cần Freeze'); return false;
        }
        this.freezes--;
        this.history.unshift({
        date: k, reason: 'Dùng thủ công', type: 'use', delta: -1, at: new Date().toISOString(),
        });
        this.save();
        const day = Storage.ensureDay(k);
        day.frozen = true;
        Storage.saveDays();
        this.render();
        Home.render();
        Modules.refreshHeader();
        toast('❄️ Đã đóng băng streak hôm nay');
        return true;
    },
    isFrozen(k) {
        return this.history.some(h => h.date === k && h.type === 'use');
    },
    needsFreeze() {
        if (!this.alertEnabled) return false;
        if (this.freezes <= 0) return false;
        if (this.isFrozen(State.today)) return false;
        const s = Stats.calcStreak();
        if (s < 1) return false;
        const todayData = State.days[State.today];
        if (todayData && Stats.dayHasActivity(todayData)) return false;
        const h = new Date().getHours();
        if (h < 20) return false;
        return true;
    },
    render() {
        const countEl = $('#freezeCount');
        if (countEl) countEl.textContent = this.freezes;
        const refillEl = $('#freezeRefill');
        if (refillEl) {
        const now = new Date();
        const thisMonday = this.getMondayOf(now);
        const nextMonday = new Date(thisMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);
        const diffDays = Math.ceil((nextMonday - now) / 86400000);
        if (this.freezes >= this.max) refillEl.innerHTML = '✅ Đã đầy 3 lượt';
        else refillEl.innerHTML = `⏳ Nạp lượt tiếp theo: <b>còn ${diffDays} ngày</b>`;
        }
        const alert = $('#freezeAlert');
        if (alert) {
        if (this.needsFreeze()) alert.removeAttribute('hidden');
        else alert.setAttribute('hidden', '');
        }
        const hist = $('#freezeHistory');
        if (hist) {
        hist.innerHTML = '';
        if (this.history.length === 0) {
            hist.innerHTML = '<div class="empty-state" style="padding:12px"><div class="es-desc">Chưa có lịch sử</div></div>';
        } else {
            const frag = document.createDocumentFragment();
            this.history.slice(0, 15).forEach(h => {
            const el = document.createElement('div');
            el.className = 'freeze-history-item ' + (h.type || 'use');
            const sign = h.type === 'refill' ? '+' : '−';
            el.innerHTML = `
                <span class="date">${h.type === 'refill' ? '🔄' : '❄️'} ${h.date}</span>
                <span class="reason">${escapeHtml(h.reason)}</span>
                <span class="delta">${sign}${Math.abs(h.delta || 1)}</span>
            `;
            frag.appendChild(el);
            });
            hist.appendChild(frag);
        }
        }
    },
    };

    /* ═══════ 23. NOTIF MANAGER ═══════ */
    const NotifManager = {
    dailyTime: '20:00', deadlineNotif: true, sound: true,
    inAppFallback: true, lastNotifiedDate: '', timerId: null, pendingNotifs: [],
    init() {
        this.load();
        const permBtn = $('#notifPermBtn');
        if (permBtn) permBtn.addEventListener('click', () => this.requestPermission());
        const testBtn = $('#notifTestBtn');
        if (testBtn) testBtn.addEventListener('click', () => this.test());
        const timeInput = $('#notifTime');
        if (timeInput) timeInput.value = this.dailyTime;
        const saveTimeBtn = $('#saveNotifTimeBtn');
        if (saveTimeBtn) saveTimeBtn.addEventListener('click', () => {
        const v = $('#notifTime')?.value;
        if (!v) { toast('⚠️ Chọn giờ'); return; }
        this.dailyTime = v;
        this.save();
        toast('✅ Đã lưu giờ nhắc: ' + v);
        });
        const dlBox = $('#notifDeadline');
        if (dlBox) {
        dlBox.checked = this.deadlineNotif;
        dlBox.addEventListener('change', () => { this.deadlineNotif = dlBox.checked; this.save(); });
        }
        const sndBox = $('#notifSound');
        if (sndBox) {
        sndBox.checked = this.sound;
        sndBox.addEventListener('change', () => { this.sound = sndBox.checked; this.save(); });
        }
        const inAppBox = $('#notifInApp');
        if (inAppBox) {
        inAppBox.checked = this.inAppFallback;
        inAppBox.addEventListener('change', () => { this.inAppFallback = inAppBox.checked; this.save(); });
        }
        this.renderStatus();
        this.startChecker();
        document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            this.flushPending();
            this.check();
        }
        });
    },
    load() {
        try {
        let d = null;
        if (window.DB && window.DB.ready && window.DB.getMeta) {
            d = window.DB.getMeta('notif', null);
        }
        if (!d) {
            const raw = localStorage.getItem(STORE.NOTIF);
            d = raw ? JSON.parse(raw) : {};
        }
        this.dailyTime = d.dailyTime || '20:00';
        this.deadlineNotif = d.deadlineNotif !== false;
        this.sound = d.sound !== false;
        this.inAppFallback = d.inAppFallback !== false;
        this.lastNotifiedDate = d.lastNotifiedDate || '';
        this.pendingNotifs = Array.isArray(d.pendingNotifs) ? d.pendingNotifs : [];
        } catch (e) { this.pendingNotifs = []; }
    },
    save() {
        Storage.saveNotif({
        dailyTime: this.dailyTime,
        deadlineNotif: this.deadlineNotif,
        sound: this.sound,
        inAppFallback: this.inAppFallback,
        lastNotifiedDate: this.lastNotifiedDate,
        pendingNotifs: this.pendingNotifs.slice(0, 10),
        });
    },
    async requestPermission() {
        if (!('Notification' in window)) { toast('❌ Trình duyệt không hỗ trợ'); return; }
        if (window.Notification.permission === 'granted') { toast('✅ Đã bật thông báo'); return; }
        if (window.Notification.permission === 'denied') {
        this.showHelp();
        toast('⚠️ Bạn đã chặn. Xem hướng dẫn mở lại.');
        return;
        }
        try {
        const perm = await window.Notification.requestPermission();
        this.renderStatus();
        if (perm === 'granted') {
            toast('✅ Đã bật thông báo');
            this.send('Study Tracker', 'Thông báo đã được bật thành công! 🎉', 'success');
        } else if (perm === 'denied') {
            this.showHelp();
            toast('❌ Bạn đã từ chối.');
        }
        } catch (e) { toast('❌ Không thể xin quyền'); }
    },
    test() {
        if (!('Notification' in window)) { toast('❌ Trình duyệt không hỗ trợ'); return; }
        if (window.Notification.permission === 'granted') {
        this.send('🧪 Test thông báo', 'Nếu bạn thấy thông báo này, mọi thứ hoạt động tốt!', 'success');
        } else {
        this.showInApp('🧪 Test thông báo', 'Trình duyệt chưa cấp quyền. Đây là banner in-app thay thế.', 'warning');
        toast('⚠️ Chưa có quyền — đang dùng banner in-app');
        }
    },
    renderStatus() {
        const el = $('#notifStatus');
        const help = $('#notifHelp');
        if (!el) return;
        if (!('Notification' in window)) {
        el.textContent = '⚠️ Trình duyệt không hỗ trợ thông báo';
        el.className = 'notif-status';
        if (help) help.hidden = true;
        return;
        }
        const p = window.Notification.permission;
        if (p === 'granted') {
        el.textContent = '✅ Đã bật — hoạt động khi tab đang mở';
        el.className = 'notif-status granted';
        if (help) help.hidden = true;
        } else if (p === 'denied') {
        el.textContent = '❌ Bạn đã chặn thông báo — dùng banner in-app';
        el.className = 'notif-status denied';
        if (help) help.hidden = false;
        } else {
        el.textContent = '🔔 Chưa bật — bấm "Xin quyền" để bật';
        el.className = 'notif-status';
        if (help) help.hidden = true;
        }
    },
    showHelp() {
        const help = $('#notifHelp');
        if (help) help.hidden = false;
    },
    send(title, body, type = 'info') {
        if (document.hidden) {
        this.pendingNotifs.push({ title, body, type, at: Date.now() });
        this.save();
        return;
        }
        let sent = false;
        if ('Notification' in window && window.Notification.permission === 'granted') {
        try {
            const n = new window.Notification(title, {
            body: body, tag: 'study-' + Date.now(), silent: !this.sound,
            });
            sent = true;
            setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
        } catch (e) {}
        }
        if (!sent || this.inAppFallback) {
        this.showInApp(title, body, type);
        }
        if (this.sound) this.playSound();
    },
    showInApp(title, msg, type = 'info') {
        const old = document.querySelector('.inapp-notif');
        if (old) old.remove();
        const icons = { info: 'ℹ️', warning: '⚠️', danger: '🚨', success: '✅' };
        const el = document.createElement('div');
        el.className = 'inapp-notif ' + (type || 'info');
        el.innerHTML = `
        <div class="in-icon">${icons[type] || 'ℹ️'}</div>
        <div class="in-body">
            <div class="in-title">${escapeHtml(title)}</div>
            <div class="in-msg">${escapeHtml(msg)}</div>
        </div>
        <button class="in-close" aria-label="Đóng thông báo">✕</button>
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        const close = () => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
        };
        el.querySelector('.in-close').addEventListener('click', close);
        setTimeout(close, 8000);
    },
    flushPending() {
        if (this.pendingNotifs.length === 0) return;
        const list = [...this.pendingNotifs];
        this.pendingNotifs = [];
        this.save();
        if (list.length === 1) {
        this.showInApp(list[0].title, list[0].body, list[0].type);
        } else if (list.length > 1) {
        const titles = list.slice(0, 3).map(n => '• ' + n.title).join('\n');
        this.showInApp(`📬 ${list.length} thông báo bị lỡ`,
            titles + (list.length > 3 ? `\n...và ${list.length - 3} cái khác` : ''), 'info');
        }
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
    _cleanupOldNotifKeys() {
        try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffKey = dateKey(cutoff);
        Object.keys(localStorage).forEach(k => {
            if (!k.startsWith('notif_')) return;
            const parts = k.split('_');
            const datePart = parts[parts.length - 1];
            if (datePart.length === 10 && datePart < cutoffKey) {
                localStorage.removeItem(k);
            }
        });
        } catch (e) {}
    },
    check() {
        const now = new Date();
        const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const todayKey = dateKey(now);
        if (hhmm === this.dailyTime && this.lastNotifiedDate !== todayKey) {
        const goal = State.profile.dailyGoal || 0;
        const done = State.days[todayKey]?.minutes || 0;
        if (goal > 0 && done < goal) {
            this.send('📚 Đến giờ học rồi!', `Bạn còn thiếu ${goal - done} phút để đạt mục tiêu hôm nay.`, 'info');
        } else if (done === 0) {
            this.send('📚 Đến giờ học rồi!', 'Hôm nay bạn chưa học gì. Bắt đầu ngay nào!', 'info');
        }
        this.lastNotifiedDate = todayKey;
        this.save();
        }
        if (this.deadlineNotif && typeof TodoManager !== 'undefined') {
        const soon = TodoManager.countSoon(1);
        const overdue = TodoManager.countOverdue();
        const notifiedKey = 'notif_dl_' + todayKey;
        if (!localStorage.getItem(notifiedKey)) {
            if (overdue > 0) {
            this.send('⚠️ Có việc quá hạn!', `${overdue} việc đã quá hạn.`, 'danger');
            localStorage.setItem(notifiedKey, '1');
            } else if (soon.length > 0) {
            const firstTodo = soon[0];
            this.send('⏰ Deadline sắp đến', `${soon.length} việc sẽ đến hạn trong 24h. Sắp nhất: "${firstTodo.title}"`, 'warning');
            localStorage.setItem(notifiedKey, '1');
            }
        }
        }
        if (now.getHours() >= 22 && StreakFreeze.needsFreeze()) {
        const notifiedKey = 'notif_streak_' + todayKey;
        if (!localStorage.getItem(notifiedKey)) {
            this.send('🔥 Streak sắp mất!', 'Bạn chưa học hôm nay. Học nhanh hoặc dùng Freeze!', 'warning');
            localStorage.setItem(notifiedKey, '1');
        }
        }
        this._cleanupOldNotifKeys();
    },
    };

    /* ═══════ 24. IMAGE UTILS ═══════ */
    const ImageUtils = {
    compress(file, maxDim = 800, quality = 0.85) {
        return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) { reject(new Error('Không phải ảnh')); return; }
        if (file.size > 20 * 1024 * 1024) { reject(new Error('Ảnh quá lớn (tối đa 20MB)')); return; }
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
                if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
                else { width = Math.round(width * maxDim / height); height = maxDim; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(outputType, quality);
            resolve({ dataUrl, width, height, originalSize: file.size, newSize: Math.round(dataUrl.length * 0.75) });
            };
            img.onerror = () => reject(new Error('Không đọc được ảnh'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Không đọc được file'));
        reader.readAsDataURL(file);
        });
    },
    getStorageInfo() {
        let total = 0;
        try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            if (val) total += (val.length + key.length) * 2;
        }
        } catch (e) {}
        const usedMB = (total / 1024 / 1024).toFixed(2);
        const limitMB = 10;
        const pct = Math.round((total / (limitMB * 1024 * 1024)) * 100);
        return { usedMB, limitMB, pct };
    },
    };

    /* ═══════ 25. DATA MANAGER ═══════ */
    const DataManager = {
    DAYS_WARN_BACKUP: 14,
    _importData: null,
    init() {
        this.bindDeleteRange();
        this.bindImport();
        this.renderBackupStatus();
        this.checkBackupReminder();
    },
    bindDeleteRange() {
        const from = $('#deleteFrom');
        const to = $('#deleteTo');
        const btn = $('#deleteRangeBtn');
        const preview = $('#deletePreview');
        if (!from || !to) return;
        const updatePreview = () => {
        if (!preview) return;
        const f = from.value, t = to.value;
        if (!f || !t) { preview.hidden = true; return; }
        if (f > t) { preview.hidden = false; preview.innerHTML = '<div class="dp-title">⚠️ Lỗi</div>Ngày bắt đầu phải ≤ ngày kết thúc.'; return; }
        const toDelete = Object.keys(State.days).filter(k => k >= f && k <= t);
        let totalMinutes = 0, totalSessions = 0, totalSlots = 0;
        toDelete.forEach(k => {
            const day = State.days[k];
            totalMinutes += day.minutes || 0;
            totalSessions += (day.sessions || []).length;
            totalSlots += (day.slots || []).length;
        });
        const totalDays = Math.ceil((parseKey(t) - parseKey(f)) / 86400000) + 1;
        preview.hidden = false;
        preview.innerHTML = `
            <div class="dp-title">⚠️ Sẽ xóa:</div>
            <ul>
            <li>📅 <b>${toDelete.length}</b> ngày có dữ liệu (trong ${totalDays} ngày)</li>
            <li>⏱️ <b>${fmtMinutes(totalMinutes)}</b> tổng thời gian học</li>
            <li>📖 <b>${totalSessions}</b> phiên học</li>
            <li>🕐 <b>${totalSlots}</b> khung giờ chi tiết</li>
            </ul>
        `;
        };
        from.addEventListener('change', updatePreview);
        to.addEventListener('change', updatePreview);
        from.addEventListener('input', updatePreview);
        to.addEventListener('input', updatePreview);
        if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => this.performDeleteRange());
        }
    },
    performDeleteRange() {
        const f = $('#deleteFrom')?.value, t = $('#deleteTo')?.value;
        if (!f || !t) { toast('⚠️ Chọn đủ 2 ngày'); return; }
        if (f > t) { toast('⚠️ Ngày bắt đầu phải trước ngày kết thúc'); return; }
        if (t > State.today) { toast('⚠️ Ngày kết thúc không được ở tương lai'); return; }
        const toDelete = Object.keys(State.days).filter(k => k >= f && k <= t);
        if (toDelete.length === 0) { toast('ℹ️ Không có dữ liệu trong khoảng này'); return; }
        if (!confirm(`Xóa ${toDelete.length} ngày dữ liệu từ ${f} đến ${t}?`)) return;
        const backup = {};
        toDelete.forEach(k => { backup[k] = State.days[k]; delete State.days[k]; });
        Storage.saveDays();
        Modules.refreshAll();
        $('#deleteFrom').value = '';
        $('#deleteTo').value = '';
        const preview = $('#deletePreview');
        if (preview) preview.hidden = true;
        Undo.push(`Đã xóa ${toDelete.length} ngày`, () => {
        Object.keys(backup).forEach(k => { State.days[k] = backup[k]; });
        Storage.saveDays();
        Modules.refreshAll();
        }, 15000);
        toast(`🗑 Đã xóa ${toDelete.length} ngày`);
    },
    bindImport() {
        const importBtn = $('#importBtn');
        const importFile = $('#importFile');
        const confirmBtn = $('#importConfirm');
        if (!importBtn || !importFile) return;
        const newImportBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newImportBtn, importBtn);
        newImportBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', e => this.parseFile(e));
        if (confirmBtn) {
        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        newConfirm.addEventListener('click', () => this.doImport());
        }
        $$('#importModal [data-close-import]').forEach(el => {
        el.addEventListener('click', () => this.closeImportModal());
        });
    },
    parseFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast('❌ File quá lớn (> 10MB)'); e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = evt => {
        let data;
        try { data = JSON.parse(evt.target.result); }
        catch (err) { toast('❌ File không phải JSON hợp lệ'); e.target.value = ''; return; }
        const validation = this.validateImportData(data);
        if (!validation.ok) { toast('❌ ' + validation.error); e.target.value = ''; return; }
        this._importData = data;
        this.showImportModal(data, validation.stats);
        e.target.value = '';
        };
        reader.onerror = () => { toast('❌ Không đọc được file'); e.target.value = ''; };
        reader.readAsText(file);
    },
    validateImportData(data) {
        if (!data || typeof data !== 'object') return { ok: false, error: 'File không phải đối tượng JSON' };
        const hasDays = data.days && typeof data.days === 'object';
        const hasProfile = data.profile && typeof data.profile === 'object';
        const hasRoadmap = Array.isArray(data.roadmap);
        const hasTodos = Array.isArray(data.todos);
        if (!hasDays && !hasProfile && !hasRoadmap && !hasTodos) return { ok: false, error: 'File không chứa dữ liệu Study Tracker' };
        const stats = {
        days: hasDays ? Object.keys(data.days).length : 0,
        profile: hasProfile,
        roadmap: hasRoadmap ? data.roadmap.length : 0,
        todos: hasTodos ? data.todos.length : 0,
        hasTheme: !!data.theme, hasBg: !!data.bg,
        version: data.version || '?',
        };
        return { ok: true, stats };
    },
    showImportModal(data, stats) {
        const modal = $('#importModal');
        const preview = $('#importPreview');
        if (!modal || !preview) return;
        const currentDays = Object.keys(State.days).length;
        preview.innerHTML = `
        <div class="ip-title">📦 File chứa:</div>
        <div class="ip-row"><span>Phiên bản</span><b>v${stats.version}</b></div>
        <div class="ip-row"><span>Ngày học</span><b>${stats.days}</b></div>
        <div class="ip-row"><span>Lộ trình</span><b>${stats.roadmap}</b></div>
        <div class="ip-row"><span>Todo</span><b>${stats.todos}</b></div>
        <div class="ip-row"><span>Có hồ sơ</span><b>${stats.profile ? '✓' : '✗'}</b></div>
        <div class="ip-row"><span>Có theme/BG</span><b>${(stats.hasTheme ? '✓' : '✗')} / ${(stats.hasBg ? '✓' : '✗')}</b></div>
        <div class="ip-title" style="margin-top:10px;color:var(--text-mute)">Hiện tại bạn có <b>${currentDays}</b> ngày</div>
        `;
        modal.classList.add('show');
    },
    doImport() {
        const data = this._importData;
        if (!data) { toast('❌ Không có dữ liệu'); return; }
        const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'merge';
        try {
        const backup = { version: 5, exportedAt: new Date().toISOString(), profile: State.profile, days: State.days, roadmap: State.roadmap };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `backup-before-import-${State.today}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        } catch (e) {}
        if (mode === 'overwrite') {
        if (data.profile) State.profile = { ...State.profile, ...data.profile };
        if (data.days && typeof data.days === 'object') State.days = { ...data.days };
        if (Array.isArray(data.roadmap)) State.roadmap = [...data.roadmap];
        if (data.theme) State.theme = data.theme;
        if (data.bg) State.bg = data.bg;
        if (Array.isArray(data.todos) && typeof TodoManager !== 'undefined') TodoManager.todos = [...data.todos];
        if (data.freeze && typeof StreakFreeze !== 'undefined') {
            StreakFreeze.freezes = data.freeze.freezes ?? 3;
            StreakFreeze.history = data.freeze.history || [];
        }
        toast('✅ Đã ghi đè toàn bộ');
        } else {
        let merged = 0;
        if (data.days && typeof data.days === 'object') {
            Object.keys(data.days).forEach(k => { State.days[k] = data.days[k]; merged++; });
        }
        if (data.profile) {
            Object.keys(data.profile).forEach(f => { if (!State.profile[f]) State.profile[f] = data.profile[f]; });
        }
        if (Array.isArray(data.roadmap) && data.roadmap.length) {
            const existingIds = new Set(State.roadmap.map(r => r.id));
            data.roadmap.forEach(r => { if (!existingIds.has(r.id)) State.roadmap.push(r); });
        }
        if (Array.isArray(data.todos) && typeof TodoManager !== 'undefined') {
            const existingIds = new Set(TodoManager.todos.map(t => t.id));
            data.todos.forEach(t => { if (!existingIds.has(t.id)) TodoManager.todos.push(t); });
        }
        toast(`✅ Đã gộp ${merged} ngày dữ liệu`);
        }
        Storage.saveProfile(); Storage.saveDays(); Storage.saveRoadmap();
        Storage.saveTheme(); Storage.saveBg();
        if (typeof TodoManager !== 'undefined') TodoManager.save();
        if (typeof StreakFreeze !== 'undefined') StreakFreeze.save();
        Theme.apply(State.theme, true);
        Background.apply();
        Profile.sync();
        Modules.refreshAll();
        this.closeImportModal();
        this._importData = null;
    },
    closeImportModal() {
        const modal = $('#importModal');
        if (modal) modal.classList.remove('show');
    },
    getLastBackupDate() {
        try {
        if (window.DB && window.DB.ready && window.DB.getMeta) {
            const d = window.DB.getMeta('backup_date', null);
            if (d) return d;
        }
        return localStorage.getItem(STORE.BACKUP) || '';
        } catch (e) { return ''; }
    },
    setLastBackupDate() {
        try {
        localStorage.setItem(STORE.BACKUP, State.today);
        if (window.DB && window.DB.ready && window.DB.setMeta) {
            window.DB.setMeta('backup_date', State.today);
        }
        } catch (e) {}
    },
    renderBackupStatus() {
        const el = $('#backupStatus');
        if (!el) return;
        const last = this.getLastBackupDate();
        const info = ImageUtils.getStorageInfo();
        if (!last) {
        el.className = 'backup-status warn';
        el.innerHTML = `<span class="bs-icon">💡</span><span class="bs-text">Bạn chưa xuất backup. Đã dùng <b>${info.usedMB} MB</b> / ${info.limitMB} MB.</span>`;
        return;
        }
        const daysSince = Math.floor((parseKey(State.today) - parseKey(last)) / 86400000);
        if (daysSince >= this.DAYS_WARN_BACKUP) {
        el.className = 'backup-status warn';
        el.innerHTML = `<span class="bs-icon">⚠️</span><span class="bs-text">Xuất cuối: <b>${daysSince} ngày trước</b>. Nên sao lưu. Đã dùng <b>${info.usedMB} MB</b> / ${info.limitMB} MB.</span>`;
        } else {
        el.className = 'backup-status';
        el.innerHTML = `<span class="bs-icon">✅</span><span class="bs-text">Backup gần nhất: <b>${daysSince} ngày trước</b>. Đã dùng <b>${info.usedMB} MB</b> / ${info.limitMB} MB.</span>`;
        }
    },
    checkBackupReminder() {
        const last = this.getLastBackupDate();
        if (!last) return;
        const daysSince = Math.floor((parseKey(State.today) - parseKey(last)) / 86400000);
        if (daysSince >= this.DAYS_WARN_BACKUP) {
        const key = 'st_backup_reminded_' + State.today;
        if (!sessionStorage.getItem(key)) {
            setTimeout(() => {
            if (typeof NotifManager !== 'undefined' && NotifManager.send) {
                NotifManager.send('💾 Nên sao lưu dữ liệu',
                `Đã ${daysSince} ngày từ lần xuất cuối.`, 'warning');
            }
            }, 3000);
            sessionStorage.setItem(key, '1');
        }
        }
    },
    };

    /* ═══════ 26. UNDO MANAGER ═══════ */
    const Undo = {
    stack: [], timeout: null, _timerInt: null,
    init() {
        const btn = $('#undoBtn');
        if (!btn) return;
        btn.addEventListener('click', () => this.rollback());
    },
    push(msg, fn, duration = 15000) {
        this.stack.push(fn);
        const msgEl = $('#undoMsg');
        const toastEl = $('#undoToast');
        if (msgEl) msgEl.textContent = msg;
        if (toastEl) toastEl.classList.add('show');
        const timerEl = $('#undoTimer');
        if (timerEl) {
        let left = Math.round(duration / 1000);
        timerEl.textContent = `(${left}s)`;
        clearInterval(this._timerInt);
        this._timerInt = setInterval(() => {
            left--;
            if (left <= 0) { clearInterval(this._timerInt); return; }
            timerEl.textContent = `(${left}s)`;
        }, 1000);
        }
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.clear(), duration);
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
        clearInterval(this._timerInt);
    },
    };

    /* ═══════ 27. A11Y ═══════ */
    const A11y = {
    EMOJI_LABELS: {
        '✏️': 'Sửa', '🗑': 'Xóa', '🗑️': 'Xóa', '➕': 'Thêm',
        '✕': 'Đóng', '✖': 'Đóng', '🎨': 'Đổi màu', '📷': 'Tải ảnh lên',
        '🔍': 'Tìm kiếm', '⛶': 'Toàn màn hình', '↺': 'Đặt lại',
        '⏸': 'Tạm dừng', '⏹': 'Dừng', '❄️': 'Streak Freeze',
        '🔔': 'Thông báo', '❄': 'Streak Freeze', '☀️': 'Chế độ sáng',
        '🌙': 'Chế độ tối', '⭐': 'Đánh giá', '★': 'Đánh giá sao',
        '☆': 'Chưa đánh giá', '🔀': 'Trộn', '📅': 'Lịch', '📊': 'Thống kê',
        '⚙️': 'Cài đặt', '🏠': 'Trang chủ', '📖': 'Học tập', '🕐': 'Giờ học',
        '✅': 'Hoàn thành', '↩️': 'Hoàn tác', '↩': 'Hoàn tác',
        '◀': 'Trước', '▶': 'Sau', '−': 'Giảm', '+': 'Tăng',
        '📥': 'Nhập', '📦': 'Xuất', '⬇': 'Xuất', '⬆': 'Nhập',
    },
    init() {
        this.autoLabelAll();
        const debouncedLabel = debounce(() => this.autoLabelAll(), 200);
        const observer = new MutationObserver((mutations) => {
        let hasAdded = false;
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === 1) hasAdded = true;
            });
            }
        });
        if (hasAdded) debouncedLabel();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },
    autoLabelAll() { document.querySelectorAll('button').forEach(btn => this.autoLabel(btn)); },
    autoLabel(btn) {
        if (btn.getAttribute('aria-label') || btn.getAttribute('title')) return;
        const text = (btn.textContent || '').trim();
        if (text.length > 0 && text.length <= 3) {
        const label = this.EMOJI_LABELS[text];
        if (label) {
            btn.setAttribute('aria-label', label);
            if (!btn.title) btn.title = label;
        }
        }
    },
    };

    /* ═══════ 28. HEATMAP SCROLL ═══════ */
    const HeatmapScroll = {
    scrollToToday() {
        const scroll = $('#heatmapScroll');
        const map = $('#heatmap');
        if (!scroll || !map) return;
        const today = map.querySelector(`.hm-cell[data-date="${State.today}"]`);
        if (!today) return;
        const scrollWidth = scroll.clientWidth;
        const cellLeft = today.offsetLeft;
        const cellWidth = today.offsetWidth;
        const targetScroll = cellLeft - (scrollWidth / 2) + (cellWidth / 2);
        scroll.scrollLeft = Math.max(0, targetScroll);
    },
    init() {
        setTimeout(() => this.scrollToToday(), 300);
        window.addEventListener('resize', () => this.scrollToToday());
        const wrap = document.querySelector('.heatmap-wrap');
        if (wrap && !wrap.querySelector('.heatmap-today-btn')) {
        const btn = document.createElement('button');
        btn.className = 'btn soft heatmap-today-btn';
        btn.style.cssText = 'align-self:flex-start;font-size:12px;padding:6px 12px';
        btn.textContent = '📍 Về hôm nay';
        btn.setAttribute('aria-label', 'Cuộn heatmap về ngày hôm nay');
        btn.addEventListener('click', () => this.scrollToToday());
        wrap.appendChild(btn);
        }
    },
    };

    /* ═══════ 29. ARIA LIVE ═══════ */
    const AriaLive = {
    init() {
        if (!$('#ariaLive')) {
        const el = document.createElement('div');
        el.id = 'ariaLive';
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
        document.body.appendChild(el);
        }
    },
    announce(msg) {
        const el = $('#ariaLive');
        if (!el) return;
        el.textContent = '';
        setTimeout(() => { el.textContent = msg; }, 50);
    },
    };

    /* ═══════ 30. FAB + SHORTCUTS ═══════ */
    const Fab = {
    init() {
        const btn = $('#fabBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
        Router.go('study');
        setTimeout(() => {
            if (typeof Pomodoro !== 'undefined' && typeof Pomodoro.start === 'function') Pomodoro.start();
        }, 200);
        });
    },
    };

    const Shortcuts = {
    init() {
        document.addEventListener('keydown', e => {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
            if (e.key === 'Escape') e.target.blur();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#globalSearch')?.focus(); return; }
        if (e.key.toLowerCase() === 'n') { e.preventDefault(); Calendar.openModal(State.today); return; }
        if (e.key.toLowerCase() === 't') { e.preventDefault(); Router.go('home'); return; }
        if (e.key === '/') { e.preventDefault(); $('#globalSearch')?.focus(); }
        });
    },
    };

    /* ═══════ 31. PWA MANAGER ═══════ */
    const PWAManager = {
    deferredPrompt: null, registration: null, _banner: null, _bannerShown: false,
    init() {
        if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
                this.registration = reg;
                console.log('[PWA] SW đã đăng ký:', reg.scope);
                setInterval(() => reg.update(), 60 * 60 * 1000);
            })
            .catch((err) => { console.warn('[PWA] SW đăng ký lỗi:', err.message); });
        });
        }
        window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallBanner();
        });
        window.addEventListener('appinstalled', () => {
        toast('📲 Đã cài Study Tracker!');
        this.hideInstallBanner();
        this.deferredPrompt = null;
        const btn = $('#installPwaBtn');
        if (btn) btn.style.display = 'none';
        });
        const installBtn = $('#installPwaBtn');
        if (installBtn) installBtn.addEventListener('click', () => this.promptInstall());
        const updateBtn = $('#updatePwaBtn');
        if (updateBtn) updateBtn.addEventListener('click', () => this.checkUpdate());
        if (this.isStandalone()) {
        const btn = $('#installPwaBtn');
        if (btn) btn.style.display = 'none';
        const hint = $('#pwaHint');
        if (hint) hint.textContent = '✅ Bạn đang dùng app đã cài — hoạt động offline tốt.';
        }
        this.setupOfflineBadge();
    },
    isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    },
    async promptInstall() {
        if (!this.deferredPrompt) { toast('ℹ️ Dùng menu trình duyệt → "Cài đặt ứng dụng"'); return; }
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') toast('📲 Đang cài đặt...');
        else toast('ℹ️ Bạn đã hủy cài đặt');
        this.deferredPrompt = null;
        this.hideInstallBanner();
    },
    showInstallBanner() {
        if (this._bannerShown) return;
        if (sessionStorage.getItem('pwa_banner_dismissed')) return;
        this._bannerShown = true;
        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
        <span class="pb-icon">📲</span>
        <div class="pb-body">
            <div class="pb-title">Cài Study Tracker?</div>
            <div class="pb-desc">Dùng như app thật, chạy offline</div>
        </div>
        <div class="pb-actions">
            <button class="btn ghost" data-act="later" style="padding:6px 10px;font-size:12px">Để sau</button>
            <button class="btn primary" data-act="install" style="padding:6px 12px;font-size:12px">Cài</button>
        </div>
        `;
        document.body.appendChild(banner);
        requestAnimationFrame(() => banner.classList.add('show'));
        banner.querySelector('[data-act="install"]').addEventListener('click', () => this.promptInstall());
        banner.querySelector('[data-act="later"]').addEventListener('click', () => {
        sessionStorage.setItem('pwa_banner_dismissed', '1');
        this.hideInstallBanner();
        });
        this._banner = banner;
    },
    hideInstallBanner() {
        if (this._banner) {
        this._banner.classList.remove('show');
        setTimeout(() => {
            if (this._banner && this._banner.parentNode) this._banner.remove();
        }, 400);
        }
    },
    async checkUpdate() {
        if (!this.registration) { toast('⚠️ Service Worker chưa sẵn sàng'); return; }
        toast('🔄 Đang kiểm tra cập nhật...');
        try {
        await this.registration.update();
        if (this.registration.waiting) {
            if (confirm('Có bản cập nhật mới. Tải lại trang bây giờ?')) {
            this.registration.waiting.postMessage('SKIP_WAITING');
            setTimeout(() => location.reload(), 500);
            }
        } else {
            toast('✅ Bạn đang dùng bản mới nhất');
        }
        } catch (e) { toast('❌ Không kiểm tra được'); }
    },
    setupOfflineBadge() {
        const badge = document.createElement('div');
        badge.className = 'offline-badge';
        badge.textContent = '📴 Đang offline — dữ liệu vẫn lưu bình thường';
        document.body.appendChild(badge);
        const update = () => {
        if (navigator.onLine) badge.classList.remove('show');
        else badge.classList.add('show');
        };
        window.addEventListener('online', () => { toast('🌐 Đã kết nối lại'); update(); });
        window.addEventListener('offline', () => { toast('📴 Mất kết nối — dữ liệu vẫn lưu'); update(); });
        update();
    },
    };

    /* ═══════ 32. INIT ═══════ */
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

    Pomodoro.init();
    Fab.init();
    Shortcuts.init();
    Undo.init();

    SubjectManager.init();
    TodoManager.init();

    StreakFreeze.init();
    NotifManager.init();

    Onboarding.init();

    SessionManager.init();
    Guards.applyDateLimits();

    DataManager.init();

    A11y.init();
    AriaLive.init();
    HeatmapScroll.init();

    PWAManager.init();

    Modules.refreshAll();

    if (window.DB && window.DB.onReady) {
        window.DB.onReady(() => {
        console.log('[App] DB ready — reload data');
        Storage.loadAll();
        SubjectManager.load();
        SubjectManager.render();
        SubjectManager.renderTagPicker();
        SubjectManager.renderModalSelect();
        TodoManager.load();
        TodoManager.render();
        StreakFreeze.load();
        StreakFreeze.render();
        NotifManager.load();
        NotifManager.renderStatus();
        Modules.refreshAll();
        });
    }

    window.addEventListener('beforeunload', () => {
        Storage.saveDays();
        Storage.saveProfile();
        Storage.saveRoadmap();
        Storage.saveBg();
        if (typeof TodoManager !== 'undefined') TodoManager.save();
        if (typeof StreakFreeze !== 'undefined') StreakFreeze.save();
        if (typeof SubjectManager !== 'undefined') SubjectManager.save();
        if (typeof NotifManager !== 'undefined') NotifManager.save();
        if (window.DB && window.DB.saveNow) {
        try { window.DB.saveNow(); } catch (e) {}
        }
    });

    console.log('%c✅ Study Tracker v5 + SQLite + Worker ready!',
        'color:#4f46e5;font-weight:bold;font-size:14px;');
    }

    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    } else {
    init();
    }
        window.TodoManager = TodoManager;
    window.State = State;
    })();