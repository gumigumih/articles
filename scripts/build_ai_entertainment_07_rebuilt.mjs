#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = '/Users/meggumi/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations';
const runtime = '/Users/meggumi/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const { values: args } = parseArgs({ options: {
  theme: { type: 'string' }, article: { type: 'string' },
  output: { type: 'string' }, finalize: { type: 'boolean', default: false },
} });
const spec = JSON.parse(await fs.readFile(path.join(root, 'scripts/ai-entertainment-07-rebuilt.json'), 'utf8'));
assert.equal(args.theme, spec.theme, '--theme ai-entertainment-night is required');
assert.equal(path.resolve(root, args.article ?? ''), path.join(root, spec.article), 'Use the approved issue 07 article');
const article = await fs.readFile(path.join(root, spec.article), 'utf8');
assert.match(article, /第2部/);
assert.equal(spec.slides.length, 11);
assert.deepEqual(spec.slides.map(s => s.id), Array.from({length:11}, (_, i) => i+1));
assert.equal(spec.slides[9].layout, 'summary');
assert.equal(spec.slides[10].layout, 'membership-closing');
assert.ok(!spec.slides[9].elements.some(e => e.kind === 'qr' || /メンバーシップ|note\.com/.test(e.text ?? '')));
assert.equal(spec.slides.filter(s => s.elements.some(e => e.kind === 'table')).length, 1);
for (const slide of spec.slides) for (const e of slide.elements) {
  assert.ok(['text','rect','line','arrow','table','qr','image'].includes(e.kind), `Unknown element ${e.kind}`);
  const x2 = e.x2 ?? e.x + e.w, y2 = e.y2 ?? e.y + e.h;
  assert.ok(e.x >= 0 && e.y >= 0 && x2 >= 0 && y2 >= 0 && x2 <= 1280 && y2 <= 720, `Bounds: slide ${slide.id}`);
  if (e.kind === 'table') assert.ok(e.values.every(row => row.length === e.widths.length));
}

process.env.RUNTIME_NODE_MODULES = path.join(runtime, 'node/node_modules');
const { Presentation, PresentationFile } = await import(pathToFileURL(path.join(process.env.RUNTIME_NODE_MODULES, '@oai/artifact-tool/dist/artifact_tool.mjs')));
const { resolvePresentationFont, finalizePresentation } = await import(pathToFileURL(path.join(skill, 'container_tools/artifact_tool_utils.mjs')));
const font = resolvePresentationFont({fontFamily:'M PLUS 1p'});
const build = path.join(root, 'temp/ai-entertainment-07-rebuilt');
await fs.mkdir(build, {recursive:true});
const p = Presentation.create({slideSize:spec.canvas});
const qr = await fs.readFile(path.join(root,'note/images/20260915_ai-entertainment-night-06/membership-qr.png'));
const C = spec.palette;

function shape(slide, geometry, x, y, w, h, fill='none', stroke='none', rotation=0) {
  return slide.shapes.add({geometry, position:{left:x,top:y,width:w,height:h,rotation},fill,
    line:{fill:stroke,width:stroke==='none'?0:2}});
}
function text(slide, e) {
  if (!e.text) return;
  const box = shape(slide,'textbox',e.x,e.y,e.w,e.h);
  box.text = e.text;
  box.text.style = {typeface:font,fontSize:e.size,color:e.color===C.pink?C.ink:e.color,bold:e.bold,
    autoFit:'none',wrap:'square',verticalAlignment:'top',
    insets:e.insets??{left:0,right:0,top:0,bottom:0}};
  if (e.text.includes('note.com/')) box.text.get(e.text).link = {uri:'https://note.com/gumigumih/membership',isExternal:true};
}
function line(slide, e) {
  const dx=e.x2-e.x, dy=e.y2-e.y, length=Math.hypot(dx,dy);
  const rotation=Math.atan2(dy,dx)*180/Math.PI;
  // Native lines use their midpoint for rotation, including leftward return paths.
  const l=shape(slide,'line',(e.x+e.x2)/2-length/2,(e.y+e.y2)/2,length,0,'none',e.color,rotation);
  l.line={fill:e.color,width:2.5,style:e.dashed?'dashed':'solid'};
  if(e.kind==='arrow') shape(slide,'triangle',e.x2-6,e.y2-6,12,12,e.color,'none',rotation+90);
}

