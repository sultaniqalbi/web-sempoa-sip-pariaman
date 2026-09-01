/*
  =========================================================
  SISTEM ABSENSI RFID ESP32 BERBASIS IoT (LCD 16x2)
  SEMPOA SIP TC PARIAMAN - ULTRA REALTIME & MULTI-USER HIGH SPEED
  
  Peningkatan Stabilitas & Fitur Terbaru:
  1. Pola Buzzer Khusus:
     - Kartu Terdaftar (Guru ada di sistem/NVS cache): Bip 1x panjang 1 detik (1000ms).
     - Kartu Baru (Belum terdaftar): Bip 3x cepat dalam 1 detik.
  2. Penguatan Ekstrem Ketajaman & Sensitivitas Antena RFID:
     - Gain Antena Maksimal (RxGain_max = 48dB).
     - Modulasi 100% ASK (TxASKReg = 0x40).
     - Deteksi Agresif (PICC_WakeupA) agar kartu terbaca cepat dari sudut mana pun.
  3. Sinkronisasi Waktu Akurat WIB (UTC+7):
     - Sinkronisasi otomatis dengan server NTP Indonesia (id.pool.ntp.org, time.google.com).
     - Auto-kalibrasi hardware RTC DS1302 setiap WiFi terkoneksi.
     - Proteksi waktu presisi untuk push data online maupun offline.
  4. FreeRTOS Non-Blocking Tap Queue (Core 1 -> Core 0):
     - Mampu membaca banyak kartu berturut-turut tanpa jeda (5 guru dalam 10 detik).
  5. 3-Layer Offline Fallback (Server Online -> MicroSD Card -> NVS Flash Internal).
  =========================================================
*/

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ThreeWire.h>
#include <RtcDS1302.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>
#include <FS.h>
#include <SD.h>
#include <time.h>

#define DEBUG_MODE 0

// ============ PENGATURAN KONEKSI WIFI / HOTSPOT ============
// Kredensial Hotspot HP Anda (OPPO Find X8):
const char* DEFAULT_WIFI_SSID     = "OPPO Find X8";
const char* DEFAULT_WIFI_PASS     = "szgm7477";
const char* DEFAULT_ESP32_API_KEY = "SempoaPariaman_ESP32_SecureKey_2026!";

Preferences preferences;
String WIFI_SSID     = "";
String WIFI_PASSWORD = "";
String ESP32_API_KEY = "";
const char* API_URL        = "https://sempoasippariaman.com/api/absensi";
const char* PING_URL       = "https://sempoasippariaman.com/api/ping";
const char* GURU_CACHE_URL = "https://sempoasippariaman.com/api/guru-cache";

// ============ PIN RFID RC522 (VSPI) ============
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4

// ============ PIN MICRO SD CARD (HSPI) ============
#define SD_CS_PIN     32
#define SD_MOSI_PIN   13
#define SD_MISO_PIN   25 // Pindah dari D12 ke D25 (Bebas dari Strapping Pin Flash)
#define SD_SCK_PIN    33

// ============ PIN RTC DS1302 ============
#define RTC_CLK_PIN   14
#define RTC_DAT_PIN   27
#define RTC_RST_PIN   26

// ============ PIN BUZZER ============
#define BUZZER_PIN    15

// ============ PIN I2C LCD (16x2) ============
#define LCD_SDA_PIN   21
#define LCD_SCL_PIN   22
#define LCD_ADDR      0x27
#define LCD_COLS      16
#define LCD_ROWS      2

// ============ FILE OFFLINE SD CARD ============
#define OFFLINE_FILE  "/data_absensi.txt"

// ============ TIMEOUT HTTP (ms) ============
#define HTTP_TIMEOUT_MS   4000
#define SEMAPHORE_WAIT_MS 2000

// Durasi perpindahan teks standby: 5 Detik (5000ms)
const unsigned long DURASI_STANDBY = 5000;

// ============ STRUKTUR ANTREAN TAP REALTIME ============
struct TapEvent {
  char uid[32];
  char waktu[25];
};

QueueHandle_t tapQueue = NULL;
unsigned long lcdDisplayUntil = 0;

// ============ OBJEK GLOBAL ============
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

ThreeWire myWire(RTC_DAT_PIN, RTC_CLK_PIN, RTC_RST_PIN);
RtcDS1302<ThreeWire> Rtc(myWire);

SPIClass sdSPI(HSPI);

// ============ FLAG DAN STATE ============
volatile bool wifiConnected = false;
volatile bool isSyncing     = false;

SemaphoreHandle_t fileMutex = NULL;
SemaphoreHandle_t lcdMutex  = NULL;

String uidTerakhir = "";
unsigned long waktuTapTerakhir = 0;
const unsigned long DEBOUNCE_SAME_CARD_MS = 1500; // Hanya untuk kartu yang sama

enum StandbyState { TEKS_1_JUDUL, TEKS_2_AJAKAN, TEKS_3_ALAT, TEKS_4_WAKTU };
StandbyState standbyState      = TEKS_1_JUDUL;
unsigned long standbyStateMulai = 0;
int detikTerakhir = -1;

