export const calculateEndDate = (startDateStr, weeks) => {
  if (!startDateStr || !weeks) return null;
  
  const current = new Date(startDateStr + 'T12:00:00');
  
  // Encontrar el Lunes de la semana actual
  const dayOfWeek = current.getDay();
  // Si es Domingo(0), el lunes fue hace 6 días. Si es otro día, es dayOfWeek - 1.
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const mondayOfThisWeek = new Date(current);
  mondayOfThisWeek.setDate(current.getDate() - daysSinceMonday);

  // El viernes de la última semana (sumamos (weeks - 1) * 7 días al lunes, y luego + 4 días para llegar al viernes)
  const endDate = new Date(mondayOfThisWeek);
  endDate.setDate(mondayOfThisWeek.getDate() + ((weeks - 1) * 7) + 4);
  
  return endDate;
};
