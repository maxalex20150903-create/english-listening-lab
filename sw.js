'use strict';
const CACHE='listen-lab-install-v2-1';
const ROOT=new URL('./',self.location.href);
const CORE=['./','./index.html','./manifest.webmanifest','./pwa-install.js','./icons/listen-192.png','./icons/listen-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(path=>new URL(path,ROOT).href))));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('listen-lab-install-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
function byteRange(value,length){
 const match=/^bytes=(\d*)-(\d*)$/.exec(value||'');if(!match||(!match[1]&&!match[2]))return null;
 let start,end;
 if(!match[1]){const count=Number(match[2]);if(count<=0)return null;start=Math.max(0,length-count);end=length-1;}
 else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),length-1):length-1;}
 return start>=length||end<start?null:{start,end};
}
async function audioResponse(request){
 const cache=await caches.open(CACHE),headers=new Headers(request.headers);headers.delete('range');
 const whole=new Request(request.url,{method:'GET',headers,credentials:request.credentials,mode:'same-origin'});
 let response=await cache.match(request.url);
 if(!response){response=await fetch(whole);if(response.ok&&response.status===200){try{await cache.put(request.url,response.clone())}catch{}}else return fetch(request);}
 const value=request.headers.get('range');if(!value)return response;
 const buffer=await response.arrayBuffer(),range=byteRange(value,buffer.byteLength);
 if(!range)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+buffer.byteLength}});
 return new Response(buffer.slice(range.start,range.end+1),{status:206,headers:{'Content-Type':response.headers.get('content-type')||'audio/mpeg','Content-Range':'bytes '+range.start+'-'+range.end+'/'+buffer.byteLength,'Content-Length':String(range.end-range.start+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(url.pathname.startsWith(new URL('audio-v2/',ROOT).pathname)){event.respondWith(audioResponse(request));return;}
 const paths=CORE.map(path=>new URL(path,ROOT).pathname);
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(async response=>{if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(new URL('./index.html',ROOT).href,response.clone())}catch{}}return response}).catch(async()=>{const cached=await caches.match(new URL('./index.html',ROOT).href);return cached||new Response('目前離線，請連上網路後再開啟一次。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})}));return;}
 if(!paths.includes(url.pathname))return;
 event.respondWith(fetch(request).then(async response=>{if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(request,response.clone())}catch{}}return response}).catch(()=>caches.match(request).then(response=>response||Response.error())));
});

