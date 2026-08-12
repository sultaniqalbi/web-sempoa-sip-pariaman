import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
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
      
      onClose(); // Close modal on success

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
        setError('Alamat Email atau Kata Sandi salah!');
      } else {
        setError('Koneksi server gagal. Silakan coba sesaat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-split">
          <div className="modal-left">
            <div className="modal-left-content">
              <h3>Portal Terpadu</h3>
              <p>Masuk untuk mengakses layanan Sempoa SIP TC Pariaman.</p>
            </div>
          </div>
          <div className="modal-right">
            <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="modal-form-logo" />
            <h2 className="modal-title">Masuk ke Akun Anda</h2>
            {error && (
              <div style={{ color: '#D32F2F', background: '#FFEBEE', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Kata Sandi</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '35px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-light)'
                  }}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'MASUK'}
              </button>
            </form>
            <p className="modal-footer-text">
              Lupa kata sandi? Silakan hubungi Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
