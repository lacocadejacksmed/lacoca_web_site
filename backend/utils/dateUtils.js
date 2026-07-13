const { getHolidaysInRange } = require('./colombianHolidays');

const calcularVencimiento = (fechaInicioStr, planNombre, planDiasDuracion, feriadosDocs = [], estado) => {
    if (!fechaInicioStr) return { fechaVencimiento: null, diasRestantes: 0 };
    
    // Determinar semanas del plan
    let weeks = 1;
    let baseDias = 5;
    const p = (planNombre || '').toLowerCase();
    
    if (p === 'semanal') { weeks = 1; baseDias = 5; }
    else if (p === 'quincenal') { weeks = 2; baseDias = 10; }
    else if (p === 'mensual') { weeks = 4; baseDias = 20; }
    else { 
      baseDias = planDiasDuracion || 5; 
      weeks = Math.ceil(baseDias / 5) || 1;
    }

    const [year, month, day] = fechaInicioStr.split('-').map(Number);
    // Utilizamos mediodía para evitar problemas de zona horaria
    const start = new Date(year, month - 1, day, 12, 0, 0);
    
    const dbActive = feriadosDocs.filter(f => f.activo !== false).map(f => typeof f === 'string' ? f : f.fecha);
    const dbIgnored = new Set(feriadosDocs.filter(f => f.activo === false).map(f => typeof f === 'string' ? null : f.fecha));

    const currentYear = start.getFullYear();
    let autoHolidays = getHolidaysInRange(currentYear, currentYear + 1).map(h => h.date);
    
    // Filtramos los ignorados
    autoHolidays = autoHolidays.filter(date => !dbIgnored.has(date));

    const combinedHolidays = [...new Set([...autoHolidays, ...dbActive])];
    
    const feriadosSet = new Set(combinedHolidays);

    // Calcular la fecha de vencimiento (Viernes de la semana N)
    const dayOfWeek = start.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayOfThisWeek = new Date(start);
    mondayOfThisWeek.setDate(start.getDate() - daysSinceMonday);

    const endDate = new Date(mondayOfThisWeek);
    endDate.setDate(mondayOfThisWeek.getDate() + ((weeks - 1) * 7) + 4);

    // Deducir del planDias los festivos que caen en este rango de calendario
    let holidaysInWindow = 0;
    const tempHolidayCursor = new Date(mondayOfThisWeek);
    tempHolidayCursor.setHours(12,0,0,0);
    
    const endCursor = new Date(endDate);
    endCursor.setHours(12,0,0,0);
    
    const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const d_str = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${d_str}`;
    };

    while (tempHolidayCursor <= endCursor) {
        const dow = tempHolidayCursor.getDay();
        const localDateStr = fmt(tempHolidayCursor);
        if (dow !== 0 && dow !== 6 && feriadosSet.has(localDateStr)) {
            holidaysInWindow++;
        }
        tempHolidayCursor.setDate(tempHolidayCursor.getDate() + 1);
    }

    let planDias = baseDias - holidaysInWindow;
    if (planDias < 1) planDias = 1; // Seguridad mínima

    // Calcular días consumidos desde start hasta HOY
    const today = new Date();
    today.setHours(12,0,0,0);

    let consumidos = 0;
    
    if (estado === 'Activo') {
        let temp = new Date(start);
        temp.setHours(12,0,0,0);

        while (temp < today && temp <= endCursor) {
            const dow = temp.getDay();
            const localDateStr = fmt(temp);

            if (dow !== 0 && dow !== 6 && !feriadosSet.has(localDateStr)) {
                consumidos++;
            }
            temp.setDate(temp.getDate() + 1);
        }
    } else if (estado === 'Cancelado' || estado === 'Vencido') {
        consumidos = planDias; // 0 restantes
    } else {
        // Pendiente, etc.
        consumidos = 0;
    }

    const diasRestantes = Math.max(0, planDias - consumidos);

    return {
        fechaVencimiento: fmt(endDate),
        diasRestantes
    };
};

module.exports = { calcularVencimiento };
