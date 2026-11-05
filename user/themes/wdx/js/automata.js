(() => {
  const lab=document.querySelector('#lab');
  const get=id=>lab.querySelector('#'+id);
  const canvas=get('lab-canvas'),ctx=canvas.getContext('2d');
  const {lifeStep,elementaryStep}=AutomataCore;
  let mode='life',w=60,h=36,cells,row,history=[],generation=0,running=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=false,raf=0,last=0,elapsed=0,dirty=true,drag=false,paint=1,cursor={x:0,y:0},focused=false;
  let saved={};
  const patterns={glider:[[1,0],[2,1],[0,2],[1,2],[2,2]],blinker:[[0,0],[1,0],[2,0]],toad:[[1,0],[2,0],[3,0],[0,1],[1,1],[2,1]]};
  function message(text){get('lab-status').textContent=text;}
  function reset(kind=get('lab-pattern').value){
    generation=0;elapsed=0;
    if(mode==='life'){
      cells=new Uint8Array(w*h);
      if(kind==='random') cells=Uint8Array.from(cells,()=>Number(Math.random()<Number(get('lab-density').value)/100));
      else if(patterns[kind]) for(const [x,y]of patterns[kind])cells[(Math.floor(h/2)+y)*w+Math.floor(w/2)+x]=1;
    }else{
      row=new Uint8Array(w);
      if(kind==='random')row=Uint8Array.from(row,()=>Number(Math.random()<Number(get('lab-density').value)/100));
      else if(kind!=='empty')row[Math.floor(w/2)]=1;
      history=[row.slice()];
    }
    dirty=true;wake();
  }
  function advance(){
    if(mode==='life') cells=lifeStep(cells,w,h);
    else {row=elementaryStep(row,Number(get('lab-rule').value));history.push(row.slice());if(history.length>h)history.shift();}
    generation++;dirty=true;
  }
  function updateRun(){get('lab-play').textContent=running?'PAUSE':'PLAY';get('lab-play').setAttribute('aria-pressed',String(running));}
  function wake(){if(visible&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;
    if(!visible||document.hidden){last=0;return;}
    if(running&&!drag){elapsed+=last?Math.min(now-last,100):0;const interval=1000/Number(get('lab-speed').value);let count=0;while(elapsed>=interval&&count++<3){advance();elapsed-=interval;}}
    last=now;if(dirty)draw();if(running)wake();
  }
  function draw(){
    dirty=false;
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
    const cw=Math.max(1,Math.round(rect.width*ratio)),ch=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,cw,ch);const sx=cw/w,sy=ch/h;
    ctx.fillStyle='#f2f2f2';let population=0;
    const grid=get('lab-grid').checked,gap=grid&&sx>4?Math.min(ratio,sx*.15):0;
    if(mode==='life'){
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(cells[y*w+x]){population++;ctx.fillRect(x*sx+gap,y*sy+gap,Math.max(1,sx-gap),Math.max(1,sy-gap));}
    }else{
      population=row.reduce((a,b)=>a+b,0);
      history.forEach((line,y)=>line.forEach((v,x)=>{if(v)ctx.fillRect(x*sx+gap,y*sy+gap,Math.max(1,sx-gap),Math.max(1,sy-gap));}));
    }
    if(grid&&sx>5){ctx.strokeStyle='rgba(242,242,242,.12)';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<=w;x++){ctx.moveTo(x*sx,0);ctx.lineTo(x*sx,ch);}for(let y=0;y<=h;y++){ctx.moveTo(0,y*sy);ctx.lineTo(cw,y*sy);}ctx.stroke();}
    if(focused){ctx.strokeStyle='#f2f2f2';ctx.lineWidth=2;ctx.strokeRect(cursor.x*sx+1,(mode==='life'?cursor.y:history.length-1)*sy+1,sx-2,sy-2);}
    get('lab-generation').textContent=String(generation).padStart(5,'0');get('lab-population').textContent=population;get('lab-dimensions').textContent=`${w} × ${h}`;
  }
  function pause(){running=false;elapsed=0;updateRun();dirty=true;wake();}
  get('lab-play').addEventListener('click',()=>{running=!running;last=0;updateRun();wake();});
  get('lab-step').addEventListener('click',()=>{pause();advance();wake();});
  get('lab-reset').addEventListener('click',()=>{reset();message('Starting pattern restored.');});
  get('lab-clear').addEventListener('click',()=>{pause();reset('empty');message('Board cleared. Draw a pattern, then press Play.');});
  get('lab-random').addEventListener('click',()=>{reset('random');message('Random seed generated.');});
  get('lab-pattern').addEventListener('change',()=>{reset();message('Pattern loaded.');});
  ['speed','density'].forEach(name=>get('lab-'+name).addEventListener('input',event=>{get('lab-'+name+'-value').textContent=event.target.value+(name==='speed'?' / s':'%');}));
  get('lab-size').addEventListener('input',event=>{get('lab-size-value').textContent=event.target.value+' cols';});
  get('lab-size').addEventListener('change',event=>{w=Number(event.target.value);h=Math.round(w*.6);cursor={x:0,y:0};reset();message('Grid resized; starting pattern restored.');});
  get('lab-grid').addEventListener('change',()=>{dirty=true;wake();});
  get('lab-rule').addEventListener('change',event=>{
    const n=Number(event.target.value);if(!Number.isInteger(n)||n<0||n>255){event.target.value=110;message('Choose a whole-number rule from 0 to 255.');}
    get('lab-rule-preset').value=['30','90','110','184'].includes(event.target.value)?event.target.value:'';reset();
  });
  get('lab-rule-preset').addEventListener('change',event=>{if(event.target.value){get('lab-rule').value=event.target.value;reset();}});
  function switchMode(next){
    if(next===mode)return;
    saved[mode]={cells,row,history,generation};mode=next;drag=false;last=0;elapsed=0;
    lab.querySelectorAll('[data-automaton]').forEach(b=>{const active=b.dataset.automaton===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    get('lab-life-pattern').hidden=mode!=='life';get('lab-1d-settings').hidden=mode==='life';
    get('lab-description').textContent=mode==='life'?'Conway’s Game of Life. A glider travels across a borderless world: opposite edges connect.':'Elementary cellular automata. Each row is the next generation; left and right edges connect. History scrolls when the board fills.';
    get('lab-help').textContent=mode==='life'?'Draw or erase by dragging or touching the board. Keyboard: arrow keys move; Space toggles a cell.':'Tap or drag across columns to edit the latest row (outlined with keyboard focus). New generations grow from that row. Arrow keys move; Space toggles a column.';
    canvas.setAttribute('aria-label',mode==='life'?'Editable Game of Life board':'Editable one-dimensional automaton; edit the latest generation');
    if(saved[mode]&&saved[mode].cells?.length===w*h||mode==='one'&&saved[mode]?.row?.length===w){({cells,row,history,generation}=saved[mode]);}else reset(mode==='life'?get('lab-pattern').value:'single');
    dirty=true;wake();message(mode==='life'?'Game of Life selected.':'1D Automata selected.');
  }
  const tabs=[...lab.querySelectorAll('[data-automaton]')];
  tabs.forEach((b,i)=>{b.addEventListener('click',()=>switchMode(b.dataset.automaton));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?1:1-i;tabs[j].focus();switchMode(tabs[j].dataset.automaton);}});});
  function locate(event){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(w-1,Math.floor((event.clientX-r.left)/r.width*w))),y:Math.max(0,Math.min(h-1,Math.floor((event.clientY-r.top)/r.height*h)))};}
  function edit(p,value){cursor=p;if(mode==='life')cells[p.y*w+p.x]=value;else {row[p.x]=value;history[history.length-1]=row.slice();}dirty=true;wake();}
  let previous;
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag=true;const p=locate(e);previous=p;paint=1-(mode==='life'?cells[p.y*w+p.x]:row[p.x]);edit(p,paint);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=locate(e),steps=Math.max(Math.abs(p.x-previous.x),Math.abs(p.y-previous.y));for(let i=0;i<=steps;i++){const t=steps?i/steps:0;edit({x:Math.round(previous.x+(p.x-previous.x)*t),y:Math.round(previous.y+(p.y-previous.y)*t)},paint);}previous=p;});
  const end=()=>{drag=false;last=0;wake();};['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,end));
  canvas.addEventListener('focus',()=>{focused=true;dirty=true;wake();});canvas.addEventListener('blur',()=>{focused=false;dirty=true;wake();});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();pause();if(e.key===' ')edit(cursor,1-(mode==='life'?cells[cursor.y*w+cursor.x]:row[cursor.x]));else{cursor.x=(cursor.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)+w)%w;cursor.y=(cursor.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)+h)%h;}dirty=true;wake();}});
  new ResizeObserver(()=>{dirty=true;wake();}).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;if(!visible){cancelAnimationFrame(raf);raf=0;}else{dirty=true;wake();}},{threshold:.01}).observe(lab);
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)pause();});
  reset('glider');updateRun();
})();
