import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { Spinner } from './components/ui';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import Phases from './pages/Phases';
import PhaseDetail from './pages/PhaseDetail';
import Costs from './pages/Costs';
import Reminders from './pages/Reminders';
import HouseAreas from './pages/HouseAreas';
import Settings from './pages/Settings';

function HouseRoute() {
  const { enableHouseModule } = useData();
  return enableHouseModule ? <HouseAreas /> : <Navigate to="/" replace />;
}

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/phases" element={<Phases />} />
        <Route path="/phases/:id" element={<PhaseDetail />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/house" element={<HouseRoute />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
