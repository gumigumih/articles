// Repository rules for article metadata and publication evidence.
export type Platform='note'|'zenn'|'qiita';
export function platformOf(path:string):Platform|null {
 const normalized=path.replace(/^\/+/, '');
 if(normalized.startsWith('note/images/'))return null;
 const platform=normalized.startsWith('note/')?'note':normalized.startsWith('zenn/articles/')?'zenn':normalized.startsWith('qiita/public/')?'qiita':null;
 if(!platform||!/\.md$/i.test(normalized))return null;
 const name=normalized.split('/').pop()!.replace(/\.md$/i,'');
 if(/^(readme|agents|claude|index)$/i.test(name)||/\.(x-post|cover-prompt|prompt)$/i.test(name))return null;
 return platform;
}
export const slugOf=(path:string)=>path.split('/').pop()!.replace(/\.md$/i,'');
export function metadata(text:string){
 const normalized=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 const front=normalized.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1]||'';
 const fields:Record<string,string>={};
 for(const line of front.split('\n')){const m=/^([\w_]+):\s*(.*?)\s*$/.exec(line);if(!m)continue;let v=m[2];if(v.startsWith('"')){try{v=JSON.parse(v.match(/^"(?:\\.|[^"\\])*"/)?.[0]||v)}catch{v=v.replace(/^"|"$/g,'')}}else if(v.startsWith("'"))v=v.replace(/^'|'$/g,'').replace(/''/g,"'");else v=v.replace(/\s+#.*$/,'').trim();fields[m[1]]=v;}
 return {fields,title:fields.title||normalized.match(/^#\s+(.+)$/m)?.[1]||'',preview:normalized.replace(/^---\s*\n[\s\S]*?\n---\s*/,'').replace(/\s+/g,' ').slice(0,240)};
}
export function describe(path:string,body:string,files:Set<string>,records:any={}){
 const platform=platformOf(path);if(!platform)return null;
 const slug=slugOf(path),{fields:f,title,preview}=metadata(body);
 if(!title)return null;
 // Structured metadata distinguishes technical articles from support documents.
 if(platform==='zenn'&&!('published' in f))return null;
 if(platform==='qiita'&&!('private' in f)&&!('id' in f))return null;
 const record=records[slug];let publication='要確認',url='',id='',evidence='公開情報が未確認';
 if(platform==='note'){
  id=f.note_id||f.noteId||record?.noteId||'';url=f.note_url||f.noteUrl||record?.noteUrl||(id?`https://note.com/gumigumih/n/${id}`:'');
  if(record?.status==='deleted')publication='削除済み';else if(record?.status==='published')publication='公開済み';else if(['draft','not_published'].includes(record?.status))publication='未公開';
  evidence=f.note_id||f.note_url?'Markdownメタ情報のnote_id/note_url':record?'note/posting-records.json の投稿記録':'投稿記録・公開確認なし（未公開とは断定しません）';
 }else if(platform==='zenn'){
  publication=f.published==='true'?'公開済み':f.published==='false'?'未公開':'要確認';
  if(f.published_at&&Date.parse(f.published_at)>Date.now())publication='未公開';
  if(publication==='公開済み')url=`https://zenn.dev/gumigumih/articles/${slug}`;
  evidence=`Git設定: published=${f.published}${f.published_at?`, 公開予定=${f.published_at}`:''}（配信結果は未確認）`;
 }else{
  id=f.id&&f.id!=='null'?f.id:'';url=id?`https://qiita.com/gumigumih/items/${id}`:'';
  publication=id?(f.private==='false'?'公開済み':'要確認'):'未公開';
  evidence=`Git設定: ${id?'投稿IDあり':'投稿IDなし'} / private=${f.private??'未設定'} / ignorePublish=${f.ignorePublish??'未設定'}${f.private==='true'?'（限定共有）':''}（配信結果は未確認）`;
 }
 const isNote=platform==='note';const asset=`note/images/${slug}/`;
 return {platform,source_path:path,slug,title,body_preview:preview,publication_status:publication,url,note_id:platform==='note'?id:'',source_evidence:evidence,cover_status:isNote?(files.has(asset+'cover.png')?'ready':'missing'):'not_applicable',cover_file_state:isNote?(files.has(asset+'cover.png')?'ready':'missing'):'not_applicable',x_copy_state:isNote?(files.has(`note/${slug}.x-post.md`)?'ready':'missing'):'not_applicable',cover_prompt_state:isNote?([...files].some(p=>p.startsWith(asset)&&/prompt.*\.md$/i.test(p))?'ready':'missing'):'not_applicable',record};
}
