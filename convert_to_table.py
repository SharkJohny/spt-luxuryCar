import json

# Načítaj JSON
with open("car_data_manual copy.json", "r", encoding="utf-8") as f:
    car_data = json.load(f)

print("Konvertujem JSON do formátu pre tabuľku...")

# Vytvor výstup pre tabuľku (tab-separated values)
output_lines = []

for brand, models in car_data.items():
    # Začni riadok názvom značky
    line = [brand]
    
    # Pridaj všetky modely ako ďalšie stĺpce
    line.extend(models)
    
    # Spoj pomocou tab charakteru (pre excel/google sheets)
    output_lines.append("\t".join(line))

# Ulož do súboru
with open("car_data_table.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))

print(f"✅ Hotovo! Vytvorený súbor: car_data_table.txt")
print(f"📊 {len(car_data)} značiek konvertovaných")
print("\nPrvých 5 riadkov:")
for i, line in enumerate(output_lines[:5]):
    print(f"{i+1}. {line}")

print(f"\nSúbor môžeš:")
print("1. Otvoriť v textovom editore a skopírovať")
print("2. Importovať priamo do Excel/Google Sheets")
print("3. Skopírovať obsah a vložiť do tabuľky")
