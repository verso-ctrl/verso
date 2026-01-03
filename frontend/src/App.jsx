import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores';
import { ToastProvider } from './components/Toast';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Library from './pages/Library';
import Discover from './pages/Discover';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import BookDetails from './pages/BookDetails';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import Statistics from './pages/Statistics';
import GoodreadsImport from './pages/GoodreadsImport';
import Circles from './pages/Circles';
import CircleDetail from './pages/CircleDetail';

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/circles" element={<Circles />} />
              <Route path="/circles/:circleId" element={<CircleDetail />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/import" element={<GoodreadsImport />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/books/:id" element={<BookDetails />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:userId" element={<UserProfile />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <Outlet />;
}

export default App;
