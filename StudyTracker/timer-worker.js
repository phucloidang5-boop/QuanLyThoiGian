    /* ═══════════════════════════════════════════════════════════
        STUDY TRACKER — timer-worker.js
        Web Worker đếm giờ ngầm không bị trình duyệt throttle
    ═══════════════════════════════════════════════════════════ */
    let timerId = null;

    self.onmessage = function (e) {
    if (e.data === 'start') {
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => {
        self.postMessage('tick');
        }, 250);
    } else if (e.data === 'stop') {
        if (timerId) {
        clearInterval(timerId);
        timerId = null;
        }
    }
    };