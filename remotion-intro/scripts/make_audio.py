"""Original beatless ambient bed, made from quiet harmonics; no sampled music."""
import math, wave, array
from pathlib import Path
rate=44100
duration=64
out=array.array('h')
notes=[(0,146.832,19),(10,220.0,23),(22,164.814,23),(35,196.0,23),(48,146.832,16)]
for i in range(rate*duration):
    t=i/rate
    left=right=0.0
    for onset,freq,length in notes:
        age=t-onset
        if 0<=age<length:
            env=math.sin(math.pi*age/length)**2
            body=(math.sin(2*math.pi*freq*t)+.22*math.sin(2*math.pi*freq*2*t)+.08*math.sin(2*math.pi*freq*3*t))*.045*env
            left+=body*(.9+.1*math.sin(t*.19))
            right+=body*(.9+.1*math.cos(t*.19))
    # Sparse, soft high harmonics; long attack, no rhythmic percussion.
    for onset in (4,17,30,43,55):
        age=t-onset
        if age>=0:
            env=(1-math.exp(-age/1.8))*math.exp(-age/4.2)
            left+=.014*env*math.sin(2*math.pi*587.328*t)
            right+=.014*env*math.sin(2*math.pi*587.4*t)
    fade=min(1,t/3,(duration-t)/4)
    out.extend((int(left*fade*32767),int(right*fade*32767)))
path=Path(__file__).resolve().parents[1]/'public/quiet-room.wav'
with wave.open(str(path),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(out.tobytes())
print(path)