for (const s of spec.slides) {
  const slide=p.slides.add();
  slide.background.fill=s.dark?C.night:C.paper;
  for (const e of s.elements) {
    if(e.kind==='text') {
      const adjusted={...e};
      if(s.id===8 && ['既存LLM','Jev','Gemini TTS'].includes(e.text)) adjusted.y+=10;
      text(slide,adjusted);
    }
    else if(e.kind==='rect') {
      const box=shape(slide,'rect',e.x,e.y,e.w,e.h,e.fill,e.stroke);
      if(e.borderRadius) box.borderRadius=e.borderRadius;
      if(e.lineWidth) box.line={fill:e.stroke,width:e.lineWidth};
    }
    else if(e.kind==='image') slide.images.add({blob:await fs.readFile(path.join(root,e.path)),contentType:'image/png',alt:e.alt,fit:e.fit,position:{left:e.x,top:e.y,width:e.w,height:e.h}});
    else if(e.kind==='line'||e.kind==='arrow') line(slide,e);
    else if(e.kind==='qr') slide.images.add({blob:qr,contentType:'image/png',alt:'ぐみのnoteメンバーシップ',fit:'contain',position:{left:e.x,top:e.y,width:e.w,height:e.h}});
    else if(e.kind==='table') {
      const t=slide.tables.add({rows:e.values.length,columns:e.widths.length,left:e.x,top:e.y,width:e.w,height:e.h,columnWidths:e.widths,values:e.values});
      t.borders.assign({fill:C.rule,width:1,style:'solid'});
      t.cells.block({row:0,column:0,rowCount:e.values.length,columnCount:e.widths.length}).assign({margins:{left:14,right:14,top:12,bottom:12},anchor:'center'});
      for(let r=0;r<e.values.length;r++) for(let c=0;c<e.widths.length;c++) {
        const cell=t.getCell(r,c);
        cell.fill=r===0?C.night:(c===0?'#EEEFF7':C.white);
        cell.text.style={typeface:font,fontSize:r===0?22:21,color:r===0?C.white:C.ink,bold:r===0||c===0,autoFit:'none'};
      }
    }
  }
  if(s.layout!=='cover' && s.layout!=='membership-closing') text(slide,{text:`${s.id} / ${spec.slides.length}`,x:1160,y:676,w:70,h:26,size:16,color:s.dark?C.white:C.muted});
  slide.speakerNotes.textFrame.setText([s.title.replaceAll('\n',''),...s.sources].join('\n'));
}
const candidate=path.join(build,'candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
for(const [i,slide] of p.slides.items.entries()) {
  const png=await p.export({slide,format:'png',scale:1.5});
  await fs.writeFile(path.join(build,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
if(args.finalize) {
  assert.ok(args.output, '--output is required with --finalize');
  const finalPath=path.resolve(root,args.output);
  await fs.mkdir(path.dirname(finalPath),{recursive:true});
  await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath,
    explicitTotalSlideCount:11,requiredNativeTableOwnerSlides:[3],requiredNativeChartOwnerSlides:[],
    pythonExecutable:path.join(runtime,'python/bin/python3'),
    integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
    layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
    layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','3'],
    fontPolicy:{basis:'user_request',families:[font]},verifyArtifactToolImport:true,
    receiptPath:path.join(build,`${path.basename(finalPath)}.validation.json`)});
  console.log(finalPath);
}
console.log(JSON.stringify({candidate,previews:build,slideCount:p.slides.items.length}));
