// Calculador de Festivos de Colombia (Ley Emiliani)

const calculateEaster = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const nextMonday = (date) => {
  const newDate = new Date(date);
  const dayOfWeek = newDate.getDay();
  if (dayOfWeek === 1) return newDate; // Si es lunes, se queda
  const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  newDate.setDate(newDate.getDate() + daysToAdd);
  return newDate;
};

const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getColombianHolidays = (year) => {
  const holidays = [];

  const add = (date, name) => holidays.push({ date: formatDate(date), name });

  // Festivos fijos
  add(new Date(year, 0, 1), "Año Nuevo");
  add(new Date(year, 4, 1), "Día del Trabajo");
  add(new Date(year, 6, 20), "Día de la Independencia");
  add(new Date(year, 7, 7), "Batalla de Boyacá");
  add(new Date(year, 11, 8), "Inmaculada Concepción");
  add(new Date(year, 11, 25), "Navidad");

  // Festivos trasladables al lunes
  add(nextMonday(new Date(year, 0, 6)), "Reyes Magos");
  add(nextMonday(new Date(year, 2, 19)), "San José");
  add(nextMonday(new Date(year, 5, 29)), "San Pedro y San Pablo");
  add(nextMonday(new Date(year, 7, 15)), "Asunción de la Virgen");
  add(nextMonday(new Date(year, 9, 12)), "Día de la Raza");
  add(nextMonday(new Date(year, 10, 1)), "Todos los Santos");
  add(nextMonday(new Date(year, 10, 11)), "Independencia de Cartagena");

  // Festivos relativos a Semana Santa
  const easter = calculateEaster(year);
  add(addDays(easter, -3), "Jueves Santo");
  add(addDays(easter, -2), "Viernes Santo");
  add(nextMonday(addDays(easter, 43)), "Ascensión de Jesús");
  add(nextMonday(addDays(easter, 64)), "Corpus Christi");
  add(nextMonday(addDays(easter, 71)), "Sagrado Corazón");

  return holidays;
};

export const getHolidaysInRange = (startYear, endYear) => {
  let allHolidays = [];
  for (let y = startYear; y <= endYear; y++) {
    allHolidays = allHolidays.concat(getColombianHolidays(y));
  }
  return allHolidays;
};
