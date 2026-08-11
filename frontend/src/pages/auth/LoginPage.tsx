import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';
import Toast from '../../components/Toast';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      setToastType('success');
      setToastMessage('Login berhasil! Mengalihkan...');
      
      setTimeout(() => {
        if (user.role === 'admin' || user.role === 'owner') {
          navigate('/admin');
        } else if (user.role === 'guru') {
          navigate('/guru');
        } else if (user.role === 'ortu') {
          navigate('/ortu');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err: any) {
      console.error('Login failed:', err);
      setToastType('error');
      if (err.response?.status === 429) {
        setToastMessage('Terlalu banyak percobaan masuk salah. Akun Anda diblokir selama 15 menit.');
      } else if (err.response?.status === 401) {
        setToastMessage('Email atau kata sandi Anda salah.');
      } else {
        setToastMessage('Koneksi server gagal. Silakan coba sesaat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 sm:p-6" aria-label="Portal Login">
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="w-full max-w-[400px] bg-white border border-[#CCCCCC] rounded-lg p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex w-12 h-12 bg-[#E67E22] rounded-full items-center justify-center text-2xl font-bold shadow-lg shadow-[#E67E22]/20 mb-2 focus:ring-2 focus:ring-[#E67E22] focus:outline-none"
            aria-label="Kembali ke Beranda"
          >
            🧮
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#333333]">Portal Masuk</h1>
          <p className="text-xs text-slate-500">Silakan masukkan akun Anda untuk mengakses sistem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alamat Email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#CCCCCC] focus:border-[#E67E22] focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded-lg px-4 py-2.5 text-sm text-[#333333] placeholder-slate-400 transition-all"
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="password-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kata Sandi
              </label>
              <a
                href="#forgot"
                className="text-xs text-[#E67E22] hover:text-[#D35400] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded"
                onClick={(e) => {
                  e.preventDefault();
                  setToastType('error');
                  setToastMessage('Layanan reset password otomatis belum tersedia. Hubungi admin.');
                }}
              >
                Lupa Password?
              </a>
            </div>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#CCCCCC] focus:border-[#E67E22] focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded-lg px-4 py-2.5 text-sm text-[#333333] placeholder-slate-400 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#E67E22] hover:bg-[#D35400] text-white text-sm font-bold rounded-lg transition-all shadow-lg hover:scale-102 active:scale-98 disabled:opacity-50 disabled:hover:scale-100 focus:ring-2 focus:ring-[#E67E22] focus:outline-none"
          >
            {isLoading ? 'Sedang Masuk...' : 'Masuk Portal 🚀'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-[#333333] transition-colors focus:ring-2 focus:ring-[#E67E22] focus:outline-none rounded"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
