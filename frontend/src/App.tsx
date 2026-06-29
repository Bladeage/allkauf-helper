import { Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import NotFound from './pages/NotFound';
import { ReloadPrompt } from './components/ReloadPrompt';

// Remount bei Phasenwechsel, damit keine alten Daten unter neuer URL aufblitzen
function PhaseDetailRoute() {
  const { id } = useParams();
  return <PhaseDetail key={id} />;
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
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/phases" element={<Phases />} />
          <Route path="/phases/:id" element={<PhaseDetailRoute />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/house" element={<HouseRoute />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ReloadPrompt />
    </>
  );
}
