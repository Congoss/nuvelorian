export function computeGlobalWeekDay(utcTime = Date.now()) {
  const date = new Date(utcTime);
  const day = date.getUTCDay() || 7;
  return Math.min(Math.max(day, 1), 7);
}

export function getUtcDateKey(utcTime = Date.now()) {
  return new Date(utcTime).toISOString().slice(0, 10);
}

export function getUtcWeekStartKey(utcTime = Date.now()) {
  const date = new Date(utcTime);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export function getPreviousUtcDateKey(utcTime = Date.now()) {
  const date = new Date(utcTime);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function getGlobalWeekMeta(utcTime = Date.now()) {
  return {
    currentDayIndex: computeGlobalWeekDay(utcTime),
    currentDateKey: getUtcDateKey(utcTime),
    previousDateKey: getPreviousUtcDateKey(utcTime),
    currentWeekKey: getUtcWeekStartKey(utcTime),
  };
}
