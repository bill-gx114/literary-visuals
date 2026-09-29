(()=>{
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('art'),ctx=canvas.getContext('2d',{alpha:false});
const gpu=document.createElement('canvas');
const gl=gpu.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const delivery=SPEC.delivery,formats=delivery.formats,textMode=delivery.text_mode;
const [imageW,imageH]=delivery.image_size,[videoW,videoH]=delivery.video_size;
const ratio=imageW/imageH,staticOnly=formats.length===1&&formats[0]==='png';
const state={paused:reduced||staticOnly,words:textMode!=='without',value:SPEC.parameter.default,time:SPEC.start_time||0,busy:false};
let pairTime=null;
const exportTime=()=>textMode==='both'?(pairTime??(pairTime=state.time)):state.time;
canvas.style.aspectRatio=`${imageW} / ${imageH}`;
document.querySelector('main').style.maxWidth=ratio>1?'840px':'480px';
$('kind').textContent=staticOnly?'文学意象 · 静态作品':'文学意象 · 动态作品';
$('pause').hidden=staticOnly;
$('png').hidden=!formats.includes('png');
$('png-alt').hidden=!formats.includes('png')||textMode!=='both';
$('video').hidden=!formats.includes('mp4');
$('video-alt').hidden=!formats.includes('mp4')||textMode!=='both';
$('png').textContent=textMode==='both'?'保存带字图片':'保存高清图片';
$('video').textContent=textMode==='both'?`导出带字视频 · ${delivery.duration_seconds} 秒`:`导出 ${delivery.duration_seconds} 秒视频`;
$('video-alt').textContent=`导出无字视频 · ${delivery.duration_seconds} 秒`;
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
 ['pause','words','parameter','png','png-alt','video','video-alt'].forEach(id=>$(id).disabled=state.busy);
 $('cancel').hidden=!state.busy||!recording;dirty=true;
}
function fail(message){$('error').hidden=false;$('error').textContent=message;['pause','words','parameter','png','png-alt','video','video-alt'].forEach(id=>$(id).disabled=true);canvas.dataset.ready='false';}
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
function lettering(context,w,h,showWords){
 if(!showWords)return {ok:true,issues:[]};
 const result=LiteraryLettering.layout(SPEC,w,h,context);
 LiteraryLettering.draw(context,result);return result;
}
function render(target,w,h,t,showWords=state.words){
 if(gpu.width!==w||gpu.height!==h){gpu.width=w;gpu.height=h;}
 gl.viewport(0,0,w,h);gl.useProgram(program);
 gl.uniform2f(loc.res,w,h);gl.uniform1f(loc.time,t);
 gl.uniform1f(loc.force,SPEC.parameter.uniform==='force'?state.value:(SPEC.uniforms.force??.55));
 gl.uniform1f(loc.evening,SPEC.parameter.uniform==='evening'?state.value:(SPEC.uniforms.evening??1));
 gl.uniform1i(loc.mode,SPEC.uniforms.mode??0);
 gl.drawArrays(gl.TRIANGLES,0,6);
 if(target.width!==w||target.height!==h){target.width=w;target.height=h;}
 const context=target.getContext('2d');context.drawImage(gpu,0,0);return lettering(context,w,h,showWords);
}
function preview(){const w=Math.max(1,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,1.5)));const layout=render(canvas,w,Math.round(w/ratio),state.time);canvas.dataset.textFits=String(layout.ok);$('layout-warning').hidden=layout.ok;$('layout-warning').textContent=layout.ok?'':layout.issues.join('；')+'。请重新安排阅读区，或取得节选/分页选择。未绘制溢出文字，带字导出将被阻止。';canvas.dataset.frame=state.time.toFixed(3);canvas.dataset.parameter=state.value.toFixed(2);canvas.dataset.words=String(state.words);dirty=false;}
$('pause').onclick=()=>{state.paused=!state.paused;pairTime=null;controls();};
$('words').onclick=()=>{state.words=!state.words;controls();};
$('parameter').oninput=()=>{state.value=Number($('parameter').value)/100;pairTime=null;dirty=true;};
new ResizeObserver(()=>dirty=true).observe(canvas);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(canvas);
function loop(now){requestAnimationFrame(loop);if(now-last<40)return;const dt=Math.min((now-last)/1000,.08);last=now;if(state.busy||!visible||document.hidden)return;if(!state.paused)state.time+=dt;if(!state.paused||dirty)preview();}
requestAnimationFrame(loop);
function download(blob,extension,showWords){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=SPEC.slug+(showWords?'-with-text':'-art')+'.'+extension;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function blobFromCanvas(target){return new Promise((resolve,reject)=>target.toBlob(blob=>blob?resolve(blob):reject(new Error('无法生成图片')),'image/png'));}
async function exportPng(showWords){
 state.busy=true;controls();status(`正在生成 ${imageW} × ${imageH} 图片…`);
 try{await document.fonts.ready;const out=document.createElement('canvas');const layout=render(out,imageW,imageH,exportTime(),showWords);if(!layout.ok)throw new Error(layout.issues.join('；'));download(await blobFromCanvas(out),'png',showWords);status(`已生成${showWords?'带字':'无字'} PNG · ${imageW} × ${imageH}`);}
 catch(error){status('图片导出失败：'+error.message);}
 finally{state.busy=false;controls();preview();}
}
$('png').onclick=()=>exportPng(textMode==='both'?true:state.words);
$('png-alt').onclick=()=>exportPng(false);
$('cancel').onclick=()=>{cancelRequested=true;};
async function exportVideo(showWords){
 if(typeof MediaRecorder==='undefined'||!HTMLCanvasElement.prototype.captureStream){status('此浏览器不支持视频录制；可以保存 PNG 和 HTML。');return;}
 const choices=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
 const mime=choices.find(type=>MediaRecorder.isTypeSupported(type));
 if(!mime){status('没有可用的视频编码器；可以保存 PNG 和 HTML。');return;}
 state.busy=true;recording=true;cancelRequested=false;controls();
 let stream,recorder;
 try{
  await document.fonts.ready;
  const out=document.createElement('canvas'),duration=delivery.duration_seconds,baseTime=exportTime();const layout=render(out,videoW,videoH,baseTime,showWords);if(!layout.ok)throw new Error(layout.issues.join('；'));
  stream=out.captureStream(delivery.fps);
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
  const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const finished=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=e=>reject(new Error(e.error?.message||'编码失败'));});
  recorder.start(250);const started=performance.now();
  await new Promise((resolve,reject)=>{
   function tick(){try{const elapsed=(performance.now()-started)/1000;
    if(elapsed>=duration||cancelRequested||document.hidden){if(document.hidden)cancelRequested=true;resolve();return;}
    render(out,videoW,videoH,baseTime+elapsed,showWords);ctx.drawImage(out,0,0,canvas.width,canvas.height);
    status(`正在录制 ${Math.floor(elapsed)} / ${duration} 秒，请保持页面可见…`);setTimeout(tick,1000/delivery.fps);
   }catch(error){reject(error);}}tick();
  });
  recorder.stop();await finished;
  if(cancelRequested){status('已取消录制，未生成视频。');}
  else{const actual=recorder.mimeType||mime,extension=actual.includes('mp4')?'mp4':'webm';const blob=new Blob(chunks,{type:actual});if(blob.size<1000)throw new Error('视频数据为空');download(blob,extension,showWords);status(`已生成${showWords?'带字':'无字'} ${extension.toUpperCase()} · ${videoW} × ${videoH} · 约 ${duration} 秒${extension==='webm'?'；可用随包工具转成 MP4':''}`);}
 }catch(error){status('视频导出失败：'+error.message);}
 finally{if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(track=>track.stop());recording=false;state.busy=false;controls();preview();}
}
$('video').onclick=()=>exportVideo(textMode==='both'?true:state.words);
$('video-alt').onclick=()=>exportVideo(false);
})();
