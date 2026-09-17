import {articlesDb} from '@/lib/articles-db';
function unauthorized(req:Request){return !req.headers.get('oai-authenticated-user-id')}
const cleanCell=(value:string)=>{
 const v=String(value??'').trim().replace(/^\uFEFF/,'').replace(/^"|"$/g,'').trim();
 const markdown=v.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
 return markdown?markdown[2]:v;
};
const norm=(v:string)=>cleanCell(v).replace(/\/+$/,'').toLowerCase();
const normTitle=(v:string)=>cleanCell(v).normalize('NFKC').replace(/\s+/g,'').replace(/[|｜]/g,'').toLowerCase();
function splitRow(line:string,sep:string){
 if(sep==='\t')return line.split('\t');
 const cells:string[]=[];let cell='',quoted=false;
 for(let i=0;i<line.length;i++){
  const ch=line[i];
  if(ch==='"'&&line[i+1]==='"'){cell+='"';i++;continue}
  if(ch==='"'){quoted=!quoted;continue}
  if(ch===sep&&!quoted){cells.push(cell);cell='';continue}
  cell+=ch;
 }
 cells.push(cell);return cells;
}
const numeric=(v:string)=>Number(cleanCell(v).replace(/[,，\s]/g,''));
const looksLikeUrl=(v:string)=>/^\[?https?:\/\//i.test(String(v||'').trim());
function parse(text:string){
 const lines=text.trim().split(/\r?\n/).filter(Boolean);if(lines.length<2)throw new Error('見出し行を含む表を貼り付けてください。');
 const sep=lines.slice(0,2).some(line=>line.includes('\t'))?'\t':',';const head=splitRow(lines[0],sep).map(norm);
 const at=(names:string[])=>head.findIndex(h=>names.some(n=>h.includes(n)));
 const rows=lines.slice(1).map(line=>splitRow(line,sep));
 const ix={title:at(['タイトル','記事']),url:at(['url','href','リンク']),id:at(['note id','note_id']),pv:at(['ページビュー','page view','pageview','pv','ビュー','アクセス']),likes:at(['スキ','like'])};
 // noteの画面コピーは、見出しがCSSクラス名に置き換わることがあります。
 // URL列があるコピーは「URL・タイトル・日付・PV・スキ」の位置、
 // URL列がない分析表は「タイトル・インプレッション・PV・スキ・コメント・売上」の位置で補います。
 const first=rows.find(row=>row.some(cell=>cleanCell(cell))||row.length>0)||[];
 const hasUrlCell=first.some(looksLikeUrl);
 if(ix.pv<0&&ix.likes<0){
  if((ix.url>=0||hasUrlCell)&&head.length>=5){
   ix.url=ix.url>=0?ix.url:0;ix.title=ix.title>=0?ix.title:1;ix.pv=3;ix.likes=4;
  }else if(head.length>=4){
   ix.title=ix.title>=0?ix.title:0;ix.pv=2;ix.likes=3;
  }
 }
 if(ix.pv<0&&ix.likes<0)throw new Error('PVまたはスキの列が見つかりません。');
 return rows.map(c=>({title:ix.title>=0?cleanCell(c[ix.title]||''):'',url:ix.url>=0?cleanCell(c[ix.url]||''):'',note_id:ix.id>=0?cleanCell(c[ix.id]||''):'',pv:ix.pv>=0?numeric(c[ix.pv]||''):null,likes:ix.likes>=0?numeric(c[ix.likes]||''):null})).filter(r=>r.title||r.url||r.note_id);
}
export async function POST(req:Request){
 if(unauthorized(req))return Response.json({error:'ログインが必要です。'},{status:401});
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'許可されていないリクエストです。'},{status:403});
 try{
  const {text,fetched_at}=await req.json() as any;const rows=parse(String(text||''));const db=articlesDb();const articles:any[]=(await db.prepare("SELECT * FROM articles WHERE platform='note' AND source_kind='article'").all()).results as any[];
  const at=fetched_at?new Date(fetched_at).toISOString():new Date().toISOString();const matched:any[]=[],unmatched:any[]=[];
  for(const r of rows){const a=articles.find(x=>(r.url&&norm(x.url)===norm(r.url))||(r.note_id&&norm(x.note_id)===norm(r.note_id))||(r.title&&normTitle(x.title)===normTitle(r.title)));
   if(!a){unmatched.push(r.title||r.url||r.note_id);continue}
   const pv=Number.isFinite(r.pv)?Math.max(0,r.pv as number):a.pv;const likes=Number.isFinite(r.likes)?Math.max(0,r.likes as number):a.likes;
   await db.prepare('UPDATE articles SET pv=?, likes=?, metrics_fetched_at=?, updated_at=? WHERE id=?').bind(pv,likes,at,new Date().toISOString(),a.id).run();
   matched.push({title:a.title,pv,likes,pv_delta:pv-a.pv,likes_delta:likes-a.likes});
  }
  return Response.json({matched,unmatched,fetched_at:at});
 }catch(e){console.error(e);return Response.json({error:e instanceof Error?e.message:'分析データを取り込めませんでした。'},{status:400})}
}
