// === KLASSRESA 5A – KONFIGURATION ===
window.KLASSRESA_CONFIG = {
  // Текущая сумма и цель
  current: 13200,
  goal: 70000,

  // Деления банки (снизу вверх). Должны логически соответствовать меткам справа от банки.
  // Пример: 0, 10k, 15k, 20k, 30k, 70k
  ticks: [0, 10000, 15000, 20000, 30000, 70000],

  // Комmande aktiviteter: можно редактировать здесь, HTML рендерится автоматически
  activities: [
    { date: "2025-09-29", text: "Start försäljning (Kakservice)", icon: "🍪" },
    { date: "2025-10-16", text: "Sista beställningsdag",          icon: "📦" },
    { date: "2025-11-15", text: "Halloweenfest i lokalen",        icon: "🎃" },
    { date: "Slutet av nov", text: "Nästa försäljning", icon: "💰" },
    { date: "Jan–feb", text: "Filmkväll",    icon: "🎬" },
    { date: "Vår 2026", text: "Garage loppis",        icon: "♻️" },
    { date: "Vår 2026", text: "Nästa försäljning",    icon: "💰" },
    { date: "Juni 2026", text: "Sommar picnic",       icon: "🫕" }
  ]
};
