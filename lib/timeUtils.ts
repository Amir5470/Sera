export const parseTimeToMinutes = (time?: string) => {
  if (!time) return null;
  const trimmed = time.trim().toLowerCase();
  const match = trimmed.match(/^(\d{1,2})(?:\:(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const meridiem = match[3];

  if (meridiem === "am") {
    if (hours === 12) hours = 0;
  } else if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
};

export const hasMeridiem = (time?: string) =>
  !!time?.trim().match(/\b(am|pm)\b/i);
