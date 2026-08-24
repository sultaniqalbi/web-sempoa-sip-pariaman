import os
import requests
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def send_to_google_sheet(tab_name: str, rows: list, title: str = "Export Data"):
    """
    Kirim data baris ke Google Sheets.
    Mendukung Webhook Apps Script (Cara A) & Service Account gspread (Cara B).
    """
    webhook_url = os.getenv("GOOGLE_WEBHOOK_URL")
    service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    spreadsheet_url = os.getenv("GOOGLE_SPREADSHEET_URL")

    # 1. Cara A: Webhook (Google Apps Script)
    if webhook_url:
        try:
            # 1. Pad rows to ensure they have the exact same length
            max_cols = max((len(r) for r in rows), default=1)
            padded_rows = [list(r) + [""] * (max_cols - len(r)) for r in rows]

            payload = {
                "sheet": tab_name,
                "title": title,
                "timestamp": datetime.utcnow().isoformat(),
                "rows": padded_rows
            }
            # Kirim request POST ke URL Apps Script
            resp = requests.post(webhook_url, json=payload, timeout=15)
            logger.info(f"Google Sheet Webhook status: {resp.status_code}")

            # Cari URL asli Google Spreadsheet (bukan Apps Script URL)
            target_sheet_url = None
            try:
                resp_json = resp.json()
                if isinstance(resp_json, dict):
                    target_sheet_url = resp_json.get("sheet_url") or resp_json.get("spreadsheet_url") or resp_json.get("url")
            except Exception:
                pass

            if not target_sheet_url:
                if spreadsheet_url:
                    target_sheet_url = spreadsheet_url
                elif sheet_id:
                    target_sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
                else:
                    target_sheet_url = "https://docs.google.com/spreadsheets/d/1C9m90ipD2mt_pmWK5pNQ_YxfzwRbWZOlLYAXMtzMYKA/edit"
            
            return {
                "status": "success",
                "method": "webhook",
                "sheet_url": target_sheet_url,
                "worksheet_name": tab_name,
                "rows_written": max(0, len(rows) - 1),
                "message": f"Data {title} ({len(rows)-1} baris) berhasil dikirim ke Google Sheets via Webhook!",
                "sent_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error posting to Google Sheet Webhook: {e}")
            return {
                "status": "error",
                "message": f"Gagal mengirim ke Webhook Google Sheets: {str(e)}",
                "rows_written": max(0, len(rows) - 1)
            }

    # 2. Cara B: Service Account (gspread)
    if service_account_json and sheet_id and os.path.exists(service_account_json):
        try:
            import gspread
            gc = gspread.service_account(filename=service_account_json)
            sh = gc.open_by_key(sheet_id)
            try:
                ws = sh.worksheet(tab_name)
                ws.clear()
            except Exception:
                ws = sh.add_worksheet(title=tab_name, rows=len(rows)+10, cols=max(len(r) for r in rows) if rows else 10)
            ws.update(values=rows, range_name="A1")
            return {
                "status": "success",
                "method": "service_account",
                "sheet_url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid={ws.id}",
                "worksheet_name": tab_name,
                "rows_written": max(0, len(rows) - 1),
                "message": f"Data {title} ({len(rows)-1} baris) berhasil diekspor ke Google Sheets!",
                "sent_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error gspread export: {e}")
            return {
                "status": "error",
                "message": f"Gagal export ke Google Sheets Service Account: {str(e)}",
                "rows_written": max(0, len(rows) - 1)
            }

    # 3. Fallback jika tidak ada yang dikonfigurasi
    return {
        "status": "pending",
        "message": "Google Sheets belum dikonfigurasi. Pastikan GOOGLE_WEBHOOK_URL ada di backend/.env",
        "worksheet_name": tab_name,
        "rows_written": max(0, len(rows) - 1),
        "preview": rows[:5]
    }
