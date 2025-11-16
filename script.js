(() => {
  // ====== CONFIG READ ======
  const CFG     = window.KLASSRESA_CONFIG || {};
  const CURRENT = Number(CFG.current ?? 0);
  const GOAL    = Number(CFG.goal ?? 1);
  const TICKS   = Array.isArray(CFG.ticks) && CFG.ticks.length >= 2 ? CFG.ticks.slice() : [0, GOAL];

  // ====== DOM ======
  const jarFill      = document.getElementById("jarFill");
  const jarLabel     = document.getElementById("jarLabel");
  const timeline     = document.getElementById("timeline");
  const timelineFill = document.getElementById("timelineFill");
  const timelineShip = document.getElementById("timelineShip");
  const events       = Array.from(document.querySelectorAll(".event"));
  const activitiesWrap = document.querySelector(".events");
  let   activitiesList = document.getElementById("activitiesList");

  const fmt = n => new Intl.NumberFormat("sv-SE").format(n) + " kr";

  // =========================================================
  //  A) CONFETTI + “BRA JOBBAT” BANNER (once per session)
  // =========================================================
  function fireConfetti() {
    if (typeof confetti !== 'function') return;
    const end = Date.now() + 800;
    (function frame() {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.2 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
  function showGGBanner() {
    const el = document.getElementById('gg-banner');
    if (!el) return;
    el.hidden = false;
    setTimeout(() => el.classList.add('gg-hide'), 4000);
    setTimeout(() => el.hidden = true, 4600);
  }
  function confettiOncePerSession() {
    const KEY = 'gg_confetti_shown';
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    fireConfetti();
    showGGBanner();
  }

  // =========================================================
  //  B) JAR (segmented scale to match ticks)
  // =========================================================
  function segmentedPercent(val) {
    const steps = TICKS.length - 1;
    if (val <= TICKS[0]) return 0;
    if (val >= TICKS[steps]) return 1;
    let i = 0;
    for (; i < steps; i++) if (val <= TICKS[i + 1]) break;
    const segStart = TICKS[i], segEnd = TICKS[i + 1];
    const frac = (val - segStart) / (segEnd - segStart);
    return (i + frac) / steps;
  }

  function updateJar() {
    let p = segmentedPercent(CURRENT);
    if (CURRENT > 0 && p < 0.06) p = 0.06; // чуть видимой заливки в начале
    jarFill.style.height = (p * 100) + "%";
    jarLabel.textContent = fmt(CURRENT);
  }

  // =========================================================
  //  C) TIMELINE (progress fill + ship position)
  // =========================================================
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
    const pts = events.map(ev => {
      const r = ev.getBoundingClientRect();
      const midY = r.top + r.height / 2;
      return { goal: Number(ev.dataset.goal) || 0, y: midY - tlRect.top };
    });

    // найти участок, где CURRENT
    let idx = 0;
    for (; idx < pts.length - 1; idx++) {
      const g0 = pts[idx].goal, g1 = pts[idx + 1].goal;
      if (CURRENT >= g0 && CURRENT <= g1) break;
    }

    const g0 = pts[idx].goal, g1 = pts[Math.min(idx + 1, pts.length - 1)].goal;
    const y0 = pts[idx].y,    y1 = pts[Math.min(idx + 1, pts.length - 1)].y;
    const span = Math.max(1, g1 - g0);
    const frac = Math.min(Math.max((CURRENT - g0) / span, 0), 1);
    let y = y0 + (y1 - y0) * frac;
    y = Math.max(0, Math.min(y, tlRect.height)); // границы таймлайна

    // заливка от самого верха до кораблика
    timelineFill.style.top    = "0px";
    timelineFill.style.height = y + "px";
    timelineShip.style.top    = y + "px";
  }

  // =========================================================
  //  D) KOMMANDE AKTIVITETER (list + past marking)
  //     supports `label` in config.js to override formatted date
  // =========================================================
  function ensureActivitiesListEl() {
    if (!activitiesList && activitiesWrap) {
      activitiesList = document.createElement("ul");
      activitiesList.id = "activitiesList";
      activitiesWrap.appendChild(activitiesList);
    }
    return activitiesList;
  }

  function formatSvDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  }

  function renderActivities() {
    const list = ensureActivitiesListEl();
    if (!list) return;

    const items = Array.isArray(CFG.activities) ? CFG.activities.slice() : [];
    if (items.length === 0) return;

    list.innerHTML = items.map((a, i) => {
      const dateLabel = a.label || (a.date ? formatSvDate(a.date) : "");
      const dateAttr  = a.date ? ` data-date="${a.date}"` : ""; // только если ISO-дату дали
      const lbl = dateLabel ? `${dateLabel}:` : "";
      return `<li${dateAttr} data-idx="${i}" title="Klicka för info">
        <strong>${lbl}</strong> ${a.text} <span>${a.icon || ""}</span>
      </li>`;
    }).join("");

    // клики -> модалка
    list.querySelectorAll("li[data-idx]").forEach(li => {
      li.addEventListener("click", () => {
        const idx = Number(li.getAttribute("data-idx"));
        openActivityModal(items[idx]);
      });
    });

    markPastActivities();
  }

  function markPastActivities() {
    const now = new Date();
    document.querySelectorAll(".events li[data-date]").forEach(li => {
      const ds = li.getAttribute("data-date");
      const dt = new Date(ds);
      if (!isNaN(dt) && dt < now) li.classList.add("past");
    });
  }

  // =========================================================
  //  E) MODAL + ICS GENERATION
  // =========================================================
  // ---- ICS helpers ----
  function pad2(n){ return String(n).padStart(2,'0'); }
  function fmtICSDate(dt){
    return dt.getFullYear()
      + pad2(dt.getMonth()+1)
      + pad2(dt.getDate())
      + 'T'
      + pad2(dt.getHours())
      + pad2(dt.getMinutes())
      + pad2(dt.getSeconds());
  }
  function fmtICSDateAllDay(dt){
    return dt.getFullYear() + pad2(dt.getMonth()+1) + pad2(dt.getDate());
  }
  // parse "15:00–18:00", "15:00-18:00", "15:00", "TBA"
  function parseTimeRange(timeStr){
    if(!timeStr) return null;
    const clean = timeStr.replace(/\s/g,'');
    if (/^tba$/i.test(clean)) return null;
    const m = clean.match(/^(\d{1,2}):?(\d{2})?(?:[-–](\d{1,2}):?(\d{2})?)?$/);
    if(!m) return null;
    const h1 = parseInt(m[1],10);
    const min1 = m[2]? parseInt(m[2],10):0;
    let h2=null, min2=null;
    if(m[3]){
      h2 = parseInt(m[3],10);
      min2 = m[4]? parseInt(m[4],10):0;
    }
    return { start:{h:h1, m:min1}, end: (h2!=null? {h:h2,m:min2}: null) };
  }
  function makeICS({title, desc, location, url, start, end, allDay=false}){
    const uid = 'klassresa5a-' + Date.now() + '@example';
    const now = new Date();
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Klassresa5A//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nBEGIN:VEVENT\r\n';
    ics += 'UID:' + uid + '\r\n';
    ics += 'DTSTAMP:' + fmtICSDate(now) + '\r\n';
    if(allDay){
      ics += 'DTSTART;VALUE=DATE:' + fmtICSDateAllDay(start) + '\r\n';
      const next = new Date(start); next.setDate(next.getDate()+1);
      ics += 'DTEND;VALUE=DATE:' + fmtICSDateAllDay(next) + '\r\n';
    }else{
      ics += 'DTSTART:' + fmtICSDate(start) + '\r\n';
      ics += 'DTEND:'   + fmtICSDate(end)   + '\r\n';
    }
    ics += 'SUMMARY:' + (title||'Aktivitet') + '\r\n';
    if(location) ics += 'LOCATION:' + location.replace(/\r?\n/g,' ') + '\r\n';
    let descFull = desc || '';
    if(url) descFull += (descFull? ' ': '') + url;
    if(descFull) ics += 'DESCRIPTION:' + descFull.replace(/\r?\n/g,' ') + '\r\n';
    ics += 'END:VEVENT\r\nEND:VCALENDAR\r\n';
    return ics;
  }
  function downloadICS(filename, content){
    const blob = new Blob([content], {type:'text/calendar;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  function openActivityModal(item) {
    const modal = document.getElementById("activityModal");
    if (!modal) return;

    const titleEl = modal.querySelector(".modal__title");
    const metaEl  = modal.querySelector(".modal__meta");
    const descEl  = modal.querySelector(".modal__desc");
    const linkEl  = modal.querySelector(".modal__link");
    const icsBtn  = modal.querySelector(".modal__ics");

    const title = item?.text || "Aktivitet";
    titleEl.textContent = title;

    const dateLabel = item?.label || (item?.date ? formatSvDate(item.date) : "");
    const bits = [];
    if (dateLabel) bits.push(dateLabel);
    if (item?.time) bits.push(item.time);
    if (item?.place) bits.push(item.place);
    metaEl.textContent = bits.join(" • ");

    descEl.textContent = item?.desc || "";

    if (item?.link) {
      linkEl.href = item.link;
      linkEl.hidden = false;
    } else {
      linkEl.hidden = true;
    }

    // ICS availability
    let canICS = !!item?.date && !isNaN(new Date(item.date));
    icsBtn.hidden = !canICS;
    icsBtn.onclick = null;

    if (canICS) {
      icsBtn.onclick = () => {
        const baseDate = new Date(item.date);
        const tr = parseTimeRange(item.time || '');

        let allDay = false;
        let start = new Date(baseDate);
        let end   = new Date(baseDate);

        if (tr && tr.start) {
          start.setHours(tr.start.h, tr.start.m, 0, 0);
          if (tr.end) end.setHours(tr.end.h, tr.end.m, 0, 0);
          else end = new Date(start.getTime() + 90*60*1000); // 1.5h по умолчанию
        } else {
          allDay = true;
        }

        const ics = makeICS({
          title,
          desc: item?.desc || '',
          location: item?.place || '',
          url: item?.link || '',
          start, end, allDay
        });
        const safeName = title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
        downloadICS((safeName || 'aktivitet') + '.ics', ics);
      };
    }

    // show modal
    modal.setAttribute("aria-hidden", "false");

    const close = () => modal.setAttribute("aria-hidden","true");
    modal.querySelectorAll("[data-close]").forEach(btn => btn.onclick = close);
    function escClose(e){ if(e.key === "Escape"){ close(); document.removeEventListener("keydown", escClose);} }
    document.addEventListener("keydown", escClose);
  }

  // ===== AKTUELT =====
function renderAktuellt(){
  const wrap = document.getElementById('aktuelltList');
  if(!wrap) return;
  const items = (window.KLASSRESA_CONFIG && Array.isArray(window.KLASSRESA_CONFIG.aktuellt))
    ? window.KLASSRESA_CONFIG.aktuellt.slice()
    : [];
  if(items.length === 0){ wrap.innerHTML = '<p style="text-align:center;color:#5c7390">Inget nytt just nu.</p>'; return; }

  // отсортируем: новее выше
  items.sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));

  const fmtDate = ds => {
    if(!ds) return '';
    const d = new Date(ds);
    if(isNaN(d)) return ds; // если это уже "Vår 2026" и т.п.
    return d.toLocaleDateString('sv-SE', { day:'numeric', month:'short', year:'numeric' });
  };

  wrap.innerHTML = items.map(item => {
    const isAlbum = item.type === 'album';
    const dateStr = fmtDate(item.date);
    const media = isAlbum && item.coverUrl
      ? `<div class="card__media"><img src="${item.coverUrl}" alt="Omslagsbild: ${item.title||'Album'}"></div>`
      : `<div class="card__media"></div>`;

    const cta = (isAlbum && item.albumUrl)
      ? `<a class="btn btn-primary" href="${item.albumUrl}" target="_blank" rel="noopener">🖼️ ${item.cta || 'Öppna albumet'}</a>`
      : '';

    return `
      <article class="card" data-id="${item.id||''}">
        ${media}
        <div class="card__body">
          <h3 class="card__title">${item.title || (isAlbum ? 'Bildalbum' : 'Aktuellt')}</h3>
          <div class="card__meta">${dateStr}</div>
          <div class="card__text">${item.summary || ''}</div>
        </div>
        <div class="card__actions">
          ${cta}
          ${item.link ? `<a class="btn" href="${item.link}" target="_blank" rel="noopener">Öppna länk</a>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

  // =========================================================
  //  F) INIT
  // =========================================================
  function init() {
    confettiOncePerSession();
    renderActivities();
    renderAktuellt();  
    updateJar();
    markEvents();
    updateTimeline();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", updateTimeline);
})();
