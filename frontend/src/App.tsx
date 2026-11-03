import { useCallback, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { sessionStore, setUnauthorizedHandler } from './services/api';
import { canAccess, RouteKey, routes } from './routes';
import type { Session } from './types/api';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { SalesPage } from './pages/SalesPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { useToast } from './components/Toast';

const readRoute = (): RouteKey => {
  const key = window.location.hash.replace('#/', '').replace('#', '') as RouteKey;
  return routes.some((r) => r.key === key) ? key : 'dashboard';
};

export default function App() {
  const [session, setSession] = useState<Session | null>(() => sessionStore.get());
  const [route, setRoute] = useState<RouteKey>(readRoute);
  const toast = useToast();

  const logout = useCallback(() => {
    sessionStore.clear();
    setSession(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
      toast.error('Sesi login berakhir. Silakan masuk kembali.');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (key: RouteKey) => {
    window.location.hash = `/${key}`;
    setRoute(key);
  };

  if (!session) {
    return <LoginPage onLogin={(s) => { sessionStore.set(s); setSession(s); }} />;
  }

  const active = canAccess(route, session.role) ? route : 'dashboard';

  const page = {
    dashboard: <DashboardPage session={session} onNavigate={navigate} />,
    pos: <PosPage session={session} />,
    sales: <SalesPage session={session} />,
    customers: <CustomersPage session={session} />,
    products: <ProductsPage />,
    categories: <CategoriesPage />,
    inventory: <InventoryPage />,
    purchases: <PurchasesPage />,
    suppliers: <SuppliersPage />,
    reports: <ReportsPage />,
    users: <UsersPage session={session} />,
    settings: <SettingsPage session={session} />,
  }[active];

  return (
    <Layout session={session} current={active} onNavigate={navigate} onLogout={logout}>
      {page}
    </Layout>
  );
}
