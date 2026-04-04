export const getLast7Days = () => {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [];

  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const monday = new Date(today);
  const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysFromMonday = currentDay === 0 ? -6 : 1 - currentDay;
  monday.setDate(today.getDate() + daysFromMonday);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    result.push({
      day: daysOfWeek[date.getDay()],
      date: getLocalDateKey(date),
      income: 0,
      expense: 0,
    });
  }

  return result;
};