// Prototipe Fungsi
void wifiSyncTask(void *pvParameters);
String kirimKeServer(const String& uid, const String& waktu, const char* mode);
void simpanOffline(const String& uid, const String& waktu);
void syncInternalFlashKeServer();
void syncGuruCacheFromServer();
void simpanGuruCache(const String& uid, const String& nama);
void hapusGuruCache(const String& uid);
String ambilGuruCache(const String& uid);
void syncNTPWaktu();
RtcDateTime ambilWaktuValidWIB();
void prosesTap(const RtcDateTime& now);
void beepBoot();
void triggerBuzzerTerdaftar();
void triggerBuzzerBaru();
void updateBuzzer();
bool deteksiKartuAgresif();
bool cekKartuRFID();
void optimasiAntenaRFID();
void jalankanStandby();
void tampilkanTeks1();
void tampilkanTeks2();
void tampilkanTeks3();
void tampilkanTeks4();
void cetakCenter(const char* teks, int baris);
void cetakDuaBarisCenter(const char* baris0, const char* baris1);
String formatWaktu(const RtcDateTime& dt);
String urlEncode(const String& str);

// =========================================================
// HELPER: Cetak Rata Tengah LCD 16 Karakter (Anti-Kedip)
// =========================================================
void cetakCenter(const char* teks, int baris) {
  if (baris < 0 || baris >= LCD_ROWS) return;

  char buf[LCD_COLS + 1];
  int len = strlen(teks);
  if (len > LCD_COLS) len = LCD_COLS;
  int pad = (LCD_COLS - len) / 2;
  int idx = 0;

  for (int i = 0; i < pad && idx < LCD_COLS; i++) buf[idx++] = ' ';
  for (int i = 0; i < len && idx < LCD_COLS; i++) buf[idx++] = teks[i];
  while (idx < LCD_COLS) buf[idx++] = ' ';
  buf[LCD_COLS] = '\0';

  if (lcdMutex && xSemaphoreTake(lcdMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
    lcd.setCursor(0, baris);
    lcd.print(buf);
    xSemaphoreGive(lcdMutex);
  }
}

void cetakDuaBarisCenter(const char* baris0, const char* baris1) {
  cetakCenter(baris0 ? baris0 : "", 0);
  cetakCenter(baris1 ? baris1 : "", 1);
}

// =========================================================
// NON-BLOCKING BUZZER STATE MACHINE
// =========================================================
unsigned long buzzerMulai = 0;
unsigned long buzzerDurasi = 0;
int buzzerBeepCount = 0;
int buzzerBeepTarget = 0;
unsigned long buzzerNextToggle = 0;
bool buzzerState = false;

// 1. Boot / Nyala: Bip panjang 1 detik (1000ms)
void beepBoot() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(1000);
  digitalWrite(BUZZER_PIN, LOW);
}

// 2. Kartu Terdaftar: Bip panjang 1 detik (Non-blocking)
void triggerBuzzerTerdaftar() {
  digitalWrite(BUZZER_PIN, HIGH);
  buzzerMulai = millis();
  buzzerDurasi = 1000;
  buzzerBeepTarget = 0;
  buzzerState = true;
}

// 3. Kartu Baru: Bip 3x cepat dalam 1 detik (Non-blocking)
void triggerBuzzerBaru() {
  buzzerBeepCount = 0;
  buzzerBeepTarget = 3;
  buzzerNextToggle = millis();
  buzzerState = false;
  buzzerDurasi = 0;
}

// Fungsi update buzzer yang dipanggil di setiap putaran loop()
void updateBuzzer() {
  unsigned long now = millis();
  if (buzzerDurasi > 0) {
    if (now - buzzerMulai >= buzzerDurasi) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerDurasi = 0;
      buzzerState = false;
    }
  } else if (buzzerBeepTarget > 0) {
    if (now >= buzzerNextToggle) {
      if (!buzzerState) {
        digitalWrite(BUZZER_PIN, HIGH);
        buzzerState = true;
        buzzerNextToggle = now + 120; // 120ms ON
      } else {
        digitalWrite(BUZZER_PIN, LOW);
        buzzerState = false;
        buzzerBeepCount++;
        if (buzzerBeepCount >= buzzerBeepTarget) {
          buzzerBeepTarget = 0;
        } else {
          buzzerNextToggle = now + 100; // 100ms OFF
        }
      }
    }
  }
}

// =========================================================
// OPTIMASI KETAJAMAN & SENSITIVITAS ANTENA RFID RC522
// =========================================================
void optimasiAntenaRFID() {
  // 1. Set Gain Receiver Maksimal (48 dB)
  rfid.PCD_SetAntennaGain(MFRC522::RxGain_max);
  
  // 2. Force 100% ASK Modulation untuk memperkuat penetrasi medan magnet
  rfid.PCD_WriteRegister(MFRC522::TxASKReg, 0x40);

  // 3. Aktifkan driver pemancar antena
  rfid.PCD_AntennaOn();

  Serial.println("[BOOT] Penguatan Antena RFID RC522: MAX 48dB + 100% ASK Modulation OK");
}

