#!/usr/bin/env python3
"""Build one offline artwork HTML from a JSON brief and original GLSL."""
import argparse
import html
import json
import math
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
STATUSES = {'confirmed', 'work-confirmed-translation-unverified', 'ambiguous', 'unverified', 'original'}
SIZES = {
    '3:4': ([1536, 2048], [1080, 1440]),
    '4:5': ([1600, 2000], [1080, 1350]),
    '9:16': ([1440, 2560], [1080, 1920]),
    '16:9': ([2560, 1440], [1920, 1080]),
    '1:1': ([2000, 2000], [1080, 1080]),
}


def normalize_delivery(spec):
    legacy = 'delivery' not in spec
    delivery = spec.setdefault('delivery', {})
    if not isinstance(delivery, dict):
        raise ValueError('delivery must be an object')
    formats = delivery.setdefault('formats', ['png', 'mp4', 'html'])
    if not isinstance(formats, list) or not formats or any(f not in ('png', 'mp4', 'html') for f in formats):
        raise ValueError('delivery.formats must be a nonempty list of png, mp4, html')
    if len(set(formats)) != len(formats):
        raise ValueError('delivery.formats must not contain duplicates')
    ratio = delivery.setdefault('ratio', '4:5')
    if ratio not in SIZES and ratio != 'custom':
        raise ValueError('delivery.ratio must be a supported ratio or custom')
    if delivery.setdefault('text_mode', 'with') not in ('with', 'without', 'both'):
        raise ValueError('delivery.text_mode must be with, without or both')
    if ratio in SIZES:
        png, video = SIZES[ratio]
        delivery.setdefault('image_size', list(png))
        delivery.setdefault('video_size', [720, 900] if legacy else list(video))
    for key, limit in (('image_size', 4096), ('video_size', 3840)):
        size = delivery.get(key)
        if not isinstance(size, list) or len(size) != 2 or any(type(n) is not int or not 128 <= n <= limit for n in size):
            raise ValueError(f'delivery.{key} must contain two integer dimensions between 128 and {limit}')
        if key == 'video_size' and any(n % 2 for n in size):
            raise ValueError('video dimensions must be even')
    iw, ih = delivery['image_size']
    vw, vh = delivery['video_size']
    if iw * vh != ih * vw:
        raise ValueError('image and video must have the same aspect ratio')
    if ratio in SIZES:
        rw, rh = map(int, ratio.split(':'))
        if iw * rh != ih * rw:
            raise ValueError('pixel dimensions do not match delivery.ratio')
    duration = delivery.setdefault('duration_seconds', 12)
    if type(duration) is not int or not 3 <= duration <= 60:
        raise ValueError('duration_seconds must be an integer from 3 to 60')
    if delivery.setdefault('fps', 24) not in (24, 30):
        raise ValueError('delivery.fps must be 24 or 30')
    if delivery.setdefault('audio', 'none') != 'none':
        raise ValueError('this HTML renderer supports silent video only; use another renderer for audio')
    return delivery


