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

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Gallery Image State
  const [galleryImgUrl, setGalleryImgUrl] = useState('/assets/image/maskot-hero.webp');
  const [galleryImgAlt, setGalleryImgAlt] = useState('Maskot Sempoa SIP');

  // Refs for a11y & focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setGlobalError(''); // Clear error on typing
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setGlobalError(''); // Clear error on typing
  };

  // Submit Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setGlobalSuccess('');
    
    if (!email || !password) {
      setGlobalError("Email dan kata sandi wajib diisi");
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
      } else if (err.response?.status === 401 || err.response?.status === 404) {
        setGlobalError('Email atau kata sandi tidak ditemukan');
      } else {
        setGlobalError('Email atau kata sandi tidak ditemukan');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load Random Gallery Image
  const loadRandomGalleryImage = async () => {
    try {
      // Fetch image from gallery
      setGalleryImgUrl('/assets/image/maskot-hero.webp');
      setGalleryImgAlt('Galeri Sempoa SIP');
      
    } catch (error) {
      console.error("Error loading gallery image:", error);
      setGalleryImgUrl('/assets/image/maskot-hero.webp');
      setGalleryImgAlt('Maskot Sempoa SIP');
    }
  };

  // Setup Accessibility (ESC, Focus Trap) and initial data
  useEffect(() => {
    if (isOpen) {
      // Load random image on open
      loadRandomGalleryImage();

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
      setEmail('');
      setPassword('');
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
        {/* LANDSCAPE LEFT SIDE - IMAGE */}
        <div className="login-modal-image-side">
          <img 
            id="login-gallery-image"
            src={galleryImgUrl}
            alt={galleryImgAlt}
            className="login-modal-image"
          />
        </div>

        {/* LANDSCAPE RIGHT SIDE - FORM */}
        <div className="login-modal-form-side">
          <button 
            className="login-modal-close" 
            onClick={onClose}
            aria-label="Tutup modal"
          >
            &times;
          </button>

          <div id="login-form-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="login-modal-header">
              <img src="/assets/logo/logo-sempoa-sip.png" alt="Logo Sempoa SIP" className="login-modal-logo" />
              <h2 className="login-modal-title" id="modal-title">Masuk ke Akun Anda</h2>
              <p className="login-modal-subtitle">Akses portal Sempoa SIP TC Pariaman</p>
            </div>

            {globalSuccess && (
              <div className="login-alert login-alert-success" style={{ margin: '1.5rem 2.5rem 0' }}>
                <i className="fas fa-check-circle"></i>
                <span>{globalSuccess}</span>
              </div>
            )}

            <form id="login-form" className="login-form" onSubmit={handleSubmit}>
              <div className="login-form-group">
                <label htmlFor="login-email" className="login-form-label">
                  Email <span className="login-required">*</span>
                </label>
                <div className="login-input-wrapper">
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    className="login-form-control"
                    placeholder="nama@sempoasippariaman.com"
                    aria-label="Email"
                    value={email}
                    onChange={handleEmailChange}
                    ref={emailInputRef}
                    required
                  />
                  <span className="login-input-icon"><i className="fas fa-envelope"></i></span>
                </div>
              </div>

              <div className="login-form-group" style={{ marginBottom: globalError ? '0.5rem' : '1.2rem' }}>
                <label htmlFor="login-password" className="login-form-label">
                  Kata Sandi <span className="login-required">*</span>
                </label>
                <div className="login-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    className="login-form-control"
                    placeholder="••••••••••••"
                    aria-label="Kata Sandi"
                    value={password}
                    onChange={handlePasswordChange}
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
                    {/* SVG Eye (shown ketika password visible) */}
                    <svg 
                      className="login-password-icon-eye" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      width="20" height="20"
                      style={{ display: showPassword ? 'block' : 'none' }}
                    >
                      <path fill="currentColor" fillRule="evenodd" d="M1 12c2.028-4.152 6.192-7 11-7s8.972 2.848 11 7c-2.028 4.152-6.192 7-11 7s-8.972-2.848-11-7m11 3.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7"/>
                    </svg>
                    
                    {/* SVG Eye Slash (shown ketika password hidden) */}
                    <svg 
                      className="login-password-icon-eye-slash" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      width="20" height="20" 
                      style={{ display: showPassword ? 'none' : 'block' }}
                    >
                      <path fill="currentColor" fillRule="evenodd" d="m18.922 16.8l3.17 3.17l-1.06 1.061L4.06 4.061L5.12 3l2.74 2.738A11.9 11.9 0 0 1 12 5c4.808 0 8.972 2.848 11 7a12.66 12.66 0 0 1-4.078 4.8l3.625 3.624a3.5 3.5 0 0 0 4.474 4.474l2.964 2.964z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {globalError && (
                <div className="login-form-error" style={{ display: 'flex', marginBottom: '1.2rem' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{globalError}</span>
                </div>
              )}

              <div className="login-forgot-wrapper">
                <a 
                  href="https://wa.me/628126784986?text=Halo%20Admin%2C%20saya%20%5Bisi%20nama%20Anda%5D%2C%20melupakan%20password%20akun%20saya.%20Mohon%20ditindaklanjuti."
                  target="_blank"
                  rel="noreferrer"
                  className="login-forgot-link" 
                  style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
                >
                  <i className="fas fa-question-circle"></i>
                  Lupa Kata Sandi?
                </a>
              </div>

              <div className="login-button-wrapper">
                <button
                  type="submit"
                  className="login-btn-submit"
                  id="login-btn-submit"
                  disabled={isLoading}
                  aria-label="Masuk ke akun"
                >
                  {!isLoading ? (
                    <span id="login-btn-text">MASUK</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg 
                        style={{ animation: 'spin 1s linear infinite' }} 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      <span>Memeriksa...</span>
                    </div>
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
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
