import { BellSchedule } from "./bellSchedules";

const normalizePeriod = (period: string) =>
  period
    .toLowerCase()
    .replace(/period/g, "")
    .replace(/(st|nd|rd|th)/g, "")
    .trim()
    .replace(/^0+/, "");

const getPeriodSortValue = (period: string) => {
  const value = Number.parseInt(normalizePeriod(period), 10);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

const sortPeriods = (periods: string[]) =>
  [...periods].sort((a, b) => getPeriodSortValue(a) - getPeriodSortValue(b));

const toMinutesForSort = (time?: string) => {
  if (!time || !time.includes(":")) return Number.MAX_SAFE_INTEGER;
  const [hStr, mStr] = time.split(":").map((s) => s.trim());
  const h = Number.parseInt(hStr || "0", 10);
  const m = Number.parseInt(mStr || "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m))
    return Number.MAX_SAFE_INTEGER;
  return h < 7 ? (h + 12) * 60 + m : h * 60 + m;
};

export const computeNextClass = (
  classRooms?: any[],
  activeSchedule?: BellSchedule | null,
  nowDate: Date = new Date(),
) => {
  if (!classRooms || classRooms.length === 0) return null;

  const day = nowDate.getDay();
  if (day === 0 || day === 6) return null; // weekend

  const activePeriods = activeSchedule
    ? sortPeriods(activeSchedule.periods.map((p) => p.period))
    : [];

  const activePeriodOrder = new Map(
    activePeriods.map((period, index) => [normalizePeriod(period), index]),
  );
  const activePeriodSet = new Set(activePeriods.map(normalizePeriod));

  const visibleClasses = activePeriods.length
    ? classRooms.filter((cls) =>
        activePeriodSet.has(normalizePeriod(cls.period)),
      )
    : classRooms;

  const sorted = [...visibleClasses].sort((a, b) => {
    const orderA =
      activePeriodOrder.get(normalizePeriod(a.period)) ??
      Number.MAX_SAFE_INTEGER;
    const orderB =
      activePeriodOrder.get(normalizePeriod(b.period)) ??
      Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return toMinutesForSort(a.startTime) - toMinutesForSort(b.startTime);
  });

  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  const current = sorted.find((c) => {
    const start = toMinutesForSort(c.startTime);
    const end = toMinutesForSort(c.endTime);
    return nowMinutes >= start && nowMinutes < end;
  });
  if (current) return { label: "Now", cls: current };

  const upcoming = sorted.find(
    (c) => toMinutesForSort(c.startTime) > nowMinutes,
  );
  if (upcoming) return { label: "Next", cls: upcoming };

  if (sorted.length > 0) {
    return { label: "Tomorrow", cls: sorted[0] };
  }

  return null;
};

export default computeNextClass;
