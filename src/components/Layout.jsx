// Layout.jsx - Wrapper apenas para páginas COM menu
import { Outlet } from 'react-router-dom';
import MenuLateral from './MenuLateral';

export default function Layout() {
  return (
    <div className="app-layout">
      <MenuLateral />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}