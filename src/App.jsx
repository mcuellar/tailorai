import { Routes, Route, HashRouter, BrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
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
      </Routes>
    </Router>
  );
}

export default App;
