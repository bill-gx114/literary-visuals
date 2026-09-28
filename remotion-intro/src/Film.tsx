import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Artwork, ArtName} from './Artwork';

const PAPER='#edeae1', INK='#323d38', MUTED='#74776a';
const serif='"Literary Serif", "Songti SC", serif';
const sans='"Helvetica Neue", "PingFang SC", sans-serif';
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
const appear=(f:number,start=0,length=42)=>smooth((f-start)/length);
const easeOut=(f:number,duration:number)=>1-appear(f,duration-36,36);
const Small:React.FC<{children:React.ReactNode;style?:React.CSSProperties}>=({children,style})=><div style={{fontFamily:sans,fontSize:20,letterSpacing:4,lineHeight:1.8,...style}}>{children}</div>;

const Paper:React.FC=()=><AbsoluteFill style={{backgroundColor:PAPER}}>
  <svg width="100%" height="100%" style={{opacity:.14}}>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#paper)" opacity=".35"/>
  </svg>
</AbsoluteFill>;

const Opening:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:easeOut(f,204),color:INK}}>
   <div style={{position:'absolute',left:0,top:0,width:1920,height:1080,overflow:'hidden',opacity:.13*appear(f,0,64)}}>
     <div style={{position:'absolute',width:1160,height:1450,left:1130,top:-170,transform:`translateX(${-f*.055}px)`}}><Artwork name="surge" time={14+f/24*.5} resolution={480}/></div>
   </div>
   <div style={{position:'absolute',left:174,top:172,opacity:appear(f,5,48)}}><Small style={{color:MUTED}}>LITERARY VISUALS</Small></div>
   <div style={{position:'absolute',left:169,top:330,fontSize:94,fontWeight:400,letterSpacing:9,lineHeight:1.6,opacity:appear(f,16,56),transform:`translateY(${(1-appear(f,16,56))*15}px)`}}>让文字，<br/>慢慢成为风景。</div>
   <div style={{position:'absolute',left:177,top:849,opacity:appear(f,68,42),fontSize:27,letterSpacing:4,color:MUTED}}>文学意象转译 · Skill</div>
 </AbsoluteFill>;
};

const Method:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:appear(f,0,30)*easeOut(f,204),color:INK,padding:'151px 176px'}}>
  <Small style={{color:MUTED}}>从一句话，走进它的内在。</Small>
  <div style={{fontSize:66,letterSpacing:7,marginTop:39}}>文学意象转译</div>
  <div style={{fontSize:29,letterSpacing:2,lineHeight:1.9,marginTop:30,color:MUTED}}>把诗歌、小说与摘抄，转成可以收藏的视觉作品。</div>
  <div style={{position:'absolute',left:176,right:176,top:559,display:'flex',gap:100}}>
   {[
    ['01','查出处','回到原文与上下文'],
    ['02','读意象','理解情绪、尺度与动作'],
    ['03','成作品','让材质与运动回应文字'],
   ].map(([n,title,desc],i)=><div key={n} style={{width:450,opacity:appear(f,25+i*17,40),transform:`translateY(${(1-appear(f,25+i*17,40))*12}px)`}}>
    <div style={{height:1,background:'#b9b9a9',marginBottom:36}}/>
    <Small style={{color:'#969782'}}>{n}</Small>
    <div style={{fontSize:42,letterSpacing:6,margin:'19px 0'}}>{title}</div>
    <div style={{fontSize:25,color:MUTED,letterSpacing:1.5}}>{desc}</div>
   </div>)}
  </div>
  <div style={{position:'absolute',left:176,bottom:97,fontSize:22,color:MUTED,opacity:appear(f,84,40)}}>查不到出处时，如实标注，依文本继续创作。</div>
 </AbsoluteFill>;
};

const cases:[ArtName,string,string,string,string,string,string][]=[
 ['surge','01','涌','星垂平野阔，\n月涌大江流。','杜甫《旅夜书怀》','矿物的层理缓慢推进。\n广阔之中，保留细微的重量。','时间的切面'],
 ['truce','02','暂歇','傍晚应该是\n一段忧伤的喘息。','加缪《局外人》· 第一部第一章','压力松开一线，余热仍在。\n把想象中的傍晚，留成一道间隙。','忧伤的喘息'],
 ['artificialSky','03','伪天','空气闻起来像塑料，\n地平线就像凝胶。','用户摘抄 · 出处未确认','薄膜、层片与低频搏动。\n让不安发生在材料的内部。','人造的天空'],
];

