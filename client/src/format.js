export function formatHour(hour) {
  const h = ((Math.round(hour) % 24) + 24) % 24
  const suffix = h >= 12 ? "pm" : "am"
  const h12 = h % 12 || 12
  return `${h12}:00 ${suffix}`
}
