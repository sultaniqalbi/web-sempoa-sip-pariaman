/*
  =========================================================
  SISTEM ABSENSI RFID ESP32 BERBASIS IoT
  SEMPOA SIP TC PARIAMAN
  
  Spesifikasi Hardware & Perilaku:
  1. Boot / Nyala: Bip panjang 1 detik (1000ms).
  2. Tap Kartu Terdaftar: Bip panjang 0.5 detik (500ms).
     Layar menampilkan:
     - Baris 0: "Selamat Datang" (Center)
     - Baris 1: [Nama Guru] (Center)
     - Baris 2: "Absensi Berhasil" / "Sudah Absen Hari Ini" (Center)
     - Baris 3: [Jam & Tanggal] (Center)
  3. Tap Kartu Belum Terdaftar (Kartu Baru untuk Pendaftaran Guru/Siswa):
     - Bip 3 kali masing-masing 0.1 detik (100ms).
     - Layar menampilkan: "KARTU BARU", "UID: [UID]", "Siap Didaftarkan".
     - Terkirim otomatis ke backend (last_tap.json) untuk auto-fill form pendaftaran.
  4. Semua teks di layar LCD 20x4 rata tengah (Center Aligned).
  5. Anti-Kedip (No-Flicker): Penulisan LCD atomik 20 karakter dengan spasi padding,
     tanpa lcd.clear() berulang, clock I2C 100kHz stabil.
  6. Keamanan TLS HTTPS Let's Encrypt CA Root & NVS Storage.
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

// ISRG Root X1 — Let's Encrypt Root CA (valid sampai 2035-06-04)
const char* ISRG_ROOT_X1 = \
  "-----BEGIN CERTIFICATE-----\n" \
  "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\n" \
  "j/KQRDBk27E=\n" \
  "-----END CERTIFICATE-----\n";

// ============ SECURITY FIX: NVS CREDENTIALS & TLS ============
Preferences preferences;
String WIFI_SSID     = "";
String WIFI_PASSWORD = "";
String ESP32_API_KEY = "";
const char* API_URL  = "https://sempoasippariaman.com/api/absensi";
const char* PING_URL = "https://sempoasippariaman.com/api/ping";

// ============ PIN RFID RC522 (VSPI) ============
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4

// ============ PIN MICRO SD CARD (HSPI) ============
#define SD_CS_PIN     32
#define SD_MOSI_PIN   13
#define SD_MISO_PIN   12
#define SD_SCK_PIN    33

// ============ PIN RTC DS1302 ============
#define RTC_CLK_PIN   14
#define RTC_DAT_PIN   27
#define RTC_RST_PIN   26

// ============ PIN BUZZER ============
#define BUZZER_PIN    15

// ============ PIN I2C LCD (20x4) ============
#define LCD_SDA_PIN   21
#define LCD_SCL_PIN   22
#define LCD_ADDR      0x27
#define LCD_COLS      20
#define LCD_ROWS      4

// ============ FILE OFFLINE ============
#define OFFLINE_FILE  "/data_absensi.txt"

// ============ TIMEOUT HTTP (ms) ============
#define HTTP_TIMEOUT_MS   3500
#define SEMAPHORE_WAIT_MS 2000

const unsigned long DURASI_STANDBY = 5000;

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
const unsigned long DEBOUNCE_TAP_MS = 2500;

enum StandbyState { TAMPIL_STATUS, TAMPIL_JAM };
StandbyState standbyState      = TAMPIL_STATUS;
unsigned long standbyStateMulai = 0;
int detikTerakhir = -1;

// Prototipe Fungsi
void wifiSyncTask(void *pvParameters);
String kirimKeServer(const String& uid, const String& waktu, const char* mode);
void simpanOffline(const String& uid, const String& waktu);
void syncNTPWaktu();
void prosesTap(const RtcDateTime& now);
void beepBoot();
void beepKartuTerdaftar();
void beepKartuBaru();
void jalankanStandby();
void tampilkanStatusStandby();
void tampilkanJamStandby();
void cetakCenter(const char* teks, int baris);
void cetakSemuaCenter(const char* l0, const char* l1, const char* l2, const char* l3);
String formatWaktu(const RtcDateTime& dt);
String urlEncode(const String& str);

// =========================================================
// HELPER: Cetak Rata Tengah (Center Aligned) Anti-Flicker
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

void cetakSemuaCenter(const char* l0, const char* l1, const char* l2, const char* l3) {
  cetakCenter(l0 ? l0 : "", 0);
  cetakCenter(l1 ? l1 : "", 1);
  cetakCenter(l2 ? l2 : "", 2);
  cetakCenter(l3 ? l3 : "", 3);
}

// =========================================================
// BUZZER FUNCTIONS
// =========================================================
// 1. Boot / Nyala: Bip panjang 1 detik (1000ms)
void beepBoot() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(1000);
  digitalWrite(BUZZER_PIN, LOW);
}

// 2. Kartu Terdaftar: Bip panjang 0.5 detik (500ms)
void beepKartuTerdaftar() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(500);
  digitalWrite(BUZZER_PIN, LOW);
}

// 3. Kartu Belum Terdaftar / Baru: Bip 3 kali masing-masing 0.1 detik (100ms)
void beepKartuBaru() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < 2) delay(100);
  }
}

// =========================================================
// SETUP
// =========================================================
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n[BOOT] Sempoa SIP Absensi ESP32 starting...");

  // Load credentials from Non-Volatile Storage (NVS)
  preferences.begin("sempoa_cfg", false);
  WIFI_SSID = preferences.getString("ssid", "");
  WIFI_PASSWORD = preferences.getString("pass", "");
  ESP32_API_KEY = preferences.getString("apikey", "");
  preferences.end();

  if (WIFI_SSID.isEmpty() || WIFI_PASSWORD.isEmpty() || ESP32_API_KEY.isEmpty()) {
    Serial.println("[ERROR] Credentials belum di-provisioning di NVS!");
    Serial.println("[INFO] Gunakan Serial Monitor untuk provisioning.");
    Serial.println("[INFO] Format: PROV|SSID|PASSWORD|API_KEY");

    while (true) {
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
            Serial.println("[OK] Credentials tersimpan di NVS. Restart...");
            delay(1000);
            ESP.restart();
          } else {
            Serial.println("[ERROR] Format salah. Gunakan: PROV|SSID|PASS|APIKEY");
          }
        }
      }
      delay(100);
    }
  }

  Serial.println("[BOOT] Target WiFi: " + WIFI_SSID);

  fileMutex = xSemaphoreCreateMutex();
  lcdMutex  = xSemaphoreCreateMutex();
  if (!fileMutex || !lcdMutex) {
    Serial.println("[ERROR] Mutex gagal!");
    ESP.restart();
  }

  // Inisialisasi Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Inisialisasi I2C LCD dengan frekuensi standar 100kHz (anti noise & drop arus)
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  Wire.setClock(100000);
  Wire.setTimeOut(50);
  lcd.init();
  lcd.backlight();

  // Tampilan Booting Awal
  cetakSemuaCenter("SEMPOA SIP PARIAMAN", "SISTEM ABSENSI", "Memulai Sistem...", "Mohon Tunggu");

  // Bunyikan Bip Booting Panjang 1 Detik
  beepBoot();

  // Inisialisasi RFID RC522
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[BOOT] RFID RC522 OK");

  // Inisialisasi RTC DS1302
  Rtc.Begin();
  if (!Rtc.IsDateTimeValid()) {
    RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
    Rtc.SetDateTime(compiled);
    Serial.println("[BOOT] RTC diset ke waktu compile.");
  }
  if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
  if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);

  // Inisialisasi SD Card (Offline Fallback)
  sdSPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  if (!SD.begin(SD_CS_PIN, sdSPI)) {
    Serial.println("[BOOT] SD Card tidak terdeteksi, berjalan mode Online.");
  } else {
    Serial.println("[BOOT] SD Card OK.");
  }

  // Jalankan Background WiFi Sync Task di Core 0
  BaseType_t taskResult = xTaskCreatePinnedToCore(
    wifiSyncTask,
    "WifiSyncTask",
    32768,
    NULL,
    1,
    NULL,
    0
  );

  if (taskResult != pdPASS) {
    Serial.println("[ERROR] WiFi task gagal dibuat!");
  }

  delay(500);
  cetakSemuaCenter("SEMPOA SIP PARIAMAN", "SISTEM SIAP", "Silakan Tap Kartu", "WiFi: Menghubungkan");
  standbyStateMulai = millis();

  Serial.println("[BOOT] Setup OK. Siap digunakan.");
}

// =========================================================
// MAIN LOOP (CORE 1)
// =========================================================
void loop() {
  if (!Rtc.IsDateTimeValid()) {
    delay(500);
    return;
  }

  RtcDateTime now = Rtc.GetDateTime();

  // Deteksi Tap Kartu RFID
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    prosesTap(now);
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(200);
  }

  jalankanStandby();
  delay(100);
}

// =========================================================
// PROSES TAP KARTU RFID
// =========================================================
void prosesTap(const RtcDateTime& now) {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();

  // Debounce check: cegah double tap instan kartu yang sama
  unsigned long msNow = millis();
  if (uid == uidTerakhir && (msNow - waktuTapTerakhir < DEBOUNCE_TAP_MS)) {
    if (DEBUG_MODE) Serial.println("[Tap] Duplikat diabaikan.");
    return;
  }

  uidTerakhir = uid;
  waktuTapTerakhir = msNow;
  String waktu = formatWaktu(now);

  Serial.println("[Tap] UID: " + uid + " | Waktu: " + waktu);

  cetakSemuaCenter("MEMPROSES KARTU", uid.c_str(), "Menghubungkan Server...", "");
  delay(100);

  if (wifiConnected) {
    String respon = kirimKeServer(uid, waktu, "ONLINE");
    Serial.println("[Server Response] " + respon);

    if (respon.startsWith("OK")) {
      // Kartu Guru Terdaftar
      // Format respon: "OK|<nama_guru>" atau "OK|<nama_guru>|SUDAH_TAP"
      String namaGuru = "Guru Sempoa";
      bool sudahTap = respon.indexOf("SUDAH_TAP") != -1;

      int idxFirst = respon.indexOf('|');
      if (idxFirst != -1) {
        int idxSecond = respon.indexOf('|', idxFirst + 1);
        if (idxSecond != -1) {
          namaGuru = respon.substring(idxFirst + 1, idxSecond);
        } else {
          namaGuru = respon.substring(idxFirst + 1);
        }
      }
      namaGuru.trim();

      char jamBuf[10];
      sprintf(jamBuf, "%02d:%02d:%02d WIB", now.Hour(), now.Minute(), now.Second());

      cetakCenter("Selamat Datang", 0);
      cetakCenter(namaGuru.c_str(), 1);
      cetakCenter(sudahTap ? "Sudah Absen Hari Ini" : "Absensi Berhasil", 2);
      cetakCenter(jamBuf, 3);

      // Bip panjang 0.5 detik untuk kartu terdaftar
      beepKartuTerdaftar();

    } else if (respon == "GURU_NOT_FOUND" || respon == "TIDAK_TERDAFTAR" || respon.startsWith("UNREGISTERED")) {
      // Kartu Baru (Belum Terdaftar) -> Bip 3x 0.1s dan tampilkan UID
      cetakCenter("KARTU BARU", 0);
      cetakCenter("UID:", 1);
      cetakCenter(uid.c_str(), 2);
      cetakCenter("Siap Didaftarkan", 3);

      // Bip 3 kali (0.1 detik)
      beepKartuBaru();

    } else {
      // Error koneksi / Rate limit / Lainnya
      cetakCenter("INFO ABSENSI", 0);
      cetakCenter(respon.c_str(), 1);
      cetakCenter(uid.c_str(), 2);
      cetakCenter("Coba Lagi Nanti", 3);

      beepKartuBaru();
    }

  } else {
    // Mode Offline SD Card
    simpanOffline(uid, waktu);
    cetakCenter("OFFLINE MODE", 0);
    cetakCenter(uid.c_str(), 1);
    cetakCenter("Tersimpan di SD Card", 2);
    cetakCenter("Akan Disinkronkan", 3);

    beepKartuTerdaftar();
  }

  delay(2000);
  standbyStateMulai = millis();
  detikTerakhir = -1; // Force refresh standby
}

// =========================================================
// KIRIM KE SERVER (HTTPS TLS ISRG ROOT X1)
// =========================================================
String kirimKeServer(const String& uid, const String& waktu, const char* mode) {
  if (!wifiConnected) return "WIFI_OFF";

  WiFiClientSecure client;
  client.setCACert(ISRG_ROOT_X1);
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
// SIMPAN OFFLINE DI SD CARD
// =========================================================
void simpanOffline(const String& uid, const String& waktu) {
  if (!fileMutex) return;

  if (xSemaphoreTake(fileMutex, pdMS_TO_TICKS(SEMAPHORE_WAIT_MS)) == pdTRUE) {
    File file = SD.open(OFFLINE_FILE, FILE_APPEND);
    if (file) {
      file.println(uid + "|" + waktu);
      file.close();
    }
    xSemaphoreGive(fileMutex);
  }
}

// =========================================================
// TAMPILAN STANDBY (ANTI-KEDIP / NO-FLICKER)
// =========================================================
void jalankanStandby() {
  unsigned long nowMs = millis();

  if (nowMs - standbyStateMulai >= DURASI_STANDBY) {
    standbyStateMulai = nowMs;
    standbyState = (standbyState == TAMPIL_STATUS) ? TAMPIL_JAM : TAMPIL_STATUS;
    detikTerakhir = -1; // trigger screen update
  }

  if (standbyState == TAMPIL_STATUS) {
    tampilkanStatusStandby();
  } else {
    tampilkanJamStandby();
  }
}

void tampilkanStatusStandby() {
  if (!Rtc.IsDateTimeValid()) return;
  RtcDateTime now = Rtc.GetDateTime();

  // Hanya update jika detik berubah agar tidak kedip
  if (now.Second() == detikTerakhir) return;
  detikTerakhir = now.Second();

  char jamBuf[25];
  sprintf(jamBuf, "%02d:%02d:%02d | %02d-%02d-%04d",
          now.Hour(), now.Minute(), now.Second(),
          now.Day(), now.Month(), now.Year());

  cetakCenter("SEMPOA SIP PARIAMAN", 0);
  cetakCenter("Silakan Tap Kartu", 1);
  cetakCenter(jamBuf, 2);
  cetakCenter(wifiConnected ? "Status: ONLINE" : "Status: OFFLINE", 3);
}

void tampilkanJamStandby() {
  if (!Rtc.IsDateTimeValid()) return;
  RtcDateTime now = Rtc.GetDateTime();

  if (now.Second() == detikTerakhir) return;
  detikTerakhir = now.Second();

  char jamBesar[20];
  sprintf(jamBesar, "PUKUL %02d:%02d:%02d", now.Hour(), now.Minute(), now.Second());

  char tglBuf[20];
  sprintf(tglBuf, "%02d-%02d-%04d", now.Day(), now.Month(), now.Year());

  cetakCenter("SEMPOA SIP PARIAMAN", 0);
  cetakCenter(jamBesar, 1);
  cetakCenter(tglBuf, 2);
  cetakCenter("Siap Absensi", 3);
}

// =========================================================
// BACKGROUND WIFI SYNC TASK (CORE 0)
// =========================================================
void wifiSyncTask(void *pvParameters) {
  Serial.println("[BOOT] WiFi Task berjalan pada Core " + String(xPortGetCoreID()));

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  vTaskDelay(pdMS_TO_TICKS(200));
  WiFi.begin(WIFI_SSID.c_str(), WIFI_PASSWORD.c_str());
  WiFi.setAutoReconnect(true);

  unsigned long lastNtpSync   = 0;
  unsigned long lastWifiRetry = millis();
  unsigned long lastPingSync  = 0;

  while (true) {
    bool currentWifi = (WiFi.status() == WL_CONNECTED);
    wifiConnected = currentWifi;

    if (currentWifi) {
      // Ping Heartbeat ke Server setiap 10 detik
      if (millis() - lastPingSync >= 10000) {
        lastPingSync = millis();

        WiFiClientSecure pingClient;
        pingClient.setCACert(ISRG_ROOT_X1);
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

      // Sync NTP Time sekali sehari
      if (lastNtpSync == 0 || millis() - lastNtpSync >= 24UL * 3600000UL) {
        syncNTPWaktu();
        lastNtpSync = millis();
      }

      // Sinkronisasi antrean data offline SD Card ke Server
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

            if (respon.startsWith("OK") || respon == "GURU_NOT_FOUND" || respon == "TIDAK_TERDAFTAR") {
              Serial.println("[Sync] Sukses kirim offline: " + uid);

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
                  }
                }
                xSemaphoreGive(fileMutex);
              }
              vTaskDelay(pdMS_TO_TICKS(300));
            } else {
              vTaskDelay(pdMS_TO_TICKS(5000));
            }
          }
          isSyncing = false;
        }
      }

    } else {
      if (millis() - lastWifiRetry >= 20000) {
        lastWifiRetry = millis();
        if (DEBUG_MODE) Serial.println("[WiFi] Mencoba koneksi ulang...");
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

// =========================================================
// SYNC WAKTU NTP KE RTC
// =========================================================
void syncNTPWaktu() {
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  delay(1000);

  time_t now = time(nullptr);
  if (now > 24 * 3600) {
    struct tm* timeinfo = localtime(&now);
    RtcDateTime newTime(
      timeinfo->tm_year + 1900,
      timeinfo->tm_mon + 1,
      timeinfo->tm_mday,
      timeinfo->tm_hour,
      timeinfo->tm_min,
      timeinfo->tm_sec
    );
    Rtc.SetDateTime(newTime);
    Serial.println("[NTP] Waktu RTC berhasil disinkronkan.");
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