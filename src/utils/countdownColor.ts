// Maps days remaining to a color from the palette:
// light yellow-green (today) → dark blue (far future)
// Overdue stays red.
export function getCountdownColor(daysRemaining: number): string {
    if (daysRemaining < 0)   return '#dc2626'; // overdue — red
    if (daysRemaining === 0) return '#e8f5a3'; // today
    if (daysRemaining <= 2)  return '#c5e87a'; // 1–2 days
    if (daysRemaining <= 5)  return '#9cd98a'; // 3–5 days
    if (daysRemaining <= 10) return '#72c898'; // 6–10 days
    if (daysRemaining <= 14) return '#4db8a0'; // 11–14 days
    if (daysRemaining <= 21) return '#3aa8a0'; // 15–21 days
    if (daysRemaining <= 30) return '#2e98b0'; // 22–30 days
    if (daysRemaining <= 60) return '#2080b8'; // 31–60 days
    if (daysRemaining <= 90) return '#1a68a8'; // 61–90 days
    if (daysRemaining <= 180) return '#1a5090'; // 91–180 days
    return '#1a3870';                           // 181+ days
}