// Deteksi kartu agresif (Wake-Up All / WUPA 0x52)
bool deteksiKartuAgresif() {
  byte bufferATQA[2];
  byte bufferSize = sizeof(bufferATQA);

  MFRC522::StatusCode status = rfid.PICC_WakeupA(bufferATQA, &bufferSize);
  return (status == MFRC522::STATUS_OK || status == MFRC522::STATUS_COLLISION);
}

// Helper membaca kartu RFID tanpa delay
bool cekKartuRFID() {
  if (!rfid.PICC_IsNewCardPresent() && !deteksiKartuAgresif()) {
    return false;
  }
  return rfid.PICC_ReadCardSerial();
}

// =========================================================
// HELPER CACHE GURU OFFLINE (LOCAL NVS)
// =========================================================
void simpanGuruCache(const String& uid, const String& nama) {
  String cleanUid = uid;
  cleanUid.replace(" ", "");
  cleanUid.toUpperCase();

  preferences.begin("g_cache", false);
  preferences.putString(cleanUid.c_str(), nama);
  preferences.end();
  Serial.println("[Cache] Guru disimpan offline: " + cleanUid + " -> " + nama);
}

void hapusGuruCache(const String& uid) {
  String cleanUid = uid;
  cleanUid.replace(" ", "");
  cleanUid.toUpperCase();

  preferences.begin("g_cache", false);
  preferences.remove(cleanUid.c_str());
  preferences.end();
  Serial.println("[Cache] Guru dihapus dari NVS: " + cleanUid);
}

String ambilGuruCache(const String& uid) {
  String cleanUid = uid;
  cleanUid.replace(" ", "");
  cleanUid.toUpperCase();

  preferences.begin("g_cache", true);
  String nama = preferences.getString(cleanUid.c_str(), "");
  preferences.end();
  return nama;
}

// =========================================================
// WAKTU VALID WIB (UTC+7) & AUTO-KALIBRASI RTC
// =========================================================
RtcDateTime ambilWaktuValidWIB() {
  RtcDateTime dt;
  bool rtcOk = false;
  if (Rtc.IsDateTimeValid()) {
    dt = Rtc.GetDateTime();
    if (dt.Year() >= 2024 && dt.Year() <= 2050) {
      rtcOk = true;
    }
  }

  // Cek apakah waktu NTP ESP32 sudah sinkron (> 1 Jan 2024)
  time_t nowSec = time(nullptr);
  if (nowSec > 1704067200) {
    struct tm* tinfo = localtime(&nowSec);
    RtcDateTime ntpDt(
      tinfo->tm_year + 1900,
      tinfo->tm_mon + 1,
      tinfo->tm_mday,
      tinfo->tm_hour,
      tinfo->tm_min,
      tinfo->tm_sec
    );

    // Jika RTC mati, invalid, atau selisih > 5 detik dengan NTP, kalibrasi RTC
    if (!rtcOk || abs((int)(dt.TotalSeconds() - ntpDt.TotalSeconds())) > 5) {
      if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);
      if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
      Rtc.SetDateTime(ntpDt);
      Serial.println("[RTC] Hardware RTC DS1302 otomatis disinkronkan ke WIB.");
    }
    return ntpDt;
  }

  if (rtcOk) return dt;
  return RtcDateTime(__DATE__, __TIME__);
}

