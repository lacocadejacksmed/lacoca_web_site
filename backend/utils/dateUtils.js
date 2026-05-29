const calcularVencimiento = (fechaInicioStr, planNombre, planDiasDuracion, feriadosArray, estado) => {
    if (!fechaInicioStr) return { fechaVencimiento: null, diasRestantes: 0 };
    
    // Determinar días del plan
    let planDias = 0;
    const p = (planNombre || '').toLowerCase();
    if (p === 'semanal') planDias = 5;
    else if (p === 'quincenal') planDias = 10;
    else if (p === 'mensual') planDias = 20;
    else planDias = planDiasDuracion || 5;

    const [year, month, day] = fechaInicioStr.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    const feriadosSet = new Set(feriadosArray);

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
