import { Routes, Route, HashRouter, BrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardJobs from './pages/dashboard/Jobs';
import DashboardResumes from './pages/dashboard/Resumes';
import BillingPage from './pages/dashboard/Billing';
import SettingsPage from './pages/dashboard/Settings';
import './App.css';


const Router =
  process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Register />} /> {/* Placeholder for login */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardJobs />} />
          <Route path="resumes" element={<DashboardResumes />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
