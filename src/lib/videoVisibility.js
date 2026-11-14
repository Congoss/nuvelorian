// Autoplay media behind a modal or outside the viewport must not keep decoding.
export function observeAutoplayVideos(scope,{enabled=true}={}){
 const document=scope.document,tracked=new Map();let disposed=false;
 const visible=video=>{
  if(!enabled || document.hidden || !video.isConnected)return false;
  if(video.closest('.preview-paused,[data-scene-covered="true"]'))return false;
  const app=video.closest('.game-app');
  if(app?.dataset.modalOpen==='true' && video.closest('.animated-camp-scene'))return false;
  return tracked.get(video)!==false;
 };
 const sync=video=>{
  if(!visible(video)){if(!video.paused)video.pause();}
  else if(video.paused)video.play().catch(()=>{});
 };
 const intersection=scope.IntersectionObserver?new scope.IntersectionObserver(entries=>{
  for(const entry of entries){tracked.set(entry.target,entry.isIntersecting);sync(entry.target);}
 }):null;
 const scan=()=>{
  if(disposed)return;
  for(const video of document.querySelectorAll('video[autoplay]')){
   if(!tracked.has(video)){tracked.set(video,!intersection);intersection?.observe(video);}
   sync(video);
  }
  for(const video of tracked.keys())if(!video.isConnected){intersection?.unobserve(video);tracked.delete(video);}
 };
 const mutation=new scope.MutationObserver(records=>{
  if(records.some(record=>record.type==='attributes' || [...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1 && (node.matches?.('video[autoplay]') || node.querySelector?.('video[autoplay]')))))scan();
 });
 mutation.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-modal-open','data-scene-covered','autoplay']});
 const onPlay=event=>{if(tracked.has(event.target)&&!visible(event.target))event.target.pause();};
 document.addEventListener('visibilitychange',scan);document.addEventListener('play',onPlay,true);scan();
 return()=>{disposed=true;intersection?.disconnect();mutation.disconnect();document.removeEventListener('visibilitychange',scan);document.removeEventListener('play',onPlay,true);};
}
