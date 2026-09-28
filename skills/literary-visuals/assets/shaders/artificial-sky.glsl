precision highp float;
uniform vec2 res;uniform float time;uniform float force;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*noise(p);p=mat2(1.61,-1.19,1.19,1.61)*p+2.73;a*=.5;}return s;}
float g(float x,float w){return exp(-x*x/w);}
float form(vec2 p,float t,float strength){
float beat=pow(.5+.5*sin(t*1.55),12.)+.32*pow(.5+.5*sin(t*1.55-.68),19.);
vec2 center=vec2(.54,.437);
vec2 q=(p-center)/vec2(.292,.161);
q/=1.+(.015+.045*strength)*beat;
float ang=atan(q.y,q.x);
float irregular=.105*sin(ang*3.+.4)+.057*sin(ang*5.-.7)+.038*sin(ang*9.+t*.05);
float n=fbm(p*26.+vec2(t*.012,-t*.005));
return length(q)-1.-irregular-.073*(n-.5);
}
void main(){
vec2 p=vec2(gl_FragCoord.x/res.x,1.-gl_FragCoord.y/res.y);float t=time;
float grain=hash(gl_FragCoord.xy);
float memory=pow(.5+.5*sin(t*.19+.6),9.)*force;
float slice=g(p.y-.445,.000028)+.45*g(p.y-.505,.000009);
p.x+=slice*.017*memory;
float fine=fbm(p*160.);
float air=fbm(p*4.);
vec3 col=mix(vec3(.73,.72,.76),vec3(.52,.57,.59),p.y*.6);
col+=vec3(.06,.032,.07)*(air-.5);
float membrane=sin(p.x*8.+p.y*3.+air*.8);
col+=vec3(.038,.048,.060)*pow(max(0.,membrane),12.);
float horizon=.667+.021*sin(p.x*6.+t*.09)+.014*(fbm(vec2(p.x*7.,t*.009))-.5);
float hd=p.y-horizon;
float under=smoothstep(-.017,.048,hd);
vec3 lower=vec3(.11,.115,.16);
lower+=vec3(.045,.04,.053)*fbm(p*12.);
col=mix(col,lower,under);
for(int i=0;i<10;i++){
float j=float(i);float yy=horizon+.024+j*.022;
float arch=.105*g(p.x-(.50+.07*sin(j*.8)),.065+j*.004)*(1.-j*.053);
yy-=arch;
yy+=.006*sin(p.x*12.+j*1.7+t*.085)*(.3+force);
float dy=p.y-yy;float band=g(dy,.00004+j*.000003);
float highlight=g(dy+.003,.0000018);
float shade=g(dy-.009,.000011);
col=mix(col,vec3(.24,.25,.30),band*.38);
col+=vec3(.16,.18,.21)*highlight*(.16+.22*noise(vec2(p.x*18.,j)));
col-=vec3(.043,.042,.05)*shade;
}
float gel=g(hd,.00010);col+=vec3(.14,.17,.17)*gel;
float echo=form(p-vec2(.021*memory,.007),t-.9,force);
col=mix(col,vec3(.26,.29,.34),(1.-smoothstep(-.008,.025,echo))*.13);
float d=form(p,t,force);
float body=1.-smoothstep(-.004,.011,d);
float darkHalo=g(max(d,0.),.011)*.19;
col*=1.-darkHalo;
float edgeLight=g(d+.025,.0032);
float inkTexture=fbm(vec2(p.x*70.,p.y*88.));
vec3 coal=vec3(.022,.024,.030);
coal+=vec3(.061,.066,.082)*edgeLight*(.35+.65*g(p.x-.36,.02));
coal+=vec3(.028,.029,.033)*(inkTexture-.25);
float sheen=g(p.y-(.375+.030*sin(p.x*13.)),.00024)*g(p.x-.37,.016);
coal+=vec3(.056,.061,.073)*sheen;
col=mix(col,coal,body);
for(int i=0;i<5;i++){
float j=float(i);float x=.10+j*.205;float y=.24+.047*sin(j*2.2);
float length=.027+.025*hash(vec2(j,2.));
float dy=p.y-y;float dx=p.x-x-dy*(.35+.4*sin(j));
float slit=g(dx,.0000007)*smoothstep(-length,-length+.003,dy)*(1.-smoothstep(length-.003,length,dy));
col=mix(col,vec3(.15,.17,.21),slit*.53);
col+=vec3(.12,.13,.13)*g(dx-.002,.0000005)*smoothstep(-length,0.,dy)*(1.-smoothstep(0.,length,dy));
}
col+=(fine-.5)*.03+(grain-.5)*.022;
float offset=g(p.y-.445,.0000008)*memory;
col=mix(col,vec3(.55,.55,.61),offset*.18);
gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