// =========================================================
// SETUP
// =========================================================
void setup() {
  // Proteksi Pin Strapping GPIO 12 agar tidak mengubah voltase flash chip saat reset
  pinMode(SD_MISO_PIN, INPUT_PULLDOWN);

  Serial.begin(115200);
  delay(300); // Waktu stabilisasi tegangan setelah flash/upload
  Serial.println("\n[BOOT] Sempoa SIP Absensi ESP32 (LCD 16x2) Starting...");

  fileMutex = xSemaphoreCreateMutex();
  lcdMutex  = xSemaphoreCreateMutex();

  // Inisialisasi antrean tap FreeRTOS (Maksimal 30 antrean tap beruntun di RAM)
  tapQueue = xQueueCreate(30, sizeof(TapEvent));

  // 1. Inisialisasi Buzzer & Langsung Bunyikan Bip 1 Detik
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  beepBoot();

  // 2. Inisialisasi Layar LCD 16x2 I2C
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  Wire.setClock(100000);
  Wire.setTimeOut(50);
  lcd.init();
  lcd.backlight();
  cetakDuaBarisCenter("SEMPOA SIP", "TC PARIAMAN");

  // 3. Inisialisasi RFID RC522 & BOOST SENSITIVITAS ANTENA MAKSIMAL
  SPI.begin();
  SPI.setFrequency(4000000); // Set clock SPI 4MHz stabil & tahan noise kabel panjang
  rfid.PCD_Init();
  delay(10);
  optimasiAntenaRFID();

  // 4. Inisialisasi RTC DS1302 & Set Timezone WIB (UTC+7)
  configTime(7 * 3600, 0, "0.id.pool.ntp.org", "pool.ntp.org", "time.google.com");
  Rtc.Begin();
  if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
  if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);
  if (!Rtc.IsDateTimeValid()) {
    RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
    Rtc.SetDateTime(compiled);
    Serial.println("[BOOT] RTC diset ke waktu compile.");
  }

  // 5. Inisialisasi SD Card (Lapis 2)
  sdSPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  if (!SD.begin(SD_CS_PIN, sdSPI)) {
    Serial.println("[BOOT] SD Card tidak terpasang. Memori internal ESP32 siap (Lapis 3).");
  } else {
    Serial.println("[BOOT] SD Card OK (Lapis 2 Aktif).");
  }

  // 6. Baca Kredensial NVS dengan Fallback
  preferences.begin("sempoa_cfg", false);
  WIFI_SSID     = preferences.getString("ssid", DEFAULT_WIFI_SSID);
  WIFI_PASSWORD = preferences.getString("pass", DEFAULT_WIFI_PASS);
  ESP32_API_KEY = preferences.getString("apikey", DEFAULT_ESP32_API_KEY);
  preferences.end();

  if (WIFI_SSID.isEmpty()) WIFI_SSID = DEFAULT_WIFI_SSID;
  if (WIFI_PASSWORD.isEmpty()) WIFI_PASSWORD = DEFAULT_WIFI_PASS;
  if (ESP32_API_KEY.isEmpty()) ESP32_API_KEY = DEFAULT_ESP32_API_KEY;

  Serial.println("[BOOT] Target WiFi: " + WIFI_SSID);

  // 7. Jalankan Background Task Sinkronisasi WiFi & Antrean di Core 0 (Stack 8KB Optimal)
  xTaskCreatePinnedToCore(
    wifiSyncTask,
    "WifiSyncTask",
    8192,
    NULL,
    1,
    NULL,
    0
  );

  delay(400);
  standbyStateMulai = millis();
  standbyState = TEKS_1_JUDUL;
  detikTerakhir = -1;

  Serial.println("[BOOT] Setup Selesai. Siap menerima tap kartu secara realtime.");
}

// =========================================================
// MAIN LOOP (CORE 1) — RESPON CEPAT & ULTRA REALTIME
// =========================================================
void loop() {
  updateBuzzer(); // Handle non-blocking buzzer timing

  // Input provisioning serial dari admin (Opsional)
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.startsWith("PROV|")) {
      input = input.substring(5);
      int sep1 = input.indexOf('|');
      int sep2 = input.indexOf('|', sep1 + 1);
      if (sep1 > 0 && sep2 > sep1) {
        preferences.begin("sempoa_cfg", false);
        preferences.putString("ssid", input.substring(0, sep1));
        preferences.putString("pass", input.substring(sep1 + 1, sep2));
        preferences.putString("apikey", input.substring(sep2 + 1));
        preferences.end();
        Serial.println("[OK] Kredensial baru disimpan ke NVS. Me-restart ESP32...");
        cetakDuaBarisCenter("SETTING WIFI", "Restarting...");
        delay(1500);
        ESP.restart();
      }
    }
  }

  // Ambil waktu WIB yang valid
  RtcDateTime now = ambilWaktuValidWIB();

  // DETEKSI TAP KARTU RFID (Agresif + Non-blocking)
  if (cekKartuRFID()) {
    prosesTap(now);
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  updateBuzzer();
  jalankanStandby();
  delay(5);
}

// =========================================================
// PROSES TAP KARTU RFID (INSTANT FEEDBACK + ASYNC QUEUE)
// =========================================================
void prosesTap(const RtcDateTime& now) {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();

  unsigned long msNow = millis();
  // Debounce: hanya cegah duplikasi kartu yang sama dalam 1.5 detik
  if (uid == uidTerakhir && (msNow - waktuTapTerakhir < DEBOUNCE_SAME_CARD_MS)) {
    return;
  }

  uidTerakhir = uid;
  waktuTapTerakhir = msNow;
  String waktu = formatWaktu(now);

  // 1. INSTANT LOCAL CACHE LOOKUP & POLA SUARA BUZZER (NON-BLOCKING)
  String cachedNama = ambilGuruCache(uid);

  if (cachedNama.length() > 0) {
    // A. KARTU GURU TERDAFTAR: Tampilkan Nama Guru & Bip 1x Panjang (1 Detik)
    String dispNama = cachedNama;
    if (dispNama.length() > 16) dispNama = dispNama.substring(0, 16);
    cetakDuaBarisCenter("Selamat Datang", dispNama.c_str());
    triggerBuzzerTerdaftar(); // Bip 1x panjang (non-blocking)
  } else {
    // B. KARTU BARU: Tampilkan Status Baru & Bip 3x Cepat dalam 1 detik
    cetakDuaBarisCenter("KARTU BARU", uid.c_str());
    triggerBuzzerBaru(); // Bip 3x cepat (non-blocking)
  }

  lcdDisplayUntil = millis() + 2000; // Tampilkan status di LCD selama 2 detik

  // 2. MASUKKAN KE ANTREAN ASYNC BACKGROUND (0.01ms - Non Blocking)
  if (tapQueue != NULL) {
    TapEvent evt;
    memset(&evt, 0, sizeof(evt));
    strncpy(evt.uid, uid.c_str(), sizeof(evt.uid) - 1);
    strncpy(evt.waktu, waktu.c_str(), sizeof(evt.waktu) - 1);
    xQueueSend(tapQueue, &evt, 0);
  }

  Serial.println("[Tap Instant] UID: " + uid + " | Waktu (WIB): " + waktu + (cachedNama.length() > 0 ? " (" + cachedNama + ")" : " [BARU]"));
}

