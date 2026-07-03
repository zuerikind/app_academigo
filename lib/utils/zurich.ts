// Booking/lesson times are stored as Swiss wall-clock labeled UTC (project
// convention — see CLAUDE.md memory "timezone UTC rule"). These helpers bridge
// real instants and that stored representation.

/** Milliseconds to ADD to a real UTC instant to get its stored (Zurich wall-clock-as-UTC) representation. */
export function zurichOffsetMs(at: Date): number {
  const wall = new Date(at.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  const utc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  return wall.getTime() - utc.getTime();
}

/** Current date ("YYYY-MM-DD") and time ("HH:MM") on the wall clock in Zurich. */
export function zurichNow(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}
