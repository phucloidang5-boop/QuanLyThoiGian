    /* ═══════════════════════════════════════════════════════════
    STUDY TRACKER — db.js
    SQLite (sql.js) + IndexedDB + Migration + SQL Runner
    ═══════════════════════════════════════════════════════════ */
    (function () {
    'use strict';

    const IDB_NAME  = 'study_tracker_idb';
    const IDB_STORE = 'sqlite';
    const IDB_KEY   = 'main';

    /* ═══════ 1. IndexedDB WRAPPER ═══════ */
    const IDB = {
        db: null,
        async open() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
            };
            req.onsuccess = () => { this.db = req.result; resolve(this.db); };
            req.onerror   = () => reject(req.error);
        });
        },
        async get() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror   = () => reject(req.error);
        });
        },
        async set(value) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(value, IDB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror    = () => reject(tx.error);
        });
        },
        async clear() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).delete(IDB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror    = () => reject(tx.error);
        });
        },
    };

    /* ═══════ 2. DB MODULE ═══════ */
    const DB = {
        sql: null,
        db: null,
        ready: false,
        _saveTimer: null,
        _readyCallbacks: [],

        async init() {
        if (this.ready) return;
        if (typeof initSqlJs !== 'function') {
            console.warn('[DB] initSqlJs chưa load — bỏ qua SQL');
            return;
        }

        // Load sql.js
        this.sql = await initSqlJs({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/${file}`,
        });

        // Load DB từ IndexedDB (nếu có)
        const saved = await IDB.get();
        if (saved && saved.byteLength > 0) {
            try {
            this.db = new this.sql.Database(new Uint8Array(saved));
            } catch (e) {
            console.warn('[DB] Load failed, tạo DB mới:', e);
            this.db = new this.sql.Database();
            this.createSchema();
            }
        } else {
            this.db = new this.sql.Database();
            this.createSchema();
        }

        // Migration tự động: nếu localStorage có data và DB trống
        const hasLocalData = (() => {
            try { return !!localStorage.getItem('st_days_v3'); } catch (e) { return false; }
        })();
        const hasDBData = this.getOne('SELECT COUNT(*) as n FROM days')?.n > 0;
        if (hasLocalData && !hasDBData) {
            console.log('[DB] Phát hiện dữ liệu localStorage — đang tự migrate...');
            try {
            const r = await this.migrateFromLocalStorage();
            console.log('[DB] Auto-migrate:', r);
            } catch (e) {
            console.warn('[DB] Auto-migrate failed:', e);
            }
        }

        this.ready = true;
        console.log('✅ [DB] SQLite ready — ' + this.getOne('SELECT COUNT(*) as n FROM days')?.n + ' ngày');

        // Fire ready callbacks
        this._readyCallbacks.forEach(fn => { try { fn(); } catch (e) {} });
        this._readyCallbacks = [];
        },

        onReady(fn) {
        if (this.ready) fn();
        else this._readyCallbacks.push(fn);
        },

        createSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS days (
            date TEXT PRIMARY KEY,
            minutes INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            subject TEXT DEFAULT '',
            frozen INTEGER DEFAULT 0,
            goals_json TEXT DEFAULT '[]',
            slots_json TEXT DEFAULT '[]',
            updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            at TEXT NOT NULL,
            minutes INTEGER NOT NULL,
            tag TEXT DEFAULT 'Khác',
            tag_color TEXT DEFAULT '#64748b',
            focus INTEGER DEFAULT 0,
            text TEXT DEFAULT '',
            source TEXT DEFAULT 'pomodoro'
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

            CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            desc_text TEXT DEFAULT '',
            deadline TEXT,
            priority TEXT DEFAULT 'normal',
            tag TEXT DEFAULT '',
            done INTEGER DEFAULT 0,
            created_at TEXT,
            completed_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(deadline);

            CREATE TABLE IF NOT EXISTS roadmaps (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            total_sessions INTEGER NOT NULL,
            completed_sessions INTEGER DEFAULT 0,
            created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT
            );
        `;
        this.db.run(schema);
        this.save();
        },

        /* ═══ CRUD ═══ */
        run(sql, params = []) {
        if (!this.db) return;
        try {
            this.db.run(sql, params);
            this.save();
        } catch (e) {
            console.error('[DB] Run error:', e.message, '\nSQL:', sql);
        }
        },

        query(sql, params = []) {
        if (!this.db) return [];
        const stmt = this.db.prepare(sql);
        try {
            stmt.bind(params);
            const out = [];
            while (stmt.step()) out.push(stmt.getAsObject());
            return out;
        } catch (e) {
            console.error('[DB] Query error:', e.message, '\nSQL:', sql);
            return [];
        } finally {
            stmt.free();
        }
        },

        getOne(sql, params = []) {
        const r = this.query(sql, params);
        return r[0] || null;
        },

        /* ═══ Persist (debounced 200ms) ═══ */
        save() {
        if (this._saveTimer) return;
        this._saveTimer = setTimeout(async () => {
            this._saveTimer = null;
            try {
            const data = this.db.export();
            const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            await IDB.set(buf);
            } catch (e) {
            console.error('[DB] Save failed:', e);
            }
        }, 200);
        },

        async saveNow() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        if (!this.db) return;
        const data = this.db.export();
        const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        await IDB.set(buf);
        },

        /* ═══ Export / Import / Reset ═══ */
        exportFile() {
        if (!this.db) { alert('Database chưa sẵn sàng'); return; }
        const data = this.db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        a.download = `study-tracker-${date}.sqlite`;
        a.click();
        URL.revokeObjectURL(a.href);
        },

        async importFile(file) {
        if (!this.sql) throw new Error('SQL chưa sẵn sàng');
        const buf = await file.arrayBuffer();
        if (this.db) this.db.close();
        this.db = new this.sql.Database(new Uint8Array(buf));
        // Đảm bảo schema đầy đủ
        try { this.createSchema(); } catch (e) {}
        await this.saveNow();
        },

        async reset() {
        if (this.db) this.db.close();
        this.db = new this.sql.Database();
        this.createSchema();
        await this.saveNow();
        },

        /* ═══ Meta (key-value) ═══ */
        getMeta(key, fb = null) {
        const r = this.getOne('SELECT value FROM meta WHERE key = ?', [key]);
        if (!r) return fb;
        try { return JSON.parse(r.value); } catch (e) { return r.value; }
        },

        setMeta(key, value) {
        this.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
            [key, JSON.stringify(value)]);
        },

        /* ═══ SYNC từ State (source of truth) ═══ */
        syncDays(days) {
        if (!this.db) return;
        const keys = Object.keys(days || {});
        const sessionIds = new Set();

        // Upsert từng day + session
        keys.forEach(k => {
            const d = days[k] || {};
            const goals = Array.isArray(d.goals) ? d.goals : [];
            const slots = Array.isArray(d.slots) ? d.slots : [];

            this.run(
            `INSERT OR REPLACE INTO days
            (date, minutes, notes, subject, frozen, goals_json, slots_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                k,
                d.minutes || 0,
                d.notes || '',
                d.subject || '',
                d.frozen ? 1 : 0,
                JSON.stringify(goals),
                JSON.stringify(slots),
                new Date().toISOString(),
            ]
            );

            (d.sessions || []).forEach((s, idx) => {
            const sid = s.id || ('s_' + k + '_' + (s.at || idx) + '_' + (s.minutes || 0));
            sessionIds.add(sid);
            this.run(
                `INSERT OR REPLACE INTO sessions
                (id, date, at, minutes, tag, tag_color, focus, text, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                sid,
                k,
                s.at || (k + 'T00:00:00.000Z'),
                s.minutes || 0,
                s.tag || 'Khác',
                s.tagColor || '#64748b',
                s.focus || 0,
                s.text || '',
                s.source || 'pomodoro',
                ]
            );
            });
        });

        // Xoá days không còn
        if (keys.length > 0) {
            const ph = keys.map(() => '?').join(',');
            this.run(`DELETE FROM days WHERE date NOT IN (${ph})`, keys);
        } else {
            this.run('DELETE FROM days');
        }

        // Xoá sessions không còn
        const ids = Array.from(sessionIds);
        if (ids.length > 0) {
            const ph = ids.map(() => '?').join(',');
            this.run(`DELETE FROM sessions WHERE id NOT IN (${ph})`, ids);
        } else {
            this.run('DELETE FROM sessions');
        }
        },

        syncSubjects(subjects) {
        if (!this.db) return;
        this.run('DELETE FROM subjects');
        (subjects || []).forEach(s => {
            this.run(
            `INSERT OR REPLACE INTO subjects (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
            [s.id || 'sub_' + Date.now() + '_' + Math.random(), s.name, s.color, s.createdAt || new Date().toISOString()]
            );
        });
        },

        syncTodos(todos) {
        if (!this.db) return;
        this.run('DELETE FROM todos');
        (todos || []).forEach(t => {
            this.run(
            `INSERT OR REPLACE INTO todos
            (id, title, desc_text, deadline, priority, tag, done, created_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                t.id || 'td_' + Date.now() + '_' + Math.random(),
                t.title,
                t.desc || '',
                t.deadline || '',
                t.priority || 'normal',
                t.tag || '',
                t.done ? 1 : 0,
                t.createdAt || new Date().toISOString(),
                t.completedAt || null,
            ]
            );
        });
        },

        syncRoadmaps(roadmaps) {
        if (!this.db) return;
        this.run('DELETE FROM roadmaps');
        (roadmaps || []).forEach(r => {
            this.run(
            `INSERT OR REPLACE INTO roadmaps (id, title, total_sessions, completed_sessions, created_at)
            VALUES (?, ?, ?, ?, ?)`,
            [r.id || 'r_' + Date.now(), r.title, r.totalSessions || 1, r.completedSessions || 0, r.createdAt || new Date().toISOString()]
            );
        });
        },

        /* ═══ MIGRATION từ localStorage ═══ */
        async migrateFromLocalStorage() {
        const get = (k, fb) => {
            try {
            const r = localStorage.getItem(k);
            return r ? JSON.parse(r) : fb;
            } catch (e) { return fb; }
        };

        const stats = { days: 0, sessions: 0, subjects: 0, todos: 0, roadmaps: 0 };

        // Days + Sessions
        const days = get('st_days_v3', {});
        Object.keys(days).forEach(date => {
            const d = days[date] || {};
            const goals = Array.isArray(d.goals) ? d.goals : [];
            const slots = Array.isArray(d.slots) ? d.slots : [];
            this.run(
            `INSERT OR REPLACE INTO days
            (date, minutes, notes, subject, frozen, goals_json, slots_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                date,
                d.minutes || 0,
                d.notes || '',
                d.subject || '',
                d.frozen ? 1 : 0,
                JSON.stringify(goals),
                JSON.stringify(slots),
                new Date().toISOString(),
            ]
            );
            stats.days++;

            (d.sessions || []).forEach((s, idx) => {
            const sid = s.id || ('s_' + date + '_' + (s.at || idx) + '_' + (s.minutes || 0));
            this.run(
                `INSERT OR REPLACE INTO sessions
                (id, date, at, minutes, tag, tag_color, focus, text, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                sid,
                date,
                s.at || (date + 'T00:00:00.000Z'),
                s.minutes || 0,
                s.tag || 'Khác',
                s.tagColor || '#64748b',
                s.focus || 0,
                s.text || '',
                s.source || 'pomodoro',
                ]
            );
            stats.sessions++;
            });
        });

        // Subjects
        const subjects = get('st_subjects_v1', []);
        if (Array.isArray(subjects)) {
            this.run('DELETE FROM subjects');
            subjects.forEach(s => {
            this.run(
                `INSERT OR REPLACE INTO subjects (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
                [s.id || 'sub_' + Date.now() + '_' + Math.random(), s.name, s.color, s.createdAt || new Date().toISOString()]
            );
            stats.subjects++;
            });
        }

        // Todos
        const todos = get('st_todos_v1', []);
        if (Array.isArray(todos)) {
            this.run('DELETE FROM todos');
            todos.forEach(t => {
            this.run(
                `INSERT OR REPLACE INTO todos
                (id, title, desc_text, deadline, priority, tag, done, created_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                t.id || 'td_' + Date.now() + '_' + Math.random(),
                t.title,
                t.desc || '',
                t.deadline || '',
                t.priority || 'normal',
                t.tag || '',
                t.done ? 1 : 0,
                t.createdAt || new Date().toISOString(),
                t.completedAt || null,
                ]
            );
            stats.todos++;
            });
        }

        // Roadmaps
        const roadmaps = get('st_roadmap_v3', []);
        if (Array.isArray(roadmaps)) {
            this.run('DELETE FROM roadmaps');
            roadmaps.forEach(r => {
            this.run(
                `INSERT OR REPLACE INTO roadmaps (id, title, total_sessions, completed_sessions, created_at)
                VALUES (?, ?, ?, ?, ?)`,
                [r.id || 'r_' + Date.now(), r.title, r.totalSessions || 1, r.completedSessions || 0, r.createdAt || new Date().toISOString()]
            );
            stats.roadmaps++;
            });
        }

        // Meta
        const profile = get('st_profile_v3', null);
        if (profile) this.setMeta('profile', profile);

        const theme = get('st_theme_v3', null);
        if (theme) this.setMeta('theme', theme);

        const bg = get('st_bg_v3', null);
        if (bg) this.setMeta('bg', bg);

        const notif = get('st_notif_v1', null);
        if (notif) this.setMeta('notif', notif);

        const freeze = get('st_freeze_v1', null);
        if (freeze) this.setMeta('freeze', freeze);

        const onboarded = get('st_onboarded_v1', null);
        if (onboarded) this.setMeta('onboarded', onboarded);

        const backup = get('st_last_backup_v1', null);
        if (backup) this.setMeta('backup_date', backup);

        await this.saveNow();
        return stats;
        },
    };

    /* ═══════ 3. SQL RUNNER (Tab Thống kê) ═══════ */
    const SQLRunner = {
        PRESETS: {
        top_days: `SELECT date, minutes
    FROM days
    WHERE minutes > 0
    ORDER BY minutes DESC
    LIMIT 10;`,

        by_subject: `SELECT tag,
    COUNT(*) as sessions,
    SUM(minutes) as total_minutes
    FROM sessions
    GROUP BY tag
    ORDER BY total_minutes DESC;`,

        by_weekday: `SELECT
    CASE CAST(strftime('%w', date) AS INTEGER)
        WHEN 0 THEN 'CN' WHEN 1 THEN 'T2' WHEN 2 THEN 'T3'
        WHEN 3 THEN 'T4' WHEN 4 THEN 'T5' WHEN 5 THEN 'T6'
        WHEN 6 THEN 'T7'
    END as thu,
    COUNT(*) as so_ngay,
    ROUND(AVG(minutes), 1) as tb_phut
    FROM days
    WHERE minutes > 0
    GROUP BY strftime('%w', date)
    ORDER BY CAST(strftime('%w', date) AS INTEGER);`,

        monthly: `SELECT
    strftime('%Y-%m', date) as thang,
    COUNT(*) as so_ngay_hoc,
    SUM(minutes) as tong_phut,
    ROUND(AVG(minutes), 1) as tb_phut
    FROM days
    WHERE minutes > 0
    GROUP BY thang
    ORDER BY thang DESC;`,

        streak_check: `SELECT date, minutes, frozen
    FROM days
    WHERE minutes > 0 OR frozen = 1
    ORDER BY date DESC
    LIMIT 30;`,

        sessions_today: `SELECT
    time(at) as gio,
    minutes as phut,
    tag as mon,
    text as ghi_chu,
    focus as sao
    FROM sessions
    WHERE date = date('now', 'localtime')
    ORDER BY at DESC;`,
        },

        init() {
        const runBtn   = document.getElementById('sqlRunBtn');
        const clearBtn = document.getElementById('sqlClearBtn');
        const preset   = document.getElementById('sqlPresetSelect');
        const input    = document.getElementById('sqlQueryInput');

        if (runBtn) runBtn.addEventListener('click', () => this.runQuery());
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (input) input.value = '';
            const res = document.getElementById('sqlResult');
            if (res) res.innerHTML = '';
            if (preset) preset.value = '';
        });
        if (preset) preset.addEventListener('change', () => {
            const key = preset.value;
            if (key && this.PRESETS[key] && input) {
            input.value = this.PRESETS[key];
            this.runQuery();
            }
        });
        if (input) {
            input.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runQuery();
            }
            });
        }
        },

        runQuery() {
        const input  = document.getElementById('sqlQueryInput');
        const result = document.getElementById('sqlResult');
        if (!input || !result) return;

        if (!DB.ready) {
            result.innerHTML = '<div class="sql-error">⏳ Database đang khởi tạo, đợi 2-3 giây rồi thử lại...</div>';
            return;
        }

        const sql = input.value.trim();
        if (!sql) {
            result.innerHTML = '<div class="sql-empty">Nhập query để chạy</div>';
            return;
        }

        // Safety: chỉ cho SELECT
        const clean = sql.toUpperCase().replace(/\s+/g, ' ').trim();
        const firstWord = clean.split(' ')[0];
        const dangerous = ['INSERT','UPDATE','DELETE','DROP','ALTER','CREATE','TRUNCATE','ATTACH','DETACH','PRAGMA','VACUUM'];
        if (dangerous.some(d => clean.includes(' ' + d + ' ') || firstWord === d)) {
            result.innerHTML = '<div class="sql-error">❌ Chỉ cho phép SELECT/WITH (đọc dữ liệu).</div>';
            return;
        }
        if (firstWord !== 'SELECT' && firstWord !== 'WITH') {
            result.innerHTML = '<div class="sql-error">❌ Query phải bắt đầu bằng SELECT hoặc WITH.</div>';
            return;
        }

        const t0 = performance.now();
        try {
            const rows = DB.query(sql);
            const elapsed = (performance.now() - t0).toFixed(1);

            if (rows.length === 0) {
            result.innerHTML =
                `<div class="sql-meta"><span>0 dòng</span><span>${elapsed}ms</span></div>` +
                `<div class="sql-empty">Không có kết quả</div>`;
            return;
            }

            const cols = Object.keys(rows[0]);
            const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
            }[c]));

            let html = `<div class="sql-meta"><span>${rows.length} dòng</span><span>${elapsed}ms</span></div>`;
            html += '<table class="sql-result-table"><thead><tr>';
            cols.forEach(c => { html += `<th>${esc(c)}</th>`; });
            html += '</tr></thead><tbody>';

            rows.forEach(r => {
            html += '<tr>';
            cols.forEach(c => {
                const v = r[c];
                const str = (v === null || v === undefined) ? '—' : String(v);
                html += `<td title="${esc(str)}">${esc(str)}</td>`;
            });
            html += '</tr>';
            });
            html += '</tbody></table>';
            result.innerHTML = html;
        } catch (e) {
            result.innerHTML =
            `<div class="sql-meta"><span>Lỗi</span><span>${(performance.now() - t0).toFixed(1)}ms</span></div>` +
            `<div class="sql-error">${e.message}</div>`;
        }
        },
    };

    /* ═══════ 4. AUTO-INIT ═══════ */
    async function initAll() {
        try {
        await DB.init();
        SQLRunner.init();
        console.log('%c✅ [DB] SQLite + SQLRunner sẵn sàng',
            'color:#10b981;font-weight:bold');
        } catch (e) {
        console.error('❌ [DB] Init failed:', e);
        }
    }

    // Expose globally
    window.DB = DB;
    window.IDB = IDB;
    window.SQLRunner = SQLRunner;

    // Tự init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
    })();