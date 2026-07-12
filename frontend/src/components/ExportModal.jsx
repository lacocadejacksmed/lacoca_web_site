import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, Check, Columns, Users, Database } from 'lucide-react';

const ENTITIES = {
  clientes: {
    label: 'Clientes',
    icon: Users,
    groups: [
      { id: 'todos', label: 'Todos' },
      { id: 'activos', label: 'Sólo Activos' },
      { id: 'vencer', label: 'Por Vencer' },
      { id: 'inactivos', label: 'Inactivos / Vencidos' }
    ],
    columns: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'cedula', label: 'Cédula' },
      { id: 'telefono', label: 'Teléfono' },
      { id: 'correo', label: 'Correo' },
      { id: 'status', label: 'Estado' },
      { id: 'plan', label: 'Plan' },
      { id: 'diasRestantes', label: 'Días Restantes' },
      { id: 'fechaVencimiento', label: 'Vencimiento' },
      { id: 'direccion', label: 'Dirección' },
      { id: 'barrio', label: 'Barrio' },
      { id: 'facturacion', label: 'Facturación' },
      { id: 'alergias', label: 'Alergias' },
      { id: 'restricciones', label: 'Restricciones' }
    ]
  },
  pagos: {
    label: 'Pagos / Comprobantes',
    icon: Database,
    groups: [
      { id: 'todos', label: 'Todos' },
      { id: 'aprobado', label: 'Aprobados' },
      { id: 'pendiente', label: 'Pendientes' },
      { id: 'rechazado', label: 'Rechazados' }
    ],
    columns: [
      { id: 'clienteNombre', label: 'Cliente' },
      { id: 'clienteCedula', label: 'Cédula' },
      { id: 'clienteEmail', label: 'Correo' },
      { id: 'clienteCelular', label: 'Teléfono' },
      { id: 'plan', label: 'Plan Pagado' },
      { id: 'monto', label: 'Monto' },
      { id: 'fecha', label: 'Fecha' },
      { id: 'status', label: 'Estado' },
      { id: 'motivo_rechazo', label: 'Motivo Rechazo' },
      { id: 'tipoEntrega', label: 'Tipo Entrega' }
    ]
  },
  planes: {
    label: 'Planes',
    icon: Database,
    groups: [
      { id: 'todos', label: 'Todos' },
      { id: 'activos', label: 'Activos' },
      { id: 'inactivos', label: 'Inactivos' }
    ],
    columns: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'precio_base', label: 'Precio Base' },
      { id: 'dias_duracion', label: 'Días' },
      { id: 'esta_activo', label: 'Estado' }
    ]
  }
};

const ExportModal = ({ isOpen, onClose, onExport, initialType = 'clientes' }) => {
  const [selectedEntity, setSelectedEntity] = useState(initialType === 'todos' || initialType === 'activos' ? 'clientes' : initialType);
  const [selectedGroup, setSelectedGroup] = useState('todos');
  const [selectedColumns, setSelectedColumns] = useState({});

  useEffect(() => {
    if (isOpen) {
      let entityKey = 'clientes';
      let groupKey = 'todos';
      
      if (initialType === 'activos') {
        groupKey = 'activos';
      } else if (ENTITIES[initialType]) {
        entityKey = initialType;
      }
      
      setSelectedEntity(entityKey);
      setSelectedGroup(groupKey);
      
      // Select all columns by default for the chosen entity
      const cols = {};
      ENTITIES[entityKey].columns.forEach(c => cols[c.id] = true);
      setSelectedColumns(cols);
    }
  }, [isOpen, initialType]);

  const handleEntityChange = (entityKey) => {
    setSelectedEntity(entityKey);
    setSelectedGroup('todos');
    const cols = {};
    ENTITIES[entityKey].columns.forEach(c => cols[c.id] = true);
    setSelectedColumns(cols);
  };

  const handleExport = () => {
    const activeColumns = Object.keys(selectedColumns).filter(k => selectedColumns[k]);
    onExport(selectedEntity, selectedGroup, activeColumns);
    onClose();
  };

  if (!isOpen) return null;

  const currentEntity = ENTITIES[selectedEntity];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 md:p-8 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Exportación Inteligente</h2>
              <p className="text-slate-400 font-medium mt-1">Exporta cualquier tabla de la base de datos a Excel.</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto space-y-8">
            
            {/* 1. Selector de Entidad */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database size={18} className="text-orange-500" />
                <h3 className="font-black text-slate-800 tracking-tight">1. ¿Qué información deseas exportar?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(ENTITIES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleEntityChange(key)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedEntity === key 
                        ? 'border-orange-500 bg-orange-50 text-orange-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-orange-200'
                    }`}
                  >
                    <config.icon size={16} />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Filtro de Grupo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-blue-500" />
                <h3 className="font-black text-slate-800 tracking-tight">2. Filtrar por Estado</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {currentEntity.groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedGroup === group.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-blue-200'
                    }`}
                  >
                    {selectedGroup === group.id && <Check size={16} />}
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Selector de Columnas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Columns size={18} className="text-green-500" />
                  <h3 className="font-black text-slate-800 tracking-tight">3. ¿Qué columnas deseas incluir?</h3>
                </div>
                <button 
                  onClick={() => {
                    const allTrue = {};
                    currentEntity.columns.forEach(c => allTrue[c.id] = true);
                    setSelectedColumns(allTrue);
                  }}
                  className="text-xs font-bold text-green-600 hover:text-green-800"
                >
                  Seleccionar Todas
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentEntity.columns.map(col => (
                  <label 
                    key={col.id} 
                    className={`flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedColumns[col.id] ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50 hover:border-green-200'
                    }`}
                  >
                    <div className={`shrink-0 w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${
                      selectedColumns[col.id] ? 'bg-green-600' : 'bg-slate-200'
                    }`}>
                      {selectedColumns[col.id] && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-xs font-bold truncate ${selectedColumns[col.id] ? 'text-green-900' : 'text-slate-600'}`}>
                      {col.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100 flex justify-end gap-4 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={Object.values(selectedColumns).every(v => !v)}
              className="px-8 py-3 rounded-xl font-black text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={18} />
              Generar Excel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;
