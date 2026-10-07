# /// script
# dependencies = [
#   "selenium",
# ]
# ///
"""
HH Job Copilot — Local HeadHunter Login Companion Bot
=====================================================
Launches a genuine Google Chrome browser window on your local machine to sign in to HeadHunter (hh.ru).
Captures your session cookie (hhtoken) automatically and copies it to your clipboard or
bridges it directly to your dashboard.

Usage:
  1. Double-click `login_hh.bat` (or run: `uv run login_hh.py`)
  2. A Chrome window will open. Please sign in to your hh.ru account.
  3. Once signed in, the token is automatically copied to your clipboard!
"""

import os
import sys
import time
import json
import shutil
import tempfile
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

def copy_to_clipboard(text: str):
    """Copies text to the system clipboard."""
    try:
        process = subprocess.Popen(["clip"], stdin=subprocess.PIPE, shell=True)
        process.communicate(text.encode("utf-8"))
        return True
    except Exception:
        try:
            cmd = f'Set-Clipboard -Value "{text}"'
            subprocess.run(["powershell", "-Command", cmd], capture_output=True)
            return True
        except Exception:
            return False

def run_browser_login(timeout_sec=240):
    """Launches Chrome and polls until the hhtoken cookie is captured."""
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options

    print("\n[1/3] Preparing Google Chrome browser...")
    options = Options()
    options.add_argument("--window-size=1260,860")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    
    temp_dir = tempfile.mkdtemp(prefix="hh_login_session_")
    options.add_argument(f"--user-data-dir={temp_dir}")

    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        print("[2/3] Opening HeadHunter sign-in page (https://hh.ru)...")
        print("      Please enter your phone/email and confirm the SMS/OTP code in the Chrome window.")
        
        driver.get("https://hh.ru/account/login?backurl=%2Fapplicant%2Fresumes")
        start_time = time.time()

        while time.time() - start_time < timeout_sec:
            try:
                current_url = driver.current_url
                cookies = driver.get_cookies()
                
                hhtoken_cookie = next((c for c in cookies if c.get("name") == "hhtoken"), None)
                hhtoken_val = hhtoken_cookie.get("value") if hhtoken_cookie else None

                # Detect login success
                is_auth_url = (
                    "/applicant/" in current_url
                    or "/resume/" in current_url
                    or (
                        "hh.ru" in current_url
                        and "/account/login" not in current_url
                        and "/account/signup" not in current_url
                        and "/account/verification" not in current_url
                        and "/account/otp" not in current_url
                        and "/account/code" not in current_url
                    )
                )

                if (hhtoken_val and is_auth_url) or ("/applicant/resumes" in current_url):
                    print("\n[3/3] Sign-in Successfully Detected!")
                    
                    # Ensure on resumes page to populate complete session cookies
                    if "/applicant/resumes" not in current_url:
                        driver.get("https://hh.ru/applicant/resumes")
                        time.sleep(2)
                        cookies = driver.get_cookies()
                        hhtoken_cookie = next((c for c in cookies if c.get("name") == "hhtoken"), None)
                        hhtoken_val = hhtoken_cookie.get("value") if hhtoken_cookie else hhtoken_val

                    cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
                    return {
                        "success": True,
                        "token": hhtoken_val or cookie_str,
                        "cookieString": cookie_str,
                    }
            except Exception:
                pass
            time.sleep(1)

        return {"success": False, "error": "Login timed out (4 minutes). Please try again."}
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

class CompanionServerHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "hh-local-companion"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/launch":
            res = run_browser_login(timeout_sec=240)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

def start_server():
    server = HTTPServer(("127.0.0.1", 7890), CompanionServerHandler)
    print("\n" + "=" * 60)
    print(" HH Job Copilot — Local Bridge Active at http://127.0.0.1:7890")
    print("=" * 60)
    print(" Status: Standby waiting for 'Launch Browser Login' in your web dashboard.")
    print(" Press Ctrl + C to stop the bridge.")
    print("-" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nBridge stopped.")

def main():
    print("=" * 60)
    print("  HH Job Copilot — HeadHunter Local Login Assistant")
    print("=" * 60)

    if "--serve" in sys.argv:
        start_server()
        return

    # Default: Interactive login session
    print("\nStarting HeadHunter sign-in session on your system...")
    result = run_browser_login(timeout_sec=240)

    if result.get("success"):
        token = result.get("token")
        
        # Copy to clipboard
        copied = copy_to_clipboard(token)
        
        print("\n" + "=" * 60)
        print("  SUCCESS! HeadHunter Session Captured Successfully!")
        print("=" * 60)
        print(f" Your Token: {token[:25]}... (length: {len(token)} characters)")
        if copied:
            print(" >> TOKEN HAS BEEN COPIED TO YOUR CLIPBOARD! <<")
        print("\n Next steps:")
        print(" 1. Open the Dashboard Settings page in your browser.")
        print(" 2. In the 'Direct Cookie / Token Paste' section, press Ctrl + V to Paste.")
        print(" 3. Click 'Validate & Load Resumes'.")
        print("=" * 60 + "\n")
    else:
        print("\n" + "=" * 60)
        print(f" [FAILED] {result.get('error', 'Login was not completed.')}")
        print("=" * 60 + "\n")

    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