// =========================================================
// KIRIM KE SERVER (HTTPS TLS RESILIENT)
// =========================================================
String kirimKeServer(const String& uid, const String& waktu, const char* mode) {
  if (!wifiConnected) return "WIFI_OFF";

  WiFiClientSecure client;
  client.setInsecure(); // Memastikan handshake HTTPS selalu lolos tanpa gagal verifikasi waktu RTC
  HTTPClient http;

  if (!http.begin(client, API_URL)) return "KONEKSI_ERROR";

  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  http.addHeader("X-API-Key", ESP32_API_KEY);

  String postData = "uid=" + urlEncode(uid) + "&waktu=" + urlEncode(waktu) + "&mode=" + mode;
  int httpCode = http.POST(postData);

  String respBody = "";
  if (httpCode > 0) {
    respBody = http.getString();
    respBody.trim();
  } else {
    respBody = "HTTP_" + String(httpCode);
  }

  http.end();
  return respBody;
}

// =========================================================
// SIMPAN OFFLINE (LAPIS 2: SD CARD -> LAPIS 3: INTERNAL FLASH)
// =========================================================
void simpanOffline(const String& uid, const String& waktu) {
  bool tersimpanDiSD = false;

  // Lapis 2: Coba simpan ke Micro SD Card
  if (fileMutex && xSemaphoreTake(fileMutex, pdMS_TO_TICKS(SEMAPHORE_WAIT_MS)) == pdTRUE) {
    File file = SD.open(OFFLINE_FILE, FILE_APPEND);
    if (file) {
      file.println(uid + "|" + waktu);
      file.close();
      tersimpanDiSD = true;
    }
    xSemaphoreGive(fileMutex);
  }

  // Lapis 3: Jika SD Card Rusak/Tidak Terpasang -> Simpan ke Memori Internal Flash ESP32 (NVS)
  if (!tersimpanDiSD) {
    preferences.begin("offline_nvs", false);
    int count = preferences.getInt("count", 0);
    String key = "t_" + String(count);
    preferences.putString(key.c_str(), uid + "|" + waktu);
    preferences.putInt("count", count + 1);
    preferences.end();
    Serial.println("[Offline Backup] Tersimpan di Memori Internal ESP32 (Lapis 3)!");
  }
}

// Sinkronisasi data dari Memori Internal ESP32 ke Server & KOSONGKAN TOTAL SETELAHNYA
void syncInternalFlashKeServer() {
  preferences.begin("offline_nvs", false);
  int count = preferences.getInt("count", 0);
  if (count <= 0) {
    preferences.end();
    return;
  }

  Serial.println("[Sync NVS] Menemukan " + String(count) + " data di memori internal ESP32. Memulai sync...");
  int suksesCount = 0;

  for (int i = 0; i < count; i++) {
    String key = "t_" + String(i);
    String record = preferences.getString(key.c_str(), "");
    if (record.length() > 0) {
      int sep = record.indexOf('|');
      if (sep != -1) {
        String uid = record.substring(0, sep);
        String waktu = record.substring(sep + 1);
        String res = kirimKeServer(uid, waktu, "OFFLINE");
        if (res.startsWith("OK") || res.startsWith("KARTU_BARU") || res == "GURU_NOT_FOUND" || res == "TIDAK_TERDAFTAR") {
          suksesCount++;
        }
      }
    }
  }

  // RESET TOTAL & KOSONGKAN MEMORI INTERNAL SETELAH SELURUH DATA DITERIMA SERVER
  if (suksesCount >= count) {
    preferences.clear();
    preferences.putInt("count", 0);
    Serial.println("[Sync NVS] SELURUH DATA OFFLINE INTERNAL BERHASIL DI-PUSH DAN DI-FLASH KOSONG!");
  }
  preferences.end();
}

