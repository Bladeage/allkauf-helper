import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { Spinner } from './components/ui';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import Phases from './pages/Phases';
import PhaseDetail from './pages/PhaseDetail';
import Costs from './pages/Costs';
import Reminders from './pages/Reminders';
import Defects from './pages/Defects';
import Diary from './pages/Diary';
import Payments from './pages/Payments';
import Contacts from './pages/Contacts';
import HouseAreas from './pages/HouseAreas';
import Settings from './pages/Settings';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import { ReloadPrompt } from './components/ReloadPrompt';

// Remount bei Phasenwechsel, damit keine alten Daten unter neuer URL aufblitzen
function PhaseDetailRoute() {
  const { id } = useParams();
  return <PhaseDetail key={id} />;
}

function AdminRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Users /> : <Navigate to="/" replace />;
}

function HouseRoute() {
  const { enableHouseModule, ready } = useData();
  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner />
      </div>
    );
  }
  return enableHouseModule ? <HouseAreas /> : <Navigate to="/" replace />;
}

export default function App() {
  const { user, ready, needsSetup } = useAuth();

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    // Frische Instanz ohne jeden Nutzer -> geführte Ersteinrichtung statt Login.
    const Entry = needsSetup ? Onboarding : Login;
    return (
      <Routes>
        <Route path="*" element={<Entry />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/phases" element={<Phases />} />
          <Route path="/phases/:id" element={<PhaseDetailRoute />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/defects" element={<Defects />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/house" element={<HouseRoute />} />
          <Route path="/users" element={<AdminRoute />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ReloadPrompt />
    </>
  );
}
