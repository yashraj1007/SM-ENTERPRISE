import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ShieldCheck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Artificial delay for security feel
    setTimeout(() => {
      if (username === 'SMENTERPRISE' && password === 'admin1234') {
        onLogin();
        navigate('/admin');
      } else {
        setError('ACCESS DENIED: INVALID CREDENTIALS');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 font-sans selection:bg-blue-500/30">
      <div className="max-w-md w-full">
        {/* Header Illustration / Icon */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative inline-block mb-10"
          >
            <div className="bg-gray-900 w-24 h-24 rounded-3xl shadow-2xl flex items-center justify-center border-2 border-gray-800">
              <ShieldCheck className="h-10 w-10 text-blue-500" />
            </div>
            <div className="absolute -top-3 -right-3 bg-red-600 text-white p-2.5 rounded-2xl shadow-xl animate-pulse">
              <Lock className="h-4 w-4" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-3 italic">RESTRICTED AREA</h2>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <span className="w-8 h-[1px] bg-gray-800"></span>
            Management Access Only
            <span className="w-8 h-[1px] bg-gray-800"></span>
          </p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleLocalLogin} className="bg-gray-900/50 backdrop-blur-xl rounded-[2.5rem] p-10 border border-gray-800 shadow-2xl space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Commander ID</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-950 border-2 border-gray-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-white focus:border-blue-600 focus:ring-0 outline-none transition-all placeholder:text-gray-700"
                    placeholder="ADMIN USERNAME"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Encrypted key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-950 border-2 border-gray-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-white focus:border-blue-600 focus:ring-0 outline-none transition-all placeholder:text-gray-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-red-950/30 border border-red-900/50 text-red-500 text-[10px] font-black uppercase p-4 rounded-xl text-center tracking-widest overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-500 hover:text-white hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isLoading ? 'Verifying...' : 'Authorize Access'}
            </button>
          </form>

          <div className="flex justify-center gap-6 mt-8">
            <Link to="/" className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-blue-500 transition-colors flex items-center gap-2">
               ← Main Website
            </Link>
            <span className="w-1 h-1 bg-gray-800 rounded-full my-auto"></span>
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
               System Logged <ExternalLink className="h-3 w-3" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