def validate(spec):
    if not isinstance(spec, dict):
        raise ValueError('spec must be an object')
    for key in ('title', 'slug', 'quote', 'intent'):
        if not isinstance(spec.get(key), str) or not spec[key].strip():
            raise ValueError(f'{key} must be a nonempty string')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}', spec['slug']):
        raise ValueError('slug must be lowercase ASCII letters, digits and hyphens')
    if len(spec['title']) > 80 or len(spec['quote']) > 600:
        raise ValueError('title or display quote is too long; choose an excerpt for the artwork')
    source = spec.get('source', {})
    if not isinstance(source, dict):
        raise ValueError('source must be an object')
    if source.get('status') not in STATUSES:
        raise ValueError('source.status is required and must identify provenance confidence')
    source.setdefault('label', '')
    source.setdefault('context_note', '')
    source.setdefault('urls', [])
    if any(not isinstance(source[key], str) for key in ('label', 'context_note')):
        raise ValueError('source label and context_note must be strings')
    if not isinstance(source['urls'], list):
        raise ValueError('source.urls must be a list')
    for url in source['urls']:
        if not isinstance(url, str) or urlparse(url).scheme not in ('https', 'http') or not urlparse(url).netloc:
            raise ValueError('source URLs must be HTTP(S) links')
    spec['source'] = source
    spec.setdefault('uniforms', {})
    if not isinstance(spec['uniforms'], dict):
        raise ValueError('uniforms must be an object')
    for key, value in spec['uniforms'].items():
        if key not in ('mode', 'force', 'evening') or type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError('uniforms support numeric mode, force and evening only')
    if 'mode' in spec['uniforms'] and type(spec['uniforms']['mode']) is not int:
        raise ValueError('mode must be an integer')
    start = spec.get('start_time', 0)
    if type(start) not in (int, float) or not math.isfinite(start) or start < 0:
        raise ValueError('start_time must be a finite nonnegative number')
    parameter = spec.setdefault('parameter', {'label': '力度', 'uniform': 'force', 'default': .55})
    if not isinstance(parameter, dict):
        raise ValueError('parameter must be an object')
    if parameter.get('uniform') not in ('force', 'evening'):
        raise ValueError('parameter.uniform must be force or evening')
    if not isinstance(parameter.get('default'), (int, float)) or not 0 <= parameter['default'] <= 1:
        raise ValueError('parameter.default must be in [0, 1]')
    if not isinstance(parameter.get('label'), str):
        raise ValueError('parameter.label must be a string')
    typography = spec.setdefault('typography', {'position': 'bottom-left', 'color': '#e0dacd'})
    if not isinstance(typography, dict):
        raise ValueError('typography must be an object')
    if typography.get('position') not in ('top-left', 'bottom-left', 'top-right-vertical'):
        raise ValueError('invalid typography.position')
    if not isinstance(spec.get('caption', ''), str) or len(spec.get('caption', '')) > 180:
        raise ValueError('caption must be a string of at most 180 characters')
    if 'size' in typography and not .02 <= typography['size'] <= .065:
        raise ValueError('typography.size must be between .02 and .065')
    for key in ('color', 'caption_color'):
        if key in typography and not re.fullmatch(r'#[0-9a-fA-F]{6}', typography[key]):
            raise ValueError(f'typography.{key} must be a hex color')
    if typography['position'] == 'top-right-vertical':
        if len(spec['quote'].splitlines()) > 5 or any(len(line) > 17 for line in spec['quote'].splitlines()):
            raise ValueError('vertical text exceeds artwork space; shorten it or choose horizontal text')
    normalize_delivery(spec)
    return spec


def js_json(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')


def build(spec_path, shader_path, output, force=False):
    spec = validate(json.loads(spec_path.read_text(encoding='utf-8')))
    shader = shader_path.read_text(encoding='utf-8')
    if len(shader) > 200_000 or not re.search(r'void\s+main\s*\(', shader):
        raise ValueError('shader must contain main() and be under 200 KB')
    template = (ROOT / 'assets/viewer.html').read_text(encoding='utf-8')
    substitutions = {'__TITLE__': html.escape(spec['title']), '__SPEC__': js_json(spec), '__SHADER__': js_json(shader), '__RUNTIME__': (ROOT / 'assets/runtime.js').read_text(encoding='utf-8')}
    rendered = re.sub('|'.join(map(re.escape, substitutions)), lambda match: substitutions[match[0]], template)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('w' if force else 'x', encoding='utf-8') as handle:
        handle.write(rendered)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--spec', required=True, type=Path)
    parser.add_argument('--shader', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--force', action='store_true', help='replace an existing output')
    args = parser.parse_args()
    try:
        print(build(args.spec, args.shader, args.output, args.force).resolve())
    except (ValueError, OSError, TypeError) as exc:
        parser.exit(1, f'Build failed: {exc}\n')


if __name__ == '__main__':
    main()
