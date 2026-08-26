/**
 * Date helper for Gameopedia Sports Signups
 * Rule: Signups for next week close by 6:00 PM Friday of the current week.
 */

export function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

export function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function getWeekId(mondayDate) {
  const d = new Date(mondayDate);
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

export function getNextWeekSignupInfo(referenceDate = new Date()) {
  const { monday: currentMonday } = getWeekRange(referenceDate);
  
  // Next week Monday to Sunday
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);

  // Signup deadline: Friday of CURRENT week at 18:00 (6:00 PM)
  const fridayDeadline = new Date(currentMonday);
  fridayDeadline.setDate(currentMonday.getDate() + 4); // Monday + 4 = Friday
  fridayDeadline.setHours(18, 0, 0, 0); // 6:00 PM

  const now = new Date(referenceDate);
  const isSignupOpen = now <= fridayDeadline;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const nextWeekDays = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i);
    nextWeekDays.push({
      dayIndex: i,
      dayOfWeekNumber: d.getDay(),
      dayName: dayNames[i],
      dateKey: formatDateKey(d),
      displayDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    });
  }

  return {
    weekId: getWeekId(nextMonday),
    startDate: formatDateKey(nextMonday),
    endDate: formatDateKey(nextSunday),
    label: `Next Week (${nextMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${nextSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
    fridayDeadline: fridayDeadline.toISOString(),
    fridayDeadlineDisplay: `Friday ${fridayDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at 6:00 PM`,
    isSignupOpen,
    days: nextWeekDays
  };
}
