// Layout.jsx - Wrapper principal para organizar o layout
import { Outlet } from 'react-router-dom';
import MenuLateral from './MenuLateral';
import './layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <MenuLateral />
      <main className="app-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
