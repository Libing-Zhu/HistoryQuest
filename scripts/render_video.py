from pathlib import Path
import sys,subprocess,json,math,wave
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe()
ROOT=Path(__file__).resolve().parents[1]
work=ROOT/'video-work';work.mkdir(exist_ok=True);out=ROOT/'public/media'
segments=json.loads((ROOT/'scripts/narration.json').read_text())
SR=22050; gap=.45
waves=[]; timeline=[]; cursor=0
for i,s in enumerate(segments):
 (work/f'{i}.txt').write_text(s['text'])
 subprocess.run(['/usr/bin/say','-v','Tingting','-r','175','-f',str(work/f'{i}.txt'),'-o',str(work/f'{i}.aiff')],check=True)
 raw=subprocess.check_output([FF,'-v','error','-i',str(work/f'{i}.aiff'),'-f','s16le','-ar',str(SR),'-ac','1','-'])
 a=np.frombuffer(raw,dtype=np.int16);dur=len(a)/SR
 timeline.append({**s,'start':cursor,'end':cursor+dur})
 waves.extend([a,np.zeros(int(gap*SR),dtype=np.int16)]);cursor+=dur+gap
voice=np.concatenate(waves)
with wave.open(str(work/'voice.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(voice.tobytes())
(work/'timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2))
def ts(t):
 h=int(t//3600);m=int(t//60)%60;sec=t%60
 return f'{h:02d}:{m:02d}:{sec:06.3f}'
(out/'chair-story.zh.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{ts(s["start"])} --> {ts(s["end"])}\n{s["text"]}' for i,s in enumerate(timeline)))
W,H,FPS=1280,720,24
fontpath='/System/Library/Fonts/PingFang.ttc'
def font(n):return ImageFont.truetype(fontpath,n)
F={n:font(n) for n in [15,17,20,23,26,32,38]}
navy=(20,40,63);gold=(198,163,107);paper=(245,240,231)
bg=Image.new('RGB',(W,H),navy);d=ImageDraw.Draw(bg)
for x in range(0,W,42):d.line((x,0,x,H),fill=(26,46,67))
for y in range(0,H,42):d.line((0,y,W,y),fill=(26,46,67))
d.ellipse((40,35,610,605),outline=(88,82,65),width=1);d.ellipse((62,57,588,583),outline=(64,66,61),width=1)
d.text((45,24),'HISTORYQUEST  /  寻迹上海',font=F[17],fill=gold)
d.text((897,26),'拟人艺术演绎 · 合成配音',font=F[15],fill=(176,184,187))
d.line((660,120,1200,120),fill=(93,90,79),width=1)
char=Image.open(out/'chair-character.png').convert('RGBA').resize((590,590),Image.Resampling.LANCZOS)
def wrap(text,maxwidth,ft):
 lines=[];cur=''
 for ch in text:
  if d.textlength(cur+ch,font=ft)>maxwidth and cur:lines.append(cur);cur=ch
  else:cur+=ch
 if cur:lines.append(cur)
 return lines
# Mouth is animated over the blank face panel of the generated rig; coordinates documented.
char_mouth=(295,450)
args=[FF,'-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(work/'voice.wav'),'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',str(out/'chair-story.mp4')]
p=subprocess.Popen(args,stdin=subprocess.PIPE)
frames=int(cursor*FPS)
for f in range(frames):
 t=f/FPS;s=next((s for s in timeline if s['start']<=t<s['end']+gap),timeline[-1]);idx=timeline.index(s)
 # Audio energy drives opening; quiet gaps close the mouth.
 chunk=voice[int(t*SR):int((t+.035)*SR)].astype(float);energy=math.sqrt(np.mean(chunk*chunk)) if len(chunk) else 0
 amp=min(1,energy/4500) if t<s['end'] else 0
 rig=char.copy();rd=ImageDraw.Draw(rig);mx,my=char_mouth
 if amp>.04:
  mw=16+12*amp;mh=3+22*amp
  rd.ellipse((mx-mw,my-mh/2,mx+mw,my+mh/2),fill=(83,31,27),outline=(136,64,40),width=2)
  if amp>.28:rd.ellipse((mx-mw*.52,my+mh*.05,mx+mw*.52,my+mh*.32),fill=(228,129,120))
  if amp>.6:rd.rounded_rectangle((mx-mw*.6,my-mh*.35,mx+mw*.6,my-mh*.13),radius=2,fill=(255,241,206))
 else:rd.arc((mx-16,my-8,mx+16,my+7),0,180,fill=(122,65,40),width=3)
 # Brief eyelid blinks, with small smiling closed arcs.
 blink=t%4.3
 if 0.10<blink<.24:
  for ex in [260,330]:
   rd.rounded_rectangle((ex-27,393,ex+27,435),radius=12,fill=(248,216,149))
   rd.arc((ex-23,403,ex+23,425),0,180,fill=(99,49,27),width=3)
 rig=rig.rotate(math.sin(t*1.7)*1.05,resample=Image.Resampling.BICUBIC,expand=False)
 frame=bg.copy().convert('RGBA');frame.alpha_composite(rig,(30,int(55+math.sin(t*2.1)*4)))
 dr=ImageDraw.Draw(frame)
 # Glints around the animated character.
 for j in range(7):
  x=90+j*75;y=150+((j*53-t*11)%370);brightness=int(90+80*(.5+.5*math.sin(t*2+j)))
  dr.line((x-3,y,x+3,y),fill=(brightness,brightness-15,70),width=1);dr.line((x,y-3,x,y+3),fill=(brightness,brightness-15,70),width=1)
 dr.text((670,88),f'OBJECT STORY  /  0{idx+1}',font=F[15],fill=gold)
 y=154
 for line in wrap(s['title'],510,F[38]):dr.text((665,y),line,font=F[38],fill=paper);y+=58
 dr.rounded_rectangle((665,y+13,820,y+49),radius=2,outline=(131,110,78),width=1)
 dr.text((678,y+18),s['label'],font=F[17],fill=gold)
 y+=92
 for line in wrap(s['detail'],510,F[26]):dr.text((665,y),line,font=F[26],fill=(206,207,198));y+=46
 for line in wrap(s['source'],510,F[15]):dr.text((665,489),line,font=F[15],fill=(161,169,169))
 dr.text((665,532),'不虚构文物经历 · 不强制下一站',font=F[15],fill=(168,147,113))
 dr.rectangle((0,602,W,H),fill=(10,24,39))
 # Burned-in accessible captions complement the selectable WebVTT track.
 lines=wrap(s['text'],1120,F[26]);cy=619 if len(lines)>1 else 638
 for line in lines:dr.text(((W-dr.textlength(line,font=F[26]))/2,cy),line,font=F[26],fill=paper);cy+=39
 dr.rectangle((0,H-4,int(W*t/cursor),H),fill=gold)
 if f==48:frame.convert('RGB').save(out/'chair-video-poster.jpg',quality=92)
 p.stdin.write(frame.convert('RGB').tobytes())
 if f%240==0:print(f'{f}/{frames} frames',flush=True)
p.stdin.close();code=p.wait()
if code:raise SystemExit(code)
print(json.dumps({'duration':cursor,'frames':frames,'video':str(out/'chair-story.mp4')},ensure_ascii=False))
