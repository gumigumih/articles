// Exercise the production Cloudflare runtime, with outbound requests mocked.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const {Miniflare}=require(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const code=ts.transpile(readFileSync('lib/github-client.ts','utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {MockAgent}=require(require.resolve('undici',{paths:[require.resolve('miniflare',{paths:[require.resolve('wrangler')]})]}));
const mock=new MockAgent();mock.disableNetConnect();
mock.get('https://api.github.com').intercept({path:'/repos/gumigumih/articles'}).reply(200,{default_branch:'main'});
const mf=new Miniflare({fetchMock:mock,modules:true,script:code.replace(/export /g,'')+`\nexport default {async fetch(){try{const res=await githubClient()('https://api.github.com/repos/gumigumih/articles');return Response.json({status:res.status,body:await res.json()})}catch(e){return Response.json({code:e.code,message:e.message})}}}`});
try {const result=await(await mf.dispatchFetch('http://localhost/')).json();assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.default_branch,'main');console.log('PASS: GitHub request succeeds in Cloudflare workerd using supported redirect mode.');}finally{await mf.dispose();await mock.close();}
process.exit(0);
