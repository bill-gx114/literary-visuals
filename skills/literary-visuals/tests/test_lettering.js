const test = require('node:test');
const assert = require('node:assert/strict');
const {wrap,layout,draw} = require('../assets/lettering.js');
function context(){return {font:'',measureText(s){const n=parseFloat(this.font.split(' ')[1])||10;return {width:Array.from(s).reduce((a,c)=>a+(/^[\x00-\x7f]$/.test(c)?.55:1)*n,0)};},save(){},restore(){},fillText(){throw new Error('unexpected draw')}};}
const spec=(quote,typography={})=>({quote,caption:'作者《作品》',typography:{position:'bottom-left',...typography}});
test('Chinese wrap keeps closing punctuation off the next line',()=>{const c=context();c.font='400 10px serif';const lines=wrap('甲乙丙，丁戊己。',30,c);assert.equal(lines.join(''),'甲乙丙，丁戊己。');assert.ok(lines.every(s=>!/^，|^。/.test(s)));assert.ok(lines.every(s=>c.measureText(s).width<=30));});
test('opening bracket travels with next character',()=>{const c=context();c.font='400 10px serif';const lines=wrap('甲乙（丙丁）',30,c);assert.equal(lines.join(''),'甲乙（丙丁）');assert.ok(lines.every(s=>!s.endsWith('（')));});
test('English breaks on word boundaries and preserves paragraphs',()=>{const c=context();c.font='400 10px serif';const lines=wrap('The door stays open.\nNobody enters.',80,c);assert.equal(lines.join(' '),'The door stays open. Nobody enters.');assert.ok(lines.includes('Nobody enters.'));assert.ok(lines.every(s=>c.measureText(s).width<=80));});
test('long unbroken word wraps without dropping characters',()=>{const c=context();c.font='400 10px serif';assert.equal(wrap('uncharacteristically',30,c).join(''),'uncharacteristically');});
test('overflow is rejected without shrinking or painting partial quote',()=>{const c=context(),r=layout(spec('长'.repeat(600)),1536,2048,c);assert.equal(r.ok,false);assert.equal(r.size,1536*.0375);assert.doesNotThrow(()=>draw(c,r));});
test('line count and fit stay consistent at preview and export scale',()=>{for(const wh of [[390,520],[1536,2048],[1080,1440]]){const r=layout(spec('杯沿还温着，对面的座位已经空了。'),...wh,context());assert.equal(r.ok,true);assert.equal(r.commands.filter(x=>!x.caption).length,1);}});
test('full passage can fit a deliberately planned reading region',()=>{const r=layout(spec('甲'.repeat(230),{box:[.08,.38,.84,.42],size:.035,line_height:1.5}),1536,2048,context());assert.equal(r.ok,true);});
test('tiny vertical region rejects horizontal and vertical overflow',()=>{const r=layout(spec('甲乙丙丁戊\n一二三四五',{position:'top-right-vertical',box:[.8,.1,.1,.1]}),1536,2048,context());assert.equal(r.ok,false);});
test('vertical short poem fits portrait and landscape',()=>{for(const wh of [[1536,2048],[2560,1440]]){assert.equal(layout(spec('星垂平野阔\n月涌大江流',{position:'top-right-vertical'}),...wh,context()).ok,true);}});
test('caption collision rejects export layout',()=>{assert.equal(layout(spec('一二三四五',{box:[.09,.80,.82,.13],caption_box:[.09,.83,.82,.10]}),1536,2048,context()).ok,false);});
