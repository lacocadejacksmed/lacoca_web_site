const { getColombianHolidays } = require('./src/utils/colombianHolidays.js'); // Not easily importable if it uses export. Let's redefine.
const holidays = ['2026-07-13', '2026-07-20'];
const planName = 'quincenal';
let weeks = 2;
let baseDays = 10;
let formData = { fecha_inicio: '2026-07-14' }; // They probably picked Tuesday!
const calculateEndDate = (startDateStr, weeks) => {
  const current = new Date(startDateStr + 'T12:00:00');
  const dayOfWeek = current.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayOfThisWeek = new Date(current);
  mondayOfThisWeek.setDate(current.getDate() - daysSinceMonday);
  const endDate = new Date(mondayOfThisWeek);
  endDate.setDate(mondayOfThisWeek.getDate() + ((weeks - 1) * 7) + 4);
  return endDate;
};
const endDate = calculateEndDate(formData.fecha_inicio, weeks);
console.log('EndDate:', endDate);
let holidaysFound = 0;
const start = new Date(formData.fecha_inicio + 'T12:00:00');
const dayOfWeek = start.getDay();
const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
const current = new Date(start);
current.setDate(start.getDate() - daysSinceMonday);
const end = new Date(endDate);
const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
};
while (current <= end) {
  if (holidays.includes(fmt(current)) && current.getDay() !== 0 && current.getDay() !== 6) {
    holidaysFound++;
    console.log('Found holiday:', fmt(current));
  }
  current.setDate(current.getDate() + 1);
}
console.log('Total holidays found:', holidaysFound);
