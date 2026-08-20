/*
  =========================================================
  SISTEM ABSENSI RFID ESP32 BERBASIS IoT
  SEMPOA SIP TC PARIAMAN
  
  Spesifikasi Hardware (LCD 16x2 & Buzzer):
  1. Layar LCD: 16 Kolom x 2 Baris (16x2 I2C).
  2. Semua teks di-center otomatis dan pas 16 karakter (tanpa terpotong).
  3. Boot / Nyala: Bip panjang 1 detik (1000ms).
  4. Tap Kartu Terdaftar (Guru / Siswa):
     - Bip panjang 0.5 detik (500ms).
     - Layar Baris 0: "Selamat Datang"
     - Layar Baris 1: [Nama Guru / Siswa]
  5. Tap Kartu Baru (Belum Terdaftar):
     - Bip 3 kali (0.1 detik on, 0.1 detik off).
     - Layar Baris 0: "KARTU BARU"
     - Layar Baris 1: [UID Kartu]
     - Terkirim otomatis ke backend untuk auto-fill form pendaftaran guru/siswa di web.
  6. Anti-Kedip (No-Flicker): Penulisan LCD atomik 16 karakter tanpa lcd.clear() di loop.
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

// ============ PENGATURAN WIFI & API KEY ============
// Ganti nama WiFi/Hotspot dan Password Anda di sini:
const char* DEFAULT_WIFI_SSID     = "SEMPOA_SIP"; // Ganti dengan nama Hotspot HP / WiFi Anda
const char* DEFAULT_WIFI_PASS     = "12345678";   // Ganti dengan password Hotspot / WiFi Anda
const char* DEFAULT_ESP32_API_KEY = "SempoaPariaman_ESP32_SecureKey_2026!";

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

// ============ PIN I2C LCD (16x2) ============
#define LCD_SDA_PIN   21
#define LCD_SCL_PIN   22
#define LCD_ADDR      0x27
#define LCD_COLS      16
#define LCD_ROWS      2

// ============ FILE OFFLINE ============
#define OFFLINE_FILE  "/data_absensi.txt"

// ============ TIMEOUT HTTP (ms) ============
#define HTTP_TIMEOUT_MS   3500
#define SEMAPHORE_WAIT_MS 2000

const unsigned long DURASI_STANDBY = 4000;

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

enum StandbyState { TAMPIL_STATUS, TAMPIL_JAM, TAMPIL_WIFI };
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
void tampilkanWifiStandby();
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
  delay(100);
  Serial.println("\n[BOOT] Sempoa SIP Absensi ESP32 (LCD 16x2) Starting...");

  fileMutex = xSemaphoreCreateMutex();
  lcdMutex  = xSemaphoreCreateMutex();

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

  // 3. Inisialisasi RFID RC522
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[BOOT] RFID RC522 OK");

  // 4. Inisialisasi RTC DS1302
  Rtc.Begin();
  if (!Rtc.IsDateTimeValid()) {
    RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
    Rtc.SetDateTime(compiled);
    Serial.println("[BOOT] RTC diset ke waktu compile.");
  }
  if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
  if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);

  // 5. Inisialisasi SD Card (Offline Mode)
  sdSPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  if (!SD.begin(SD_CS_PIN, sdSPI)) {
    Serial.println("[BOOT] SD Card tidak terpasang.");
  } else {
    Serial.println("[BOOT] SD Card OK.");
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

  Serial.println("[BOOT] WiFi Target: " + WIFI_SSID);

  // 7. Jalankan Background Task Sinkronisasi WiFi di Core 0
  xTaskCreatePinnedToCore(
    wifiSyncTask,
    "WifiSyncTask",
    32768,
    NULL,
    1,
    NULL,
    0
  );

  delay(600);
  cetakDuaBarisCenter("SEMPOA SIP", "Silakan Tap");
  standbyStateMulai = millis();

  Serial.println("[BOOT] Setup OK. Siap menerima tap kartu.");
}

// =========================================================
// MAIN LOOP (CORE 1)
// =========================================================
void loop() {
  // Cek jika ada input provisioning serial dari admin (Opsional)
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

  if (!Rtc.IsDateTimeValid()) {
    delay(300);
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
// PROSES TAP KARTU RFID (LCD 16x2 RATA TENGAH)
// =========================================================
void prosesTap(const RtcDateTime& now) {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();

  // Debounce: cegah tap ganda dalam 2.5 detik
  unsigned long msNow = millis();
  if (uid == uidTerakhir && (msNow - waktuTapTerakhir < DEBOUNCE_TAP_MS)) {
    if (DEBUG_MODE) Serial.println("[Tap] Duplikat diabaikan.");
    return;
  }

  uidTerakhir = uid;
  waktuTapTerakhir = msNow;
  String waktu = formatWaktu(now);

  Serial.println("[Tap] UID: " + uid + " | Waktu: " + waktu);

  cetakDuaBarisCenter("MEMPROSES...", uid.c_str());
  delay(100);

  if (wifiConnected) {
    String respon = kirimKeServer(uid, waktu, "ONLINE");
    Serial.println("[Server Response] " + respon);

    if (respon.startsWith("OK")) {
      // 1. KARTU TERDAFTAR (GURU / SISWA)
      // Format respon: "OK|<nama>" atau "OK|<nama>|SUDAH_TAP"
      String nama = "Guru Sempoa";
      bool sudahTap = respon.indexOf("SUDAH_TAP") != -1;

      int idxFirst = respon.indexOf('|');
      if (idxFirst != -1) {
        int idxSecond = respon.indexOf('|', idxFirst + 1);
        if (idxSecond != -1) {
          nama = respon.substring(idxFirst + 1, idxSecond);
        } else {
          nama = respon.substring(idxFirst + 1);
        }
      }
      nama.trim();

      // Potong nama jika lebih dari 16 karakter
      if (nama.length() > 16) {
        nama = nama.substring(0, 16);
      }

      // Tampilkan "Selamat Datang" di atas dan Nama di bawah
      cetakDuaBarisCenter("Selamat Datang", nama.c_str());

      // Bip panjang 0.5 detik
      beepKartuTerdaftar();

      delay(1500);

      // Tampilkan status absensi
      char jamBuf[10];
      sprintf(jamBuf, "%02d:%02d WIB", now.Hour(), now.Minute());
      cetakDuaBarisCenter(sudahTap ? "Sudah Absen" : "Absensi Sukses", jamBuf);
      delay(1500);

    } else if (respon == "GURU_NOT_FOUND" || respon == "TIDAK_TERDAFTAR" || respon.startsWith("UNREGISTERED")) {
      // 2. KARTU BARU (BELUM TERDAFTAR) -> Untuk Pendaftaran Guru / Siswa Baru
      cetakDuaBarisCenter("KARTU BARU", uid.c_str());

      // Bip 3 kali (0.1 detik)
      beepKartuBaru();

      delay(1500);
      cetakDuaBarisCenter("UID Terkirim", "Siap Didaftar");
      delay(1500);

    } else {
      // 3. Error lainnya
      cetakDuaBarisCenter("INFO ABSENSI", respon.c_str());
      beepKartuBaru();
      delay(1500);
    }

  } else {
    // Mode Offline SD Card
    simpanOffline(uid, waktu);
    cetakDuaBarisCenter("OFFLINE MODE", uid.c_str());
    beepKartuTerdaftar();
    delay(1500);
    cetakDuaBarisCenter("Tersimpan di SD", "Akan Disinkron");
    delay(1500);
  }

  standbyStateMulai = millis();
  detikTerakhir = -1;
}

// =========================================================
// KIRIM KE SERVER (HTTPS TLS)
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
// STANDBY SCREEN LCD 16x2 (ANTI-KEDIP)
// =========================================================
void jalankanStandby() {
  unsigned long nowMs = millis();

  if (nowMs - standbyStateMulai >= DURASI_STANDBY) {
    standbyStateMulai = nowMs;
    if (standbyState == TAMPIL_STATUS) {
      standbyState = TAMPIL_JAM;
    } else if (standbyState == TAMPIL_JAM) {
      standbyState = TAMPIL_WIFI;
    } else {
      standbyState = TAMPIL_STATUS;
    }
    detikTerakhir = -1; // Trigger refresh
  }

  if (standbyState == TAMPIL_STATUS) {
    tampilkanStatusStandby();
  } else if (standbyState == TAMPIL_JAM) {
    tampilkanJamStandby();
  } else {
    tampilkanWifiStandby();
  }
}

// Tampilan 1: Judul & Ajakan Tap
void tampilkanStatusStandby() {
  if (detikTerakhir == 0) return;
  detikTerakhir = 0;
  cetakDuaBarisCenter("SEMPOA SIP", "Silakan Tap");
}

// Tampilan 2: Jam & Tanggal
void tampilkanJamStandby() {
  if (!Rtc.IsDateTimeValid()) return;
  RtcDateTime now = Rtc.GetDateTime();

  if (now.Second() == detikTerakhir) return;
  detikTerakhir = now.Second();

  char jamBuf[17];
  sprintf(jamBuf, "Pukul %02d:%02d:%02d", now.Hour(), now.Minute(), now.Second());

  char tglBuf[17];
  sprintf(tglBuf, "%02d-%02d-%04d", now.Day(), now.Month(), now.Year());

  cetakDuaBarisCenter(jamBuf, tglBuf);
}

// Tampilan 3: Status WiFi
void tampilkanWifiStandby() {
  if (detikTerakhir == 2) return;
  detikTerakhir = 2;

  cetakDuaBarisCenter("SEMPOA SIP", wifiConnected ? "WiFi: ONLINE" : "WiFi: OFFLINE");
}

// =========================================================
// BACKGROUND WIFI TASK (CORE 0)
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
      if (millis() - lastWifiRetry >= 15000) {
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