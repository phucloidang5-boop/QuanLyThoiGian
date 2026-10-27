/* ═══════════════════════════════════════════════════════════
    STUDY TRACKER — migrate.js
    Chuyển dữ liệu từ localStorage → SQLite (IndexedDB)

    Cách dùng:
        1. Đảm bảo web chạy qua HTTP server (Live Server / localhost)
        2. Import file này TRƯỚC app.js trong index.html:
            <script src="migrate.js"></script>
            <script src="app.js"></script>
        3. Mở Console (F12), gõ 1 trong các lệnh:
            - Migrate.migrate()        → chuyển toàn bộ
            - Migrate.check()          → xem có gì trong localStorage
            - Migrate.clear()          → xóa localStorage (sau khi migrate)
            - Migrate.exportBackup()   → tải file backup JSON
    ═══════════════════════════════════════════════════════════ */
    (function () {
    'use strict';

    const KEYS = {
    DAYS:     'st_days_v3',
    PROFILE:  'st_profile_v3',
    THEME:    'st_theme_v3',
    ROADMAP:  'st_roadmap_v3',
    BG:       'st_bg_v3',
    TODOS:    'st_todos_v1',
    FREEZE:   'st_freeze_v1',
    NOTIF:    'st_notif_v1',
    SUBJECTS: 'st_subjects_v1',
    ONBOARD:  'st_onboarded_v1',
    BACKUP:   'st_last_backup_v1',
    };

    const Migrate = {
    /* ═══ 1. KIỂM TRA localStorage ═══ */
    check() {
        console.log('%c🔍 KIỂM TRA localStorage', 'color:#4f46e5;font-weight:bold;font-size:14px');
        console.log('URL:', location.href);
        console.log('Protocol:', location.protocol);
        console.log('');

        // Kiểm tra localStorage có bị chặn
        try {
        localStorage.setItem('_test', '1');
        localStorage.removeItem('_test');
        console.log('%c✅ localStorage hoạt động', 'color:#10b981;font-weight:bold');
        } catch(e) {
        console.log('%c❌ localStorage BỊ CHẶN:', 'color:#ef4444;font-weight:bold', e.message);
        return;
        }

        // Liệt kê từng key
        let found = 0, totalSize = 0;
        Object.entries(KEYS).forEach(([name, key]) => {
        const val = localStorage.getItem(key);
        if (val) {
            try {
            const parsed = JSON.parse(val);
            const count = Array.isArray(parsed) 
                ? parsed.length 
                : (typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1);
            console.log(`  ✅ ${name} (${key}) — ${count} mục — ${(val.length/1024).toFixed(1)}KB`);
            found++;
            totalSize += val.length;
            } catch(e) {
            console.log(`  ⚠️ ${name} (${key}) — LỖI PARSE:`, e.message);
            }
        } else {
            console.log(`  ⬜ ${name} (${key}) — không có`);
        }
        });

        console.log(`\n📊 Tìm thấy ${found}/${Object.keys(KEYS).length} key — ${(totalSize/1024).toFixed(1)}KB`);

        // Kiểm tra SQLite
        if (window.DB && window.DB.ready) {
        const stats = {
            days:     window.DB.getOne('SELECT COUNT(*) as n FROM days')?.n || 0,
            sessions: window.DB.getOne('SELECT COUNT(*) as n FROM sessions')?.n || 0,
            subjects: window.DB.getOne('SELECT COUNT(*) as n FROM subjects')?.n || 0,
            todos:    window.DB.getOne('SELECT COUNT(*) as n FROM todos')?.n || 0,
            roadmaps: window.DB.getOne('SELECT COUNT(*) as n FROM roadmaps')?.n || 0,
        };
        console.log('\n%c📦 SQLite hiện tại:', 'color:#10b981;font-weight:bold');
        Object.entries(stats).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
        } else {
        console.log('\n%c⚠️ SQLite chưa sẵn sàng', 'color:#f59e0b');
        }

        return { found, totalSize };
    },

    /* ═══ 2. MIGRATE localStorage → SQLite ═══ */
    async migrate() {
        console.log('%c🚀 BẮT ĐẦU MIGRATE', 'color:#4f46e5;font-weight:bold;font-size:14px');

        // Kiểm tra SQLite
        if (!window.DB || !window.DB.ready) {
        console.error('❌ SQLite chưa sẵn sàng! Đợi 2-3s rồi thử lại.');
        console.log('💡 Gõ: setTimeout(() => Migrate.migrate(), 2000)');
        return;
        }

        // Kiểm tra có data không
        const hasData = localStorage.getItem(KEYS.DAYS) 
        || localStorage.getItem(KEYS.TODOS)
        || localStorage.getItem(KEYS.SUBJECTS);
        if (!hasData) {
        console.warn('⚠️ localStorage không có dữ liệu để migrate');
        return;
        }

        // Backup trước
        console.log('💾 Tạo backup trước khi migrate...');
        this.exportBackup();

        const stats = { days: 0, sessions: 0, subjects: 0, todos: 0, roadmaps: 0, meta: 0 };
        const parse = (key, fb) => {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fb;
        } catch(e) { return fb; }
        };

        // ─── DAYS + SESSIONS ───
        const days = parse(KEYS.DAYS, {});
        Object.keys(days).forEach(date => {
        const d = days[date] || {};
        const goals = Array.isArray(d.goals) ? d.goals : [];
        const slots = Array.isArray(d.slots) ? d.slots : [];
        const work  = (d.work && typeof d.work === 'object') ? d.work : {};

        try {
            window.DB.run(
            `INSERT OR REPLACE INTO days 
            (date, minutes, notes, subject, frozen, goals_json, slots_json, work_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                date,
                d.minutes || 0,
                d.notes || '',
                d.subject || '',
                d.frozen ? 1 : 0,
                JSON.stringify(goals),
                JSON.stringify(slots),
                JSON.stringify(work),
                new Date().toISOString(),
            ]
            );
            stats.days++;
        } catch(e) { console.warn('Lỗi insert day:', date, e.message); }

        // Sessions
        (d.sessions || []).forEach((s, idx) => {
            const sid = s.id || ('s_' + date + '_' + idx + '_' + (s.at || Date.now()));
            try {
            window.DB.run(
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
            } catch(e) { console.warn('Lỗi insert session:', e.message); }
        });
        });

        // ─── SUBJECTS ───
        const subjects = parse(KEYS.SUBJECTS, []);
        if (Array.isArray(subjects)) {
        try { window.DB.run('DELETE FROM subjects'); } catch(e) {}
        subjects.forEach(s => {
            try {
            window.DB.run(
                `INSERT OR REPLACE INTO subjects (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
                [
                s.id || ('sub_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)),
                s.name,
                s.color || '#4f46e5',
                s.createdAt || new Date().toISOString(),
                ]
            );
            stats.subjects++;
            } catch(e) {}
        });
        }

        // ─── TODOS ───
        const todos = parse(KEYS.TODOS, []);
        if (Array.isArray(todos)) {
        try { window.DB.run('DELETE FROM todos'); } catch(e) {}
        todos.forEach(t => {
            try {
            window.DB.run(
                `INSERT OR REPLACE INTO todos 
                (id, title, desc_text, deadline, priority, tag, done, created_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                t.id || ('td_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)),
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
            } catch(e) {}
        });
        }

        // ─── ROADMAPS ───
        // ✅ FIX: Thêm completed_dates_json để không mất lịch sử ngày hoàn thành
        const roadmaps = parse(KEYS.ROADMAP, []);
        if (Array.isArray(roadmaps)) {
        try { window.DB.run('DELETE FROM roadmaps'); } catch(e) {}
        roadmaps.forEach(r => {
            try {
            window.DB.run(
                `INSERT OR REPLACE INTO roadmaps 
                (id, title, total_sessions, completed_sessions, completed_dates_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                r.id || ('r_' + Date.now()),
                r.title,
                r.totalSessions || 1,
                r.completedSessions || 0,
                JSON.stringify(Array.isArray(r.completedDates) ? r.completedDates : []),
                r.createdAt || new Date().toISOString(),
                ]
            );
            stats.roadmaps++;
            } catch(e) {}
        });
        }

        // ─── META: profile, theme, bg, freeze, notif, onboard, backup ───
        const metaItems = {
        profile: parse(KEYS.PROFILE, null),
        theme:   parse(KEYS.THEME, null),
        bg:      parse(KEYS.BG, null),
        freeze:  parse(KEYS.FREEZE, null),
        notif:   parse(KEYS.NOTIF, null),
        onboard: parse(KEYS.ONBOARD, null),
        backup:  parse(KEYS.BACKUP, null),
        };
        Object.entries(metaItems).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
            try {
            window.DB.setMeta(k, v);
            stats.meta++;
            } catch(e) {}
        }
        });

        // Lưu DB xuống IndexedDB
        await window.DB.saveNow();

        // Log kết quả
        console.log('%c\n✅ MIGRATE HOÀN TẤT', 'color:#10b981;font-weight:bold;font-size:14px');
        console.log('  📅 Days:      ', stats.days);
        console.log('  📖 Sessions:  ', stats.sessions);
        console.log('  📚 Subjects:  ', stats.subjects);
        console.log('  📝 Todos:     ', stats.todos);
        console.log('  🗺️  Roadmaps:  ', stats.roadmaps);
        console.log('  ⚙️  Meta:      ', stats.meta);
        console.log('');
        console.log('%c💡 Bước tiếp:', 'color:#4f46e5;font-weight:bold');
        console.log('   1. F5 reload trang');
        console.log('   2. Kiểm tra dữ liệu đã hiển thị đúng chưa');
        console.log('   3. Nếu OK → gõ: Migrate.clear() để xóa localStorage cũ');

        return stats;
    },

    /* ═══ 3. EXPORT BACKUP JSON ═══ */
    exportBackup() {
        const data = {
        exportedAt: new Date().toISOString(),
        version: 5,
        profile: JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null'),
        days:    JSON.parse(localStorage.getItem(KEYS.DAYS) || '{}'),
        roadmap: JSON.parse(localStorage.getItem(KEYS.ROADMAP) || '[]'),
        todos:   JSON.parse(localStorage.getItem(KEYS.TODOS) || '[]'),
        subjects: JSON.parse(localStorage.getItem(KEYS.SUBJECTS) || '[]'),
        theme:   JSON.parse(localStorage.getItem(KEYS.THEME) || 'null'),
        bg:      JSON.parse(localStorage.getItem(KEYS.BG) || 'null'),
        freeze:  JSON.parse(localStorage.getItem(KEYS.FREEZE) || 'null'),
        notif:   JSON.parse(localStorage.getItem(KEYS.NOTIF) || 'null'),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'backup-truoc-migrate-' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
        console.log('✅ Đã tải file backup JSON');
    },

    /* ═══ 4. XÓA localStorage sau khi migrate xong ═══ */
    clear() {
        console.log('%c🗑 XÓA localStorage', 'color:#ef4444;font-weight:bold;font-size:14px');
        console.log('Backup đã có chưa? Nếu chưa → Ctrl+C ngay và gõ: Migrate.exportBackup()');

        const confirm = window.confirm(
        'Xóa toàn bộ dữ liệu cũ trong localStorage?\n\n' +
        '⚠️ Sau khi xóa sẽ KHÔNG khôi phục được (trừ khi có backup JSON).\n\n' +
        'Chỉ xóa khi:\n' +
        '  ✅ Đã migrate sang SQLite thành công\n' +
        '  ✅ Đã reload trang và thấy dữ liệu đúng\n' +
        '  ✅ Đã có backup JSON'
        );
        if (!confirm) { console.log('❌ Hủy'); return; }

        let count = 0;
        Object.values(KEYS).forEach(k => {
        if (localStorage.getItem(k)) {
            localStorage.removeItem(k);
            count++;
        }
        });
        console.log(`✅ Đã xóa ${count} key`);
        console.log('F5 để áp dụng');
    },

    /* ═══ 5. KIỂM TRA SQLite sau migrate ═══ */
    verify() {
        if (!window.DB || !window.DB.ready) {
        console.error('❌ SQLite chưa sẵn sàng');
        return;
        }
        console.log('%c🔍 KIỂM TRA SQLite', 'color:#4f46e5;font-weight:bold;font-size:14px');

        const tables = ['days', 'sessions', 'subjects', 'todos', 'roadmaps', 'meta'];
        tables.forEach(t => {
        try {
            const n = window.DB.getOne(`SELECT COUNT(*) as n FROM ${t}`)?.n || 0;
            console.log(`  ${t}: ${n} rows`);
        } catch(e) {
            console.log(`  ${t}: LỖI`, e.message);
        }
        });

        // Sample data
        console.log('\n📋 3 Todos mẫu:');
        window.DB.query('SELECT id, title, tag, done FROM todos LIMIT 3').forEach(t => {
        console.log(`  - [${t.done ? 'x' : ' '}] ${t.title} (${t.tag})`);
        });
    },

    /* ═══ 6. TỰ ĐỘNG MIGRATE NẾU CẦN ═══ */
    async auto() {
        // Đợi SQLite sẵn sàng
        if (!window.DB || !window.DB.ready) {
        await new Promise(r => setTimeout(r, 2000));
        }
        if (!window.DB || !window.DB.ready) {
        console.log('⏳ SQLite chưa sẵn sàng — bỏ qua auto-migrate');
        return;
        }

        // Kiểm tra
        const hasLS = localStorage.getItem(KEYS.DAYS) || localStorage.getItem(KEYS.TODOS);
        const hasDB = (window.DB.getOne('SELECT COUNT(*) as n FROM days')?.n || 0) > 0 
                    || (window.DB.getOne('SELECT COUNT(*) as n FROM todos')?.n || 0) > 0;

        if (hasLS && !hasDB) {
        console.log('%c🔄 Phát hiện localStorage có data, SQLite trống — auto-migrate...', 'color:#f59e0b;font-weight:bold');
        await this.migrate();
        } else if (hasLS && hasDB) {
        console.log('%cℹ️ Cả 2 đều có data — KHÔNG auto-migrate (tránh ghi đè)', 'color:#64748b');
        console.log('   Muốn migrate thủ công → gõ: Migrate.migrate()');
        } else if (!hasLS && hasDB) {
        console.log('%c✅ SQLite đã có data — không cần migrate', 'color:#10b981');
        } else {
        console.log('%cℹ️ Cả 2 trống — bắt đầu mới', 'color:#64748b');
        }
    },
    };

    // Expose global
    window.Migrate = Migrate;

    // Tự chạy check khi load
    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
        console.log('%c💡 Migrate.js đã sẵn sàng', 'color:#4f46e5;font-weight:bold');
        console.log('   Migrate.check()        → xem có gì trong localStorage');
        console.log('   Migrate.migrate()      → chuyển sang SQLite');
        console.log('   Migrate.verify()       → kiểm tra SQLite sau migrate');
        console.log('   Migrate.exportBackup() → tải backup JSON');
        console.log('   Migrate.clear()        → xóa localStorage (sau khi migrate OK)');
        console.log('   Migrate.auto()         → tự động migrate nếu cần');
        }, 1500);
    });
    } else {
    setTimeout(() => {
        console.log('%c💡 Migrate.js đã sẵn sàng', 'color:#4f46e5;font-weight:bold');
        console.log('   Migrate.check() / migrate() / verify() / exportBackup() / clear() / auto()');
    }, 1500);
    }

    })();