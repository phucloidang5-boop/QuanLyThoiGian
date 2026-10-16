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
    // Nhóm 7: Định nghĩa rõ ràng ngày "có học" = >= 5 phút
        MIN_MINUTES_PER_DAY: 5,

        dayHasActivity(d) {
            if (!d) return false;
            // Ưu tiên: nếu có đủ phút học → tính là ngày học
            const mins = d.minutes || 0;
            if (mins >= this.MIN_MINUTES_PER_DAY) return true;

            // Nếu chưa đủ 5 phút nhưng có session thật → cộng dồn lại
            if (d.sessions && d.sessions.length > 0) {
            const total = d.sessions.reduce((s, x) => s + (x.minutes || 0), 0);
            if (total >= this.MIN_MINUTES_PER_DAY) return true;
            }

            // Nếu dùng Streak Freeze → tính là ngày học
            if (d.frozen) return true;

            // Các trường hợp khác (chỉ có slot/note nhưng không có phút) → KHÔNG tính
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
        // Nhóm 7: streak = đếm ngược từ hôm nay (hoặc hôm qua) trở về
        // Điều kiện: ngày có học (>= 5 phút) hoặc dùng Streak Freeze
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
                // Hôm nay chưa học → vẫn cho phép tính tiếp từ hôm qua
                d.setDate(d.getDate() - 1);
                first = false;
            } else {
                break;
            }
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
        // Nhóm 5: cập nhật label trong Quản lý (không còn segment)
        const label = $('#currentThemeLabel');
        if (label) {
            const map = { light: '☀️ Sáng', dark: '🌙 Tối', auto: '💻 Tự động' };
            label.textContent = map[State.theme] || '☀️ Sáng';
        }
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
        $('#bgFile').addEventListener('change', async e => {
        const f = e.target.files[0];
        if (!f) return;

        // Nhóm 10: nén ảnh nền (≤ 1920px)
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

            $('#avatarFile').addEventListener('change', async e => {
            const f = e.target.files[0];
            if (!f) return;

            // Nhóm 10: nén ảnh avatar (≤ 400px)
            const loading = toast('⏳ Đang xử lý ảnh...');
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

    // Nhóm 10: ghi nhớ ngày backup
    if (typeof DataManager !== 'undefined') {
        DataManager.setLastBackupDate();
        DataManager.renderBackupStatus();
        }
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
            applyDateLimits() {
        const today = State.today;

        // Các input chặn ngày tương lai
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

            // Riêng deadline Todo: chỉ chặn quá khứ, cho phép tương lai
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
    const greetEl = $('#heroGreeting');
    if (greetEl) greetEl.textContent = `${g}${name} 👋`;

    const d = new Date();
    const dateEl = $('#heroDate');
    if (dateEl) {
      dateEl.textContent = `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth()+1}, ${d.getFullYear()}`;
    }

    // Nhóm 12: hint theo tình huống
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

        // Nhóm 4: chặn ngày tương lai
        Guards.applyDateLimits();

        $('#studyAddBtn').addEventListener('click', () => {
            const k = $('#studyDateInput').value || State.today;
            if (k > State.today) {
            toast('⚠️ Không thể ghi vào ngày tương lai');
            return;
            }
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
        if (typeof SessionManager !== 'undefined') SessionManager.render();
        },

    renderSummary() {
        // Nhóm 5: thông tin riêng của tab Học tập (không trùng Home/Navbar)

        // 1. Phiên hôm nay
        const todaySessions = (State.days[State.today]?.sessions || []).length;
        const el1 = $('#studyTodaySessions');
        if (el1) el1.textContent = todaySessions;

        // 2. Môn nhiều nhất tuần
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

        // 3. Tập trung TB (từ các phiên có đánh giá sao)
        let focusSum = 0, focusCount = 0;
        Object.keys(State.days).forEach(k => {
            (State.days[k].sessions || []).forEach(s => {
            if (s.focus > 0) { focusSum += s.focus; focusCount++; }
            });
        });

        const el3 = $('#studyFocusAvg');
        if (el3) {
            if (focusCount === 0) {
            el3.textContent = '—';
            } else {
            const avg = (focusSum / focusCount).toFixed(1);
            el3.textContent = avg + '★';
            }
        }
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
        // Nhóm 5: thông tin riêng của tab Lịch

        // 1. Tháng này (giữ)
        const monthEl = $('#calMonthHours');
        if (monthEl) {
            monthEl.textContent = fmtMinutes(Stats.monthTotal(State.viewYear, State.viewMonth));
        }

        // 2. Ngày có lịch trong tháng đang xem
        let activeDays = 0;
        Object.keys(State.days).forEach(k => {
            const [y, m] = k.split('-').map(Number);
            if (y === State.viewYear && m === State.viewMonth + 1) {
            if (Stats.dayHasActivity(State.days[k])) activeDays++;
            }
        });
        const daysEl = $('#calActiveDays');
        if (daysEl) daysEl.textContent = activeDays;

        // 3. Deadline sắp tới (trong 7 ngày)
        let upcoming = 0;
        if (typeof TodoManager !== 'undefined') {
            upcoming = TodoManager.countSoon(7).length;
        }
        const upEl = $('#calUpcoming');
        if (upEl) upEl.textContent = upcoming;
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

        // ═══ PHÂN LỚP: KẾ HOẠCH vs THỰC TẾ ═══
            const chips = document.createElement('div');
            chips.className = 'chips';

        // 1. Kế hoạch = slots (khung giờ dự định)
            const planSlots = (data && data.slots) ? data.slots : [];
        // 2. Thực tế = sessions (phiên đã học) + minutes
            const actualSessions = (data && data.sessions) ? data.sessions : [];
            const actualMinutes = (data && data.minutes) || 0;

        // Chip KẾ HOẠCH (nếu có khung giờ)
            if (planSlots.length > 0) {
            chips.insertAdjacentHTML('beforeend',
                `<div class="chip plan" title="${planSlots.length} khung giờ dự định">📅 ${planSlots.length} KH</div>`);
            }

        // Chip THỰC TẾ (nếu có phút học)
            if (actualMinutes > 0) {
            chips.insertAdjacentHTML('beforeend',
                `<div class="chip actual" title="${actualMinutes} phút đã học">✅ ${fmtMinutes(actualMinutes)}</div>`);
            }

        // 3. Deadline Todo
            if (typeof TodoManager !== 'undefined') {
            const todos = TodoManager.todos.filter(t => t.deadline === k && !t.done);
            if (todos.length > 0) {
                const isSoon = k >= State.today;
                todos.slice(0, 2).forEach(t => {
                const safeTitle = escapeHtml(t.title).slice(0, 40);
                chips.insertAdjacentHTML('beforeend',
                    `<div class="chip deadline ${isSoon ? '' : 'overdue'}" data-todo-id="${t.id}" title="⏰ ${safeTitle}">⏰ ${safeTitle.slice(0, 12)}${safeTitle.length > 12 ? '…' : ''}</div>`);
                });
                if (todos.length > 2) {
                chips.insertAdjacentHTML('beforeend',
                    `<div class="chip deadline" title="${todos.length - 2} deadline khác">+${todos.length - 2}</div>`);
                }
            }
            }

            if (chips.children.length > 0) {
            cell.appendChild(chips);
            }

        // Nếu vừa có kế hoạch vừa có thực tế → đánh dấu
            if (planSlots.length > 0 && actualMinutes > 0) {
            cell.classList.add('has-both');
            }

            frag.appendChild(cell);
        }
        grid.appendChild(frag);

        // Bind click cho chip deadline
        grid.querySelectorAll('.chip.deadline[data-todo-id]').forEach(chip => {
            chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = chip.dataset.todoId;
            if (typeof TodoManager !== 'undefined') {
                TodoManager.openModal(id);
            }
            });
        });
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

        // Lấy môn học (Nhóm 1)
        const subjectSel = $('#modalSubject');
        const subject = subjectSel ? subjectSel.value : '';

        const list = $('#hourList');
        const slots = [];
        list.querySelectorAll('input[type="text"]').forEach(txt => {
            const val = txt.value.trim();
            if (val) slots.push({ hour: +txt.dataset.h, text: val, done: true });
        });

        const dayData = Storage.ensureDay(k);
        dayData.minutes = mins;
        dayData.slots = slots.sort((a, b) => a.hour - b.hour);

        // Lưu môn vào ngày
        if (subject) dayData.subject = subject;

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

    // Nhóm 11: cập nhật aria-label cho nút mới render
    if (typeof A11y !== 'undefined') {
        setTimeout(() => A11y.autoLabelAll(), 100);
        }
    },
    };
    /* ─── 14. POMODORO (Nâng cao — Nhóm 2) ─── */
    const Pomodoro = {
        modes: {
        pomodoro: { min: 25, label: 'Pomodoro · Tập trung', kind: 'work' },
        short:    { min: 5,  label: 'Nghỉ ngắn',           kind: 'break' },
        long:     { min: 15, label: 'Nghỉ dài',            kind: 'break' },
        custom:   { min: 30, label: 'Tuỳ chỉnh',           kind: 'work' },
        },
        state: {
        mode: 'pomodoro',
        remaining: 25 * 60,
        running: false,
        paused: false,
        endAt: 0,
        id: null,
        sessionStartAt: 0,
    },
    selectedTag: null,
    selectedStar: 0,

    STORAGE_KEY: 'st_pomodoro_state_v1',

    init() {
        $$('#pomodoroModes .pmode').forEach(btn => {
        btn.addEventListener('click', () => {
            if (this.state.running) { toast('⏸ Dừng hoặc hoàn thành trước khi đổi chế độ'); return; }
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

        this.initStarRating();

        // Vẽ tag picker (từ SubjectManager)
        if (typeof SubjectManager !== 'undefined') {
        SubjectManager.renderTagPicker();
        }

        // Khôi phục state
        this.restore();

        // Cảnh báo đóng tab
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

    initStarRating() {
        const box = $('#starRating');
        if (!box) return;
        this.selectedStar = 0;
        box.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const star = +b.dataset.star;
            // Click lại sao đang chọn → bỏ chọn
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
    },

    fmt(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    },

    start() {
        if (this.state.running) return;

        if (this.state.paused) {
        // Resume
        this.state.paused = false;
        this.state.running = true;
        this.state.endAt = Date.now() + this.state.remaining * 1000;
        if (!this.state.sessionStartAt) this.state.sessionStartAt = Date.now();
        } else {
        // Bắt đầu mới
        this.state.running = true;
        this.state.paused = false;
        this.state.endAt = Date.now() + this.state.remaining * 1000;
        this.state.sessionStartAt = Date.now();
        }

        this.startTick();
        this.renderButtons();
        this.render();
        this.saveState();

        const card = $('.pomodoro-card');
        card.classList.toggle('running', this.modes[this.state.mode].kind === 'work');
        card.classList.toggle('break', this.modes[this.state.mode].kind === 'break');
        card.classList.remove('paused');
        this.renderFullscreenButtons();
    },

    pause() {
        if (!this.state.running) return;
        this.state.running = false;
        this.state.paused = true;
        if (this.state.id) { clearInterval(this.state.id); this.state.id = null; }

        // Lưu remaining hiện tại
        const remain = Math.max(0, Math.round((this.state.endAt - Date.now()) / 1000));
        this.state.remaining = remain;

        const card = $('.pomodoro-card');
        card.classList.remove('running', 'break');
        card.classList.add('paused');

        this.renderButtons();
        this.saveState();
        this.renderFullscreenButtons();
        toast('⏸ Đã tạm dừng');
    },

    startTick() {
        if (this.state.id) clearInterval(this.state.id);
        this.state.id = setInterval(() => {
        const remain = Math.max(0, Math.round((this.state.endAt - Date.now()) / 1000));
        this.state.remaining = remain;
        this.render();
        if (remain <= 0) this.finish();
        }, 250);
    },

    reset() {
        if (this.state.running || this.state.paused) {
        if (!confirm('Đang có phiên. Reset sẽ hủy phiên hiện tại. Tiếp tục?')) return;
        }
        if (this.state.id) { clearInterval(this.state.id); this.state.id = null; }
        this.state.running = false;
        this.state.paused = false;
        this.state.endAt = 0;
        this.state.sessionStartAt = 0;
        this.setDuration(this.modes[this.state.mode].min);
        $('.pomodoro-card').classList.remove('running', 'break', 'paused');
        this.renderButtons();
        this.clearSavedState();
        this.renderFullscreenButtons();
    },

    stopAndSave() {
        if (!this.state.running && !this.state.paused) return;

        const fullSec = this.modes[this.state.mode].min * 60;
        const elapsed = Math.round((fullSec - this.state.remaining) / 60);

        if (elapsed <= 0) {
        toast('ℹ️ Chưa học phút nào');
        this.reset();
        return;
        }
        if (!confirm(`Dừng và lưu ${elapsed} phút đã học?`)) return;

        this.saveWorkSession(elapsed);
        this.reset();
    },

    saveWorkSession(mins) {
        if (this.modes[this.state.mode].kind !== 'work') return;

        const today = State.today;
        const day = Storage.ensureDay(today);
        day.minutes = (day.minutes || 0) + mins;
        day.sessions = day.sessions || [];

        const tagName = this.selectedTag || 'Khác';
        const tagColor = (typeof SubjectManager !== 'undefined')
        ? SubjectManager.getColor(tagName) : '#64748b';

        day.sessions.push({
        at: new Date().toISOString(),
        minutes: mins,
        tag: tagName,
        tagColor: tagColor,
        focus: this.selectedStar || 0,
        text: `Pomodoro ${mins}p${tagName ? ' · ' + tagName : ''}`,
        source: 'pomodoro',
        });

        Storage.saveDays();

        // Reset sao
        this.selectedStar = 0;
        $$('#starRating button').forEach(x => { x.textContent = '☆'; x.classList.remove('active'); });

        Home.render();
        Study.render();
        Calendar.render();
        Modules.refreshHeader();
    },

    finish() {
        if (this.state.id) { clearInterval(this.state.id); this.state.id = null; }

        const mode = this.modes[this.state.mode];
        const fullMin = mode.min;

        this.state.running = false;
        this.state.paused = false;
        $('.pomodoro-card').classList.remove('running', 'break', 'paused');

        // Âm thanh + thông báo
        this.playAlarm();

        if (mode.kind === 'work') {
        this.saveWorkSession(fullMin);
        toast(`✅ Hoàn thành Pomodoro ${fullMin}p!`);

        if (typeof NotifManager !== 'undefined' && NotifManager.send) {
            NotifManager.send(
            '🍅 Hết giờ Pomodoro!',
            `Bạn đã học ${fullMin} phút. Nghỉ ngắn 5 phút nhé!`,
            'success'
            );
        }

        // Tự chuyển sang nghỉ ngắn
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
            NotifManager.send(
            '☕ Hết giờ nghỉ',
            'Quay lại học thôi!',
            'info'
            );
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

    // ═══ Lưu/khôi phục trạng thái ═══
    saveState() {
        try {
        if (!this.state.running && !this.state.paused) {
            this.clearSavedState();
            return;
        }
        const data = {
            mode: this.state.mode,
            remaining: this.state.remaining,
            running: this.state.running,
            paused: this.state.paused,
            endAt: this.state.endAt,
            sessionStartAt: this.state.sessionStartAt,
            selectedTag: this.selectedTag,
            selectedStar: this.selectedStar,
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    },

    clearSavedState() {
        try { localStorage.removeItem(this.STORAGE_KEY); } catch (e) {}
    },

    restore() {
        try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (!d) return;

        // Khôi phục mode
        if (d.mode) {
            this.state.mode = d.mode;
            $$('#pomodoroModes .pmode').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === d.mode);
            });
        }

        // Khôi phục tag
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
                }
            }
            }
        }

        // Khôi phục star
        if (typeof d.selectedStar === 'number') {
            this.selectedStar = d.selectedStar;
            $$('#starRating button').forEach(x => {
            const active = +x.dataset.star <= d.selectedStar;
            x.classList.toggle('active', active);
            x.textContent = active ? '★' : '☆';
            });
        }

        // Đang chạy → tính lại từ endAt
        if (d.running && d.endAt) {
            const remain = Math.max(0, Math.round((d.endAt - Date.now()) / 1000));
            if (remain <= 0) {
            // Hết giờ khi tab đóng → không auto lưu
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
            card.classList.toggle('running', this.modes[this.state.mode].kind === 'work');
            card.classList.toggle('break', this.modes[this.state.mode].kind === 'break');

            toast('▶ Đã khôi phục phiên đang chạy');
            }
        } else if (d.paused) {
            this.state.remaining = d.remaining || this.modes[this.state.mode].min * 60;
            this.state.running = false;
            this.state.paused = true;
            this.state.endAt = 0;
            $('.pomodoro-card').classList.add('paused');
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

    // Nhóm 11: tự cuộn đến hôm nay
    if (typeof HeatmapScroll !== 'undefined') {
        setTimeout(() => HeatmapScroll.scrollToToday(), 100);
        }
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

            // Tuần này / tuần trước
            let weekThis = 0, weekPrev = 0;
            Object.keys(State.days).forEach(k => {
            const d = parseKey(k);
            const mins = State.days[k].minutes || 0;
            if (d >= mondayThis && d <= now) weekThis += mins;
            if (d >= mondayPrev && d <= sundayPrev) weekPrev += mins;
            });

            const weekEl = $('#statsWeek');
            if (weekEl) {
            weekEl.textContent = weekThis > 0 ? fmtMinutes(weekThis) : 'Chưa có';
            }

            // Tháng này
            let month = 0;
            Object.keys(State.days).forEach(k => {
            const d = parseKey(k);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                month += State.days[k].minutes || 0;
            }
            });
            const monthEl = $('#statsMonth');
            if (monthEl) {
            monthEl.textContent = month > 0 ? fmtMinutes(month) : 'Chưa có';
            }

            // Trend
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

            // ═══ Nhóm 7: Chỉ số phụ ═══
            this.renderMetaStats();

            this.renderChart14();
            this.renderPie();
            this.renderHourBars();

            if (typeof TodoManager !== 'undefined') {
            TodoManager.renderStats7Days();
            }
        },

        // Tính các chỉ số phụ rõ ràng
        renderMetaStats() {
            const allKeys = Object.keys(State.days);
            let totalMin = 0;
            let activeDays = 0;
            let firstKey = null;

            allKeys.forEach(k => {
            const day = State.days[k];
            if (!Stats.dayHasActivity(day)) return;
            activeDays++;
            totalMin += day.minutes || 0;
            if (!firstKey || k < firstKey) firstKey = k;
            });

            // 1. Tổng thời gian
            const totalEl = $('#statsTotalTime');
            if (totalEl) {
            if (totalMin === 0) {
                totalEl.textContent = 'Chưa có';
                totalEl.classList.add('empty');
            } else {
                totalEl.textContent = fmtMinutes(totalMin);
                totalEl.classList.remove('empty');
            }
            }

            // 2. Ngày có học
            const activeEl = $('#statsActiveDays');
            if (activeEl) {
            activeEl.textContent = activeDays;
            }

            // 3. TB / ngày có học
            const avgActiveEl = $('#statsAvgPerActive');
            if (avgActiveEl) {
            if (activeDays === 0) {
                avgActiveEl.textContent = 'Chưa đủ dữ liệu';
                avgActiveEl.classList.add('empty');
            } else {
                avgActiveEl.textContent = Math.round(totalMin / activeDays) + ' phút';
                avgActiveEl.classList.remove('empty');
            }
            }

            // 4. TB / ngày kể từ khi bắt đầu
            const avgDayEl = $('#statsAvgPerDay');
            if (avgDayEl) {
            if (!firstKey) {
                avgDayEl.textContent = 'Chưa đủ dữ liệu';
                avgDayEl.classList.add('empty');
            } else {
                const first = parseKey(firstKey);
                const today = parseKey(State.today);
                const diffDays = Math.round((today - first) / 86400000) + 1;
                const avg = Math.round(totalMin / diffDays);
                avgDayEl.textContent = avg + ' phút/ngày';
                avgDayEl.classList.remove('empty');
            }
            }

            // 5. Streak
            const streakEl = $('#statsStreakVal');
            if (streakEl) {
            const s = Stats.calcStreak();
            streakEl.textContent = s + ' ngày';
            }

            // 6. Ngày đạt mục tiêu
            const goalEl = $('#statsGoalDays');
            if (goalEl) {
            const goal = State.profile.dailyGoal || 0;
            if (goal === 0) {
                goalEl.textContent = 'Chưa đặt mục tiêu';
                goalEl.classList.add('empty');
            } else {
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

            // Nhóm 7: CHỈ tính từ phiên học thật (session.at), KHÔNG dùng slots
            // Mỗi phiên phân bổ phút vào giờ bắt đầu của nó
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
            box.innerHTML = `
                <div class="empty-state">
                <span class="es-icon">🕐</span>
                <div class="es-title">Chưa đủ dữ liệu</div>
                <div class="es-desc">Cần ít nhất 1 phiên học (Pomodoro hoặc ghi tay) để phân tích khung giờ hiệu quả.</div>
                </div>`;
            return;
            }

            const maxMin = Math.max(...hourMin, 1);
            const total = hourMin.reduce((a, b) => a + b, 0);

            const activeHours = hourMin.map((v, h) => ({ h, v })).filter(x => x.v > 0);
            // Sắp xếp giờ có nhiều phút nhất lên đầu
            activeHours.sort((a, b) => b.v - a.v);

            const frag = document.createDocumentFragment();
            activeHours.slice(0, 10).forEach(({ h, v }) => {
            const pct = (v / maxMin) * 100;
            const pctOfTotal = total > 0 ? Math.round((v / total) * 100) : 0;
            const row = document.createElement('div');
            row.className = 'hour-bar-row';
            row.innerHTML = `
                <div class="hour-bar-label">${String(h).padStart(2,'0')}:00</div>
                <div class="hour-bar-track">
                <div class="hour-bar-fill" style="width:${pct}%"></div>
                </div>
                <div class="hour-bar-val" data-pct="${pctOfTotal}% tổng">${v}p</div>
            `;
            frag.appendChild(row);
            });
            box.appendChild(frag);

            // Chú thích dưới
            const note = document.createElement('p');
            note.style.cssText = 'font-size:11px;color:var(--text-mute);margin-top:12px;text-align:center;font-style:italic';
            note.textContent = `Dựa trên ${sessionCount} phiên · Tổng ${fmtMinutes(total)}`;
            box.appendChild(note);
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
    push(msg, fn, duration = 6000) {
        this.stack.push(fn);
        const msgEl = $('#undoMsg');
        const toastEl = $('#undoToast');
        if (msgEl) msgEl.textContent = msg;
        if (toastEl) toastEl.classList.add('show');

        // Cập nhật số giây còn lại
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
        // Nhóm 6: hiện nút Xóa khi sửa
            const delBtn = $('#todoDelete');
            if (delBtn) {
                delBtn.style.display = 'inline-flex';
                // Bind 1 lần duy nhất
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
            title.textContent = 'Thêm việc cần làm';
        // Ẩn nút Xóa khi thêm mới
            const delBtn = $('#todoDelete');
            if (delBtn) delBtn.style.display = 'none';
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
            // ═══ GUARD 1: Tên không trống ═══
            const titleRaw = $('#todoTitle').value;
            const title = titleRaw.trim();
            if (!title) {
            toast('⚠️ Nhập tên việc');
            $('#todoTitle').focus();
            return;
        }
            if (title.length > 200) {
            toast('⚠️ Tên quá dài (tối đa 200 ký tự)');
            return;
            }

            // ═══ GUARD 2: Deadline không được quá khứ ═══
            const deadline = $('#todoDeadline').value || '';
            if (deadline) {
            const dlDate = parseKey(deadline);
            const todayDate = parseKey(State.today);
            if (dlDate < todayDate) {
                toast('⚠️ Deadline không thể là ngày trong quá khứ');
                $('#todoDeadline').focus();
                return;
            }
        }

        const data = {
            title: title,
            desc: $('#todoDesc').value.trim(),
            deadline: deadline,
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

        // Nhóm 6: đồng bộ Study + Home nếu có deadline thay đổi
        if (typeof Study !== 'undefined') Study.render();
        if (typeof Home !== 'undefined') Home.render();
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

        // Nhóm 6: dùng real-time date, tính theo mốc nửa đêm
        const now = new Date();
        const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dl = parseKey(todo.deadline);
        const dlMid = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
        const diffDays = Math.round((dlMid - todayMid) / 86400000);

        if (diffDays < 0) return { cls: 'overdue', text: `⚠️ Quá hạn ${Math.abs(diffDays)} ngày` };
        if (diffDays === 0) return { cls: 'today', text: `🔥 Hôm nay` };
        if (diffDays === 1) return { cls: 'soon', text: `⏰ Còn 1 ngày` };
        if (diffDays <= 3) return { cls: 'soon', text: `⏰ Còn ${diffDays} ngày` };
        if (diffDays <= 7) return { cls: '', text: `📅 Còn ${diffDays} ngày` };
        return { cls: '', text: `📅 ${todo.deadline}` };
    },

        filteredTodos() {
            // Nhóm 6: lấy today real-time (tránh stale state khi qua nửa đêm)
            const now = new Date();
            const today = dateKey(now);

            return this.todos.filter(t => {
            if (this.filter === 'pending') return !t.done;
            if (this.filter === 'done') return t.done;

            if (this.filter === 'today') {
                if (t.done) return false;
                if (!t.deadline) return false;
                // Hôm nay = deadline đúng hôm nay hoặc đã quá hạn
                return t.deadline <= today;
            }

            if (this.filter === 'overdue') {
                if (t.done) return false;
                if (!t.deadline) return false;
                // Quá hạn = deadline < hôm nay (strict)
                return t.deadline < today;
            }

            return true;
            });
        },
    // Nhóm 6: tự làm mới khi qua nửa đêm
    _midnightTimer: null,
    syncMidnight() {
        if (this._midnightTimer) clearTimeout(this._midnightTimer);

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
        const delay = tomorrow - now;

        this._midnightTimer = setTimeout(() => {
        // Reset today
            State.today = dateKey(new Date());
            // Re-render mọi thứ
            Home.render();
            Study.render();
            Calendar.render();
            if (typeof StatsPage !== 'undefined' && Router.current === 'stats') StatsPage.render();
            Modules.refreshHeader();
            toast('🌅 Ngày mới bắt đầu!');
            // Lặp lại
            this.syncMidnight();
            }, delay);
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
    /* ═══════════════════════════════════════════════════════════
    21. STREAK FREEZE (Nhóm 8 — Nâng cao)
    • Nạp 1 lượt mỗi thứ Hai (max 3)
    • Xử lý múi giờ local (không dùng UTC)
    • Tự check khi mở app, không phụ thuộc 23:59
    • Auto-freeze cho ngày đã bỏ lỡ
    ═══════════════════════════════════════════════════════════ */
    const StreakFreeze = {
    max: 3,
    freezes: 3,
    history: [],           // [{date, reason, type: 'use'|'refill', delta, at}]
    autoMode: false,
    alertEnabled: true,
    lastRefillWeek: '',    // 'YYYY-MM-DD' của thứ Hai tuần cuối nạp
    lastAutoCheck: '',     // ngày cuối kiểm tra auto-freeze

    init() {
        this.load();

        // 1. Nạp lượt theo tuần (kiểm tra khi mở app)
        this.checkWeeklyRefill();

        // 2. Auto-freeze cho ngày đã bỏ lỡ
        this.checkAutoFreeze();

        // 3. Bind UI
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

        // 4. Nạp lại khi tab được focus lại (VD: để máy qua đêm rồi sáng mở lại)
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
        const raw = localStorage.getItem(STORE.FREEZE);
        const d = raw ? JSON.parse(raw) : {};
        this.freezes = typeof d.freezes === 'number' ? Math.min(d.freezes, this.max) : 3;
        this.history = Array.isArray(d.history) ? d.history : [];
        this.autoMode = !!d.autoMode;
        this.alertEnabled = d.alertEnabled !== false;
        this.lastRefillWeek = d.lastRefillWeek || '';
        this.lastAutoCheck = d.lastAutoCheck || '';
        } catch (e) {
        this.freezes = 3;
        this.history = [];
        this.autoMode = false;
        this.alertEnabled = true;
        this.lastRefillWeek = '';
        this.lastAutoCheck = '';
        }
    },

    save() {
        try {
        localStorage.setItem(STORE.FREEZE, JSON.stringify({
            freezes: this.freezes,
            history: this.history.slice(0, 30), // Giới hạn 30 mục
            autoMode: this.autoMode,
            alertEnabled: this.alertEnabled,
            lastRefillWeek: this.lastRefillWeek,
            lastAutoCheck: this.lastAutoCheck,
            }));
            } catch (e) {}
        },

        // ═══ Helper: lấy thứ Hai của tuần chứa ngày d ═══
        // (Dùng local time, không dùng UTC để tránh lệch múi giờ VN)
        getMondayOf(d) {
            const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const dow = (local.getDay() + 6) % 7; // T2=0, CN=6
            local.setDate(local.getDate() - dow);
            return local;
        },

        // ═══ Nạp 1 lượt mỗi thứ Hai ═══
        checkWeeklyRefill() {
            const now = new Date();
            const thisMonday = this.getMondayOf(now);
            const weekKey = dateKey(thisMonday);

            if (this.lastRefillWeek === weekKey) return; // Đã nạp tuần này

            // Nếu lần đầu (chưa từng nạp) → chỉ ghi mốc, không cộng
            if (!this.lastRefillWeek) {
            this.lastRefillWeek = weekKey;
            this.save();
            return;
            }

            // Nếu đã sang tuần mới → nạp +1 (không vượt max)
            const oldWeekDate = parseKey(this.lastRefillWeek);
            const diffWeeks = Math.floor((thisMonday - oldWeekDate) / (7 * 86400000));

            if (diffWeeks >= 1) {
            const addAmount = Math.min(diffWeeks, this.max - this.freezes);
            if (addAmount > 0) {
                this.freezes += addAmount;
                this.history.unshift({
                date: dateKey(now),
                reason: `Nạp tuần (${addAmount} lượt)`,
                type: 'refill',
                delta: addAmount,
                at: now.toISOString(),
                });
                toast(`❄️ +${addAmount} lượt Freeze (nạp tuần)`);
            }
            this.lastRefillWeek = weekKey;
            this.save();
            this.render();
            }
        },

        // ═══ Auto-freeze: khi mở app, kiểm tra ngày đã bỏ lỡ ═══
        checkAutoFreeze() {
            if (!this.autoMode) return;

            const now = new Date();
            const today = dateKey(now);
            if (this.lastAutoCheck === today) return; // Đã check hôm nay

            // Duyệt ngược 7 ngày gần đây để tìm ngày bỏ lỡ
            let used = 0;
            for (let i = 1; i <= 7 && this.freezes > 0; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const k = dateKey(d);

            // Nếu ngày này đã có dữ liệu → không cần
            const dayData = State.days[k];
            if (dayData && Stats.dayHasActivity(dayData)) continue;

            // Nếu ngày này đã dùng freeze → bỏ qua
            if (this.isFrozen(k)) continue;

            // Nếu bỏ qua mà streak tại k > 0 → cần freeze
            // Kiểm tra: có ít nhất 1 ngày trước k trong streak không?
            const dayBefore = new Date(d);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const kB = dateKey(dayBefore);
            const dayBeforeHas = State.days[kB] && Stats.dayHasActivity(State.days[kB]);
            const dayBeforeFrozen = this.isFrozen(kB);

            // Chỉ auto-freeze nếu ngày trước đó có học (để cứu streak)
            if (!dayBeforeHas && !dayBeforeFrozen) continue;

            // Dùng 1 lượt
            this.freezes--;
            this.history.unshift({
                date: k,
                reason: `Tự động (bỏ lỡ ngày ${k})`,
                type: 'use',
                delta: -1,
                at: now.toISOString(),
            });
            used++;

            // Đánh dấu ngày đó là frozen
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

        // ═══ Dùng freeze thủ công cho hôm nay ═══
        use() {
            const k = State.today;

            if (this.freezes <= 0) {
            toast('❌ Hết lượt Freeze — tuần sau sẽ nạp thêm');
            return false;
            }
            if (this.isFrozen(k)) {
            toast('ℹ️ Hôm nay đã dùng Freeze');
            return false;
            }
            if (State.days[k] && Stats.dayHasActivity(State.days[k])) {
            toast('ℹ️ Hôm nay đã học — không cần Freeze');
            return false;
            }

            this.freezes--;
            this.history.unshift({
            date: k,
            reason: 'Dùng thủ công',
            type: 'use',
            delta: -1,
            at: new Date().toISOString(),
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

        // ═══ Cần Freeze? (chỉ khi streak >= 1 + sau 20h + chưa học hôm nay) ═══
        needsFreeze() {
            if (!this.alertEnabled) return false;
            if (this.freezes <= 0) return false;
            if (this.isFrozen(State.today)) return false;

            // Streak >= 1
            const s = Stats.calcStreak();
            if (s < 1) return false;

            // Hôm nay chưa học
            const todayData = State.days[State.today];
            if (todayData && Stats.dayHasActivity(todayData)) return false;

            // Sau 20h
            const h = new Date().getHours();
            if (h < 20) return false;

            return true;
        },

        // ═══ Render UI ═══
        render() {
            // Số lượt
            const countEl = $('#freezeCount');
            if (countEl) countEl.textContent = this.freezes;

            // Đếm ngược nạp tiếp theo
            const refillEl = $('#freezeRefill');
            if (refillEl) {
            const now = new Date();
            const thisMonday = this.getMondayOf(now);
            const nextMonday = new Date(thisMonday);
            nextMonday.setDate(nextMonday.getDate() + 7);

            const diffMs = nextMonday - now;
            const diffDays = Math.ceil(diffMs / 86400000);

            if (this.freezes >= this.max) {
                refillEl.innerHTML = '✅ Đã đầy 3 lượt';
            } else {
                refillEl.innerHTML = `⏳ Nạp lượt tiếp theo: <b>còn ${diffDays} ngày</b>`;
            }
            }

            // Alert trên Home
            const alert = $('#freezeAlert');
            if (alert) {
            if (this.needsFreeze()) alert.removeAttribute('hidden');
            else alert.setAttribute('hidden', '');
            }

            // History
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

    /* ═══════════════════════════════════════════════════════════
    22. NOTIFICATION MANAGER (GIAI ĐOẠN 2)
    ═══════════════════════════════════════════════════════════ */
    /* ═══════════════════════════════════════════════════════════
    22. NOTIFICATION MANAGER (Nhóm 9 — Nâng cao)
    • Ghi chú rõ giới hạn tab-only
    • Xử lý khi user chặn quyền + hướng dẫn mở lại
    • Fallback in-app notification khi tab ẩn hoặc bị chặn
    • Nút Test để kiểm tra ngay
    ═══════════════════════════════════════════════════════════ */
    const NotifManager = {
    dailyTime: '20:00',
    deadlineNotif: true,
    sound: true,
    inAppFallback: true,
    lastNotifiedDate: '',
    timerId: null,
    pendingNotifs: [],  // Hàng đợi khi tab ẩn

    init() {
        this.load();

        // Nút xin quyền
        const permBtn = $('#notifPermBtn');
        if (permBtn) permBtn.addEventListener('click', () => this.requestPermission());

        // Nút test
        const testBtn = $('#notifTestBtn');
        if (testBtn) testBtn.addEventListener('click', () => this.test());

        // Giờ nhắc
        const timeInput = $('#notifTime');
        if (timeInput) timeInput.value = this.dailyTime;

        const saveTimeBtn = $('#saveNotifTimeBtn');
        if (saveTimeBtn) saveTimeBtn.addEventListener('click', () => {
        const v = $('#notifTime').value;
        if (!v) { toast('⚠️ Chọn giờ'); return; }
        this.dailyTime = v;
        this.save();
        toast('✅ Đã lưu giờ nhắc: ' + v);
        });

        // Toggles
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

        const inAppBox = $('#notifInApp');
        if (inAppBox) {
        inAppBox.checked = this.inAppFallback;
        inAppBox.addEventListener('change', () => {
            this.inAppFallback = inAppBox.checked;
            this.save();
        });
        }

        this.renderStatus();
        this.startChecker();

        // Khi tab được focus lại → hiện các notif đã lưu
        document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            this.flushPending();
            this.check();
        }
        });
    },

    load() {
        try {
        const raw = localStorage.getItem(STORE.NOTIF);
        const d = raw ? JSON.parse(raw) : {};
        this.dailyTime = d.dailyTime || '20:00';
        this.deadlineNotif = d.deadlineNotif !== false;
        this.sound = d.sound !== false;
        this.inAppFallback = d.inAppFallback !== false;
        this.lastNotifiedDate = d.lastNotifiedDate || '';
        // Khôi phục pending notifs chưa hiển thị
        this.pendingNotifs = Array.isArray(d.pendingNotifs) ? d.pendingNotifs : [];
        } catch (e) {
        this.pendingNotifs = [];
        }
    },

    save() {
        try {
        localStorage.setItem(STORE.NOTIF, JSON.stringify({
            dailyTime: this.dailyTime,
            deadlineNotif: this.deadlineNotif,
            sound: this.sound,
            inAppFallback: this.inAppFallback,
            lastNotifiedDate: this.lastNotifiedDate,
            pendingNotifs: this.pendingNotifs.slice(0, 10),
        }));
        } catch (e) {}
    },

    // ═══ Xin quyền ═══
    async requestPermission() {
        if (!('Notification' in window)) {
        toast('❌ Trình duyệt không hỗ trợ thông báo');
        return;
        }
        if (window.Notification.permission === 'granted') {
        toast('✅ Thông báo đã được bật');
        return;
        }
        if (window.Notification.permission === 'denied') {
        // Không thể xin lại bằng API — hướng dẫn user
        this.showHelp();
        toast('⚠️ Bạn đã chặn. Xem hướng dẫn mở lại bên dưới.');
        return;
        }
        try {
        const perm = await window.Notification.requestPermission();
        this.renderStatus();
        if (perm === 'granted') {
            toast('✅ Đã bật thông báo');
            this.send('Study Tracker', 'Thông báo đã được bật thành công! 🎉');
        } else if (perm === 'denied') {
            this.showHelp();
            toast('❌ Bạn đã từ chối. Xem hướng dẫn bên dưới.');
        }
        } catch (e) {
        toast('❌ Không thể xin quyền');
        }
    },

    // ═══ Test ═══
    test() {
        if (!('Notification' in window)) {
        toast('❌ Trình duyệt không hỗ trợ');
        return;
        }
        if (window.Notification.permission === 'granted') {
        this.send('🧪 Test thông báo', 'Nếu bạn thấy thông báo này, mọi thứ hoạt động tốt!');
        this.showInApp('🧪 Test thông báo', 'Đây là banner in-app. Nó hiện song song với thông báo hệ thống.', 'success');
        } else {
        // Fallback in-app
        this.showInApp('🧪 Test thông báo', 'Trình duyệt chưa cấp quyền. Đây là banner in-app thay thế.', 'warning');
        toast('⚠️ Chưa có quyền — đang dùng banner in-app');
        }
    },

    // ═══ Hiển thị trạng thái quyền ═══
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
        el.textContent = '✅ Đã bật — thông báo hoạt động khi tab đang mở';
        el.className = 'notif-status granted';
        if (help) help.hidden = true;
        } else if (p === 'denied') {
        el.textContent = '❌ Bạn đã chặn thông báo — dùng banner in-app thay thế';
        el.className = 'notif-status denied';
        if (help) help.hidden = false;
        } else {
        el.textContent = '🔔 Chưa bật — bấm "Xin quyền thông báo" để bật';
        el.className = 'notif-status';
        if (help) help.hidden = true;
        }
    },

    showHelp() {
        const help = $('#notifHelp');
        if (help) help.hidden = false;
    },

    // ═══ Gửi thông báo ═══
    send(title, body, type = 'info') {
        // Nếu tab đang ẩn → lưu vào pending
        if (document.hidden) {
        this.pendingNotifs.push({ title, body, type, at: Date.now() });
        this.save();
        return;
        }

        // Thử gửi system notification
        let sent = false;
        if ('Notification' in window && window.Notification.permission === 'granted') {
        try {
            const n = new window.Notification(title, {
            body: body,
            tag: 'study-' + Date.now(),
            silent: !this.sound,
            });
            sent = true;
            // Auto-close sau 8s
            setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
        } catch (e) {}
        }

        // Nếu chưa gửi được hoặc bật in-app → hiện banner
        if (!sent || this.inAppFallback) {
        this.showInApp(title, body, type);
        }

        if (this.sound) this.playSound();
    },

    // ═══ Banner in-app ═══
    showInApp(title, msg, type = 'info') {
        // Xoá banner cũ nếu có
        const old = document.querySelector('.inapp-notif');
        if (old) old.remove();

        const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        danger: '🚨',
        success: '✅',
        };

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

        // Animation
        requestAnimationFrame(() => el.classList.add('show'));

        // Đóng
        const close = () => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
        };
        el.querySelector('.in-close').addEventListener('click', close);
        setTimeout(close, 8000);
    },

    // ═══ Phát hành pending khi tab active lại ═══
    flushPending() {
        if (this.pendingNotifs.length === 0) return;
        const list = [...this.pendingNotifs];
        this.pendingNotifs = [];
        this.save();

        // Gộp nhiều thông báo thành 1 banner
        if (list.length === 1) {
        const n = list[0];
        this.showInApp(n.title, n.body, n.type);
        } else if (list.length > 1) {
        const titles = list.slice(0, 3).map(n => '• ' + n.title).join('\n');
        this.showInApp(
            `📬 ${list.length} thông báo bị lỡ`,
            titles + (list.length > 3 ? `\n...và ${list.length - 3} cái khác` : ''),
            'info'
        );
        }
    },

    // ═══ Âm thanh ═══
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

    // ═══ Checker chạy mỗi phút ═══
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
            const remain = goal - done;
            this.send(
            '📚 Đến giờ học rồi!',
            `Bạn còn thiếu ${remain} phút để đạt mục tiêu hôm nay.`,
            'info'
            );
        } else if (done === 0) {
            this.send(
            '📚 Đến giờ học rồi!',
            'Hôm nay bạn chưa học gì. Bắt đầu ngay nào!',
            'info'
            );
        }
        this.lastNotifiedDate = todayKey;
        this.save();
        }

        // 2. Nhắc deadline
        if (this.deadlineNotif) {
        const soon = TodoManager.countSoon(1);
        const overdue = TodoManager.countOverdue();
        const notifiedKey = 'notif_dl_' + todayKey;

        if (!sessionStorage.getItem(notifiedKey)) {
            if (overdue > 0) {
            this.send(
                '⚠️ Có việc quá hạn!',
                `${overdue} việc đã quá hạn. Vào trang chủ để kiểm tra.`,
                'danger'
            );
            sessionStorage.setItem(notifiedKey, '1');
            } else if (soon.length > 0) {
            const firstTodo = soon[0];
            this.send(
                '⏰ Deadline sắp đến',
                `${soon.length} việc sẽ đến hạn trong 24h. Sắp nhất: "${firstTodo.title}"`,
                'warning'
            );
            sessionStorage.setItem(notifiedKey, '1');
            }
        }
        }

        // 3. Nhắc streak sắp mất
        if (now.getHours() >= 22 && StreakFreeze.needsFreeze()) {
        const notifiedKey = 'notif_streak_' + todayKey;
        if (!sessionStorage.getItem(notifiedKey)) {
            this.send(
            '🔥 Streak sắp mất!',
            'Bạn chưa học hôm nay. Học nhanh hoặc dùng Freeze để giữ chuỗi!',
            'warning'
            );
            sessionStorage.setItem(notifiedKey, '1');
        }
        }
    },
    };

    /* ═══════════════════════════════════════════════════════════
   22B. IMAGE UTILS — Nén ảnh trước khi lưu (Nhóm 10)
═══════════════════════════════════════════════════════════ */
const ImageUtils = {
  // Nén ảnh: trả về Promise<dataURL>
  compress(file, maxDim = 800, quality = 0.85) {
    return new Promise((resolve, reject) => {
      // Chỉ nén ảnh
      if (!file.type.startsWith('image/')) {
        reject(new Error('Không phải ảnh'));
        return;
      }

      // Giới hạn dung lượng gốc: 20 MB
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error('Ảnh quá lớn (tối đa 20MB)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          // Tính kích thước mới giữ tỷ lệ
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round(height * maxDim / width);
              width = maxDim;
            } else {
              width = Math.round(width * maxDim / height);
              height = maxDim;
            }
          }

          // Vẽ lên canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Nền trắng cho ảnh PNG trong suốt (nếu cần)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Xuất JPEG (nhẹ hơn PNG)
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);

          resolve({
            dataUrl: dataUrl,
            width: width,
            height: height,
            originalSize: file.size,
            newSize: Math.round(dataUrl.length * 0.75), // Ước lượng
          });
        };
        img.onerror = () => reject(new Error('Không đọc được ảnh'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Không đọc được file'));
      reader.readAsDataURL(file);
    });
  },

  // Kiểm tra dung lượng localStorage đã dùng
  getStorageInfo() {
    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += (localStorage[key].length + key.length) * 2; // UTF-16
        }
      }
    } catch (e) {}

    const usedMB = (total / 1024 / 1024).toFixed(2);
    const limitMB = 5; // Chuẩn localStorage ~5MB
    const pct = Math.round((total / (limitMB * 1024 * 1024)) * 100);

    return { usedMB, limitMB, pct };
  },
};

/* ═══════════════════════════════════════════════════════════
   22C. DATA MANAGER — Backup, Import thông minh (Nhóm 10)
═══════════════════════════════════════════════════════════ */
const DataManager = {
  LAST_BACKUP_KEY: 'st_last_backup_v1',
  DAYS_WARN_BACKUP: 14,

  init() {
    this.bindDeleteRange();
    this.bindImport();
    this.renderBackupStatus();
    this.checkBackupReminder();
  },

  // ═══ Xóa theo khoảng: validate + preview ═══
  bindDeleteRange() {
    const from = $('#deleteFrom');
    const to = $('#deleteTo');
    const btn = $('#deleteRangeBtn');
    const preview = $('#deletePreview');
    if (!from || !to) return;

    const updatePreview = () => {
      if (!preview) return;
      const f = from.value;
      const t = to.value;

      if (!f || !t) {
        preview.hidden = true;
        return;
      }

      if (f > t) {
        preview.hidden = false;
        preview.innerHTML = `<div class="dp-title">⚠️ Lỗi</div>Ngày bắt đầu phải ≤ ngày kết thúc.`;
        return;
      }

      // Đếm dữ liệu
      const toDelete = Object.keys(State.days).filter(k => k >= f && k <= t);
      let totalMinutes = 0;
      let totalSessions = 0;
      let totalSlots = 0;
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

    // Nút xóa
    if (btn) {
      // Xóa listener cũ bằng clone
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => this.performDeleteRange());
    }
  },

  performDeleteRange() {
    const f = $('#deleteFrom').value;
    const t = $('#deleteTo').value;

    // Validate
    if (!f || !t) { toast('⚠️ Chọn đủ 2 ngày'); return; }
    if (f > t) { toast('⚠️ Ngày bắt đầu phải trước ngày kết thúc'); return; }
    if (t > State.today) { toast('⚠️ Ngày kết thúc không được ở tương lai'); return; }

    const toDelete = Object.keys(State.days).filter(k => k >= f && k <= t);
    if (toDelete.length === 0) {
      toast('ℹ️ Không có dữ liệu trong khoảng này');
      return;
    }

    if (!confirm(`Xóa ${toDelete.length} ngày dữ liệu từ ${f} đến ${t}?\n\nKhông thể hoàn tác sau khi rời trang!`)) return;

    const backup = {};
    toDelete.forEach(k => { backup[k] = State.days[k]; delete State.days[k]; });
    Storage.saveDays();
    Modules.refreshAll();

    $('#deleteFrom').value = '';
    $('#deleteTo').value = '';
    $('#deletePreview').hidden = true;

    Undo.push(`Đã xóa ${toDelete.length} ngày`, () => {
      Object.keys(backup).forEach(k => { State.days[k] = backup[k]; });
      Storage.saveDays();
      Modules.refreshAll();
    }, 15000); // 15 giây

    toast(`🗑 Đã xóa ${toDelete.length} ngày`);
  },

  // ═══ Import: hỏi Merge / Overwrite ═══
  bindImport() {
    const importBtn = $('#importBtn');
    const importFile = $('#importFile');
    const confirmBtn = $('#importConfirm');
    if (!importBtn || !importFile) return;

    // Xóa listener cũ
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

  _importData: null, // lưu dữ liệu chờ import

  parseFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra size
    if (file.size > 10 * 1024 * 1024) {
      toast('❌ File quá lớn (> 10MB)');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      let data;
      try {
        data = JSON.parse(evt.target.result);
      } catch (err) {
        toast('❌ File không phải JSON hợp lệ');
        e.target.value = '';
        return;
      }

      // Validate cấu trúc
      const validation = this.validateImportData(data);
      if (!validation.ok) {
        toast('❌ ' + validation.error);
        e.target.value = '';
        return;
      }

      // Lưu và hiện modal
      this._importData = data;
      this.showImportModal(data, validation.stats);
      e.target.value = '';
    };
    reader.onerror = () => {
      toast('❌ Không đọc được file');
      e.target.value = '';
    };
    reader.readAsText(file);
  },

  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return { ok: false, error: 'File không phải đối tượng JSON' };
    }

    // Ít nhất phải có 1 trong các mục
    const hasDays = data.days && typeof data.days === 'object';
    const hasProfile = data.profile && typeof data.profile === 'object';
    const hasRoadmap = Array.isArray(data.roadmap);
    const hasTodos = Array.isArray(data.todos);

    if (!hasDays && !hasProfile && !hasRoadmap && !hasTodos) {
      return { ok: false, error: 'File không chứa dữ liệu Study Tracker' };
    }

    // Đếm dữ liệu
    const stats = {
      days: hasDays ? Object.keys(data.days).length : 0,
      profile: hasProfile,
      roadmap: hasRoadmap ? data.roadmap.length : 0,
      todos: hasTodos ? data.todos.length : 0,
      hasTheme: !!data.theme,
      hasBg: !!data.bg,
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

        // Backup trước khi thao tác
        try {
        const backup = {
            version: 5,
            exportedAt: new Date().toISOString(),
            profile: State.profile,
            days: State.days,
            roadmap: State.roadmap,
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `backup-before-import-${State.today}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        } catch (e) {}

        if (mode === 'overwrite') {
        // Ghi đè toàn bộ
        if (data.profile) State.profile = { ...State.profile, ...data.profile };
        if (data.days && typeof data.days === 'object') State.days = { ...data.days };
        if (Array.isArray(data.roadmap)) State.roadmap = [...data.roadmap];
        if (data.theme) State.theme = data.theme;
        if (data.bg) State.bg = data.bg;

        if (Array.isArray(data.todos) && typeof TodoManager !== 'undefined') {
            TodoManager.todos = [...data.todos];
        }
        if (data.freeze && typeof StreakFreeze !== 'undefined') {
            StreakFreeze.freezes = data.freeze.freezes ?? 3;
            StreakFreeze.history = data.freeze.history || [];
        }
        toast('✅ Đã ghi đè toàn bộ');
        } else {
        // Gộp
        let merged = 0;
        if (data.days && typeof data.days === 'object') {
            Object.keys(data.days).forEach(k => {
            State.days[k] = data.days[k];
            merged++;
            });
        }
        if (data.profile) {
            // Chỉ ghi đè field nếu ô hiện tại trống
            Object.keys(data.profile).forEach(f => {
            if (!State.profile[f]) State.profile[f] = data.profile[f];
            });
        }
        if (Array.isArray(data.roadmap) && data.roadmap.length) {
            // Thêm roadmap chưa có
            const existingIds = new Set(State.roadmap.map(r => r.id));
            data.roadmap.forEach(r => {
            if (!existingIds.has(r.id)) State.roadmap.push(r);
            });
        }
        if (Array.isArray(data.todos) && typeof TodoManager !== 'undefined') {
            const existingIds = new Set(TodoManager.todos.map(t => t.id));
            data.todos.forEach(t => {
            if (!existingIds.has(t.id)) TodoManager.todos.push(t);
            });
        }
        toast(`✅ Đã gộp ${merged} ngày dữ liệu`);
        }

        // Lưu
        Storage.saveProfile();
        Storage.saveDays();
        Storage.saveRoadmap();
        Storage.saveTheme();
        Storage.saveBg();
        if (typeof TodoManager !== 'undefined') TodoManager.save();
        if (typeof StreakFreeze !== 'undefined') StreakFreeze.save();

        // Cập nhật UI
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

    // ═══ Nhắc backup định kỳ ═══
    getLastBackupDate() {
        try {
        return localStorage.getItem(this.LAST_BACKUP_KEY) || '';
        } catch (e) { return ''; }
    },

    setLastBackupDate() {
        try {
        localStorage.setItem(this.LAST_BACKUP_KEY, State.today);
        } catch (e) {}
    },

    renderBackupStatus() {
        const el = $('#backupStatus');
        if (!el) return;

        const last = this.getLastBackupDate();
        const info = ImageUtils.getStorageInfo();

        if (!last) {
        el.className = 'backup-status warn';
        el.innerHTML = `
            <span class="bs-icon">💡</span>
            <span class="bs-text">Bạn chưa xuất backup. Nên xuất JSON định kỳ. Đã dùng <b>${info.usedMB} MB</b> / ${info.limitMB} MB.</span>
        `;
        return;
        }

        const daysSince = Math.floor((parseKey(State.today) - parseKey(last)) / 86400000);

        if (daysSince >= this.DAYS_WARN_BACKUP) {
        el.className = 'backup-status warn';
        el.innerHTML = `
            <span class="bs-icon">⚠️</span>
            <span class="bs-text">Lần xuất cuối: <b>${daysSince} ngày trước</b>. Nên sao lưu lại. Đã dùng <b>${info.usedMB} MB</b> / ${info.limitMB} MB.</span>
        `;
        } else {
        el.className = 'backup-status';
        el.innerHTML = `
            <span class="bs-icon">✅</span>
            <span class="bs-text">Backup gần nhất: <b>${daysSince} ngày trước</b>. Đã dùng <b>${info.usedMB} MB</b> / ${info.limitMB} MB.</span>
        `;
        }
    },

    checkBackupReminder() {
        const last = this.getLastBackupDate();
        if (!last) return; // Không nhắc người mới

        const daysSince = Math.floor((parseKey(State.today) - parseKey(last)) / 86400000);
        if (daysSince >= this.DAYS_WARN_BACKUP) {
        // Nhắc 1 lần / ngày
        const key = 'st_backup_reminded_' + State.today;
        if (!sessionStorage.getItem(key)) {
            setTimeout(() => {
            if (typeof NotifManager !== 'undefined' && NotifManager.send) {
                NotifManager.send(
                '💾 Nên sao lưu dữ liệu',
                `Đã ${daysSince} ngày từ lần xuất cuối. Vào Quản lý → Dữ liệu để xuất JSON.`,
                'warning'
                );
            }
            }, 3000);
            sessionStorage.setItem(key, '1');
        }
        }
    },
    };
/* ═══════════════════════════════════════════════════════════
   22D. A11Y — Aria-label tự động cho nút emoji (Nhóm 11)
═══════════════════════════════════════════════════════════ */
const A11y = {
  // Map emoji → mô tả cho aria-label
  EMOJI_LABELS: {
    '✏️': 'Sửa',
    '🗑': 'Xóa',
    '🗑️': 'Xóa',
    '➕': 'Thêm',
    '✕': 'Đóng',
    '✖': 'Đóng',
    '🎨': 'Đổi màu',
    '📷': 'Tải ảnh lên',
    '🔍': 'Tìm kiếm',
    '⛶': 'Toàn màn hình',
    '↺': 'Đặt lại',
    '▶': 'Bắt đầu',
    '⏸': 'Tạm dừng',
    '⏹': 'Dừng',
    '❄️': 'Streak Freeze',
    '🔔': 'Thông báo',
    '❄': 'Streak Freeze',
    '☀️': 'Chế độ sáng',
    '🌙': 'Chế độ tối',
    '⭐': 'Đánh giá',
    '★': 'Đánh giá sao',
    '☆': 'Chưa đánh giá',
    '🔀': 'Trộn',
    '📅': 'Lịch',
    '📊': 'Thống kê',
    '⚙️': 'Cài đặt',
    '🏠': 'Trang chủ',
    '📖': 'Học tập',
    '🕐': 'Giờ học',
    '✅': 'Hoàn thành',
    '↩️': 'Hoàn tác',
    '↩': 'Hoàn tác',
    '◀': 'Trước',
    '▶': 'Sau',
    '−': 'Giảm',
    '+': 'Tăng',
    '📥': 'Nhập',
    '📦': 'Xuất',
    '⬇': 'Xuất',
    '⬆': 'Nhập',
  },

  init() {
    // Chạy lần đầu
    this.autoLabelAll();

    // Theo dõi DOM thay đổi để tự label
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.tagName === 'BUTTON') this.autoLabel(node);
            // Duyệt con
            if (node.querySelectorAll) {
              node.querySelectorAll('button').forEach(b => this.autoLabel(b));
            }
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  autoLabelAll() {
    document.querySelectorAll('button').forEach(btn => this.autoLabel(btn));
  },

  autoLabel(btn) {
    // Đã có aria-label hoặc title → bỏ qua
    if (btn.getAttribute('aria-label') || btn.getAttribute('title')) return;

    // Lấy text
    const text = (btn.textContent || '').trim();

    // Nếu text ngắn và toàn emoji → đặt label
    if (text.length > 0 && text.length <= 3) {
      const label = this.EMOJI_LABELS[text];
      if (label) {
        btn.setAttribute('aria-label', label);
        // Thêm title nếu chưa có
        if (!btn.title) btn.title = label;
      }
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   22E. HEATMAP SCROLL — Tự cuộn đến hôm nay (Nhóm 11)
═══════════════════════════════════════════════════════════ */
const HeatmapScroll = {
  scrollToToday() {
    const scroll = $('#heatmapScroll');
    const map = $('#heatmap');
    if (!scroll || !map) return;

    // Tìm ô hôm nay
    const today = map.querySelector(`.hm-cell[data-date="${State.today}"]`);
    if (!today) return;

    // Cuộn đến giữa khung
    const scrollWidth = scroll.clientWidth;
    const cellLeft = today.offsetLeft;
    const cellWidth = today.offsetWidth;
    const targetScroll = cellLeft - (scrollWidth / 2) + (cellWidth / 2);

    scroll.scrollLeft = Math.max(0, targetScroll);
  },

  init() {
    // Cuộn sau khi heatmap render xong
    setTimeout(() => this.scrollToToday(), 300);

    // Cuộn lại khi tab được focus (VD: đổi từ mobile sang desktop)
    window.addEventListener('resize', () => this.scrollToToday());

    // Nút "Về hôm nay" cho heatmap
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

/* ═══════════════════════════════════════════════════════════
   22F. ARIA LIVE — Thông báo cho screen reader (Nhóm 11)
═══════════════════════════════════════════════════════════ */
const AriaLive = {
  init() {
    // Tạo vùng aria-live ẩn
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
    /* ═══════════════════════════════════════════════════════════
    23. HOOKS — Bổ sung module mới vào hệ thống
    ═══════════════════════════════════════════════════════════ */
    /* ═══════════════════════════════════════════════════════════
    23. QUẢN LÝ MÔN HỌC (NHÓM 1)
    ═══════════════════════════════════════════════════════════ */
    const SubjectManager = {
    subjects: [],   // [{id, name, color, createdAt}]
    editingId: null,

    // Màu mặc định cho môn mới
    DEFAULT_COLORS: [
        '#4f46e5', '#10b981', '#ef4444', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
    ],

    init() {
        this.load();

        // Nút thêm
        const addBtn = $('#addSubjectBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.add());

        // Enter để thêm
        const nameInput = $('#subjectNameInput');
        if (nameInput) {
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); this.add(); }
        });
        }

        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
    },

    load() {
        try {
        const raw = localStorage.getItem('st_subjects_v1');
        this.subjects = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.subjects)) this.subjects = [];

        // Migration: nếu chưa có môn nào, tạo 7 môn mặc định
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
        } catch (e) {
        this.subjects = [];
        }
    },

    save() {
        try { localStorage.setItem('st_subjects_v1', JSON.stringify(this.subjects)); } catch (e) {}
    },

    add() {
        const nameInput = $('#subjectNameInput');
        const colorInput = $('#subjectColorInput');
        const name = nameInput.value.trim();
        const color = colorInput.value || this.DEFAULT_COLORS[0];

        if (!name) { toast('⚠️ Nhập tên môn'); return; }
        if (this.subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        toast('⚠️ Môn này đã có'); return;
        }

        this.subjects.push({
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        name: name,
        color: color,
        createdAt: new Date().toISOString(),
        });

        this.save();
        nameInput.value = '';
        colorInput.value = this.DEFAULT_COLORS[this.subjects.length % this.DEFAULT_COLORS.length];

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

        sub.name = trimmed;
        this.save();
        this.render();
        this.renderTagPicker();
        this.renderModalSelect();
        toast('✅ Đã sửa môn');
    },

    changeColor(id, newColor) {
        const sub = this.subjects.find(s => s.id === id);
        if (!sub) return;
        sub.color = newColor;
        this.save();
        this.render();
        this.renderTagPicker();
        toast('🎨 Đã đổi màu');
    },

    remove(id) {
        const idx = this.subjects.findIndex(s => s.id === id);
        if (idx < 0) return;
        const sub = this.subjects[idx];

        // Đếm số phiên đang dùng môn này
        let usedCount = 0;
        Object.keys(State.days).forEach(k => {
        (State.days[k].sessions || []).forEach(s => {
            if (s.tag === sub.name) usedCount++;
        });
        });

        let msg = `Xóa môn "${sub.name}"?`;
        if (usedCount > 0) {
        msg += `\n\n⚠️ Có ${usedCount} phiên học đang dùng môn này. Các phiên vẫn giữ tên môn cũ.`;
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
        // Đếm số phiên học dùng môn này
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
            <button class="color-btn" title="Đổi màu">🎨</button>
            <button class="edit-btn" title="Sửa tên">✏️</button>
            <button class="del" title="Xóa">🗑</button>
            </div>
        `;

        // Nút đổi màu → mở color picker ẩn
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
            document.body.removeChild(colorInput);
            });
            colorInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (colorInput.parentNode) document.body.removeChild(colorInput);
            }, 200);
            });

            colorInput.click();
        });

        item.querySelector('.edit-btn').addEventListener('click', () => this.edit(sub.id));
        item.querySelector('.del').addEventListener('click', () => this.remove(sub.id));

        frag.appendChild(item);
        });

        list.appendChild(frag);
    },

    // Vẽ lại tag picker trong Pomodoro
    renderTagPicker() {
        const picker = $('#tagPicker');
        if (!picker) return;
        picker.innerHTML = '';
        Pomodoro.selectedTag = null;

        if (this.subjects.length === 0) {
        picker.innerHTML = '<span style="color:var(--text-mute);font-size:13px">Chưa có môn — vào Quản lý để thêm</span>';
        return;
        }

        this.subjects.forEach(sub => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tag';
        b.style.background = sub.color + '22';
        b.style.color = sub.color;
        b.textContent = sub.name;
        b.dataset.subjectId = sub.id;

        b.addEventListener('click', () => {
            const wasActive = b.classList.contains('active');
            picker.querySelectorAll('.tag').forEach(x => {
            x.classList.remove('active');
            x.style.background = x.style.background.replace('var(--accent)', '');
            });

            if (!wasActive) {
            b.classList.add('active');
            b.style.background = sub.color;
            b.style.color = '#fff';
            Pomodoro.selectedTag = sub.name;
            } else {
            b.style.background = sub.color + '22';
            b.style.color = sub.color;
            Pomodoro.selectedTag = null;
            }
        });

        picker.appendChild(b);
        });
    },

    // Vẽ dropdown chọn môn trong modal ghi giờ
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

        // Khôi phục lựa chọn nếu còn
        if (currentVal) sel.value = currentVal;
    },

    // Helper: lấy màu theo tên môn
    getColor(name) {
        const sub = this.subjects.find(s => s.name === name);
        return sub ? sub.color : '#64748b';
    },
    };
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
        SubjectManager.init();
        TodoManager.init();
        StreakFreeze.init();
        NotifManager.init();

    // GĐ3 (Nhóm 3)
        Onboarding.init();

        // GĐ4 (Nhóm 4)
        SessionManager.init();
        Guards.applyDateLimits();

  // GĐ6 (Nhóm 6)
    TodoManager.syncMidnight();

  // GĐ10 (Nhóm 10)
    DataManager.init();

    // GĐ11 (Nhóm 11) — Giao diện + A11y
    A11y.init();
    AriaLive.init();
    HeatmapScroll.init();

    // Nút chạy lại onboarding
        const rerunBtn = $('#rerunOnboardingBtn');
        if (rerunBtn) rerunBtn.addEventListener('click', () => Onboarding.reset());
        // Nhóm 5: nút mở Thống kê từ Quản lý
        const goStatsBtn = $('#goToStatsBtn');
        if (goStatsBtn) goStatsBtn.addEventListener('click', () => Router.go('stats'));
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