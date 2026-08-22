import React, { useState, useEffect } from 'react';

export interface CookiePreferences {
  essential: boolean; // Always true
  functional: boolean;
  notifications: boolean;
  analytics: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  notifications: true,
  analytics: false,
};

interface CookieConsentModalProps {
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const CookieConsentModal: React.FC<CookieConsentModalProps> = ({
  forceOpenModal = false,
  onCloseModal,
}) => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = localStorage.getItem('sempoa_cookie_preferences');
    if (!saved) {
      // Delay banner display slightly for smooth page entry
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        setPreferences(JSON.parse(saved));
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  }, []);

  useEffect(() => {
    if (forceOpenModal) {
      setIsModalOpen(true);
      setShowBanner(false);
    }
  }, [forceOpenModal]);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('sempoa_cookie_preferences', JSON.stringify(prefs));
    localStorage.setItem('sempoa_cookie_consent', 'true');
    setPreferences(prefs);
    setShowBanner(false);
    setIsModalOpen(false);
    if (onCloseModal) onCloseModal();
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      notifications: true,
      analytics: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      functional: false,
      notifications: false,
      analytics: false,
    };
    savePreferences(onlyEssential);
  };

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Cannot toggle essential
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* 1. Cookie Notice Floating Banner */}
      {showBanner && !isModalOpen && (
        <aside
          role="region"
          aria-label="Pemberitahuan Cookie & Privasi Data"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-white/95 backdrop-blur-md border border-[#FFD8C7] rounded-2xl shadow-2xl p-5 text-[#1E293B] animate-in slide-in-from-bottom-5 duration-300 space-y-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] text-[#FF7043] flex items-center justify-center shrink-0 text-xl shadow-xs border border-[#FFE0B2]">
              🍪
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-[#1E293B] flex items-center gap-1.5">
                Privasi & Pengelolaan Cookie
              </h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Kami menggunakan cookie esensial dan teknologi penyimpanan lokal untuk mengamankan sesi portal, menghadirkan notifikasi absensi RFID real-time, dan meningkatkan kenyamanan Anda sesuai standar UU PDP No. 27/2022.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-[#475569] hover:text-[#1E293B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl transition-colors cursor-pointer text-center"
            >
              Kelola Cookie
            </button>
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="px-3.5 py-2 text-xs font-bold text-[#FF7043] hover:bg-[#FFF3E0] border border-[#FFCC80] rounded-xl transition-colors cursor-pointer text-center"
            >
              Tolak Opsional
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-[#FF7043] to-[#F4511E] hover:from-[#F4511E] hover:to-[#E64A19] rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer text-center active:scale-95"
            >
              Terima Semua
            </button>
          </div>
        </aside>
      )}

      {/* 2. Detailed Cookie Preference Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#1E293B]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#FFF8F5] to-white">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍪</span>
                <div>
                  <h3 id="cookie-modal-title" className="text-base sm:text-lg font-black text-[#1E293B]">
                    Pusat Preferensi & Kelola Cookie
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Kendalikan jenis data dan cookie yang diizinkan pada browser Anda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseModal) onCloseModal();
                }}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#DC2626] flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <p className="text-xs text-[#475569] leading-relaxed">
                Saat Anda mengunjungi website Sempoa SIP TC Pariaman, kami dapat menyimpan informasi pada peramban Anda terutama dalam bentuk cookie dan penyimpanan lokal (localStorage) untuk memastikan kinerja website berjalan aman, optimal, dan sesuai preferensi Anda.
              </p>

              {/* Category 1: Essential */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔒</span>
                    <h4 className="text-sm font-extrabold text-[#1E293B]">
                      1. Cookie Esensial & Keamanan Sistem
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#E2E8F0] text-[#475569] text-[10px] font-black rounded-full uppercase tracking-wider">
                    Selalu Aktif
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Cookie wajib ini mutlak diperlukan agar website berfungsi normal dan aman. Meliputi autentikasi login (orang tua, guru, admin, direktur), pencegahan serangan CSRF, dan integritas transaksi SPP. Kategori ini tidak dapat dinonaktifkan demi keamanan.
                </p>
              </div>

              {/* Category 2: Functional */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚙️</span>
                    <h4 className="text-sm font-extrabold text-[#1E293B]">
                      2. Cookie Fungsionalitas & Preferensi
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('functional')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      preferences.functional ? 'bg-[#FF7043]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        preferences.functional ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Memungkinkan situs mengingat pilihan Anda, seperti status penyelesaian panduan interaktif portal orang tua (tour), filter laporan tanggal yang dipilih, dan status penutupan jendela pengumuman.
                </p>
              </div>

              {/* Category 3: Notifications */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔔</span>
                    <h4 className="text-sm font-extrabold text-[#1E293B]">
                      3. Cookie Notifikasi & Komunikasi Real-time
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('notifications')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      preferences.notifications ? 'bg-[#FF7043]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        preferences.notifications ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Menyimpan kredensial enkripsi Web Push Notification (VAPID) untuk mengirimkan notifikasi instan langsung ke perangkat HP/Laptop orang tua saat anak melakukan absensi kartu RFID atau saat mendekati jadwal tagihan SPP.
                </p>
              </div>

              {/* Category 4: Analytics */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <h4 className="text-sm font-extrabold text-[#1E293B]">
                      4. Cookie Analitik Kinerja (Anonim)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('analytics')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      preferences.analytics ? 'bg-[#FF7043]' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        preferences.analytics ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Membantu tim pengembang memahami kecepatan respon server dan stabilitas antarmuka pengguna secara agregat dan sepenuhnya anonim tanpa mengumpulkan data pribadi atau aktivitas luar situs.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-xl transition-colors cursor-pointer text-center"
              >
                Tolak Semua Opsional
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => savePreferences(preferences)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-[#FF7043] bg-white border border-[#FFCC80] hover:bg-[#FFF3E0] rounded-xl transition-all cursor-pointer text-center shadow-xs"
                >
                  Simpan Preferensi
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#FF7043] to-[#F4511E] hover:from-[#F4511E] hover:to-[#E64A19] rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer text-center active:scale-95"
                >
                  Terima Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsentModal;
