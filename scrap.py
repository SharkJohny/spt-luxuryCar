from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
import time
import json

# Setup headless Chrome
options = Options()
options.headless = False  # nastav na True ak nechceš okno vidieť
service = Service()  # doplň cestu ke chromedriveru pokud není v PATH
driver = webdriver.Chrome(service=service, options=options)

url = "https://luxuscarmats.com/"
driver.get(url)

time.sleep(5)  # počkej na načtení strany

car_data = {}

try:
    # 1. Vyber rok
    year_select = Select(driver.find_element(By.ID, "modelyear"))
    year_options = year_select.options
    
    # Vyber konkrétny rok (napr. 2024) - môžeš zmeniť
    target_year = "2024"
    
    year_found = False
    for year_opt in year_options:
        year_value = year_opt.get_attribute("value")
        year_text = year_opt.text.strip()
        
        # Kontroluj či rok obsahuje naše číslo (kvôli medzerám)
        if target_year in year_value or target_year in year_text:
            print(f"Vyberal rok: '{year_value}' (text: '{year_text}')")
            year_select.select_by_value(year_value)
            time.sleep(3)  # počkaj na načítanie značiek
            year_found = True
            break
    
    if not year_found:
        print(f"Rok {target_year} nenájdený!")
        print("Dostupné roky:")
        for year_opt in year_options:
            year_value = year_opt.get_attribute("value")
            year_text = year_opt.text.strip()
            if year_value:  # len neprázdne
                print(f"  Value: '{year_value}' | Text: '{year_text}'")
        raise Exception(f"Rok {target_year} nebol nájdený")
    
    # 2. Počkaj na načítanie značiek v hlavnom selecte
    print("Čakám na načítanie značiek v hlavnom selecte...")
    time.sleep(3)  # daj čas na načítanie značiek
    
    # 3. Získaj značky priamo z hlavného selectu
    print("Získavam značky z hlavného selectu...")
    main_make_select = Select(driver.find_element(By.ID, "make"))
    make_options = main_make_select.options
    
    # Vytvor zoznam značiek pred iteráciou (kvôli obnoveniu DOM)
    makes_to_process = []
    for option in make_options:
        make_value = option.get_attribute("value").strip()
        make_label = option.text.strip()
        if make_value and make_value != "" and make_value != "0":
            makes_to_process.append((make_value, make_label))
    
    print(f"Nájdených {len(makes_to_process)} značiek na spracovanie")
    
    processed_count = 0
    for make_value, make_label in makes_to_process:
        processed_count += 1
        print(f"[{processed_count}] Zpracovávám značku: {make_label} (value: {make_value})")
        try:
            # Vytvor nový Select objekt pre každý výber (kvôli obnoveniu DOM)
            fresh_make_select = Select(driver.find_element(By.ID, "make"))
            fresh_make_select.select_by_value(make_value)
            time.sleep(2)  # počkaj na načítanie modelov

            # Získaj modely
            model_select = Select(driver.find_element(By.ID, "models"))
            model_options = model_select.options

            models = []
            for m_opt in model_options:
                model_val = m_opt.get_attribute("value").strip()
                model_text = m_opt.text.strip()
                if model_val and model_val != "" and model_val != "0":
                    models.append(model_text)

            print(f"    → Nájdených {len(models)} modelov")
            car_data[make_label] = models  # bez roku, len modely

        except Exception as e:
            print(f"Chyba u značky {make_label}: {e}")
            car_data[make_label] = []

except Exception as e:
    print(f"Hlavná chyba: {e}")

finally:
    driver.quit()

# Ulož do JSON
with open("car_data_2024.json", "w", encoding="utf-8") as f:
    json.dump(car_data, f, ensure_ascii=False, indent=2)

print("Hotovo! Výstup uložen ako car_data_2024.json")

# ALTERNATÍVNA VERZIA - scrapovanie pre viacero rokov
def scrape_multiple_years(years_to_scrape=["2024", "2023", "2022"]):
    """
    Scrapuje pre viacero rokov
    """
    all_data = {}
    
    driver = webdriver.Chrome(service=service, options=options)
    driver.get(url)
    time.sleep(5)
    
    for target_year in years_to_scrape:
        print(f"\n=== Scrapujem rok {target_year} ===")
        year_data = {}
        
        try:
            # Vyber rok
            year_select = Select(driver.find_element(By.ID, "modelyear"))
            year_options = year_select.options
            
            year_found = False
            for year_opt in year_options:
                year_value = year_opt.get_attribute("value")
                year_text = year_opt.text.strip()
                
                if target_year in year_value or target_year in year_text:
                    print(f"Vyberal rok: '{year_value}' (text: '{year_text}')")
                    year_select.select_by_value(year_value)
                    time.sleep(3)
                    year_found = True
                    break
            
            if not year_found:
                print(f"Rok {target_year} nenájdený!")
                continue
            
            # Získaj značky a modely (rovnaký kód ako vyššie)
            print("Čakám na načítanie značiek...")
            time.sleep(3)
            
            main_make_select = Select(driver.find_element(By.ID, "make"))
            make_options = main_make_select.options
            
            # Vytvor zoznam značiek pred iteráciou
            makes_to_process = []
            for option in make_options:
                make_value = option.get_attribute("value").strip()
                make_label = option.text.strip()
                if make_value and make_value != "" and make_value != "0":
                    makes_to_process.append((make_value, make_label))
            
            for make_value, make_label in makes_to_process:
                try:
                    # Vytvor nový Select objekt pre každý výber
                    fresh_make_select = Select(driver.find_element(By.ID, "make"))
                    fresh_make_select.select_by_value(make_value)
                    time.sleep(2)

                    model_select = Select(driver.find_element(By.ID, "models"))
                    model_options = model_select.options

                    models = []
                    for m_opt in model_options:
                        model_val = m_opt.get_attribute("value").strip()
                        model_text = m_opt.text.strip()
                        if model_val and model_val != "" and model_val != "0":
                            models.append(model_text)

                    year_data[make_label] = models

                except Exception as e:
                    print(f"Chyba u značky {make_label} v roku {target_year}: {e}")
                    year_data[make_label] = []
            
            all_data[target_year] = year_data
            
        except Exception as e:
            print(f"Chyba pri roku {target_year}: {e}")
    
    driver.quit()
    
    # Ulož výsledky
    with open("car_data_multiple_years.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print("Hotovo! Viacročné dáta uložené ako car_data_multiple_years.json")

# Spusti scrapovanie pre viacero rokov (odkomentuj ak chceš použiť)
# scrape_multiple_years(["2024", "2023", "2022"])