const Case:React.FC<{index:number}>=({index})=>{
 const f=useCurrentFrame();const [name,n,title,quote,source,meaning,sub]=cases[index];
 const light=index===1;const bg=light?'#e4e2d8':index===0?'#192722':'#282832';
 const fg=light?'#36413b':'#e4dfd0';const muted=light?'#74796e':'#a9ada3';
 const textLeft=light?1045:153;const artLeft=light?137:1062;
 const artTime=(index===0?14:index===1?38:12)+f/24*.65;
 return <AbsoluteFill style={{backgroundColor:bg,color:fg,opacity:appear(f,0,36)*easeOut(f,300)}}>
   <div style={{position:'absolute',left:artLeft,top:90,width:720,height:900,overflow:'hidden',opacity:appear(f,6,44)}}>
    <div style={{width:'100%',height:'100%',transform:`scale(${1+f/300*.018})`}}><Artwork name={name} time={artTime}/></div>
   </div>
   <div style={{position:'absolute',left:textLeft,top:137,width:740,opacity:appear(f,16,42)}}>
    <Small style={{color:muted}}>作品 {n} / {sub}</Small>
    <div style={{fontSize:88,letterSpacing:12,marginTop:34}}>{title}</div>
    <div style={{fontSize:index===2?43:47,letterSpacing:3,lineHeight:1.9,whiteSpace:'pre-line',marginTop:62}}>{quote}</div>
    <div style={{fontSize:22,color:muted,letterSpacing:1.3,marginTop:33}}>{source}</div>
    {light&&<div style={{fontSize:18,marginTop:10,color:muted}}>作品归属已核实，中文译本未确认</div>}
    <div style={{width:56,height:1,background:muted,marginTop:68,opacity:.65}}/>
    <div style={{fontSize:25,letterSpacing:1.7,lineHeight:1.85,whiteSpace:'pre-line',marginTop:31,color:muted,opacity:appear(f,54,44)}}>{meaning}</div>
   </div>
 </AbsoluteFill>;
};

const Closing:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{color:INK,opacity:appear(f,0,40)}}>
   <div style={{position:'absolute',top:120,width:'100%',textAlign:'center',fontSize:66,letterSpacing:8}}>把触动，留在身边。</div>
   <div style={{position:'absolute',top:258,width:'100%',textAlign:'center',fontSize:25,letterSpacing:6,color:MUTED}}>诗歌 · 小说 · 摘抄</div>
   <div style={{position:'absolute',left:455,top:359,display:'flex',gap:55}}>
    {cases.map(([name,,title],i)=><div key={name} style={{opacity:appear(f,10+i*10,42),width:300}}>
      <div style={{height:375,overflow:'hidden'}}><Artwork name={name} time={14+f/24*.5} resolution={360}/></div>
      <div style={{textAlign:'center',fontSize:23,marginTop:20,letterSpacing:7,color:MUTED}}>{title}</div>
    </div>)}
   </div>
   <div style={{position:'absolute',top:856,width:'100%',textAlign:'center',opacity:appear(f,55,36)}}>
    <div style={{fontSize:26,letterSpacing:3}}>收藏为图片 · 分享为短片</div>
    <div style={{fontFamily:sans,fontSize:23,letterSpacing:2,marginTop:28,color:MUTED}}>使用 $literary-visuals，从你读到的那句话开始。</div>
   </div>
 </AbsoluteFill>;
};

export const Film:React.FC=()=>{
 const [handle]=useState(()=>delayRender('Load Chinese serif font'));
 useEffect(()=>{
  const face=new FontFace('Literary Serif',`url(${staticFile('LiterarySerif.woff2')})`,{weight:'400'});
  face.load().then(font=>{(document.fonts as FontFaceSet & {add: (font: FontFace) => void}).add(font);continueRender(handle);}).catch(error=>{throw error;});
 },[handle]);
 return <AbsoluteFill style={{fontFamily:serif}}>
   <Paper/>
   <Audio src={staticFile('quiet-room.wav')} volume={f=>interpolate(f,[0,72,1464,1535],[0,.65,.65,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>
   <Sequence from={0} durationInFrames={204}><Opening/></Sequence>
   <Sequence from={180} durationInFrames={204}><Method/></Sequence>
   <Sequence from={360} durationInFrames={300}><Case index={0}/></Sequence>
   <Sequence from={636} durationInFrames={300}><Case index={1}/></Sequence>
   <Sequence from={912} durationInFrames={300}><Case index={2}/></Sequence>
   <Sequence from={1188} durationInFrames={348}><Closing/></Sequence>
 </AbsoluteFill>;
};
