(()=>{
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('art'),ctx=canvas.getContext('2d',{alpha:false});
const gpu=document.createElement('canvas');
const gl=gpu.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={paused:reduced,words:true,value:SPEC.parameter.default,time:SPEC.start_time||0,busy:false};
let dirty=true,program,loc={},last=0,visible=true,cancelRequested=false;
const status=text=>{$('status').textContent=text;};
$('title').textContent=SPEC.title;document.title=SPEC.title;
canvas.setAttribute('aria-label',SPEC.accessibility||SPEC.intent);
$('parameter-label').textContent=SPEC.parameter.label;
$('parameter').setAttribute('aria-label',SPEC.parameter.label);
const statuses={confirmed:'出处已核实','work-confirmed-translation-unverified':'作品已核实，译者或版本未确认',ambiguous:'出处存在多个候选',unverified:'出处未确认',original:'已明确为原创文本'};
$('source-note').textContent=[SPEC.source.label,statuses[SPEC.source.status],SPEC.source.context_note,SPEC.intent].filter(Boolean).join('\n\n');
SPEC.source.urls.forEach((url,i)=>{const a=document.createElement('a');a.href=url;a.textContent='参考来源 '+(i+1);a.target='_blank';a.rel='noopener noreferrer';$('source-links').appendChild(a);});
function controls(){
 $('pause').textContent=state.paused?'继续流动':'暂停动效';$('pause').setAttribute('aria-pressed',String(state.paused));
 $('words').textContent=state.words?'隐去文字':'显示文字';$('words').setAttribute('aria-pressed',String(!state.words));
 $('parameter').value=Math.round(state.value*100);
 ['pause','words','parameter','png','video'].forEach(id=>$(id).disabled=state.busy);
 $('cancel').hidden=!state.busy||!recording;dirty=true;
}
function fail(message){$('error').hidden=false;$('error').textContent=message;['pause','words','parameter','png','video'].forEach(id=>$(id).disabled=true);canvas.dataset.ready='false';}
let recording=false;
controls();
if(!gl){fail('此浏览器无法使用 WebGL。源文件已保留，请换用支持 WebGL 的浏览器。');return;}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
try{
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 ['res','time','force','evening','mode'].forEach(name=>loc[name]=gl.getUniformLocation(program,name));
 canvas.dataset.ready='true';
}catch(error){console.error(error);fail('画面编译失败，无法导出。请让创作工具检查着色器。');return;}
function wrap(text,maxWidth,context){
 const lines=[];String(text).split('\n').forEach(paragraph=>{let line='';for(const ch of Array.from(paragraph)){if(context.measureText(line+ch).width>maxWidth&&line){lines.push(line);line=ch;}else line+=ch;}lines.push(line);});return lines;
}
function lettering(context,w,h){
 if(!state.words)return;
 const text=SPEC.typography,color=text.color||'#e0dacd';
 const x=w*.09,maxWidth=w*.82;
 let size=w*(text.size||.0375),lines,lineHeight;
 context.fillStyle=color;context.textBaseline='top';
 do{
  context.font=`400 ${size}px "Songti SC", "STSong", "Noto Serif CJK SC", serif`;
  lines=wrap(SPEC.quote,maxWidth,context);lineHeight=size*1.9;
  if(text.position==='top-right-vertical'||lines.length*lineHeight<=h*.60||size<=w*.016)break;
  size*=.94;
 }while(true);
 let y=text.position==='bottom-left'?h*.79-lines.length*lineHeight:h*.09;
 if(text.position==='top-right-vertical'){
  let column=w*.89-size;
  const groups=SPEC.quote.split('\n');
  groups.forEach(line=>{let yy=h*.085;Array.from(line).forEach(ch=>{context.fillText(ch,column,yy);yy+=size*1.45;});column-=size*2.2;});
 }else lines.forEach(line=>{context.fillText(line,x,y);y+=lineHeight;});
 if(SPEC.caption){context.font=`400 ${w*.021}px "Songti SC", "STSong", serif`;context.fillStyle=text.caption_color||color;context.globalAlpha=.85;
  const captionLines=wrap(SPEC.caption,maxWidth,context);let cy=h*.93-captionLines.length*w*.031;
  captionLines.forEach(line=>{context.fillText(line,x,cy);cy+=w*.031;});context.globalAlpha=1;
 }
}
function render(target,w,h,t){
 if(gpu.width!==w||gpu.height!==h){gpu.width=w;gpu.height=h;}
 gl.viewport(0,0,w,h);gl.useProgram(program);
 gl.uniform2f(loc.res,w,h);gl.uniform1f(loc.time,t);
 gl.uniform1f(loc.force,SPEC.parameter.uniform==='force'?state.value:(SPEC.uniforms.force??.55));
 gl.uniform1f(loc.evening,SPEC.parameter.uniform==='evening'?state.value:(SPEC.uniforms.evening??1));
 gl.uniform1i(loc.mode,SPEC.uniforms.mode??0);
 gl.drawArrays(gl.TRIANGLES,0,6);
 if(target.width!==w||target.height!==h){target.width=w;target.height=h;}
 const context=target.getContext('2d');context.drawImage(gpu,0,0);lettering(context,w,h);
}
function preview(){const w=Math.max(1,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,1.5)));render(canvas,w,Math.round(w*1.25),state.time);canvas.dataset.frame=state.time.toFixed(3);canvas.dataset.parameter=state.value.toFixed(2);canvas.dataset.words=String(state.words);dirty=false;}
$('pause').onclick=()=>{state.paused=!state.paused;controls();};
$('words').onclick=()=>{state.words=!state.words;controls();};
$('parameter').oninput=()=>{state.value=Number($('parameter').value)/100;dirty=true;};
new ResizeObserver(()=>dirty=true).observe(canvas);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(canvas);
function loop(now){requestAnimationFrame(loop);if(now-last<40)return;const dt=Math.min((now-last)/1000,.08);last=now;if(state.busy||!visible||document.hidden)return;if(!state.paused)state.time+=dt;if(!state.paused||dirty)preview();}
requestAnimationFrame(loop);
function download(blob,extension){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=SPEC.slug+'.'+extension;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function blobFromCanvas(target){return new Promise((resolve,reject)=>target.toBlob(blob=>blob?resolve(blob):reject(new Error('无法生成图片')),'image/png'));}
$('png').onclick=async()=>{
 state.busy=true;controls();status('正在生成 1600 × 2000 图片…');
 try{await document.fonts.ready;const out=document.createElement('canvas');render(out,1600,2000,state.time);download(await blobFromCanvas(out),'png');status('已生成 PNG · 1600 × 2000');}
 catch(error){status('图片导出失败：'+error.message);}
 finally{state.busy=false;controls();preview();}
};
$('cancel').onclick=()=>{cancelRequested=true;};
$('video').onclick=async()=>{
 if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream){status('此浏览器不支持视频录制；可以保存 PNG 和 HTML。');return;}
 const choices=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
 const mime=choices.find(type=>MediaRecorder.isTypeSupported(type));
 if(!mime){status('没有可用的视频编码器；可以保存 PNG 和 HTML。');return;}
 state.busy=true;recording=true;cancelRequested=false;controls();
 let stream,recorder;
 try{
  await document.fonts.ready;
  const out=document.createElement('canvas'),duration=12,baseTime=state.time;render(out,720,900,baseTime);
  stream=out.captureStream(24);
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
  const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const finished=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=e=>reject(new Error(e.error?.message||'编码失败'));});
  recorder.start(250);const started=performance.now();
  await new Promise(resolve=>{
   function tick(){const elapsed=(performance.now()-started)/1000;
    if(elapsed>=duration||cancelRequested||document.hidden){if(document.hidden)cancelRequested=true;resolve();return;}
    render(out,720,900,baseTime+elapsed);ctx.drawImage(out,0,0,canvas.width,canvas.height);
    status(`正在录制 ${Math.floor(elapsed)} / 12 秒，请保持页面可见…`);setTimeout(tick,1000/24);
   }tick();
  });
  recorder.stop();await finished;
  if(cancelRequested){status('已取消录制，未生成视频。');}
  else{const actual=recorder.mimeType||mime,extension=actual.includes('mp4')?'mp4':'webm';const blob=new Blob(chunks,{type:actual});if(blob.size<1000)throw new Error('视频数据为空');download(blob,extension);status(`已生成 ${extension.toUpperCase()} · 720 × 900 · 约 12 秒${extension==='webm'?'；可用随包工具转成 MP4':''}`);}
 }catch(error){status('视频导出失败：'+error.message);}
 finally{if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(track=>track.stop());recording=false;state.busy=false;controls();preview();}
};
})();
