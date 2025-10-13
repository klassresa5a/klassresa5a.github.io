(() => {
  const CFG = window.KLASSRESA_CONFIG || {};
  const CURRENT = Number(CFG.current ?? 0);
  const GOAL    = Number(CFG.goal ?? 1);
  const TICKS   = Array.isArray(CFG.ticks) && CFG.ticks.length >= 2
    ? CFG.ticks.slice()
    : [0, GOAL]; // fallback

  // ===== DOM =====
  const jarFill      = document.getElementById("jarFill");
  const jarLabel     = document.getElementById("jarLabel");
  const timeline     = document.getElementById("timeline");
  const timelineFill = document.getElementById("timelineFill");
  const timelineShip = document.getElementById("timelineShip");
  const events       = Array.from(document.querySelectorAll(".event"));
  const activityItems= document.querySelectorAll(".events li");

  const fmt = n => new Intl.NumberFormat("sv-SE").format(n) + " kr";

  // === Банка ===
  function segmentedPercent(val) {
    const ticks = TICKS;
    const steps = ticks.length - 1;
    if (val <= ticks[0]) return 0;
    if (val >= ticks[steps]) return 1;

    let i = 0;
    for (; i < steps; i++) if (val <= ticks[i + 1]) break;
    const segStart = ticks[i], segEnd = ticks[i + 1];
    const frac = (val - segStart) / (segEnd - segStart);
    return (i + frac) / steps;
  }

  function updateJar() {
    let p = segmentedPercent(CURRENT);
    if (CURRENT > 0 && p < 0.06) p = 0.06; // визуальный минимум
    jarFill.style.height = (p * 100) + "%";
    jarLabel.textContent = fmt(CURRENT);
  }

  // === Таймлайн ===
  function markEvents() {
    events.forEach(ev => {
      const need = Number(ev.dataset.goal) || 0;
      if (CURRENT >= need) ev.classList.add("active", "reached");
      else ev.classList.remove("reached");
    });
  }

  function updateTimeline() {
    if (!timeline || events.length < 2) return;

    const tlRect = timeline.getBoundingClientRect();

    const pts = events.map(ev => {
      const r = ev.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const yRel = mid - tlRect.top;
      return { goal: Number(ev.dataset.goal) || 0, y: yRel };
    });

    // Найти сегмент для CURRENT
    let idx = 0;
    for (; idx < pts.length - 1; idx++) {
      const g0 = Number(events[idx].dataset.goal) || 0;
      const g1 = Number(events[idx + 1].dataset.goal) || 0;
      if (CURRENT >= g0 && CURRENT <= g1) break;
    }

    const g0 = Number(events[idx].dataset.goal) || 0;
    const g1 = Number(events[Math.min(idx + 1, events.length - 1)].dataset.goal) || g0 + 1;
    const y0 = pts[idx].y;
    const y1 = pts[Math.min(idx + 1, pts.length - 1)].y;

    const span = Math.max(1, g1 - g0);
    const frac = Math.min(Math.max((CURRENT - g0) / span, 0), 1);
    let y = y0 + (y1 - y0) * frac;

    // Клипуем в пределах высоты таймлайна
    y = Math.max(0, Math.min(y, tlRect.height));

    // Заливка сверху до кораблика
    timelineFill.style.top    = "0px";
    timelineFill.style.height = y + "px";
    timelineShip.style.top    = y + "px";
  }

  // === Активитеты ===
  function markPastActivities() {
    const now = new Date();
    activityItems.forEach(li => {
      const ds = li.getAttribute("data-date");
      if (!ds) return;
      const dt = new Date(ds);
      if (isFinite(dt)) {
        if (dt < now) li.classList.add("past");
        else li.classList.remove("past");
      }
    });
  }

  function init() {
    updateJar();
    markEvents();
    updateTimeline();
    markPastActivities();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", updateTimeline);
  window.addEventListener("resize", updateTimeline);
})();
