/*
  =========================================================
  SISTEM ABSENSI ESP32 BERBASIS IoT (ONLINE & OFFLINE SD CARD)
  UPDATED FOR FASTAPI BACKEND — Port 8000
  IP: 192.168.43.1 (Hotspot Laptop)
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
#include <FS.h>
#include <SD.h>
#include <time.h>

#define DEBUG_MODE 0

// ============ KONFIGURASI WIFI & SERVER ============
const char* WIFI_SSID     = "OPPO Find X8";
const char* WIFI_PASSWORD = "szgm7477";
const char* API_URL       = "https://sempoasippariaman.com/api/absensi";
const char* PING_URL      = "https://sempoasippariaman.com/api/ping";
const char* ESP32_API_KEY = "SempoaPariaman_ESP32_SecureKey_2026!";

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

// ============ PIN I2C LCD ============
#define LCD_SDA_PIN   21
#define LCD_SCL_PIN   22
#define LCD_ADDR      0x27
#define LCD_COLS      20
#define LCD_ROWS      4

// ============ FILE OFFLINE ============
#define OFFLINE_FILE  "/data_absensi.txt"

// ============ TIMEOUT HTTP (ms) ============
#define HTTP_TIMEOUT_MS   3000
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
volatile bool lcdNeedClear  = false;

SemaphoreHandle_t fileMutex = NULL;
SemaphoreHandle_t lcdMutex  = NULL;

String uidTerakhir = "";

enum StandbyState { TAMPIL_JAM, TAMPIL_JUDUL };
StandbyState standbyState      = TAMPIL_JAM;
unsigned long standbyStateMulai = 0;

// Prototipe
void wifiSyncTask(void *pvParameters);
String kirimKeServer(const String& uid, const String& waktu, const char* mode);
void simpanOffline(const String& uid, const String& waktu);
void syncNTPWaktu();
void prosesTap(const RtcDateTime& now);
void beepTap();
void beepGagal();
void jalankanStandby();
void tampilkanJam();
void tampilkanJudul();
void cetakCenter(const char* teks, int baris);
String formatWaktu(const RtcDateTime& dt);
String urlEncode(const String& str);

// =========================================================
void cetakCenter(const char* teks, int baris) {
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

// =========================================================
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n[BOOT] Sempoa SIP Absensi ESP32 starting...");
  Serial.println("[BOOT] API_URL: " + String(API_URL));
  Serial.println("[BOOT] PING_URL: " + String(PING_URL));

  fileMutex = xSemaphoreCreateMutex();
  lcdMutex  = xSemaphoreCreateMutex();
  if (!fileMutex || !lcdMutex) {
    Serial.println("[ERROR] Mutex gagal!");
    ESP.restart();
  }

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  Wire.setTimeOut(50);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  cetakCenter("SEMPOA SIP", 0);
  cetakCenter("Sistem Absensi", 1);
  cetakCenter("Memulai...", 2);

  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[BOOT] RFID OK");

  Rtc.Begin();
  if (!Rtc.IsDateTimeValid()) {
    RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
    Rtc.SetDateTime(compiled);
    Serial.println("[BOOT] RTC diset.");
  }
  if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
  if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);

  sdSPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  if (!SD.begin(SD_CS_PIN, sdSPI)) {
    Serial.println("[BOOT] SD gagal, lanjut tanpa SD.");
  } else {
    Serial.println("[BOOT] SD OK");
  }

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
    Serial.println("[ERROR] WiFi task gagal!");
    ESP.restart();
  }

  beepTap();
  delay(500);

  if (lcdMutex && xSemaphoreTake(lcdMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
    lcd.clear();
    xSemaphoreGive(lcdMutex);
  }

  Serial.println("[BOOT] Setup OK. Siap.");
}

// =========================================================
void loop() {
  if (!Rtc.IsDateTimeValid()) {
    delay(1000);
    return;
  }

  RtcDateTime now = Rtc.GetDateTime();

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    prosesTap(now);
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(500);
  }

  jalankanStandby();
  delay(100);
}

// =========================================================
void prosesTap(const RtcDateTime& now) {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();

  if (uid == uidTerakhir) {
    if (DEBUG_MODE) Serial.println("[Tap] Duplikat, skip.");
    return;
  }

  uidTerakhir = uid;
  String waktu = formatWaktu(now);

  Serial.println("[Tap] UID: " + uid + " | Waktu: " + waktu);

  cetakCenter("Tap terdeteksi", 1);
  delay(200);

  if (wifiConnected) {
    String respon = kirimKeServer(uid, waktu, "ONLINE");

    if (respon.startsWith("OK")) {
      beepTap();
      cetakCenter("BERHASIL", 2);
      Serial.println("[Tap] SUCCESS: " + respon);
    } else {
      beepGagal();
      cetakCenter(respon.c_str(), 2);
      Serial.println("[Tap] ERROR: " + respon);
    }
  } else {
    simpanOffline(uid, waktu);
    beepTap();
    cetakCenter("Offline - Tersimpan", 2);
    Serial.println("[Tap] Offline saved");
  }

  delay(1500);
  lcdNeedClear = true;
}

// =========================================================
String kirimKeServer(const String& uid, const String& waktu, const char* mode) {
  if (!wifiConnected) return "WIFI_OFF";

  WiFiClient client;
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
void beepTap() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(150);
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
}

void beepGagal() {
  for (int i = 0; i < 2; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

// =========================================================
void jalankanStandby() {
  unsigned long now = millis();

  if (now - standbyStateMulai >= DURASI_STANDBY) {
    standbyStateMulai = now;
    standbyState = (standbyState == TAMPIL_JAM) ? TAMPIL_JUDUL : TAMPIL_JAM;
  }

  if (lcdNeedClear) {
    if (lcdMutex && xSemaphoreTake(lcdMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
      lcd.clear();
      xSemaphoreGive(lcdMutex);
    }
    lcdNeedClear = false;
  }

  if (standbyState == TAMPIL_JAM) {
    tampilkanJam();
  } else {
    tampilkanJudul();
  }
}

void tampilkanJam() {
  if (!Rtc.IsDateTimeValid()) return;

  RtcDateTime now = Rtc.GetDateTime();
  char buf[30];
  sprintf(buf, "%02d:%02d:%02d | %02d-%02d-%04d",
          now.Hour(), now.Minute(), now.Second(),
          now.Day(), now.Month(), now.Year());

  cetakCenter(buf, 0);
  cetakCenter("TAP KARTU GURU", 1);
  
  const char* wifiStatus = wifiConnected ? "WiFi: ONLINE" : "WiFi: OFFLINE";
  cetakCenter(wifiStatus, 2);
}

void tampilkanJudul() {
  cetakCenter("SEMPOA SIP PARIAMAN", 0);
  cetakCenter("Sistem Absensi RFID", 1);
  cetakCenter("Menunggu tap kartu guru", 2);
}

// =========================================================
void wifiSyncTask(void *pvParameters) {
  Serial.println("[BOOT] WiFi Task started on Core " + String(xPortGetCoreID()));

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  vTaskDelay(pdMS_TO_TICKS(200));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setAutoReconnect(true);

  unsigned long lastNtpSync   = 0;
  unsigned long lastWifiRetry = millis();
  unsigned long lastPingSync  = 0;
  unsigned long lastHeapLog   = 0;

  while (true) {
    bool currentWifi = (WiFi.status() == WL_CONNECTED);
    wifiConnected = currentWifi;

    if (millis() - lastHeapLog >= 60000) {
      lastHeapLog = millis();
      if (DEBUG_MODE) Serial.println("[Debug] Heap: " + String(esp_get_free_heap_size()));
    }

    if (currentWifi) {

      if (millis() - lastPingSync >= 5000) {
        lastPingSync = millis();

        WiFiClient pingClient;
        HTTPClient httpPing;

        if (httpPing.begin(pingClient, PING_URL)) {
          httpPing.setTimeout(HTTP_TIMEOUT_MS);
          httpPing.addHeader("X-API-Key", ESP32_API_KEY);
          int pingCode = httpPing.GET();

          if (pingCode == HTTP_CODE_OK) {
            String pingRes = httpPing.getString();
            pingRes.trim();
            if (pingRes != "OK" || DEBUG_MODE) Serial.println("[Ping] " + pingRes);

            if (pingRes == "FULL_RESET") {
              Serial.println("[Ping] FULL_RESET!");
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

      if (lastNtpSync == 0 || millis() - lastNtpSync >= 24UL * 3600000UL) {
        syncNTPWaktu();
        lastNtpSync = millis();
      }

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
            if (DEBUG_MODE) Serial.println("[Sync] Send: " + uid);

            String respon = kirimKeServer(uid, waktu, "OFFLINE");

            if (respon.startsWith("OK") || respon == "EXPIRED" || respon == "TIDAK_TERDAFTAR") {
              Serial.println("[Sync] Sukses: " + uid);

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
                    Serial.println("[Sync] Queue kosong!");
                  }
                }
                xSemaphoreGive(fileMutex);
              }
              vTaskDelay(pdMS_TO_TICKS(300));
            } else {
              Serial.println("[Sync] Gagal, retry 5 detik...");
              vTaskDelay(pdMS_TO_TICKS(5000));
            }
          }
          isSyncing = false;
        }
      }

    } else {
      if (millis() - lastWifiRetry >= 30000) {
        lastWifiRetry = millis();
        if (DEBUG_MODE) Serial.println("[WiFi] Reconnecting...");
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

// =========================================================
void syncNTPWaktu() {
  if (DEBUG_MODE) Serial.println("[NTP] Syncing...");
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
    Serial.println("[NTP] Sync OK");
  }
}

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