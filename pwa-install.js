(() => {
'use strict';
const card=document.getElementById('installAppCard'),button=document.getElementById('installAppButton'),hint=document.getElementById('installAppHint'),dialog=document.getElementById('installHelpDialog'),help=document.getElementById('installHelpText');
const flagKey='listen-lab-pwa-installed-v1';
let installPrompt=null,installing=false;
const modes=['standalone','minimal-ui','fullscreen'].map(mode=>window.matchMedia('(display-mode: '+mode+')'));
const standalone=()=>navigator.standalone===true||modes.some(mode=>mode.matches);
const readFlag=()=>{try{return localStorage.getItem(flagKey)==='1'}catch{return false}};
const writeFlag=value=>{try{value?localStorage.setItem(flagKey,'1'):localStorage.removeItem(flagKey)}catch{}};
function refresh(){const hide=standalone()||readFlag();card.hidden=hide;card.classList.toggle('hidden',hide);button.disabled=installing;button.textContent=installing?'正在開啟安裝視窗…':'安裝應用程式';}
function installed(){installPrompt=null;installing=false;writeFlag(true);refresh();if(dialog.open)dialog.close();}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installing=false;if(!standalone())writeFlag(false);hint.textContent='按下按鈕，依照瀏覽器提示安裝。完成後，此區塊會自動隱藏。';refresh();});
window.addEventListener('appinstalled',installed);
for(const mode of modes){const listener=()=>{if(standalone())installed();else refresh()};if(mode.addEventListener)mode.addEventListener('change',listener);else if(mode.addListener)mode.addListener(listener);}
window.addEventListener('pageshow',refresh);
window.addEventListener('storage',event=>{if(event.key===flagKey)refresh()});
document.getElementById('installHelpClose').onclick=()=>dialog.close();
button.onclick=async()=>{
 if(standalone()){installed();return;}
 if(installPrompt){const prompt=installPrompt;installPrompt=null;installing=true;refresh();try{
  await prompt.prompt();const choice=await prompt.userChoice;
  hint.textContent=choice.outcome==='accepted'?'已送出安裝要求，請完成瀏覽器的安裝步驟。':'你已取消安裝，之後可再使用瀏覽器選單安裝。';
 }catch{hint.textContent='安裝視窗未能開啟，請使用瀏覽器選單中的「安裝應用程式」。';}
 finally{installing=false;refresh();}return;}
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 help.textContent=ios?'請使用 Safari 開啟這個網站，點「分享」，再選「加入主畫面」→「加入」。完成後，從主畫面的圖示開啟，安裝區塊就會隱藏。':/Android/.test(navigator.userAgent)?'請用 Chrome 或 Edge 開啟這個網站，點右上角「⋮」，選「安裝應用程式」或「加入主畫面」。若剛更新網站，重新整理後再試一次。':'請使用 Chrome 或 Edge，點網址列右側的安裝圖示，或在瀏覽器選單中選「安裝應用程式／將網頁安裝為應用程式」。若剛更新網站，重新整理後再試一次。';
 if(dialog.showModal)dialog.showModal();else window.alert(help.textContent);
};
if(standalone())installed();else refresh();
if('serviceWorker' in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{hint.textContent='安裝服務暫時無法載入，請確認網路後重新整理。';}));}
})();

