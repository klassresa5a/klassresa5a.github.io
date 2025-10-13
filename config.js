// === KLASSRESA 5A — КОНФИГ ===
window.KLASSRESA_CONFIG = {
  // Текущая сумма и цель
  current: 11154,
  goal: 70000,

  // Деления (снизу вверх) — должны соответствовать логике меток справа от банки
  // Пример под ваши текущие подписи: 0, 10k, 15k, 20k, 30k, 70k
  ticks: [0, 10000, 15000, 20000, 30000, 70000],

  // События на таймлайне (data-goal уже есть в HTML, тут — только подписи для контрольной проверки)
  milestones: [
    { goal: 0,     name: "Start" },
    { goal: 10000, name: "Halloween fest" },
    { goal: 15000, name: "Filmkväll" },
    { goal: 20000, name: "Glassfest" },
    { goal: 30000, name: "Discofest" },
    { goal: 70000, name: "Klassresan" }
  ],

  // Список «Комmande aktiviteter» (если хотите — можно из конфига рендерить автоматически)
  // Сейчас оставляем как справочно/для будущего
  activities: [
    { date: "2025-09-29", text: "Start försäljning (Kakservice)", icon: "🍪" },
    { date: "2025-10-16", text: "Sista beställningsdag",          icon: "📦" },
    { date: "2025-11-15", text: "Halloweenfest i lokalen",        icon: "🎃" },
    { date: "2025-11-30", text: "Slutet av nov: Nästa försäljning", icon: "💰" },
    { date: "2026-01-01", text: "Januari–februari: Filmkväll",    icon: "🎬" },
    { date: "2026-04-01", text: "Vår 2026: Garage loppis",        icon: "♻️" },
    { date: "2026-05-01", text: "Vår 2026: Nästa försäljning",    icon: "💰" },
    { date: "2026-06-01", text: "Juni 2026: Sommar picnic",       icon: "🫕" }
  ]
};
