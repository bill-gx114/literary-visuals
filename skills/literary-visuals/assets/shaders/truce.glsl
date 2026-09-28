precision highp float;
uniform vec2 res;uniform float time;uniform float evening;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*noise(p);p=mat2(1.61,-1.19,1.19,1.61)*p+2.73;a*=.5;}return s;}
float gaussian(float d,float width){return exp(-d*d/width);}
void main(){
vec2 p=vec2(gl_FragCoord.x/res.x,1.-gl_FragCoord.y/res.y);
float e=evening,t=time;
float grain=hash(gl_FragCoord.xy);
float pigment=fbm(p*145.);
float wide=fbm(p*6.);
float breath=pow(.5+.5*sin(t*.125),3.);
float release=e*(.009+.008*breath);
float shimmer=(1.-e)*.0025*sin(p.y*98.+t*.52)*sin(p.x*35.+t*.26);
p.x+=shimmer;
vec3 skyDay=vec3(.85,.76,.57),skyEvening=vec3(.60,.62,.65);
vec3 col=mix(skyDay,skyEvening,e);
float skyDust=fbm(vec2(p.x*2.2,p.y*5.));
col+=vec3(.12,.075,.047)*gaussian(p.y-.41,.05);
col+=(skyDust-.5)*.14;
col=mix(col,mix(vec3(.95,.83,.61),vec3(.79,.70,.63),e),gaussian(p.y-.49,.028)*.55);
float h=.505+.013*sin(p.x*5.8)+.008*(fbm(vec2(p.x*8.,1.))-.5);
float distant=smoothstep(h-.002,h+.014,p.y)*(1.-smoothstep(h+.065,h+.090,p.y));
col=mix(col,mix(vec3(.48,.43,.29),vec3(.39,.43,.42),e),distant*.8);
float slit=h+.074+release+.002*sin(p.x*4.+t*.05);
float gap=gaussian(p.y-slit,.000013+release*.00030)*(.32+.48*gaussian(p.x-.57,.17));
col=mix(col,mix(vec3(.96,.86,.67),vec3(.84,.77,.69),e),gap*.8);
float landTop=slit+.012+.022*fbm(vec2(p.x*9.,.7));
float land=smoothstep(landTop-.009,landTop+.015,p.y);
float cut=fbm(vec2(p.x*5.,p.y*6.));
float plane=p.x*.73-p.y*.46+.27*(cut-.5);
vec3 rust=mix(vec3(.56,.24,.125),vec3(.40,.23,.21),e);
vec3 green=mix(vec3(.36,.39,.22),vec3(.255,.325,.285),e);
vec3 soil=mix(rust,green,smoothstep(-.10,.01,plane));
soil=mix(soil,rust*.88,smoothstep(.37,.40,plane));
soil+=vec3(.15,.10,.064)*(wide-.5);
float scrape=fbm(vec2(p.x*18.,p.y*160.));
soil+=(scrape-.5)*.095+(pigment-.5)*.12;
float sediment=gaussian(p.y-(.74+.040*sin(p.x*4.)+.008*cut),.00001);
soil=mix(soil,vec3(.64,.48,.33),sediment*.15);
col=mix(col,soil,land);
for(int i=0;i<11;i++){
float j=float(i)/10.;
float x=.17+j*.52;
float foot=.68-j*.10;
float height=.063*(1.-j*.55);
float width=.0055*(1.-j*.60);
float dx=p.x-x-(p.y-foot)*.13;
float ragged=.70+.30*noise(vec2(p.x*340.,p.y*120.));
float stroke=gaussian(dx,width*width)*smoothstep(foot-height-.003,foot-height+.009,p.y)*(1.-smoothstep(foot-.008,foot+.008,p.y));
col=mix(col,vec3(.16,.205,.195),stroke*ragged*.73);
}
float smallVoid=gaussian(p.x-.74,.0007)*gaussian(p.y-.635,.000014);
col=mix(col,vec3(.71,.68,.54),smallVoid*.25);
col+=(pigment-.5)*.038+(grain-.5)*.025;
float bottom=smoothstep(.83,1.,p.y);
col*=1.-bottom*.22;
gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
