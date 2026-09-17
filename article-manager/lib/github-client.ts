const REPO='gumigumih/articles';
export class GitHubFetchError extends Error {
 constructor(message:string,public code:string,public upstreamStatus:number,public retryAt:string|null=null){super(message);this.name='GitHubFetchError';}
}
export function githubClient(token?:string){
 return async function get(url:string){
  const target=new URL(url);
  if(!['api.github.com','raw.githubusercontent.com'].includes(target.hostname)||target.protocol!=='https:')throw Error('取得先が不正です。');
  const headers:Record<string,string>={'Accept':'application/vnd.github+json','User-Agent':'note-article-manager','X-GitHub-Api-Version':'2022-11-28'};
  if(token&&target.hostname==='api.github.com')headers.Authorization=`Bearer ${token}`;
  let r:Response;
  try{r=await fetch(url,{headers,signal:AbortSignal.timeout(20000),redirect:'manual'});}catch(e){const timeout=e instanceof Error&&['TimeoutError','AbortError'].includes(e.name);console.error('github_transport_failed',JSON.stringify({host:target.hostname,kind:timeout?'timeout':'transport',name:e instanceof Error?e.name:'unknown'}));throw new GitHubFetchError(timeout?'GitHubへの接続が20秒以内に完了しませんでした。保存内容は変更していません。':'管理サイトからGitHubへの通信処理に失敗しました。保存内容は変更していません。',timeout?'timeout':'network_error',0);}
  if(r.status>=300&&r.status<400)throw new GitHubFetchError('GitHubから転送が返されました。リポジトリの移動先確認が必要です。保存内容は変更していません。','redirect_required',r.status);
  if(r.ok)return r;
  let message='';try{const data=await r.json() as {message?:string};message=typeof data.message==='string'?data.message:'';}catch{/* A gateway may return non-JSON. */}
  const remaining=r.headers.get('x-ratelimit-remaining');
  const isRate=(r.status===403||r.status===429)&&(remaining==='0'||/rate limit/i.test(message)||r.status===429);
  const seconds=Number(r.headers.get('retry-after'));
  const reset=Number(r.headers.get('x-ratelimit-reset'));
  const retryMs=seconds>0?Date.now()+seconds*1000:reset>0?reset*1000:0;
  const retryAt=isRate&&retryMs>Date.now()&&Number.isFinite(retryMs)?new Date(retryMs).toISOString():null;
  const stage=target.hostname==='raw.githubusercontent.com'?'記事本文':'リポジトリ情報';
  const code=isRate?'rate_limited':r.status===401?'authentication_failed':r.status===404?'repository_unavailable':r.status===403?'access_denied':'upstream_error';
  // Log only diagnostic fields; never log request headers, tokens or arbitrary upstream bodies.
  console.error('github_fetch_failed',JSON.stringify({stage,status:r.status,code,authenticated:!!token,remaining,retryAt,requestId:r.headers.get('x-github-request-id')}));
  let explanation=isRate?'GitHubの利用回数制限に達しました。':r.status===401?'GitHub認証が無効または期限切れです。':r.status===404?'リポジトリまたは記事を読み取れません。公開範囲と読み取り権限を確認してください。':r.status===403?'GitHubへのアクセスが拒否されました。利用回数制限と断定できる情報はありません。':`GitHubでエラーが発生しました（${r.status}）。`;
  if(retryAt)explanation+=`${new Date(retryAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}（日本時間）以降に再試行してください。`;
  else if(isRate)explanation+='時間をおいて再試行してください。';
  if((isRate||r.status===401||r.status===403)&&!token)explanation+='管理サイト用のGitHub読み取り認証は未設定です。ChatGPTのGitHub接続はこのサイトには引き継がれません。';
  throw new GitHubFetchError(`${stage}：${explanation}保存内容は変更していません。`,code,r.status,retryAt);
 };
}
export const repositoryApi=`https://api.github.com/repos/${REPO}`;
