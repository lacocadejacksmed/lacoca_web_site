const calcularVencimiento = (fechaInicioStr, planNombre, planDiasDuracion, feriadosArray, estado) => {
    if (!fechaInicioStr) return { fechaVencimiento: null, diasRestantes: 0 };
    
    // Determinar días del plan y la ventana de calendario
    let planDias = 0;
    let baseCalendarDays = 4;
    const p = (planNombre || '').toLowerCase();
    
    if (p === 'semanal') { planDias = 5; baseCalendarDays = 4; }
    else if (p === 'quincenal') { planDias = 10; baseCalendarDays = 11; }
    else if (p === 'mensual') { planDias = 20; baseCalendarDays = 25; }
    else { 
      planDias = planDiasDuracion || 5; 
      baseCalendarDays = planDias > 0 ? planDias - 1 : 4; 
    }

    const [year, month, day] = fechaInicioStr.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    const feriadosSet = new Set(feriadosArray);

    // Deducir del planDias los festivos que caen en su ventana normal
    let holidaysInWindow = 0;
    const windowEnd = new Date(start);
    windowEnd.setDate(windowEnd.getDate() + baseCalendarDays);
    
    let tempHolidayCursor = new Date(start);
    while (tempHolidayCursor <= windowEnd) {
        const dayOfWeek = tempHolidayCursor.getDay();
        const y = tempHolidayCursor.getFullYear();
        const m = String(tempHolidayCursor.getMonth() + 1).padStart(2, '0');
        const d = String(tempHolidayCursor.getDate()).padStart(2, '0');
        const localDateStr = `${y}-${m}-${d}`;
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && feriadosSet.has(localDateStr)) {
            holidaysInWindow++;
        }
        tempHolidayCursor.setDate(tempHolidayCursor.getDate() + 1);
    }

    planDias = planDias - holidaysInWindow;
    if (planDias < 1) planDias = 1; // Seguridad

    let current = new Date(start);
    let validDaysAdded = 0;
    let fechaVencimiento = new Date(start);

    // Encontrar la fecha de vencimiento teórica
    while (validDaysAdded < planDias) {
        const dayOfWeek = current.getDay();
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        const localDateStr = `${y}-${m}-${d}`;

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !feriadosSet.has(localDateStr)) {
            validDaysAdded++;
            fechaVencimiento = new Date(current); // La última fecha válida es la de vencimiento
        }
        current.setDate(current.getDate() + 1);
    }

    // Calcular días consumidos desde start hasta HOY
    const today = new Date();
    today.setHours(0,0,0,0);

    let consumidos = 0;
    
    if (estado === 'Activo') {
        let temp = new Date(start);
        temp.setHours(0,0,0,0);

        while (temp < today) {
            const dayOfWeek = temp.getDay();
            const y = temp.getFullYear();
            const m = String(temp.getMonth() + 1).padStart(2, '0');
            const d = String(temp.getDate()).padStart(2, '0');
            const localDateStr = `${y}-${m}-${d}`;

            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !feriadosSet.has(localDateStr)) {
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

    const diasRestantes = planDias - consumidos;

    const vencY = fechaVencimiento.getFullYear();
    const vencM = String(fechaVencimiento.getMonth() + 1).padStart(2, '0');
    const vencD = String(fechaVencimiento.getDate()).padStart(2, '0');

    return {
        fechaVencimiento: `${vencY}-${vencM}-${vencD}`,
        diasRestantes
    };
};

module.exports = { calcularVencimiento };
