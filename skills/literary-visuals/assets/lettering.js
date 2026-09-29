/* Shared by browser preview, export and Node layout tests. No automatic shrinking. */
const LiteraryLettering = (() => {
  'use strict';
  const font = size => `400 ${size}px "Songti SC", "STSong", "Noto Serif CJK SC", serif`;
  const closing = /^[，。！？；：、…）】》」』,.!?;:%]/u;
  const opening = /[（【《「『(]$/u;
  function wrap(text, maxWidth, context) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
      let line = '';
      const tokens = paragraph.match(/[\p{Script=Latin}\d]+(?:['’-][\p{Script=Latin}\d]+)*|[^\S\n]+|[^\s]/gu) || [];
      function add(token) {
        if (!line || context.measureText(line + token).width <= maxWidth) { line += token; return; }
        if (!token.trim()) { lines.push(line.trimEnd()); line = ''; return; }
        let carry = '';
        if (closing.test(token) || opening.test(line)) {
          const chars = Array.from(line.trimEnd());
          carry = chars.pop() || '';
          line = chars.join('');
        }
        if (line) lines.push(line.trimEnd());
        line = carry + token;
      }
      for (const token of tokens) {
        if (context.measureText(token).width > maxWidth) Array.from(token).forEach(add);
        else add(token);
      }
      lines.push(line.trimEnd());
    }
    return lines;
  }
  const rect = (box, w, h) => ({x:box[0]*w,y:box[1]*h,w:box[2]*w,h:box[3]*h});
  function layout(spec, w, h, context) {
    const text = spec.typography, base = Math.min(w,h);
    const size = base * (text.size || .0375), lineHeight = size * (text.line_height || 1.9);
    const vertical = text.position === 'top-right-vertical';
    const box = rect(text.box || (vertical ? [.09,.085,.82,.68] : [.09,.09,.82,.70]),w,h);
    const commands = [], issues = [];
    const captionBox = rect(text.caption_box || [.09,.83,.82,.10],w,h);
    const captionSize = base * .026;
    if (spec.caption) {
      context.font = font(captionSize);
      const lines = wrap(spec.caption, captionBox.w, context), step = captionSize*1.5;
      const height = lines.length*step;
      if (height>captionBox.h || lines.some(s=>context.measureText(s).width>captionBox.w+.01)) issues.push('署名超出预留区域');
      lines.forEach((value,i)=>commands.push({text:value,x:captionBox.x,y:captionBox.y+captionBox.h-height+i*step,size:captionSize,color:text.caption_color||text.color||'#e0dacd',caption:true}));
    }
    context.font = font(size);
    if (vertical) {
      const groups=spec.quote.split('\n'), columnStep=size*2.2;
      const width=(groups.length-1)*columnStep+size;
      if(width>box.w || groups.some(s=>Array.from(s).length*size*1.45>box.h)) issues.push('竖排原文超出预留区域');
      groups.forEach((line,i)=>Array.from(line).forEach((value,j)=>commands.push({text:value,x:box.x+box.w-size-i*columnStep,y:box.y+j*size*1.45,size,color:text.color||'#e0dacd'})));
    } else {
      const lines=wrap(spec.quote,box.w,context),height=lines.length*lineHeight;
      if(height>box.h || lines.some(s=>context.measureText(s).width>box.w+.01)) issues.push('原文超出预留阅读区域');
      const y=text.position==='bottom-left'?box.y+box.h-height:box.y;
      lines.forEach((value,i)=>commands.push({text:value,x:box.x,y:y+i*lineHeight,size,color:text.color||'#e0dacd'}));
    }
    // Actual line boxes, not just font height: typography must not collide with its caption.
    const quoteCommands=commands.filter(c=>!c.caption&&c.text);
    for(const c of commands.filter(c=>c.caption&&c.text)) {
      context.font=font(c.size);const cw=context.measureText(c.text).width;
      if(quoteCommands.some(q=>{context.font=font(q.size);const qw=context.measureText(q.text).width;return q.x<c.x+cw&&q.x+qw>c.x&&q.y<c.y+c.size*1.5&&q.y+(vertical?q.size*1.45:lineHeight)>c.y;})) {issues.push('原文与署名重叠');break;}
    }
    return {ok:issues.length===0,issues,commands,size};
  }
  function draw(context, result) {
    if(!result.ok) return; // Never draw clipped text or silently substitute a smaller size.
    context.save();context.textBaseline='top';context.textAlign='left';
    for(const command of result.commands){context.font=font(command.size);context.fillStyle=command.color;context.globalAlpha=command.caption?.85:1;context.fillText(command.text,command.x,command.y);}
    context.restore();
  }
  return {wrap,layout,draw};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=LiteraryLettering;