// Sinkronisasi seluruh daftar guru dari server ke Memori Cache Lokal ESP32
void syncGuruCacheFromServer() {
  WiFiClientSecure cacheClient;
  cacheClient.setInsecure();
  HTTPClient http;

  if (http.begin(cacheClient, GURU_CACHE_URL)) {
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.addHeader("X-API-Key", ESP32_API_KEY);
    int code = http.GET();
    if (code == HTTP_CODE_OK) {
      String payload = http.getString();
      payload.trim();

      // BERSIHKAN TOTAL SELURUH CACHE LAMA AGAR TIDAK ADA DATA DUMMY / KARTU UJI COBA YANG TERTINGGAL!
      preferences.begin("g_cache", false);
      preferences.clear();
      preferences.end();

      if (payload.length() > 0) {
        int start = 0;
        int countLoaded = 0;
        while (start < payload.length()) {
          int end = payload.indexOf('|', start);
          if (end == -1) end = payload.length();
          String pair = payload.substring(start, end);
          int sep = pair.indexOf(':');
          if (sep != -1) {
            String uid = pair.substring(0, sep);
            String nama = pair.substring(sep + 1);
            simpanGuruCache(uid, nama);
            countLoaded++;
          }
          start = end + 1;
        }
        Serial.println("[Guru Cache] SINKRON 100% REALTIME: " + String(countLoaded) + " guru aktif berhasil disimpan ke NVS!");
      } else {
        Serial.println("[Guru Cache] Database kosong. Seluruh cache lokal NVS telah dikosongkan.");
      }
    }
    http.end();
  }
}

// =========================================================
// STANDBY SCREEN (BERGANTI SETIAP 5 DETIK: TEKS 1, 2, 3, 4)
// =========================================================
void jalankanStandby() {
  unsigned long nowMs = millis();

  // Jika sedang menampilkan nama hasil tap terbaru, tahan dulu tampilan LCD
  if (nowMs < lcdDisplayUntil) {
    return;
  }

  // Pergantian state setiap 5 detik (DURASI_STANDBY = 5000ms)
  if (nowMs - standbyStateMulai >= DURASI_STANDBY) {
    standbyStateMulai = nowMs;
    if (standbyState == TEKS_1_JUDUL) {
      standbyState = TEKS_2_AJAKAN;
    } else if (standbyState == TEKS_2_AJAKAN) {
      standbyState = TEKS_3_ALAT;
    } else if (standbyState == TEKS_3_ALAT) {
      standbyState = TEKS_4_WAKTU;
    } else {
      standbyState = TEKS_1_JUDUL;
    }
    detikTerakhir = -1; // Trigger refresh
  }

  if (standbyState == TEKS_1_JUDUL) {
    tampilkanTeks1();
  } else if (standbyState == TEKS_2_AJAKAN) {
    tampilkanTeks2();
  } else if (standbyState == TEKS_3_ALAT) {
    tampilkanTeks3();
  } else {
    tampilkanTeks4();
  }
}

// TEKS 1 (5 Detik):
// Atas: "SEMPOA SIP"
// Bawah: "TC PARIAMAN"
void tampilkanTeks1() {
  if (detikTerakhir == 1) return;
  detikTerakhir = 1;
  cetakDuaBarisCenter("SEMPOA SIP", "TC PARIAMAN");
}

// TEKS 2 (5 Detik):
// Atas: "Silakan Tap"
// Bawah: "Kartu Anda"
void tampilkanTeks2() {
  if (detikTerakhir == 2) return;
  detikTerakhir = 2;
  cetakDuaBarisCenter("Silakan Tap", "Kartu Anda");
}

// TEKS 3 (5 Detik):
// Atas: "Alat Absensi"
// Bawah: "Guru Sempoa"
void tampilkanTeks3() {
  if (detikTerakhir == 3) return;
  detikTerakhir = 3;
  cetakDuaBarisCenter("Alat Absensi", "Guru Sempoa");
}

// TEKS 4 (5 Detik):
// Atas: "20-08-2026" (Tanggal-Bulan-Tahun)
// Bawah: "13:15:30" (Jam:Menit:Detik WIB)
void tampilkanTeks4() {
  RtcDateTime now = ambilWaktuValidWIB();

  if (now.Second() == detikTerakhir) return;
  detikTerakhir = now.Second();

  char tglBuf[17];
  sprintf(tglBuf, "%02d-%02d-%04d", now.Day(), now.Month(), now.Year());

  char jamBuf[17];
  sprintf(jamBuf, "%02d:%02d:%02d", now.Hour(), now.Minute(), now.Second());

  cetakDuaBarisCenter(tglBuf, jamBuf);
}

