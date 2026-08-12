from PIL import Image

image_path = r"frontend\public\assets\logo\logo-sempoa-sip.png"
img = Image.open(image_path)
img = img.convert("RGBA")

# Get bounding box of non-transparent pixels
bbox = img.getbbox()
if bbox:
    cropped_img = img.crop(bbox)
    cropped_img.save(image_path)
    print("Image cropped successfully to remove transparent padding!")
else:
    print("Image is entirely transparent or bounding box not found.")
