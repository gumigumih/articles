import {articlesDb,githubReadToken} from '@/lib/articles-db';
import {describe,platformOf,slugOf} from '@/lib/repository-rules';
const REPO='gumigumih/articles';
import {githubClient,GitHubFetchError} from '@/lib/github-client';
type Platform='note'|'zenn'|'qiita';
type SnapshotFile={path:string;body:()=>Promise<string>};
const platforms:Platform[]=['note','zenn','qiita'];
const prefix:Record<Platform,string>={note:'note/',zenn:'zenn/articles/',qiita:'qiita/public/'};
function submodules(text:string){
 const result=new Map<string,string>();let path='',url='';
 const save=()=>{if(path&&url)result.set(path.replace(/\/$/,''),url)};
 for(const line of text.replace(/\r/g,'').split('\n')){const entry=/^\s*(path|url)\s*=\s*(.+)\s*$/.exec(line);if(!entry)continue;if(entry[1]==='path'){save();path=entry[2];url=''}else url=entry[2];}save();return result;
}
function githubRepo(url:string){
 const cleaned=url.replace(/\.git$/,'').replace(/^git@github\.com:/,'https://github.com/');
 const match=/github\.com[/:]([^/]+)\/([^/]+)$/i.exec(cleaned);return match?`${match[1]}/${match[2]}`:null;
}
export async function POST(req:Request){
 if(!req.headers.get('oai-authenticated-user-id'))return Response.json({error:'ログインが必要です。'},{status:401});
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'許可されていないリクエストです。'},{status:403});
 try{
  const token=githubReadToken();
  const get=githubClient(token);
  const info:any=await(await get(`https://api.github.com/repos/${REPO}`)).json();
  const commit:any=await(await get(`https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(info.default_branch)}`)).json();
  const tree:any=await(await get(`https://api.github.com/repos/${REPO}/git/trees/${commit.sha}?recursive=1`)).json();
  if(tree.truncated||!Array.isArray(tree.tree))throw Error('ファイル一覧が不完全なため、更新を中止しました。');
  const rootFiles=new Set<string>(tree.tree.filter((x:any)=>x.type==='blob').map((x:any)=>x.path));
  const rawFrom=async(repo:string,sha:string,path:string)=>{
   const encoded=path.split('/').map(encodeURIComponent).join('/');
   if(!token)return(await get(`https://raw.githubusercontent.com/${repo}/${sha}/${encoded}`)).text();
   const data:any=await(await get(`https://api.github.com/repos/${repo}/contents/${encoded}?ref=${sha}`)).json();
   if(data.encoding!=='base64'||typeof data.content!=='string')throw Error('記事本文を取得できませんでした。保存内容は変更していません。');
   return new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
  };
  const raw=(path:string)=>rawFrom(REPO,commit.sha,path);
  const mediaErrors:Partial<Record<Platform,string>>={};
  const snapshots:SnapshotFile[]=[];
  const addRootFiles=(wanted:Platform)=>{for(const path of rootFiles)if(path.startsWith(prefix[wanted]))snapshots.push({path,body:()=>raw(path)});};
  for(const medium of platforms){
   try{
    const gitlink=tree.tree.find((x:any)=>x.path===medium&&x.type==='commit');
    if(!gitlink){addRootFiles(medium);if(![...rootFiles].some(path=>path.startsWith(prefix[medium])))mediaErrors[medium]='対象ファイルがありません。';continue;}
    if(!rootFiles.has('.gitmodules'))throw new Error('サブモジュール設定が見つかりません（未初期化の可能性があります）。');
    const repoUrl=submodules(await raw('.gitmodules')).get(medium);const repo=repoUrl&&githubRepo(repoUrl);
    if(!repo)throw new Error('サブモジュールのGitHub URLを読み取れません（未初期化の可能性があります）。');
    const subTree:any=await(await get(`https://api.github.com/repos/${repo}/git/trees/${gitlink.sha}?recursive=1`)).json();
    if(subTree.truncated||!Array.isArray(subTree.tree))throw new Error('サブモジュールのファイル一覧が不完全です。');
    const entries=subTree.tree.filter((x:any)=>x.type==='blob').map((x:any)=>x.path as string);
    const wanted=medium==='note'?'':medium==='zenn'?'articles/':'public/';
    const matches=entries.filter((path:string)=>path.startsWith(wanted));
    if(!matches.some((path:string)=>/\.md$/i.test(path))){mediaErrors[medium]='対象ファイルがありません。';continue;}
    for(const path of matches)snapshots.push({path:`${medium}/${path}`,body:()=>rawFrom(repo,gitlink.sha,path)});
   }catch(error){
    const detail=error instanceof GitHubFetchError?error.message:error instanceof Error?error.message:'サブモジュールを読み取れません。';
    mediaErrors[medium]=detail;
   }
  }
  const files=new Set(snapshots.map(file=>file.path));
  const snapshotBody=async(path:string)=>{const found=snapshots.find(file=>file.path===path);return found?found.body():null;};
  const records=files.has('note/posting-records.json')?JSON.parse((await snapshotBody('note/posting-records.json'))||'{}').records||{}:{};
  const candidates=snapshots.filter(file=>platformOf(file.path));const incoming:any[]=[];
  // Read the complete immutable snapshot before changing stored data. No silent 100-file cutoff.
  for(let i=0;i<candidates.length;i+=5){const rows=await Promise.all(candidates.slice(i,i+5).map(async file=>describe(file.path,await file.body(),files,records)));incoming.push(...rows.filter(Boolean));}
  const db=articlesDb(),existing:any[]=(await db.prepare('SELECT * FROM articles').all()).results as any[];
  const now=new Date().toISOString(),statements:D1PreparedStatement[]=[];let created=0,updated=0,excluded=0;
  const matched=new Set<number>();
  for(const a of incoming){
   const legacy=existing.filter(x=>!x.source_path&&x.slug===a.slug);
   const sameSlug=incoming.filter(x=>x.slug===a.slug);
   const canonical=existing.find(x=>x.source_path===a.source_path);
   const historicalPath=a.platform==='zenn'?a.source_path.replace(/^zenn\//,''):a.platform==='qiita'?a.source_path.replace(/^qiita\//,''):'';
   const historical=historicalPath?existing.find(x=>x.platform===a.platform&&x.source_path===historicalPath):undefined;
   const duplicateHistorical=canonical&&historical&&canonical.id!==historical.id?historical:undefined;
   if(duplicateHistorical){
    matched.add(duplicateHistorical.id);
    statements.push(db.prepare("UPDATE articles SET url='', source_kind='support', sync_status='stale', source_evidence='媒体名を含まない旧パスの重複レコード。新パスへ統合済み。', updated_at=? WHERE id=?").bind(now,duplicateHistorical.id));
    excluded++;
   }
   const old=canonical||historical||legacy.find(x=>x.url&&x.url===a.url)||(sameSlug.length===1&&legacy.length===1?legacy[0]:undefined);
   const data:Record<string,any>={platform:a.platform,source_path:a.source_path,source_kind:'article',source_evidence:a.source_evidence,title:a.title,slug:a.slug,body_preview:a.body_preview,markdown_state:'ready',cover_status:a.cover_status,cover_file_state:a.cover_file_state,x_copy_state:a.x_copy_state,cover_prompt_state:a.cover_prompt_state,synced_at:now,sync_status:'current',updated_at:now};
   if(old){
    matched.add(old.id);
    // Zenn URLs are derived from source_path + published on every sync. This also
    // removes a previously-derived URL when an article is changed back to a draft.
    // note keeps its existing publication-record/note_id based update behavior.
    if(a.platform==='zenn'&&old.source_path)data.url=a.url&&!existing.some(x=>x.id!==old.id&&x.id!==duplicateHistorical?.id&&x.url===a.url)?a.url:'';
    else if(!old.url&&a.url&&!existing.some(x=>x.id!==old.id&&x.url===a.url))data.url=a.url;
    if(!old.note_id)data.note_id=a.note_id;
    if(old.publication_status==='要確認'||(old.source_path&&a.platform!=='note'))data.publication_status=a.publication_status;
    updated++;
   }
   else{Object.assign(data,{url:existing.some(x=>a.url&&x.url===a.url)?'':a.url,note_id:a.note_id,publication_status:a.publication_status,category:a.record?.magazine||'未分類',magazine:a.record?.magazine||'未分類',memo:a.record?.memo||'',status:'未確認',git_status:'unknown',price:a.record?.priceYen||0,published_at:a.record?.publishedAt||null,x_posted:a.record?.xPosted?1:0});created++;}
   const keys=Object.keys(data);statements.push(old?db.prepare(`UPDATE articles SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`).bind(...keys.map(k=>data[k]),old.id):db.prepare(`INSERT INTO articles (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).bind(...keys.map(k=>data[k])));
  }
  for(const old of existing){if(matched.has(old.id))continue;
   const paths=[...files].filter(p=>/\.md$/i.test(p)&&slugOf(p)===old.slug);
   if(!old.source_path&&old.synced_at&&incoming.filter(a=>a.slug===old.slug).length>1){statements.push(db.prepare("UPDATE articles SET source_kind='support', source_evidence='同じスラッグが複数媒体にあるため旧データの照合を保留。メモを保持しています。' WHERE id=?").bind(old.id));excluded++;continue;}
   if((old.source_path&&files.has(old.source_path)&&!incoming.some(a=>a.source_path===old.source_path))||(!old.source_path&&old.synced_at&&paths.length>0&&paths.every(p=>!incoming.some(a=>a.source_path===p)))){
    statements.push(db.prepare("UPDATE articles SET source_kind='support', source_evidence='記事以外のMarkdownのため集計から除外', updated_at=? WHERE id=?").bind(now,old.id));excluded++;
   }else if(old.source_path){
    const oldPlatform=platformOf(old.source_path);
    if(oldPlatform&&mediaErrors[oldPlatform]){statements.push(db.prepare("UPDATE articles SET sync_status='stale', source_evidence=? WHERE id=?").bind(`今回の${oldPlatform==='zenn'?'Zenn':oldPlatform==='qiita'?'Qiita':'note'}スナップショットは取得できませんでした：${mediaErrors[oldPlatform]}`,old.id));}
    else statements.push(db.prepare("UPDATE articles SET markdown_state='missing', sync_status='stale', source_evidence='リポジトリに本文がありません。公開先の削除とは別です。' WHERE id=?").bind(old.id));
   }
  }
  if(statements.length)await db.batch(statements);
  return Response.json({created,updated,excluded,total:incoming.length,platforms:Object.fromEntries(platforms.map(p=>[p,incoming.filter(a=>a.platform===p).length])),media_errors:mediaErrors,synced_at:now,repository:REPO});
 }catch(e){if(e instanceof GitHubFetchError)return Response.json({error:e.message,code:e.code,retry_at:e.retryAt},{status:e.code==='rate_limited'?429:503});console.error(e);return Response.json({error:e instanceof Error?e.message:'同期できませんでした。'},{status:503})}
}
