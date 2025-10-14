(() => {

    // === Confetti on first visit or reload ===
  function fireConfetti() {
    // веер из 2 залпов
    const end = Date.now() + 800;
    (function frame() {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.2 }
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
  function showGGBanner() {
    const el = document.getElementById('gg-banner');
    if (!el) return;
    el.hidden = false;
    // скрыть через 2.2 сек
    setTimeout(()=> el.classList.add('gg-hide'), 3500);
    setTimeout(()=> el.hidden = true, 4000);
  }
  function confettiOncePerSession() {
    const KEY = 'gg_confetti_shown';
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    fireConfetti();
    showGGBanner();
  }

  
  // ===== Чтение конфига =====
  const CFG     = window.KLASSRESA_CONFIG || {};
  const CURRENT = Number(CFG.current ?? 0);
  const GOAL    = Number(CFG.goal ?? 1);
  const TICKS   = Array.isArray(CFG.ticks) && CFG.ticks.length >= 2 ? CFG.ticks.slice() : [0, GOAL];

  // ===== DOM =====
  const jarFill      = document.getElementById("jarFill");
  const jarLabel     = document.getElementById("jarLabel");
  const timeline     = document.getElementById("timeline");
  const timelineFill = document.getElementById("timelineFill");
  const timelineShip = document.getElementById("timelineShip");
  const events       = Array.from(document.querySelectorAll(".event"));
  const activitiesWrap = document.querySelector(".events");
  let   activitiesList = document.getElementById("activitiesList");

  const fmt = n => new Intl.NumberFormat("sv-SE").format(n) + " kr";

  // ===== Банка: проекция суммы на равные сегменты =====
  function segmentedPercent(val) {
    const steps = TICKS.length - 1;
    if (val <= TICKS[0]) return 0;
    if (val >= TICKS[steps]) return 1;

    let i = 0;
    for (; i < steps; i++) if (val <= TICKS[i + 1]) break;
    const segStart = TICKS[i], segEnd = TICKS[i + 1];
    const frac = (val - segStart) / (segEnd - segStart); // 0..1 внутри сегмента
    return (i + frac) / steps;                           // 0..1 по всей высоте
  }

  function updateJar() {
    let p = segmentedPercent(CURRENT);
    if (CURRENT > 0 && p < 0.06) p = 0.06; // минимальная видимая заливка
    jarFill.style.height = (p * 100) + "%";
    jarLabel.textContent = fmt(CURRENT);
  }

  // ===== Таймлайн =====
  function markEvents() {
    events.forEach(ev => {
      const need = Number(ev.dataset.goal) || 0;
      if (CURRENT >= need) ev.classList.add("active");
      else ev.classList.remove("active");
    });
  }

  function updateTimeline() {
    if (!timeline || events.length < 2) return;

    const tlRect = timeline.getBoundingClientRect();

    // Берём центр карточек событий, переводим в координаты относительно таймлайна
    const pts = events.map(ev => {
      const r = ev.getBoundingClientRect();
      const midY = r.top + r.height / 2;
      return { goal: Number(ev.dataset.goal) || 0, y: midY - tlRect.top };
    });

    // Найти segment [idx..idx+1], где лежит CURRENT
    let idx = 0;
    for (; idx < pts.length - 1; idx++) {
      const g0 = pts[idx].goal, g1 = pts[idx + 1].goal;
      if (CURRENT >= g0 && CURRENT <= g1) break;
    }

    const g0 = pts[idx].goal, g1 = pts[idx + 1].goal;
    const y0 = pts[idx].y,    y1 = pts[idx + 1].y;
    const span = Math.max(1, g1 - g0);
    const frac = Math.min(Math.max((CURRENT - g0) / span, 0), 1);
    let y = y0 + (y1 - y0) * frac;

    // Защита по краям
    y = Math.max(0, Math.min(y, tlRect.height));

    // Заливка — от самого верха линии до кораблика
    timelineFill.style.top    = "0px";
    timelineFill.style.height = y + "px";
    timelineShip.style.top    = y + "px";
  }

  // ===== Комmande aktiviteter =====
  function ensureActivitiesList() {
    if (!activitiesList && activitiesWrap) {
      activitiesList = document.createElement("ul");
      activitiesList.id = "activitiesList";
      activitiesWrap.appendChild(activitiesList);
    }
    return activitiesList;
  }

  function renderActivities() {
    const list = ensureActivitiesList();
    if (!list) return;

    let items = Array.isArray(CFG.activities) ? CFG.activities.slice() : [];

    // Фолбэк, если конфиг пустой/не загрузился
    if (items.length === 0) {
      items = [
        { date: "2025-09-29", text: "Start försäljning (Kakservice)", icon: "🍪" },
        { date: "2025-10-16", text: "Sista beställningsdag",          icon: "📦" },
        { date: "2025-11-15", text: "Halloweenfest i lokalen",        icon: "🎃" }
      ];
    }

    list.innerHTML = items.map(a => {
      const d = new Date(a.date);
      const label = isNaN(d) ? a.date : d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
      return `<li data-date="${a.date}">
        <strong>${label}:</strong> ${a.text} <span>${a.icon || ""}</span>
      </li>`;
    }).join("");

    markPastActivities();
  }

  function markPastActivities() {
    const now = new Date();
    document.querySelectorAll(".events li").forEach(li => {
      const ds = li.getAttribute("data-date");
      if (!ds) return;
      const dt = new Date(ds);
      if (!isNaN(dt) && dt < now) li.classList.add("past");
    });
  }

  // ===== Init =====
  function init() {
    confettiOncePerSession(); //запуск кофетти
    renderActivities();
    updateJar();
    markEvents();
    updateTimeline();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", updateTimeline);
})();
