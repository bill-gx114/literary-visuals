precision highp float;
uniform vec2 res;uniform float time;uniform float force;uniform int mode;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p+3.71;a*=.5;}return v;}
float gauss(float x,float w){return exp(-x*x/w);}
void main(){
vec2 uv=gl_FragCoord.xy/res;vec2 p=vec2(uv.x,1.-uv.y);float t=time;float grain=hash(gl_FragCoord.xy);vec3 col;
if(mode==0){
float center=.56+.025*sin(t*.18);float weight=(.085+force*.095)*gauss(p.x-center,.075);
float flow=.010*sin(p.x*7.-t*.26)+.004*sin(p.x*19.+t*.16);
float y=.48+weight+flow;
float d=p.y-y;
col=vec3(.024,.043,.071);
float atmosphere=gauss(d+.025,.011)*(.3+.7*gauss(p.x-.53,.12));
col+=vec3(.052,.105,.145)*atmosphere;
float under=gauss(d-.105,.019)*(.5+.5*noise(vec2(p.x*2.-t*.035,p.y*9.)));
col+=vec3(.012,.033,.056)*under;
float light=0.;for(int i=0;i<44;i++){
float j=float(i)/43.;float ribbon=y-(1.-j)*(.065+.032*cos(p.x*5.+j*2.))+.002*sin(p.x*24.+j*11.+t*.1);
float line=gauss(p.y-ribbon,.0000007+res.y*.00000000025);
float attenuation=pow(j,2.)*(.25+.75*gauss(p.x-.52,.15));light+=line*attenuation*.20;
}
col+=vec3(.62,.68,.67)*light;
float edge=gauss(d,.0000012)*(.23+.5*gauss(p.x-.64,.06));col+=vec3(.83,.77,.59)*edge;
float dust=noise(vec2(p.x*230.,p.y*4.))*noise(vec2(p.x*600.,p.y*3.));
col+=vec3(.042,.060,.074)*dust*gauss(d+.06,.003);
col+=vec3(.055,.07,.09)*(grain-.5);
col*=.83+.17*sin(p.x*3.14159);
}else if(mode==1){
float paper=fbm(p*9.);col=vec3(.902,.887,.842)+(paper-.5)*.045+(grain-.5)*.044;
float ink=0.;float breathing=sin(t*.20)*.018;
for(int i=0;i<72;i++){
float j=float(i)/71.;float a=.14+force*.14;
float bell=gauss(p.x-(.61+breathing),.10);
float arc=.65+(j-.5)*.082 + a*bell*(j-.50)*2.5 + .025*sin(p.x*5.+j*2.+t*.12);
arc+=.003*sin(p.x*25.+j*11.+t*.15)*bell;
float line=gauss(p.y-arc,.00000010+1./(res.y*res.y)*.13);
float variation=.32+.68*noise(vec2(j*78.,p.x*12.));
ink+=line*variation*(.30+.22*sin(j*3.14));
}
float fade=.82+.18*sin(p.x*3.14);col=mix(col,vec3(.19,.235,.22),clamp(ink*fade,0.,.82));
float trace=gauss(p.y-(.735+.010*sin(p.x*5.+t*.1)),.00000015)*.21;
col=mix(col,vec3(.40,.39,.32),trace);
}else{
vec2 q=vec2(p.x*1.7,p.y*1.15);
float w=fbm(q*2.+vec2(t*.018,-t*.012));
float v=fbm(q*4.+vec2(w*2.,t*.018));
float s=p.x*.95+p.y*.48+(.17+force*.12)*(w-.5)+.045*sin(p.y*8.+t*.14);
float body=s+.07*(v-.5);
col=vec3(.34,.115,.073);
col=mix(col,vec3(.66,.23,.12),smoothstep(.13,.52,body));
col=mix(col,vec3(.76,.38,.18),smoothstep(.50,.65,body));
col=mix(col,vec3(.055,.092,.093),smoothstep(.70,.715,body));
col=mix(col,vec3(.115,.15,.14),smoothstep(.93,1.10,body));
float veins=sin(body*680.+v*12.);float veins2=sin(body*310.+w*20.);
float metal=pow(max(0.,veins),15.)*(.4+.6*v);
float region=1.-smoothstep(.70,.73,body);
col+=vec3(.17,.12,.055)*metal*region;
col-=vec3(.085,.05,.027)*pow(max(0.,veins2),6.)*region;
float border=gauss(body-.711,.000035);col+=vec3(.59,.40,.14)*border;
float second=gauss(body-.96,.0000006);col+=vec3(.20,.25,.21)*second;
float mineral=fbm(p*180.);col+=(mineral-.5)*.095+(grain-.5)*.065;
col*=.80+.20*sin(p.y*3.14159);
}
gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
