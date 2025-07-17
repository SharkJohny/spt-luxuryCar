from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import os

# Setup Chrome
options = Options()
options.headless = False
service = Service()
driver = webdriver.Chrome(service=service, options=options)

url = "https://luxuscarmats.com/"
driver.get(url)

print("🚗 Otvorený prehliadač na luxuscarmats.com")
print("📋 Inštrukcie:")
print("   1. Vyber rok (ak chceš)")  
print("   2. Manuálne meň značky v selecte")
print("   3. Script automaticky uloží modely po každej zmene značky")
print("   4. Stlač Ctrl+C pre ukončenie")
print("\n" + "="*50)

# Load existing data if available
json_file = "car_data_manual.json"
car_data = {}
if os.path.exists(json_file):
    with open(json_file, "r", encoding="utf-8") as f:
        car_data = json.load(f)
    print(f"📁 Načítané existujúce dáta: {len(car_data)} značiek")

last_selected_make = ""
counter = 0

try:
    while True:
        try:
            # Sleduj aktuálne vybranú značku
            make_select = Select(driver.find_element(By.ID, "make"))
            current_make_value = make_select.first_selected_option.get_attribute("value")
            current_make_text = make_select.first_selected_option.text.strip()
            
            # Ak sa značka zmenila a nie je prázdna
            if (current_make_value != last_selected_make and 
                current_make_value and 
                current_make_value != "0" and 
                current_make_value != ""):
                
                counter += 1
                print(f"\n[{counter}] 🔄 Detekovaná zmena značky: {current_make_text}")
                
                # Počkaj chvíľu na načítanie modelov
                time.sleep(2)
                
                try:
                    # Získaj modely
                    model_select = Select(driver.find_element(By.ID, "models"))
                    model_options = model_select.options
                    
                    models = []
                    for m_opt in model_options:
                        model_val = m_opt.get_attribute("value").strip()
                        model_text = m_opt.text.strip()
                        if model_val and model_val != "" and model_val != "0":
                            models.append(model_text)
                    
                    # Ulož do dát
                    car_data[current_make_text] = models
                    
                    # Ulož do JSON súboru
                    with open(json_file, "w", encoding="utf-8") as f:
                        json.dump(car_data, f, ensure_ascii=False, indent=2)
                    
                    print(f"   ✅ Uložených {len(models)} modelov pre {current_make_text}")
                    print(f"   💾 JSON aktualizovaný ({len(car_data)} značiek celkom)")
                    
                except Exception as e:
                    print(f"   ❌ Chyba pri získavaní modelov: {e}")
                
                last_selected_make = current_make_value
            
            # Krátka pauza pred ďalším sledovaním
            time.sleep(0.5)
            
        except Exception as e:
            # Element možno ešte nie je načítaný, pokračuj
            time.sleep(1)
            
except KeyboardInterrupt:
    print(f"\n🛑 Ukončené používateľom")
    print(f"📊 Celkom spracovaných: {len(car_data)} značiek")
    print(f"💾 Dáta uložené v: {json_file}")
    
finally:
    driver.quit()
    print("🔐 Prehliadač zatvorený")
