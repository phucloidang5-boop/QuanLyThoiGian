    /* ═══════════ NỘI DUNG — CHỈNH SỬA Ở ĐÂY ═══════════ */
    const OPENING_LINES = [
    "Nhân ngày Phụ nữ Việt Nam 20/10,",
    "Phúc Lợi xin gửi đến các bạn nữ",
    "một lời chúc thật nhẹ nhàng và ấm áp.",
    "",
    "Chúc các bạn luôn mạnh khỏe, vui vẻ,",
    "luôn rạng rỡ và hạnh phúc trong cuộc sống.",
    "",
    "Mong rằng mọi điều tốt đẹp nhất",
    "sẽ luôn đến với các bạn."
    ];

    const SIGNATURE = "— T Boss · Phúc Lợi";
    const DEFAULT_RECIPIENT = "các bạn nữ";

    /* 6 loại phần thưởng — weight = tỷ lệ % */
    const prizes = [
    { label: 'Snacks',           weight: 19, color: '#b4ff39', emoji: '🍿' },
    { label: 'Bánh tráng nướng', weight: 19, color: '#ff8c42', emoji: '🌮' },
    { label: 'Nước tự chọn',     weight: 19, color: '#00e5ff', emoji: '🥤' },
    { label: 'Bánh tráng cuốn',  weight: 18, color: '#ff3ea5', emoji: '🌯' },
    { label: 'Bánh mì nướng',    weight: 18, color: '#a020f0', emoji: '🥖' },
    { label: '50k',              weight: 7,  color: '#ffd60a', emoji: '💵' }
    ];

    /* 18 ô — mỗi ô là 1 hộp quà, giữ nguyên tỷ lệ (50k 1 ô) */
    const wheelSegments = [
    prizes[0], prizes[0], prizes[0], prizes[0],
    prizes[1], prizes[1], prizes[1], prizes[1],
    prizes[2], prizes[2], prizes[2],
    prizes[3], prizes[3], prizes[3],
    prizes[4], prizes[4], prizes[4],
    prizes[5]
    ];

    /* Màu nền 18 ô random khác nhau — không theo prize để không gợi ý */
    const BOX_BG_COLORS = [
    '#ff3ea5', '#a020f0', '#00e5ff', '#ff8c42', '#b4ff39', '#ffd60a',
    '#ff6bb5', '#3b82f6', '#e8c5a0', '#c4a8e0', '#ff8fab', '#ffe066',
    '#ff3ea5', '#00e5ff', '#a020f0', '#b4ff39', '#ff8c42', '#ffd60a'
    ];

    /* Câu cợt nhả theo từng món — random mỗi lần trúng */
    const CHEEKY_NOTES = {
    'Snacks': [
        'Trúng snacks rồi, bóc ngay kẻo nguội 😏',
        'Snacks kìa, hên thật sự 😎',
        'Mai nhớ chia mình một miếng nha 🤤',
        'Ăn đi cho béo rồi còn gì 😆',
        'Snacks đây rồi, quẩy thôi 🔥',
        'Hên ghê, món này nhâm nhi là hết sảy 😋'
    ],
    'Bánh tráng nướng': [
        'Bánh tráng nướng kìa, món quốc dân 🔥',
        'Trúng món này thì hết sảy 😋',
        'Nhớ trả công mình nha 😏',
        'Hên quá trời, món này ngon lắm đó 😎',
        'Bánh tráng nướng đây rồi, nóng hổi 🤤'
    ],
    'Nước tự chọn': [
        'Nước tự chọn kìa, uống gì tùy thích 🥤',
        'Trà sữa hay cà phê gì cũng được nha 😎',
        'Uống đi cho mát, hên thật sự 😏',
        'Nước đây rồi, chọn đi rồi mình mua 😆',
        'Giải khát thôi, hên quá 🤤'
    ],
    'Bánh tráng cuốn': [
        'Bánh tráng cuốn kìa, cuốn đi 🤤',
        'Món này cuốn lắm đó nha 😏',
        'Hên thật sự, cuốn ngay đi 😎',
        'Trúng món ngon rồi, ăn thôi 🔥',
        'Bánh tráng cuốn đây, cuốn không? 😋'
    ],
    'Bánh mì nướng': [
        'Bánh mì nướng kìa, giòn rụm 🤤',
        'Trúng bánh mì rồi, ăn sáng thôi 😎',
        'Món này ngon lắm nha, hên thật 😏',
        'Bánh mì nướng đây rồi, thơm phức 🔥',
        'Hên quá, sáng mai có bánh mì ăn rồi 😋'
    ],
    '50k': [
        'WOW! Bạn là người được chọn! 💰',
        'Trúng 50k rồi, đãi mình ly trà sữa nha 🧋',
        'Vận may hôm nay max luôn 😎',
        'Hên thật sự! Mình còn chưa trúng nữa 🤣',
        'JACKPOT! Chụp màn hình ngay kẻo mất 💸'
    ]
    };
    /* ═══════════════════════════════════════════════════ */

    let RECIPIENT = '';
    let skipping = false;
    let hasSpun = false;
    let countdownTimer = null;
    const $ = id => document.getElementById(id);
    const wait = ms => new Promise(r => setTimeout(r, skipping ? Math.min(ms, 60) : ms));
    const NEON_COLORS = ['#ff3ea5','#ff8c42','#ffd60a','#b4ff39','#00e5ff','#3b82f6','#a020f0','#ff6bb5','#00ffb3'];

    const canvas = $('wheel');
    const ctx = canvas.getContext('2d');
    const spinBtn = $('spinBtn');
    const wheelWrap = $('wheelWrap');
    const confettiCanvas = $('layer-confetti');
    const confettiCtx = confettiCanvas.getContext('2d');
    const petalCanvas = $('layer-petals');
    const petalCtx = petalCanvas.getContext('2d');
    let SIZE = 0, RADIUS = 0, currentRotation = 0, spinning = false, wheelReady = false;

    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    petalCanvas.width = window.innerWidth;
    petalCanvas.height = window.innerHeight;

    /* ═══════════ BACKGROUND STARS ═══════════ */
    function initStars() {
    const container = $('bgStars');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#ffd60a', '#ff3ea5', '#a020f0', '#00e5ff', '#faf5f0', '#e8c5a0'];
    const count = window.innerWidth < 700 ? 28 : 50;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const size = 1.5 + Math.random() * 2.5;
        s.style.width = size + 'px';
        s.style.height = size + 'px';
        s.style.left = Math.random() * 100 + 'vw';
        s.style.top = Math.random() * 100 + 'vh';
        const c = colors[Math.floor(Math.random() * colors.length)];
        s.style.background = c;
        s.style.color = c;
        s.style.animationDelay = Math.random() * 4 + 's';
        s.style.animationDuration = (3 + Math.random() * 4) + 's';
        container.appendChild(s);
    }
    }
    initStars();
    let starTimer;
    window.addEventListener('resize', () => {
    clearTimeout(starTimer);
    starTimer = setTimeout(initStars, 500);
    });

    /* ═══════════ PROGRESS DOTS ═══════════ */
    function updateProgress(n) {
    document.querySelectorAll('#progressDots .dot').forEach((d, i) => d.classList.toggle('active', i === n - 1));
    }

    /* ═══════════ WAIT FOR NEXT BUTTON ═══════════ */
    function waitForNext(btnId) {
    return new Promise(resolve => {
        const btn = $(btnId);
        btn.classList.add('show');
        const handler = () => {
        btn.removeEventListener('click', handler);
        btn.classList.remove('show');
        setTimeout(resolve, 280);
        };
        btn.addEventListener('click', handler);
    });
    }

    /* ═══════════ TEXT REVEAL ═══════════ */
    function revealWords(el, text, baseDelay = 0, charSpeed = 26, wordGap = 32) {
    el.innerHTML = '';
    const lines = text.split('\n');
    let delay = baseDelay;

    lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
        el.appendChild(document.createElement('br'));
        if (!skipping) delay += 90;
        }
        if (line === '') return;

        const words = line.split(' ');
        words.forEach((word, wIdx) => {
        if (word === '') return;
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        if (skipping) {
            span.style.opacity = '1';
            span.style.animation = 'none';
        } else {
            const jitter = (Math.random() - 0.5) * 18;
            span.style.animationDelay = (delay + jitter) + 'ms';
        }
        el.appendChild(span);
        if (wIdx < words.length - 1) el.appendChild(document.createTextNode(' '));
        if (!skipping) delay += word.length * charSpeed + wordGap + (Math.random() - 0.5) * 20;
        });
    });
    return skipping ? 0 : delay;
    }

    function revealGreeting(el, name) {
    el.innerHTML = '';
    const charSpeed = 28;
    const wordGap = 40;
    let delay = 0;

    const before = 'Chúc';
    const after = 'một ngày 20/10 thật vui 💐';

    before.split(' ').forEach((w) => {
        const s = document.createElement('span');
        s.className = 'word';
        s.textContent = w;
        if (skipping) { s.style.animation = 'none'; s.style.opacity = '1'; }
        else { s.style.animationDelay = delay + 'ms'; }
        el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
        delay += w.length * charSpeed + wordGap;
    });

    const nameSpan = document.createElement('span');
    nameSpan.className = 'word name';
    nameSpan.textContent = name;
    if (skipping) { nameSpan.style.animation = 'none'; nameSpan.style.opacity = '1'; }
    else { nameSpan.style.animationDelay = delay + 'ms'; }
    el.appendChild(nameSpan);
    el.appendChild(document.createTextNode(' '));
    delay += name.length * charSpeed + wordGap + 180;

    after.split(' ').forEach((w) => {
        const s = document.createElement('span');
        s.className = 'word';
        s.textContent = w;
        if (skipping) { s.style.animation = 'none'; s.style.opacity = '1'; }
        else { s.style.animationDelay = delay + 'ms'; }
        el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
        delay += w.length * charSpeed + wordGap;
    });

    return skipping ? 0 : delay + 250;
    }

    /* ═══════════ PARTICLES ═══════════ */
    let particleCount = 0;
    const MAX_PARTICLES = 38;

    function createSparkleSVG(color, size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 0 L13.8 10.2 L24 12 L13.8 13.8 L12 24 L10.2 13.8 L0 12 L10.2 10.2 Z');
    path.setAttribute('fill', color);
    svg.appendChild(path);
    if (size > 10) svg.style.filter = `drop-shadow(0 0 ${size/2}px ${color}) drop-shadow(0 0 ${size}px ${color}80)`;
    return svg;
    }

    function spawnParticle() {
    if (particleCount >= MAX_PARTICLES) return;
    particleCount++;
    const rand = Math.random();
    let el;
    if (rand < 0.55) {
        const size = 6 + Math.random() * 12;
        el = createSparkleSVG(NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)], size);
        el.classList.add('particle');
        el.style.opacity = 0.6 + Math.random() * 0.3;
    } else if (rand < 0.82) {
        const size = 2 + Math.random() * 4;
        el = document.createElement('div');
        el.classList.add('particle');
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.borderRadius = '50%';
        const c = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
        el.style.background = c;
        el.style.boxShadow = `0 0 ${size*4}px ${c}, 0 0 ${size*8}px ${c}80`;
        el.style.opacity = 0.6 + Math.random() * 0.3;
    } else {
        el = document.createElement('div');
        el.classList.add('particle');
        el.textContent = ['✨','💫','🌟','⭐'][Math.floor(Math.random()*4)];
        el.style.fontSize = (12 + Math.random() * 8) + 'px';
        el.style.filter = 'drop-shadow(0 0 10px rgba(232,197,160,0.9)) drop-shadow(0 0 20px rgba(255,62,165,0.4))';
        el.style.opacity = '0.75';
    }
    el.style.left = (Math.random() * 100) + 'vw';
    const duration = 9 + Math.random() * 8;
    el.style.animationDuration = duration + 's';
    el.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
    el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    $('layer-particles').appendChild(el);
    setTimeout(() => { el.remove(); particleCount--; }, duration * 1000);
    }
    setInterval(spawnParticle, 400);
    for (let i = 0; i < 4; i++) setTimeout(spawnParticle, i * 120);

    /* ═══════════ FIREWORKS ═══════════ */
    function burst(x, y, opts = {}) {
    const sparkCount = opts.sparkCount || 30;
    const palette = opts.palette || NEON_COLORS;
    const glow = palette[Math.floor(Math.random() * palette.length)];
    const flash = document.createElement('div');
    flash.className = 'firework-flash';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    flash.style.setProperty('--glow', glow);
    $('layer-fireworks').appendChild(flash);
    setTimeout(() => flash.remove(), 650);
    for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.3;
        const dist = 60 + Math.random() * 140;
        const spark = document.createElement('div');
        spark.className = 'firework-spark';
        const color = palette[Math.floor(Math.random() * palette.length)];
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.background = color;
        spark.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
        spark.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        spark.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        spark.style.setProperty('--dur', (0.9 + Math.random() * 0.7) + 's');
        spark.style.width = (3 + Math.random() * 3) + 'px';
        spark.style.height = spark.style.width;
        $('layer-fireworks').appendChild(spark);
        setTimeout(() => spark.remove(), 2000);
    }
    }
    function burstRandom(count = 1, delayBetween = 200) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
        burst((0.15 + Math.random() * 0.7) * window.innerWidth, (0.15 + Math.random() * 0.55) * window.innerHeight);
        }, i * delayBetween);
    }
    }

    /* ═══════════ PETAL STORM — vẽ cánh hoa THẬT ĐẸP ═══════════ */
    const PETAL_COLORS = [
    '#ff3ea5', '#ff6bb5', '#ff8fab', '#ffb3c6', '#ffd6e0',
    '#ffd60a', '#e8c5a0', '#a020f0', '#c4a8e0', '#faf5f0',
    '#ff8c42', '#ffe066', '#ff4d6d', '#f9a8d4', '#ffc2e0'
    ];

    let petalParticles = [];
    let petalRAF = null;

    function hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
    }

    function petalShades(hex) {
    const { r, g, b } = hexToRgb(hex);
    return {
        light: `rgb(${Math.min(255, r + 55)}, ${Math.min(255, g + 55)}, ${Math.min(255, b + 55)})`,
        dark: `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`
    };
    }

    function spawnPetal(cx, cy) {
    const baseColor = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    const shades = petalShades(baseColor);
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 14;

    petalParticles.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4 - Math.random() * 5,
        size: 7 + Math.random() * 12,
        color: baseColor,
        colorLight: shades.light,
        colorDark: shades.dark,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22,
        life: 1,
        gravity: 0.10 + Math.random() * 0.10,
        friction: 0.986,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
        shape: Math.random() > 0.35 ? 'petal' : 'circle'
    });
    }

    function petalBurst() {
    petalCanvas.width = window.innerWidth;
    petalCanvas.height = window.innerHeight;
    petalParticles = [];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const TOTAL = 1000;
    const BATCHES = 12;
    const perBatch = TOTAL / BATCHES;

    for (let b = 0; b < BATCHES; b++) {
        setTimeout(() => {
        for (let i = 0; i < perBatch; i++) {
            spawnPetal(cx, cy);
        }
        }, b * 90);
    }

    if (petalRAF) cancelAnimationFrame(petalRAF);
    animatePetals();

    setTimeout(() => {
        if (petalRAF) cancelAnimationFrame(petalRAF);
        petalCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
        petalParticles = [];
        petalRAF = null;
    }, 6500);
    }

    /* Vẽ path cánh hoa (giọt nước) */
    function drawPetalShape(c, size) {
    const s = size;
    c.beginPath();
    c.moveTo(0, -s);
    c.bezierCurveTo(-s * 0.75, -s * 0.7, -s * 0.9, s * 0.35, 0, s);
    c.bezierCurveTo(s * 0.9, s * 0.35, s * 0.75, -s * 0.7, 0, -s);
    c.closePath();
    }

    function animatePetals() {
    petalCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
    let alive = 0;

    for (const p of petalParticles) {
        p.vx *= p.friction;
        p.vy = p.vy * 0.992 + p.gravity;
        p.x += p.vx + Math.sin(p.wobble) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        p.wobble += p.wobbleSpeed;
        p.life -= 0.0035;

        if (p.life > 0 && p.y < petalCanvas.height + 60) {
        alive++;
        petalCtx.save();
        petalCtx.translate(p.x, p.y);
        petalCtx.rotate(p.rot);
        petalCtx.globalAlpha = Math.max(0, p.life);

        if (p.shape === 'petal') {
            const grad = petalCtx.createRadialGradient(
            -p.size * 0.15, -p.size * 0.3, 0,
            0, 0, p.size * 1.1
            );
            grad.addColorStop(0, p.colorLight);
            grad.addColorStop(0.55, p.color);
            grad.addColorStop(1, p.colorDark);
            petalCtx.fillStyle = grad;

            drawPetalShape(petalCtx, p.size);
            petalCtx.fill();

            // Gân giữa
            petalCtx.strokeStyle = 'rgba(255,255,255,0.4)';
            petalCtx.lineWidth = 0.6;
            petalCtx.beginPath();
            petalCtx.moveTo(0, -p.size * 0.85);
            petalCtx.lineTo(0, p.size * 0.85);
            petalCtx.stroke();

            // Gân phụ hai bên
            if (p.size > 10) {
            petalCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            petalCtx.lineWidth = 0.4;
            petalCtx.beginPath();
            petalCtx.moveTo(0, -p.size * 0.4);
            petalCtx.quadraticCurveTo(-p.size * 0.4, 0, -p.size * 0.3, p.size * 0.5);
            petalCtx.stroke();
            petalCtx.beginPath();
            petalCtx.moveTo(0, -p.size * 0.4);
            petalCtx.quadraticCurveTo(p.size * 0.4, 0, p.size * 0.3, p.size * 0.5);
            petalCtx.stroke();
            }

            // Highlight chéo
            petalCtx.globalAlpha = Math.max(0, p.life * 0.55);
            petalCtx.fillStyle = '#fff';
            petalCtx.beginPath();
            petalCtx.ellipse(-p.size * 0.22, -p.size * 0.32, p.size * 0.16, p.size * 0.32, -0.35, 0, Math.PI * 2);
            petalCtx.fill();
        } else {
            const rGrad = petalCtx.createRadialGradient(0, 0, 0, 0, 0, p.size * 0.7);
            rGrad.addColorStop(0, p.colorLight);
            rGrad.addColorStop(1, p.color);
            petalCtx.fillStyle = rGrad;
            petalCtx.beginPath();
            petalCtx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
            petalCtx.fill();
        }

        petalCtx.restore();
        }
    }

    if (alive > 0 || petalParticles.some(p => p.life > 0)) {
        petalRAF = requestAnimationFrame(animatePetals);
    } else {
        petalCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
        petalRAF = null;
    }
    }

    /* ═══════════ OPEN GIFT ═══════════ */
    async function openGift() {
    const gift = $('giftBox');
    if (!gift || gift.classList.contains('opened')) return;

    gift.classList.add('opened');
    playFanfare();
    burst(window.innerWidth / 2, window.innerHeight / 2, { sparkCount: 60 });

    petalBurst();

    setTimeout(() => burstRandom(4, 200), 300);
    setTimeout(() => burstRandom(3, 250), 1200);

    await new Promise(r => setTimeout(r, 5000));

    burstRandom(5, 180);
    showStage(5);
    await new Promise(r => setTimeout(r, 150));
    requestAnimationFrame(() => {
        setupWheelCanvas();
        setTimeout(() => {
        if (!wheelReady || SIZE < 100) setupWheelCanvas();
        }, 300);
    });
    await new Promise(r => setTimeout(r, 700));
    burstRandom(3, 250);
    $('hint').classList.add('hide');
    }

    /* ═══════════ WHEEL — 18 HỘP QUÀ BÍ ẨN ═══════════ */
    function setupWheelCanvas() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vmin = Math.min(vw, vh);
    let size = Math.min(vmin * 0.68, vw - 60, 420);
    if (size < 220) size = Math.min(vw - 40, 220);
    if (size < 180) size = 180;

    SIZE = size;
    RADIUS = SIZE / 2 - 16;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wheelReady = true;

    positionLeds();
    drawWheel();
    }

    function positionLeds() {
    const container = $('wheelLeds');
    if (!container) return;
    container.innerHTML = '';
    container.style.width = SIZE + 'px';
    container.style.height = SIZE + 'px';

    const ledCount = 24;
    const radius = RADIUS - 2;
    for (let i = 0; i < ledCount; i++) {
        const angle = (i / ledCount) * Math.PI * 2 - Math.PI / 2;
        const x = SIZE / 2 + Math.cos(angle) * radius;
        const y = SIZE / 2 + Math.sin(angle) * radius;
        const led = document.createElement('div');
        led.className = 'wheel-led';
        led.style.left = x + 'px';
        led.style.top = y + 'px';
        led.style.animationDelay = (i * 0.06) + 's';
        container.appendChild(led);
    }
    }

    function shadeColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0xFF) + amt));
    return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
    }

    /* Vẽ hộp quà nhỏ trên vòng quay */
    function drawGiftBoxOnWheel(x, y, size) {
    const w = size;
    const h = size * 0.8;

    // Thân hộp
    const bodyGrad = ctx.createLinearGradient(x - w / 2, y + h * 0.1, x + w / 2, y + h * 0.7);
    bodyGrad.addColorStop(0, '#ff8fab');
    bodyGrad.addColorStop(0.5, '#ff3ea5');
    bodyGrad.addColorStop(1, '#c9184a');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x - w * 0.45, y - h * 0.08, w * 0.9, h * 0.65);

    // Nắp hộp
    const lidGrad = ctx.createLinearGradient(x - w / 2, y - h * 0.35, x + w / 2, y + h * 0.05);
    lidGrad.addColorStop(0, '#ffb3c6');
    lidGrad.addColorStop(1, '#ff3ea5');
    ctx.fillStyle = lidGrad;
    ctx.fillRect(x - w * 0.52, y - h * 0.32, w * 1.04, h * 0.26);

    // Ruy băng dọc
    ctx.fillStyle = '#ffd60a';
    ctx.fillRect(x - w * 0.075, y - h * 0.32, w * 0.15, h * 0.95);

    // Ruy băng ngang
    ctx.fillRect(x - w * 0.52, y + h * 0.05, w * 1.04, h * 0.13);

    // Nơ trái
    ctx.beginPath();
    ctx.ellipse(x - w * 0.17, y - h * 0.42, w * 0.16, h * 0.11, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd60a';
    ctx.fill();

    // Nơ phải
    ctx.beginPath();
    ctx.ellipse(x + w * 0.17, y - h * 0.42, w * 0.16, h * 0.11, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Nút giữa nơ
    ctx.beginPath();
    ctx.arc(x, y - h * 0.4, w * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = '#ffa94d';
    ctx.fill();
    }

    function drawWheel() {
    if (!wheelReady) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const cx = SIZE / 2, cy = SIZE / 2;
    const segmentAngle = (Math.PI * 2) / wheelSegments.length;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currentRotation);
    let angle = 0;
    let idx = 0;

    for (const seg of wheelSegments) {
        const bgColor = BOX_BG_COLORS[idx % BOX_BG_COLORS.length];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, RADIUS, angle, angle + segmentAngle);
        ctx.closePath();
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, RADIUS);
        grd.addColorStop(0, shadeColor(bgColor, 18));
        grd.addColorStop(1, shadeColor(bgColor, -35));
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Vẽ hộp quà ở giữa ô
        ctx.save();
        ctx.rotate(angle + segmentAngle / 2);
        const giftSize = RADIUS * 0.38;
        drawGiftBoxOnWheel(RADIUS * 0.72, 0, giftSize);
        ctx.restore();

        angle += segmentAngle;
        idx++;
    }
    ctx.restore();

    // Viền vàng
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    const ringGrd = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    ringGrd.addColorStop(0, '#e8c5a0');
    ringGrd.addColorStop(0.5, '#ffd60a');
    ringGrd.addColorStop(1, '#e8c5a0');
    ctx.strokeStyle = ringGrd;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS - 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    }

    function pickWeighted() {
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
        r -= p.weight;
        if (r <= 0) return p;
    }
    return prizes[prizes.length - 1];
    }

    function getSegmentIndices(label) {
    const arr = [];
    wheelSegments.forEach((seg, i) => {
        if (seg.label === label) arr.push(i);
    });
    return arr;
    }

    function spinWheel() {
    if (spinning || hasSpun) return;
    if (!wheelReady) setupWheelCanvas();
    if (!wheelReady) return;

    hasSpun = true;
    spinning = true;
    spinBtn.disabled = true;
    spinBtn.style.display = 'none';
    wheelWrap.classList.add('spinning');

    const result = pickWeighted();
    const indices = getSegmentIndices(result.label);
    const targetIdx = indices[Math.floor(Math.random() * indices.length)];

    const segmentAngle = (Math.PI * 2) / wheelSegments.length;
    const midAngle = segmentAngle * targetIdx + segmentAngle / 2;
    const baseTarget = -Math.PI / 2 - midAngle;
    const fullSpins = (6 + Math.random() * 3) * Math.PI * 2;
    let target = baseTarget + fullSpins;
    while (target < currentRotation + fullSpins) target += Math.PI * 2;

    const startRot = currentRotation;
    const duration = 5200 + Math.random() * 1400;
    const startTime = performance.now();

    function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

    function animate(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = easeOutQuint(t);
        currentRotation = startRot + (target - startRot) * eased;
        drawWheel();
        if (t < 1) {
        requestAnimationFrame(animate);
        } else {
        currentRotation = target % (Math.PI * 2);
        drawWheel();
        spinning = false;
        wheelWrap.classList.remove('spinning');
        showResult(result);
        }
    }
    requestAnimationFrame(animate);
    }

    function showResult(prize) {
    const modal = $('modal');
    const card = $('modalCard');
    $('resultIcon').textContent = prize.emoji;
    $('resultName').textContent = prize.label;
    const isJackpot = prize.label === '50k';
    card.classList.toggle('jackpot', isJackpot);

    const notes = CHEEKY_NOTES[prize.label] || [];
    const cheeky = notes[Math.floor(Math.random() * notes.length)] || '';

    if (isJackpot) {
        $('resultNote').innerHTML = `<span class="cheeky">${cheeky}</span>📸 Chụp màn hình gửi Lợi ngay để nhận 50k! 💰`;
        launchConfetti();
        playFanfare();
        burstRandom(6, 150);
    } else {
        $('resultNote').innerHTML = `<span class="cheeky">${cheeky}</span>📸 Chụp màn hình gửi Lợi để nhận quà nhé`;
        playDing();
    }
    modal.classList.add('show');

    let count = 20;
    $('countdownNum').textContent = count;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        count--;
        $('countdownNum').textContent = count;
        if (count <= 0) {
        clearInterval(countdownTimer);
        endExperience();
        }
    }, 1000);
    }

    function endExperience() {
    if (countdownTimer) clearInterval(countdownTimer);
    $('modal').classList.remove('show');
    const fadeTargets = ['.experience', '.hint', '.bg-mesh', '.bg-noise', '#layer-particles', '.bg-stars', '.bg-ornaments'];
    fadeTargets.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
        el.style.transition = 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.opacity = '0';
        });
    });
    setTimeout(() => {
        $('end-screen').classList.add('show');
    }, 900);
    }

    /* ═══════════ CONFETTI ═══════════ */
    let confettiParticles = [];
    let confettiRAF = null;

    function launchConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiParticles = [];
    const colors = ['#ff3ea5', '#ffd60a', '#00e5ff', '#b4ff39', '#a020f0', '#ff8c42', '#e8c5a0'];
    for (let i = 0; i < 170; i++) {
        confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
        });
    }
    if (confettiRAF) cancelAnimationFrame(confettiRAF);
    animateConfetti();
    }

    function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = 0;
    for (const p of confettiParticles) {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.08; p.vx *= 0.99; p.rot += p.vr;
        if (p.y < confettiCanvas.height + 50) {
        alive++;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot * Math.PI / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.shadowColor = p.color;
        confettiCtx.shadowBlur = 10;
        if (p.shape === 'rect') {
            confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 1.6);
        } else {
            confettiCtx.beginPath();
            confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            confettiCtx.fill();
        }
        confettiCtx.restore();
        }
    }
    if (alive > 0) confettiRAF = requestAnimationFrame(animateConfetti);
    else { confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); confettiRAF = null; }
    }

    /* ═══════════ SOUND ═══════════ */
    let audioCtx = null;
    function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { return null; }
    }
    return audioCtx;
    }
    function playTone(freq, duration, delay = 0, type = 'sine', vol = 0.08) {
    try {
        const ac = getAudioCtx();
        if (!ac) return;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = type; osc.frequency.value = freq;
        const t = ac.currentTime + delay;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.start(t); osc.stop(t + duration);
    } catch(e) {}
    }
    function playDing() {
    playTone(880, 0.3, 0, 'sine', 0.1);
    playTone(1175, 0.4, 0.1, 'sine', 0.08);
    }
    function playFanfare() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => playTone(f, 0.35, i * 0.1, 'triangle', 0.1));
    playTone(1047, 0.8, 0.5, 'sine', 0.12);
    }

    /* ═══════════ STAGES ═══════════ */
    const stages = [1, 2, 3, 4, 5].map(i => $('stage' + i));
    function showStage(n) {
    stages.forEach((s, i) => s.classList.toggle('active', i === n - 1));
    updateProgress(n);
    }

    /* ═══════════ EVENTS ═══════════ */
    spinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    spinWheel();
    });

    document.body.addEventListener('click', (e) => {
    if (e.target.closest('.next-btn')) return;
    if (e.target.closest('#spinBtn')) return;
    if (e.target.closest('.close-btn')) return;
    if (e.target.closest('#giftBox')) return;
    if (!$('experience').classList.contains('active')) return;
    if ($('stage4').classList.contains('active')) return;
    if ($('stage5').classList.contains('active')) return;

    if (skipping) return;
    skipping = true;

    document.querySelectorAll('.word').forEach(el => {
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
    });

    document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !$('intro').classList.contains('hide')) {
        startExperience();
    }
    if (e.code === 'Space' && !spinning && wheelReady
        && !hasSpun
        && !$('modal').classList.contains('show')
        && $('stage5').classList.contains('active')) {
        e.preventDefault();
        spinWheel();
    }
    });

    window.addEventListener('resize', () => {
    if ($('stage5').classList.contains('active') && !hasSpun) setupWheelCanvas();
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    petalCanvas.width = window.innerWidth;
    petalCanvas.height = window.innerHeight;
    });

    /* ═══════════ START ═══════════ */
    function startExperience() {
    const raw = ($('nameInput').value || '').trim();
    const name = (raw || DEFAULT_RECIPIENT).slice(0, 30);
    RECIPIENT = name;
    const btn = document.querySelector('.start-btn');
    if (btn) {
        const r = btn.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, { sparkCount: 45 });
    }
    burstRandom(3, 200);
    $('intro').classList.add('hide');
    setTimeout(() => { $('intro').style.display = 'none'; }, 800);
    $('experience').classList.add('active');
    runStory();
    }

    async function runStory() {
    /* STAGE 1 */
    showStage(1);
    skipping = false;
    await wait(400);
    burstRandom(2, 200);
    const gDelay = revealGreeting($('greeting'), RECIPIENT);
    await wait(gDelay + 500);
    skipping = false;
    await waitForNext('nextBtn1');

    /* STAGE 2 */
    showStage(2);
    burstRandom(4, 200);
    skipping = false;
    await wait(3000);
    await waitForNext('nextBtn2');

    /* STAGE 3 */
    showStage(3);
    burstRandom(2, 200);
    skipping = false;
    const openingEl = $('openingText');
    openingEl.innerHTML = '';
    let openingDelay = 0;
    for (const line of OPENING_LINES) {
        const lineEl = document.createElement('span');
        lineEl.className = 'line';
        openingEl.appendChild(lineEl);
        if (line === '') {
        lineEl.innerHTML = '&nbsp;';
        openingDelay += 80;
        continue;
        }
        const d = revealWords(lineEl, line, 0, 24, 28);
        openingDelay += d + 60;
    }
    await wait(openingDelay + 400);
    skipping = false;

    const sigEl = document.querySelector('.text-signature');
    if (sigEl) sigEl.classList.add('show');

    await wait(600);
    await waitForNext('nextBtn3');

    /* STAGE 4: Gift */
    showStage(4);
    burstRandom(3, 200);
    }

    /* ═══════════ URL ?name= ═══════════ */
    const params = new URLSearchParams(location.search);
    const urlName = (params.get('name') || '').trim();
    if (urlName) {
    RECIPIENT = urlName.slice(0, 30);
    $('intro').style.display = 'none';
    $('experience').classList.add('active');
    setTimeout(() => runStory(), 300);
    } else {
    setTimeout(() => $('nameInput').focus(), 400);
    }