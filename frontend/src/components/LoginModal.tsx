import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' or 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Validation State
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Refs for a11y & focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Validate Email
  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@sempoasippariaman\.com$/i;
    if (!val) {
      setEmailError("Email tidak boleh kosong");
      setEmailValid(false);
      return false;
    }
    if (!emailRegex.test(val)) {
      setEmailError("Format email harus nama@sempoasippariaman.com");
      setEmailValid(false);
      return false;
    }
    setEmailError('');
    setEmailValid(true);
    return true;
  };

  // Validate Password
  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError("Kata sandi tidak boleh kosong");
      setPasswordValid(false);
      return false;
    }
    if (val.length < 8) {
      setPasswordError(`Kata sandi minimal 8 karakter (saat ini: ${val.length})`);
      setPasswordValid(false);
      return false;
    }
    setPasswordError('');
    setPasswordValid(true);
    return true;
  };

  // Handlers for blur/change
  const handleEmailBlur = () => validateEmail(email);
  const handlePasswordBlur = () => validatePassword(password);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value); // real-time clear if previously errored
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
  };

  // Submit Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setGlobalSuccess('');
    
    const isEmailOk = validateEmail(email);
    const isPasswordOk = validatePassword(password);
    
    if (!isEmailOk || !isPasswordOk) {
      setGlobalError("Periksa kembali email dan kata sandi");
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(email, password);
      setGlobalSuccess("Login berhasil! Mengalihkan...");
      
      // Delay for success animation before redirect
      setTimeout(() => {
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
      }, 1500);

    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.response?.status === 429) {
        setGlobalError('Terlalu banyak percobaan masuk salah. Akun Anda diblokir selama 15 menit.');
      } else if (err.response?.status === 401) {
        setGlobalError('Email atau kata sandi salah');
      } else {
        setGlobalError(err.message || 'Koneksi server gagal. Silakan coba sesaat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Link reset akan dikirim ke ${forgotEmail} jika email terdaftar.`);
    // Implement forgot password API call here later
    setMode('login');
  };

  // Setup Accessibility (ESC, Focus Trap)
  useEffect(() => {
    if (isOpen) {
      // Focus email input on mount
      setTimeout(() => emailInputRef.current?.focus(), 100);
      
      // ESC key handler
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      
      // Focus Trap Logic
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTab);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen, onClose]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setForgotEmail('');
      setEmailError('');
      setPasswordError('');
      setEmailValid(false);
      setPasswordValid(false);
      setGlobalError('');
      setGlobalSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay">
      <div 
        className="login-modal-content" 
        ref={modalRef}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <button 
          className="login-modal-close" 
          onClick={onClose}
          aria-label="Tutup modal"
        >
          &times;
        </button>

        {mode === 'login' ? (
          <div id="login-form-container">
            <div className="login-modal-header">
              <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="login-modal-logo" />
              <h2 className="login-modal-title" id="modal-title">Masuk ke Akun Anda</h2>
              <p className="login-modal-subtitle">Akses portal Sempoa SIP TC Pariaman</p>
            </div>

            {globalError && (
              <div className="login-alert login-alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{globalError}</span>
                <button type="button" className="login-alert-close" onClick={() => setGlobalError('')}>&times;</button>
              </div>
            )}

            {globalSuccess && (
              <div className="login-alert login-alert-success">
                <i className="fas fa-check-circle"></i>
                <span>{globalSuccess}</span>
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} style={{ marginTop: globalError || globalSuccess ? '0' : '1.5rem' }}>
              <div className="login-form-group">
                <label htmlFor="login-email" className="login-form-label">
                  Email <span className="login-required">*</span>
                </label>
                <div className="login-input-wrapper">
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    className={`login-form-control ${emailError ? 'is-invalid' : ''} ${emailValid && !emailError ? 'is-valid' : ''}`}
                    placeholder="nama@sempoasippariaman.com"
                    aria-label="Email"
                    aria-describedby={emailError ? "email-error" : undefined}
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    ref={emailInputRef}
                    required
                  />
                  <span className="login-input-icon"><i className="fas fa-envelope"></i></span>
                </div>
                
                {emailError && (
                  <div id="email-error" className="login-form-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{emailError}</span>
                  </div>
                )}
                
                {emailValid && !emailError && (
                  <div className="login-form-success">
                    <i className="fas fa-check-circle"></i>
                    <span>Email valid</span>
                  </div>
                )}
                
                {!emailError && !emailValid && (
                  <p className="login-form-helper">Gunakan domain @sempoasippariaman.com</p>
                )}
              </div>

              <div className="login-form-group">
                <label htmlFor="login-password" className="login-form-label">
                  Kata Sandi <span className="login-required">*</span>
                </label>
                <div className="login-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    className={`login-form-control ${passwordError ? 'is-invalid' : ''} ${passwordValid && !passwordError ? 'is-valid' : ''}`}
                    placeholder="••••••••••••"
                    aria-label="Kata Sandi"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    required
                  />
                  <span className="login-input-icon"><i className="fas fa-lock"></i></span>
                  
                  <button
                    type="button"
                    className={`login-password-toggle ${showPassword ? 'show-password' : ''}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    title="Tampilkan/Sembunyikan kata sandi"
                  >
                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                
                {passwordError && (
                  <div id="password-error" className="login-form-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{passwordError}</span>
                  </div>
                )}
                
                {!passwordError && !passwordValid && (
                  <p className="login-form-helper">Minimal 8 karakter disarankan kombinasi angka/huruf</p>
                )}
              </div>

              <div className="login-forgot-wrapper">
                <button 
                  type="button" 
                  className="login-forgot-link" 
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
                >
                  <i className="fas fa-question-circle"></i>
                  Lupa Kata Sandi?
                </button>
              </div>

              <div className="login-button-wrapper">
                <button
                  type="submit"
                  className="login-btn-submit"
                  disabled={isLoading}
                  aria-label="Masuk ke akun"
                >
                  {!isLoading ? (
                    <span>MASUK</span>
                  ) : (
                    <i className="fas fa-spinner fa-spin"></i>
                  )}
                </button>
              </div>
            </form>

            <div className="login-modal-footer">
              <p className="login-info-text">
                <i className="fas fa-info-circle"></i>
                Belum punya akun? Hubungi <strong>Admin</strong> via WhatsApp <a href="https://wa.me/628126784986" target="_blank" rel="noreferrer" className="login-info-link">di sini</a>
              </p>
            </div>
          </div>
        ) : (
          <div id="forgot-password-modal">
            <div className="login-modal-header">
              <h2 className="login-modal-title">Lupa Kata Sandi?</h2>
              <p className="login-modal-subtitle">Masukkan email untuk reset</p>
            </div>
            
            <form id="forgot-password-form" onSubmit={handleForgotSubmit} style={{ padding: '1.5rem 0' }}>
              <div className="login-form-group">
                <label htmlFor="forgot-email" className="login-form-label">Email</label>
                <div className="login-input-wrapper">
                  <input
                    type="email"
                    id="forgot-email"
                    name="email"
                    className="login-form-control"
                    placeholder="nama@sempoasippariaman.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <span className="login-input-icon"><i className="fas fa-envelope"></i></span>
                </div>
              </div>
              
              <div className="login-alert login-alert-info">
                <i className="fas fa-info-circle"></i>
                <span>Kami akan mengirim link reset ke email Anda (jika terdaftar)</span>
              </div>
              
              <div className="login-button-wrapper">
                <button type="submit" className="login-btn-submit">
                  Kirim Link Reset
                </button>
              </div>
            </form>
            
            <div className="login-modal-footer">
              <button 
                type="button" 
                className="login-btn-back" 
                onClick={() => setMode('login')}
              >
                <i className="fas fa-arrow-left"></i> Kembali ke Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
