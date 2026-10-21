"""Rebuild real chair photograph assets; requires Pillow and libheif heif-convert.
No generative processing, sharpening, colour filters or subject cropping.
Usage: python3 scripts/prepare_chair.py [--heif-convert /path/to/heif-convert]
Raw input stays in assets-original and never enters the website bundle.
"""
from pathlib import Path
import argparse, shutil, subprocess, tempfile
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--heif-convert', default=shutil.which('heif-convert'))
args = parser.parse_args()
if not args.heif_convert:
    parser.error('Install libheif or provide --heif-convert /path/to/heif-convert')
source = ROOT / 'assets-original/IMG_6912.HEIC'
out = ROOT / 'public/media'
with tempfile.TemporaryDirectory() as tmp:
    png = Path(tmp) / 'chair.png'
    subprocess.run([args.heif_convert, str(source), str(png)], check=True)
    with Image.open(png) as decoded:
        photo = ImageOps.exif_transpose(decoded).convert('RGB')
        if photo.size != (4284, 5712):
            raise ValueError(f'Unexpected oriented dimensions: {photo.size}; inspect before replacing')
        for width in (640, 1280, 1920):
            variant = photo.resize((width, round(width * photo.height / photo.width)), Image.Resampling.LANCZOS)
            variant.save(out / f'chair-{width}.webp', quality=88, method=6)
        shutil.copyfile(out / 'chair-1920.webp', out / 'chair.webp')
        photo.save(out / 'chair-full.webp', quality=92, method=6)
        poster = ImageOps.pad(photo, (1600, 900), method=Image.Resampling.LANCZOS, color='#eee9df')
        poster.save(out / 'chair-video-poster.jpg', quality=92)
print('Saved oriented responsive WebP images, full photo and contained JPEG poster')
