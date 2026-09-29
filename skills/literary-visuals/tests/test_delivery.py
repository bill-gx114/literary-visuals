import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'scripts/build_artwork.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.art = json.loads((ROOT / 'references/examples/surge.json').read_text())

    def test_presets_keep_ratio_and_video_even(self):
        for ratio in builder.SIZES:
            with self.subTest(ratio=ratio):
                art = copy.deepcopy(self.art)
                art['delivery'] = {'ratio': ratio, 'formats': ['png', 'mp4'], 'text_mode': 'both'}
                d = builder.validate(art)['delivery']
                iw, ih = d['image_size']; vw, vh = d['video_size']
                self.assertEqual(iw*vh, ih*vw)
                self.assertEqual(vw % 2, 0); self.assertEqual(vh % 2, 0)
                self.assertEqual(d['text_mode'], 'both')
                self.assertEqual(d['formats'], ['png', 'mp4'])

    def test_legacy_size_does_not_change(self):
        d = builder.validate(self.art)['delivery']
        self.assertEqual(d['image_size'], [1600, 2000])
        self.assertEqual(d['video_size'], [720, 900])

    def test_custom_dimensions_are_preserved(self):
        self.art['delivery'] = {'ratio': 'custom', 'image_size': [1800, 1200], 'video_size': [1200, 800], 'formats': ['html'], 'text_mode': 'without'}
        d = builder.validate(self.art)['delivery']
        self.assertEqual(d['video_size'], [1200, 800])
        self.assertEqual(d['text_mode'], 'without')

    def test_invalid_or_unsupported_choices_rejected(self):
        cases = [
            {'formats': []}, {'formats': ['pdf']}, {'text_mode': 'hidden'},
            {'ratio': 'portrait'}, {'duration_seconds': 0}, {'duration_seconds': True},
            {'fps': 60}, {'audio': 'music'},
            {'ratio': '16:9', 'image_size': [1600, 2000]},
            {'ratio': 'custom', 'image_size': [600, 800], 'video_size': [600, 600]},
            {'ratio': 'custom', 'image_size': [501, 501], 'video_size': [501, 501]},
        ]
        for delivery in cases:
            with self.subTest(delivery=delivery):
                art = copy.deepcopy(self.art); art['delivery'] = delivery
                with self.assertRaises(ValueError): builder.validate(art)

    def test_delivery_is_embedded_without_executing_text(self):
        self.art['quote'] = '</script>\n__SPEC__'
        self.art['delivery'] = {'ratio': '9:16', 'formats': ['png'], 'text_mode': 'without'}
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp); source = tmp / 'input.json'
            source.write_text(json.dumps(self.art))
            result = builder.build(source, ROOT / 'assets/shaders/surge.glsl', tmp/'output.html')
            html = result.read_text()
            self.assertEqual(html.count('</script>'), 1)
            self.assertIn('\\u003c/script\\u003e', html)
            payload = json.loads(html.split('const SPEC=', 1)[1].split(';\nconst FRAGMENT=', 1)[0])
            self.assertEqual(payload['delivery']['image_size'], [1440, 2560])
            self.assertEqual(payload['delivery']['formats'], ['png'])
            self.assertEqual(payload['quote'], self.art['quote'])
            with self.assertRaises(FileExistsError):
                builder.build(source, ROOT / 'assets/shaders/surge.glsl', result)

class TextTreatmentTests(unittest.TestCase):
    setUp = DeliveryTests.setUp
    def test_full_text_cannot_be_silently_shortened(self):
        self.art['full_text'] = self.art['quote'] + '。'
        with self.assertRaisesRegex(ValueError, 'complete original'):
            builder.validate(self.art)

    def test_excerpt_needs_permission_and_exact_text(self):
        self.art['full_text'] = '前文。' + self.art['quote'] + '。后文。'
        self.art['text_selection'] = {'mode': 'excerpt'}
        with self.assertRaisesRegex(ValueError, 'explicit or delegated'):
            builder.validate(self.art)
        self.art['text_selection']['approval'] = 'delegated'
        self.assertEqual(builder.validate(self.art)['quote'], self.art['quote'])
        self.art['quote'] = '改写的金句'
        with self.assertRaisesRegex(ValueError, 'verbatim'):
            builder.validate(self.art)

    def test_long_text_is_not_forced_to_excerpt(self):
        self.art['quote'] = '长文原样保留。' * 100
        self.art['full_text'] = self.art['quote']
        self.art['typography']['position'] = 'bottom-left'
        self.assertEqual(builder.validate(self.art)['text_selection']['mode'], 'full')

    def test_invalid_layout_is_rejected(self):
        for fields in ({'size':.016}, {'size':float('nan')}, {'size':'small'},
                       {'box':[.9,.1,.2,.5]}, {'box':[0,0,-1,.5]},
                       {'box':[0,0,.8,float('nan')]}, {'caption_box':[0,0,1]},
                       {'line_height':1}, {'color':None}):
            with self.subTest(fields=fields):
                art=copy.deepcopy(self.art);art['typography'].update(fields)
                with self.assertRaises(ValueError): builder.validate(art)

if __name__ == '__main__': unittest.main()