// =========================================================
// BACKGROUND WIFI TASK & ASYNC QUEUE (CORE 0)
// =========================================================
void wifiSyncTask(void *pvParameters) {
  Serial.println("[BOOT] WiFi & Async Queue Task berjalan pada Core " + String(xPortGetCoreID()));

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  vTaskDelay(pdMS_TO_TICKS(200));
  WiFi.begin(WIFI_SSID.c_str(), WIFI_PASSWORD.c_str());
  WiFi.setAutoReconnect(true);

  unsigned long lastNtpSync     = 0;
  unsigned long lastWifiRetry   = millis();
  unsigned long lastPingSync    = 0;
  unsigned long lastNvsSync     = 0;
  unsigned long lastCacheSync   = 0;
  bool lastWifiConnectedStatus = false;

  while (true) {
    bool currentWifi = (WiFi.status() == WL_CONNECTED);
    wifiConnected = currentWifi;

    // Saat baru tersambung WiFi -> Langsung Sync Waktu WIB (NTP) & Cache Guru
    if (!lastWifiConnectedStatus && currentWifi) {
      Serial.println("[WiFi] Terkoneksi ke Hotspot/WiFi! Mengambil Waktu WIB (NTP)...");
      syncNTPWaktu();
      syncGuruCacheFromServer();
    }
    lastWifiConnectedStatus = currentWifi;

    // 1. PROSES ANTREAN TAP REALTIME DARI CORE 1 (FIFO ASYNC QUEUE)
    TapEvent evt;
    if (tapQueue != NULL && xQueueReceive(tapQueue, &evt, pdMS_TO_TICKS(40)) == pdTRUE) {
      String uidStr = String(evt.uid);
      String waktuStr = String(evt.waktu);

      if (currentWifi) {
        String res = kirimKeServer(uidStr, waktuStr, "ONLINE");
        Serial.println("[Queue Push] Respon Server: " + res);

        if (res.startsWith("OK")) {
          String nama = "Guru Sempoa";
          int idxFirst = res.indexOf('|');
          if (idxFirst != -1) {
            nama = res.substring(idxFirst + 1);
            int idxSecond = nama.indexOf('|');
            if (idxSecond != -1) {
              nama = nama.substring(0, idxSecond);
            }
          }
          nama.trim();
          simpanGuruCache(uidStr, nama);

          // Update LCD & Buzzer Realtime jika saat tap awal belum ada di cache
          if (millis() < lcdDisplayUntil) {
            String dispNama = nama;
            if (dispNama.length() > 16) dispNama = dispNama.substring(0, 16);
            cetakDuaBarisCenter("Selamat Datang", dispNama.c_str());
            triggerBuzzerTerdaftar();
          }
        } else if (res.startsWith("KARTU_BARU") || res == "GURU_NOT_FOUND" || res == "TIDAK_TERDAFTAR") {
          // Kartu belum terdaftar / kartu uji coba lama -> Bersihkan seketika dari cache NVS lokal!
          hapusGuruCache(uidStr);
        } else if (res == "WIFI_OFF" || res == "KONEKSI_ERROR" || res.startsWith("HTTP_")) {
          // Gagal koneksi -> simpan offline agar data tap tidak hilang
          simpanOffline(uidStr, waktuStr);
        }
      } else {
        // Mode Offline -> simpan ke SD Card / Flash NVS
        simpanOffline(uidStr, waktuStr);
      }
    }

    if (currentWifi) {
      // 2. Sinkronisasi data dari memori internal (Lapis 3) & FLASH KOSONG setelahnya
      if (millis() - lastNvsSync >= 30000) {
        lastNvsSync = millis();
        syncInternalFlashKeServer();
      }

      // 3. Sinkronisasi Cache Seluruh Guru Lokal secara berkala (setiap 60 detik)
      if (lastCacheSync == 0 || millis() - lastCacheSync >= 60000UL) {
        lastCacheSync = millis();
        syncGuruCacheFromServer();
      }

      // 4. Ping Heartbeat ke Server setiap 10 detik
      if (millis() - lastPingSync >= 10000) {
        lastPingSync = millis();

        WiFiClientSecure pingClient;
        pingClient.setInsecure();
        HTTPClient httpPing;

        if (httpPing.begin(pingClient, PING_URL)) {
          httpPing.setTimeout(HTTP_TIMEOUT_MS);
          httpPing.addHeader("X-API-Key", ESP32_API_KEY);
          int pingCode = httpPing.GET();

          if (pingCode == HTTP_CODE_OK) {
            String pingRes = httpPing.getString();
            pingRes.trim();

            if (pingRes == "FULL_RESET") {
              Serial.println("[Ping] FULL_RESET diterima dari server!");
              if (fileMutex && xSemaphoreTake(fileMutex, pdMS_TO_TICKS(3000)) == pdTRUE) {
                SD.remove(OFFLINE_FILE);
                SD.remove("/temp_sync.txt");
                xSemaphoreGive(fileMutex);
              }
              for (int b = 0; b < 3; b++) {
                digitalWrite(BUZZER_PIN, HIGH);
                vTaskDelay(pdMS_TO_TICKS(150));
                digitalWrite(BUZZER_PIN, LOW);
                vTaskDelay(pdMS_TO_TICKS(150));
              }
            }
          }
          httpPing.end();
        }
      }

      // 5. Sync NTP Time berkala setiap 1 jam
      if (lastNtpSync == 0 || millis() - lastNtpSync >= 3600000UL) {
        syncNTPWaktu();
        lastNtpSync = millis();
      }

      // 6. Sinkronisasi antrean data offline SD Card ke Server
      if (!isSyncing) {
        String baris = "";
        bool hasQueue = false;

        if (fileMutex && xSemaphoreTake(fileMutex, pdMS_TO_TICKS(SEMAPHORE_WAIT_MS)) == pdTRUE) {
          if (SD.exists(OFFLINE_FILE)) {
            File file = SD.open(OFFLINE_FILE, FILE_READ);
            if (file && file.available()) {
              baris = file.readStringUntil('\n');
              baris.trim();
              hasQueue = (baris.length() > 0);
            }
            if (file) file.close();

            // Jika file SD Card sudah kosong / 0 byte, hapus permanen agar storage bersih
            if (!hasQueue) {
              SD.remove(OFFLINE_FILE);
              SD.remove("/temp_sync.txt");
            }
          }
          xSemaphoreGive(fileMutex);
        }

        if (hasQueue) {
          isSyncing = true;
          int pemisah = baris.indexOf('|');
          if (pemisah != -1) {
            String uid   = baris.substring(0, pemisah);
            String waktu = baris.substring(pemisah + 1);

            String respon = kirimKeServer(uid, waktu, "OFFLINE");

            if (respon.startsWith("OK") || respon.startsWith("KARTU_BARU") || respon == "GURU_NOT_FOUND" || respon == "TIDAK_TERDAFTAR") {
              Serial.println("[Sync SD] Sukses kirim offline: " + uid);

              if (fileMutex && xSemaphoreTake(fileMutex, pdMS_TO_TICKS(SEMAPHORE_WAIT_MS)) == pdTRUE) {
                if (SD.exists(OFFLINE_FILE)) {
                  File fOrig = SD.open(OFFLINE_FILE, FILE_READ);
                  File fTemp = SD.open("/temp_sync.txt", FILE_WRITE);
                  if (fOrig && fTemp) {
                    if (fOrig.available()) fOrig.readStringUntil('\n');
                    while (fOrig.available()) {
                      fTemp.println(fOrig.readStringUntil('\n'));
                    }
                  }
                  if (fOrig) fOrig.close();
                  if (fTemp) fTemp.close();

                  SD.remove(OFFLINE_FILE);
                  File fCheck = SD.open("/temp_sync.txt", FILE_READ);
                  if (fCheck && fCheck.size() > 0) {
                    fCheck.close();
                    SD.rename("/temp_sync.txt", OFFLINE_FILE);
                  } else {
                    if (fCheck) fCheck.close();
                    SD.remove("/temp_sync.txt");
                    Serial.println("[Sync SD] SELURUH DATA SD CARD SELESAI DI-PUSH & FILE DIHAPUS BERSIH!");
                  }
                }
                xSemaphoreGive(fileMutex);
              }
              vTaskDelay(pdMS_TO_TICKS(100));
            } else {
              vTaskDelay(pdMS_TO_TICKS(3000));
            }
          }
          isSyncing = false;
        }
      }

    } else {
      if (millis() - lastWifiRetry >= 10000) {
        lastWifiRetry = millis();
        if (DEBUG_MODE) Serial.println("[WiFi] Mencoba koneksi ulang...");
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// =========================================================
// SYNC WAKTU NTP KE RTC (WIB UTC+7)
// =========================================================
void syncNTPWaktu() {
  configTime(7 * 3600, 0, "0.id.pool.ntp.org", "pool.ntp.org", "time.google.com");
  
  time_t now = time(nullptr);
  int retry = 0;
  while (now < 1704067200 && retry < 8) {
    delay(250);
    now = time(nullptr);
    retry++;
  }

  if (now >= 1704067200) {
    struct tm* timeinfo = localtime(&now);
    RtcDateTime newTime(
      timeinfo->tm_year + 1900,
      timeinfo->tm_mon + 1,
      timeinfo->tm_mday,
      timeinfo->tm_hour,
      timeinfo->tm_min,
      timeinfo->tm_sec
    );
    if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);
    if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
    Rtc.SetDateTime(newTime);
    Serial.printf("[NTP WIB] Waktu RTC DS1302 berhasil dikalibrasi: %04d-%02d-%02d %02d:%02d:%02d WIB\n",
      newTime.Year(), newTime.Month(), newTime.Day(),
      newTime.Hour(), newTime.Minute(), newTime.Second()
    );
  }
}

// =========================================================
// HELPER WAKTU & URL ENCODE
// =========================================================
String formatWaktu(const RtcDateTime& dt) {
  char buf[25];
  sprintf(buf, "%04d-%02d-%02d %02d:%02d:%02d",
          dt.Year(), dt.Month(), dt.Day(),
          dt.Hour(), dt.Minute(), dt.Second());
  return String(buf);
}

String urlEncode(const String& str) {
  String encoded = "";
  encoded.reserve(str.length() * 3);
  for (unsigned int i = 0; i < str.length(); i++) {
    char c = str.charAt(i);
    if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else if (c == ' ') {
      encoded += '+';
    } else {
      char buf[4];
      sprintf(buf, "%%%02X", (unsigned char)c);
      encoded += buf;
    }
  }
  return encoded;
}