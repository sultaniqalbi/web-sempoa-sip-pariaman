/**
 * Utility Formatting Tanggal & Waktu Standar Indonesia (WIB)
 * Aturan:
 * - Tanggal: Hari/Bulan/Tahun (DD/MM/YYYY), contoh: 03/09/2026
 * - Waktu: Jam:Menit:Detik WIB (HH:mm:ss WIB), contoh: 14:30:45 WIB
 * - Lengkap: DD/MM/YYYY HH:mm:ss WIB
 */

export function formatIndoDate(val: string | Date | null | undefined): string {
  if (!val) return '-';
  try {
    // Jika string sudah berformat YYYY-MM-DD murni
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      const [y, m, d] = val.trim().split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    let d: Date;
    if (typeof val === 'string') {
      if (!val.includes('Z') && !val.includes('+')) {
        d = new Date(val.replace(' ', 'T') + '+07:00');
      } else {
        d = new Date(val);
      }
    } else {
      d = val;
    }

    if (isNaN(d.getTime())) return typeof val === 'string' ? val : '-';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(d); // Output: DD/MM/YYYY
  } catch {
    return typeof val === 'string' ? val : '-';
  }
}

export function formatIndoTime(val: string | Date | null | undefined): string {
  if (!val) return '-';
  try {
    let d: Date;
    if (typeof val === 'string') {
      if (!val.includes('Z') && !val.includes('+')) {
        d = new Date(val.replace(' ', 'T') + '+07:00');
      } else {
        d = new Date(val);
      }
    } else {
      d = val;
    }

    if (isNaN(d.getTime())) return typeof val === 'string' ? val : '-';

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${formatter.format(d)} WIB`; // Output: HH:mm:ss WIB
  } catch {
    return typeof val === 'string' ? val : '-';
  }
}

export function formatIndoDateTime(val: string | Date | null | undefined): string {
  if (!val) return '-';
  try {
    let d: Date;
    if (typeof val === 'string') {
      if (!val.includes('Z') && !val.includes('+')) {
        d = new Date(val.replace(' ', 'T') + '+07:00');
      } else {
        d = new Date(val);
      }
    } else {
      d = val;
    }

    if (isNaN(d.getTime())) return typeof val === 'string' ? val : '-';

    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    return `${dateFormatter.format(d)} ${timeFormatter.format(d)} WIB`;
  } catch {
    return typeof val === 'string' ? val : '-';
  }
}

/**
 * Konversi ISO YYYY-MM-DD ke Display DD/MM/YYYY
 */
export function isoToDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return iso;
}

/**
 * Konversi Display DD/MM/YYYY ke ISO YYYY-MM-DD
 */
export function displayToIsoDate(display: string): string {
  if (!display) return '';
  const parts = display.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (y.length === 4) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return display;
}
