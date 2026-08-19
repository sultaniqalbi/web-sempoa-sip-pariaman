import apiClient from '../features/api/apiClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestAndSubscribePush(): Promise<{ success: boolean; message: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return {
      success: false,
      message: 'Browser perangkat Anda tidak mendukung fitur Web Push Notifications.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Izin notifikasi tidak diberikan. Silakan aktifkan izin notifikasi di pengaturan browser.'
      };
    }

    // 1. Ambil VAPID Public Key dari backend
    const vapidRes = await apiClient.get('/push/vapid-key');
    const publicKey = vapidRes.data?.public_key;

    if (!publicKey) {
      return {
        success: false,
        message: 'Kunci VAPID server belum dikonfigurasi.'
      };
    }

    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // 2. Tunggu Service Worker siap
    const registration = await navigator.serviceWorker.ready;

    // 3. Daftarkan Push Subscription ke Push Service browser
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as any
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return {
        success: false,
        message: 'Gagal membuat kunci langganan notifikasi pada browser.'
      };
    }

    // 4. Kirim subscription ke backend kita
    const userAgent = navigator.userAgent.substring(0, 100);
    await apiClient.post('/push/subscribe', {
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth
      },
      device_info: userAgent
    });

    return {
      success: true,
      message: 'Notifikasi pengingat SPP berhasil diaktifkan di perangkat Anda!'
    };
  } catch (err: any) {
    console.error('Push subscription error:', err);
    return {
      success: false,
      message: err.response?.data?.detail || err.message || 'Terjadi kesalahan saat mengaktifkan notifikasi.'
    };
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}
