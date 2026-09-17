import {articlesDb} from '@/lib/articles-db';

const columns=['platform','title','url','category','memo','status','updated_at','slug','note_id','publication_status','magazine','price','published_at','git_status','cover_status','pv','likes','metrics_fetched_at','x_posted','update_candidate','body_preview','markdown_state','x_copy_state','cover_prompt_state','cover_file_state','synced_at','sync_status'];
const defaults={platform:'note',category:'',memo:'',status:'未確認',slug:'',note_id:'',publication_status:'要確認',magazine:'未分類',price:0,published_at:null,git_status:'clean',cover_status:'missing',pv:0,likes:0,metrics_fetched_at:null,x_posted:0,update_candidate:0,body_preview:'',markdown_state:'missing',x_copy_state:'missing',cover_prompt_state:'missing',cover_file_state:'missing',synced_at:null,sync_status:'stale'} as Record<string,unknown>;

function unauthorized(req:Request){return !req.headers.get('oai-authenticated-user-id')}
function clean(input:any){const now=new Date().toISOString();const out={...defaults,...input,updated_at:now};out.title=String(out.title||'').trim();out.url=String(out.url||'').trim();out.slug=String(out.slug||'').trim();out.note_id=String(out.note_id||'').trim();out.magazine=String(out.magazine||'未分類').trim();out.memo=String(out.memo||'').trim();out.body_preview=String(out.body_preview||'').trim();out.category=out.magazine;out.status=out.publication_status;out.price=Math.max(0,Number(out.price)||0);out.pv=Math.max(0,Number(out.pv)||0);out.likes=Math.max(0,Number(out.likes)||0);out.x_posted=out.x_posted?1:0;out.update_candidate=out.update_candidate?1:0;return out}
function validate(p:any){if(!p.title||p.title.length>300)return 'タイトルを入力してください。';if(!['公開済み','未公開','削除済み','要確認'].includes(p.publication_status))return '公開状態を選択してください。';if(!['note','zenn','qiita'].includes(p.platform))return '媒体を選択してください。';if(p.url){try{const u=new URL(p.url);if(u.protocol!=='https:'||u.hostname!==({note:'note.com',zenn:'zenn.dev',qiita:'qiita.com'} as Record<string,string>)[p.platform])return '選択した媒体のURLを入力してください。'}catch{return '有効なURLを入力してください。'}}return ''}

export async function GET(req:Request){if(unauthorized(req))return Response.json({error:'ログインが必要です。'},{status:401});try{const {results}=await articlesDb().prepare('SELECT * FROM articles ORDER BY updated_at DESC, id DESC').all();return Response.json({articles:results.filter((a:any)=>a.source_kind!=='support'),excluded:results.filter((a:any)=>a.source_kind==='support'),sample:false},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return Response.json({error:'記事を読み込めませんでした。もう一度お試しください。'},{status:503})}}
export async function POST(req:Request){return save(req,false)}
export async function PATCH(req:Request){return save(req,true)}
async function save(req:Request,edit:boolean){
 if(unauthorized(req))return Response.json({error:'ログインが必要です。'},{status:401});
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'許可されていないリクエストです。'},{status:403});
 let raw:any;try{raw=await req.json()}catch{return Response.json({error:'入力内容を確認してください。'},{status:400})}
 const p=clean(raw);
 try{
  if(edit&&Number(raw.id)>0){
   const existing:any=await articlesDb().prepare('SELECT source_path,platform,title,url,slug,note_id,published_at,body_preview,markdown_state,x_copy_state,cover_prompt_state,cover_file_state FROM articles WHERE id=?').bind(raw.id).first();
   if(existing?.source_path){for(const key of ['platform','title','url','slug','note_id','published_at','body_preview','markdown_state','x_copy_state','cover_prompt_state','cover_file_state'])p[key]=existing[key]}
  }
  const problem=validate(p);if(problem)return Response.json({error:problem},{status:400});
  let row;const values=columns.map(c=>p[c]);
  if(edit&&Number(raw.id)>0){row=await articlesDb().prepare(`UPDATE articles SET ${columns.map(c=>`${c}=?`).join(',')} WHERE id=? RETURNING *`).bind(...values,raw.id).first()}
  else{row=await articlesDb().prepare(`INSERT INTO articles (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')}) RETURNING *`).bind(...values).first()}
  if(!row)return Response.json({error:'記事が見つかりません。'},{status:404});return Response.json({article:row},{status:edit?200:201});
 }catch(e){console.error(e);if(String(e).includes('UNIQUE'))return Response.json({error:'このURLの記事は登録済みです。'},{status:409});return Response.json({error:'保存できませんでした。入力は画面に残っています。'},{status:503})}}
