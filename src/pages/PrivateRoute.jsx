// src/pages/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("access_token");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se for usado como wrapper (ex: <PrivateRoute><Layout /></PrivateRoute>)
  if (children) return children;

  // Se for usado com rotas aninhadas (Outlet)
  return <Outlet />;
};

export default PrivateRoute;