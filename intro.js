(() => {
  const dialog=document.querySelector('#brand-intro');
  const slot=dialog.querySelector('.intro-frame-slot');
  const enter=dialog.querySelector('.intro-enter');
  const replay=document.querySelector('#intro-replay');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame,returnFocus;
  function showIntro(){
    if(dialog.open||typeof dialog.showModal!=='function')return;
    returnFocus=document.activeElement;
    frame=document.createElement('iframe');
    frame.title='WOWK DIGITAL X — interactive geometric logo animation';
    frame.setAttribute('sandbox','allow-scripts');
    frame.src='brand-intro.html';
    slot.append(frame);
    try{dialog.showModal();document.body.classList.add('intro-open');enter.focus();}
    catch{frame.remove();frame=null;}
  }
  function hideIntro(){if(dialog.open)dialog.close();}
  dialog.addEventListener('close',()=>{
    frame?.remove();frame=null;
    document.body.classList.remove('intro-open');
    if(returnFocus&&returnFocus!==document.body)returnFocus.focus({preventScroll:true});
    else document.querySelector('.brand')?.focus({preventScroll:true});
  });
  enter.addEventListener('click',hideIntro);
  replay.addEventListener('click',showIntro);
  window.addEventListener('message',event=>{
    if(frame&&event.source===frame.contentWindow&&event.data?.type==='wowk-intro-close')hideIntro();
  });
  // Reduced-motion users enter the content directly and can replay on demand.
  if(!reduced.matches&&!location.hash)showIntro();
})();
