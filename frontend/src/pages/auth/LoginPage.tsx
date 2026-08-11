import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      
      // Redirect based on user role
      if (user.role === 'admin' || user.role === 'owner') {
        navigate('/admin');
      } else if (user.role === 'guru') {
        navigate('/guru');
      } else if (user.role === 'ortu') {
        navigate('/ortu');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.response?.status === 429) {
        setError('Terlalu banyak percobaan masuk salah. Akun Anda diblokir selama 15 menit.');
      } else if (err.response?.status === 401) {
        setError('Email atau kata sandi Anda salah.');
      } else {
        setError('Koneksi server gagal. Silakan coba sesaat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex w-12 h-12 bg-amber-500 rounded-2xl items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/10 mb-2">
            🧮
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Portal Masuk</h1>
          <p className="text-xs text-slate-400">Silakan masukkan akun Anda untuk mengakses sistem</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-colors"
              placeholder="nama@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 text-slate-950 text-sm font-bold rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/5 disabled:opacity-50"
          >
            {isLoading ? 'Sedang Masuk...' : 'Masuk Portal 🚀'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
