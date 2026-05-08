#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def make_icon(size, path):
    img = Image.new('RGB', (size, size), '#0f3d2e')
    draw = ImageDraw.Draw(img)
    
    # White rounded rect background for pill symbol
    m = size * 0.18
    draw.rounded_rectangle([m, m, size-m, size-m], radius=size*0.15, fill='#1a6b52')
    
    # Cross / plus symbol
    cx, cy = size/2, size/2
    bar_w = size * 0.12
    bar_h = size * 0.42
    # Vertical bar
    draw.rectangle([cx - bar_w/2, cy - bar_h/2, cx + bar_w/2, cy + bar_h/2], fill='white')
    # Horizontal bar
    draw.rectangle([cx - bar_h/2, cy - bar_w/2, cx + bar_h/2, cy + bar_w/2], fill='white')
    
    img.save(path, 'PNG')
    print(f'Created {path}')

os.makedirs('icons', exist_ok=True)
make_icon(192, 'icons/icon-192.png')
make_icon(512, 'icons/icon-512.png')
print('Icons created successfully')
