import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Account from './pages/Account';
import Clients from './pages/Clients';
import LiveView from './pages/LiveView';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Layout title="Dashboard"><Home /></Layout>} />
          <Route path="/account" element={<Layout title="Account Settings"><Account /></Layout>} />
          <Route path="/clients" element={<Layout title="Clients & Deals"><Clients /></Layout>} />
          <Route path="/liveview" element={<Layout title="Live View"><LiveView /></Layout>} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
