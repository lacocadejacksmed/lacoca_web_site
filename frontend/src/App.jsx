import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing2 from './pages/Landing2';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ClientDashboard from './pages/ClientDashboard';

import { useState, useEffect } from 'react';
import api from './services/api';

// Componente para proteger rutas con roles
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    
    // Si la ruta no es solo para admin, con tener token dejamos pasar 
    // (el backend igual protegerá sus propios endpoints)
    if (!adminOnly) {
      setIsAuthorized(true);
      return;
    }

    // Validación estricta con el backend para evitar manipulación del localStorage
    api.get('/auth/me')
      .then(res => {
        if (res.data?.success && res.data.usuario?.rol === 'admin') {
          // Actualizamos el localStorage en caso de que lo hayan corrompido, pero sea admin real
          localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      })
      .catch(() => {
        setIsAuthorized(false);
      });
  }, [token, adminOnly]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to={token ? "/dashboard" : "/login"} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/registro" element={<Landing2 defaultWizardOpen={true} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <Admin />
            </ProtectedRoute>
          } 
        />
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
