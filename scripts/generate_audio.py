"""Build hashed, public-content narration; keep valid existing tracks.
Run `node scripts/collect_audio.cjs` first. Default uses edge-tts; --offline
uses macOS Tingting + afconvert. Both create shipped files, never runtime TTS.
Visitor notes are never collected. Existing original ambience is retained.
"""
from pathlib import Path
import argparse, asyncio, json, subprocess, tempfile, wave

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/media/audio'
OUT.mkdir(parents=True, exist_ok=True)
CORPUS = json.loads((ROOT / 'work/audio/corpus.json').read_text())
MANIFEST = ROOT / 'src/audioManifest.json'
old = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
parser = argparse.ArgumentParser()
parser.add_argument('--offline', action='store_true', help='macOS system speech; no remote TTS request')
args = parser.parse_args()


def native_track(track):
    dest = OUT / (track['id'] + '.m4a')
    with tempfile.TemporaryDirectory() as tmp:
        aiff = Path(tmp) / 'voice.aiff'
        wav = Path(tmp) / 'voice.wav'
        subprocess.run(['/usr/bin/say', '-v', 'Tingting', '-r', '175', '-o', str(aiff), track['text']], check=True)
        subprocess.run(['/usr/bin/afconvert', '-f', 'WAVE', '-d', 'LEI16@16000', '-c', '1', str(aiff), str(wav)], check=True)
        with wave.open(str(wav)) as audio:
            length = round(audio.getnframes() / audio.getframerate(), 2)
        if length <= 1:
            raise RuntimeError('Empty narration for ' + track['id'])
        subprocess.run(['/usr/bin/afconvert', '-f', 'm4af', '-d', 'aac', '-b', '128000', str(aiff), str(dest)], check=True)
    return {'file': dest.name, 'duration': length, 'voice': 'macOS Tingting (synthetic)'}


async def main():
    manifest = {}
    for track in CORPUS:
        previous = old.get(track['id'])
        if previous and (OUT / previous['file']).exists() and previous.get('duration', 0) > 1:
            manifest[track['id']] = previous
            continue
        if args.offline:
            entry = native_track(track)
        else:
            import edge_tts, imageio_ffmpeg
            dest = OUT / (track['id'] + '.mp3')
            try:
                await asyncio.wait_for(edge_tts.Communicate(track['text'], 'zh-CN-YunyangNeural', rate='-10%', pitch='-2Hz').save(str(dest)), 40)
                raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(dest), '-f', 's16le', '-ar', '16000', '-ac', '1', '-'])
                length = round(len(raw) / 32000, 2)
                if length <= 1:
                    raise RuntimeError('Empty narration')
                entry = {'file': dest.name, 'duration': length, 'voice': 'zh-CN-YunyangNeural'}
            except Exception:
                dest.unlink(missing_ok=True)
                raise
        manifest[track['id']] = entry
        print('Generated', track['id'], entry['duration'], 'seconds', flush=True)
    # Atomic replacement: a failed generation cannot leave a partial manifest.
    temp = MANIFEST.with_suffix('.tmp')
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    temp.replace(MANIFEST)
    print('Manifest synchronized:', len(manifest), 'tracks', flush=True)

asyncio.run(main())
