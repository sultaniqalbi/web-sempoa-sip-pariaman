import os
from PIL import Image, ImageDraw

def create_avatar(filename: str, text: str, bg_color: tuple, text_color: tuple = (255, 255, 255)):
    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", filename)
    img = Image.new("RGB", (400, 400), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw simple avatar circle
    draw.ellipse([(20, 20), (380, 380)], outline=(255, 255, 255), width=8)
    draw.ellipse([(35, 35), (365, 365)], fill=bg_color)
    
    # Head & Shoulder silhouette or text
    # Draw Head
    draw.ellipse([(140, 90), (260, 210)], fill=(255, 255, 255))
    # Draw Body
    draw.pieslice([(80, 230), (320, 450)], 180, 360, fill=(255, 255, 255))
    
    # Text badge at bottom
    draw.rounded_rectangle([(120, 310), (280, 360)], radius=15, fill=(0, 0, 0, 160))
    draw.text((170, 325), text, fill=(255, 255, 255))
    
    img.save(filepath, "PNG")
    print(f"Created: {filepath}")

# Guru
create_avatar("guru_rian.png", "RIAN", (230, 81, 0))
create_avatar("guru_nurul.png", "NURUL", (46, 125, 50))
create_avatar("guru_kevin.png", "KEVIN", (198, 40, 40))
create_avatar("guru_dian.png", "DIAN", (0, 131, 143))

# Siswa
create_avatar("siswa_farhan.png", "FARHAN", (255, 112, 67))
create_avatar("siswa_rahmah.png", "RAHMAH", (255, 167, 38))
create_avatar("siswa_bintang.png", "BINTANG", (0, 150, 136))
create_avatar("siswa_aisyah.png", "AISYAH", (156, 39, 176))
create_avatar("siswa_zaki.png", "ZAKI", (67, 160, 71))

print("All avatar files generated in backend/uploads/")
