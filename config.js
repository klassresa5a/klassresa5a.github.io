// === KLASSRESA 5A – KONFIGURATION ===
window.KLASSRESA_CONFIG = {
  // Текущая сумма и цель
  current: 11154,
  goal: 70000,

  // Деления банки (снизу вверх). Должны логически соответствовать меткам справа от банки.
  // Пример: 0, 10k, 15k, 20k, 30k, 70k
  ticks: [0, 10000, 15000, 20000, 30000, 70000],

  // Комmande aktiviteter: можно редактировать здесь, HTML рендерится автоматически
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
