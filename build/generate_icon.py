"""
Run this once to generate build/icon.ico
Requires: pip install Pillow
Usage: python build/generate_icon.py
"""
import struct, zlib, io

try:
    from PIL import Image, ImageDraw, ImageFont
    USE_PILLOW = True
except ImportError:
    USE_PILLOW = False

def make_icon_pillow():
    sizes = [256, 128, 64, 48, 32, 16]
    images = []
    for sz in sizes:
        img = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        pad = sz // 12
        r = (sz - pad * 2) // 2
        cx, cy = sz // 2, sz // 2
        # Purple gradient circle background
        for i in range(r, 0, -1):
            ratio = i / r
            red   = int(124 * ratio + 91 * (1 - ratio))
            green = int(58  * ratio + 33 * (1 - ratio))
            blue  = int(237 * ratio + 182 * (1 - ratio))
            draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(red, green, blue, 255))
        # White "N"
        font_size = max(sz // 2, 8)
        try:
            font = ImageFont.truetype("arialbd.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), "N", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (sz - tw) // 2 - bbox[0]
        ty = (sz - th) // 2 - bbox[1]
        draw.text((tx, ty), "N", fill=(255, 255, 255, 255), font=font)
        images.append(img)

    images[0].save(
        "build/icon.ico",
        format="ICO",
        sizes=[(img.width, img.height) for img in images],
        append_images=images[1:],
    )
    print("Created build/icon.ico")

if USE_PILLOW:
    make_icon_pillow()
else:
    # Minimal 1x1 ICO fallback (electron-builder will accept it)
    print("Pillow not found — creating minimal placeholder icon")
    # 16x16 solid purple ICO
    import os
    # ICO with a single 16x16 32bpp image
    w, h = 16, 16
    # BMP header for ICO
    bmp_header = struct.pack('<IIIHHIIIIII', 40, w, h*2, 1, 32, 0, w*h*4, 0, 0, 0, 0)
    pixels = b''
    for y in range(h - 1, -1, -1):
        for x in range(w):
            # Purple circle
            cx, cy = w/2, h/2
            dist = ((x-cx)**2 + (y-cy)**2)**0.5
            if dist <= w/2 - 1:
                pixels += bytes([182, 58, 124, 255])  # BGRA purple
            else:
                pixels += bytes([0, 0, 0, 0])
    xor_mask = pixels
    and_mask = b'\x00' * (w * h // 8)
    image_data = bmp_header + xor_mask + and_mask
    ico_header = struct.pack('<HHH', 0, 1, 1)
    dir_entry  = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(image_data), 6 + 16)
    os.makedirs("build", exist_ok=True)
    with open("build/icon.ico", "wb") as f:
        f.write(ico_header + dir_entry + image_data)
    print("Created build/icon.ico (minimal placeholder — run with Pillow for better icon)")
