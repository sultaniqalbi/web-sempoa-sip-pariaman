import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../features/auth/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);

      if (user?.role === 'owner') {
        navigate('/owner');
      } else if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'guru') {
        navigate('/guru');
      } else if (user?.role === 'ortu') {
        navigate('/ortu');
      } else {
        navigate('/');
      }

    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.response?.status === 429) {
        setError('Terlalu banyak percobaan masuk salah. Akun Anda diblokir selama 15 menit.');
      } else if (err.response?.status === 401) {
        setError('Alamat Email atau Kata Sandi salah!');
      } else {
        setError('Koneksi server gagal. Silakan coba sesaat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF3E0 0%, #FFCC80 100%)',
        margin: 0,
        fontFamily: 'var(--font-body)',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="login-card"
        style={{
          background: 'white',
          padding: '3rem 2.5rem',
          borderRadius: '20px',
          boxShadow: '0 15px 35px rgba(255, 152, 0, 0.2)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <img
          src="/assets/logo/logo-sempoa-sip.png"
          alt="Logo Sempoa SIP"
          style={{ height: '60px', marginBottom: '1.5rem', marginInline: 'auto' }}
        />
        <h1 style={{ color: 'var(--color-primary-orange)', fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 700 }}>
          Portal Akses
        </h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Silakan masuk menggunakan akun Anda
        </p>

        {error && (
          <div
            style={{
              color: '#dc2626',
              background: '#fee2e2',
              padding: '0.8rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-dark)', fontWeight: 600, fontSize: '0.9rem' }}>
              Alamat Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-dark)', fontWeight: 600, fontSize: '0.9rem' }}>
              Kata Sandi
            </label>
            <div className="password-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-control password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  paddingRight: '40px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
              <i
                className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                onClick={() => setShowPassword(!showPassword)}
                title="Tampilkan sandi"
                style={{
                  position: 'absolute',
                  right: '15px',
                  cursor: 'pointer',
                  color: 'var(--color-text-light)',
                }}
              ></i>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-login"
            style={{
              width: '100%',
              padding: '0.8rem',
              backgroundColor: 'var(--color-primary-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {isLoading ? 'Sedang Masuk...' : <>Masuk <i className="fas fa-sign-in-alt"></i></>}
          </button>
        </form>

        <Link
          to="/"
          className="back-link"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            color: 'var(--color-text-light)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <i className="fas fa-arrow-left"></i> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
