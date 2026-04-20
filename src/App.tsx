/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shopping from './pages/Shopping';
import SoftwareSolutions from './pages/SoftwareSolutions';
import HardwareSolutions from './pages/HardwareSolutions';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Navbar from './components/Navbar';

// Types
export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isAdminAuthenticated: false,
  setAdminAuthenticated: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAdminAuthenticated') === 'true';
  });

  const checkIsAdmin = (u: any, p: any) => {
    const adminEmails = ['yashrajbhore1107@gmail.com', 'bauchkarpranoti@gmail.com', 'testywebdevp@gmail.com'];
    return p?.role === 'admin' || adminEmails.includes(u?.email) || isAdminAuthenticated;
  };

  const handleAdminLogin = async () => {
    setAdminAuthenticated(true);
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    // Promote current user to admin in DB if logged in
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      } catch (err) {
        console.error("Critical: Could not auto-promote user to admin role: ", err);
      }
    }
  };

  const setAdminAuthenticatedWrapper = (val: boolean) => {
    setAdminAuthenticated(val);
    sessionStorage.setItem('isAdminAuthenticated', val ? 'true' : 'false');
  };

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    sessionStorage.removeItem('isAdminAuthenticated');
  };

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const adminEmails = ['yashrajbhore1107@gmail.com', 'bauchkarpranoti@gmail.com', 'testywebdevp@gmail.com'];
        const isAuthAdmin = adminEmails.includes(firebaseUser.email || '');

        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          // Auto-upgrade to admin if email matches
          if (isAuthAdmin && data.role !== 'admin') {
            await setDoc(doc(db, 'users', firebaseUser.uid), { ...data, role: 'admin' }, { merge: true });
            setProfile({ ...data, role: 'admin' });
          } else {
            setProfile(data);
          }
        } else {
          // Create profile if it doesn't exist
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: isAuthAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin: checkIsAdmin(user, profile),
      isAdminAuthenticated,
      setAdminAuthenticated: setAdminAuthenticatedWrapper
    }}>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar onAdminLogout={handleAdminLogout} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/shopping" element={<Shopping />} />
              <Route path="/software-solutions" element={<SoftwareSolutions />} />
              <Route path="/hardware-solutions" element={<HardwareSolutions />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/admin-login" element={isAdminAuthenticated ? <Navigate to="/admin" /> : <AdminLogin onLogin={handleAdminLogin} />} />
              <Route path="/admin" element={isAdminAuthenticated ? <Admin /> : <Navigate to="/admin-login" />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} SM ENTERPRISE & LAPTOP HOUSE. All rights reserved.
              </p>
              <div className="mt-2">
                <Link to="/admin-login" className="text-gray-300 hover:text-gray-400 text-xs">Admin Portal</Link>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

