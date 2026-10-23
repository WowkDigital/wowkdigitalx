const {test}=require('node:test');
const assert=require('node:assert/strict');
const {lifeStep,elementaryStep}=require('./automata-core.js');
test('A glider advances diagonally after four generations, including across both edges',()=>{
  const w=12,h=12,a=new Uint8Array(w*h);
  const points=[[1,0],[2,1],[0,2],[1,2],[2,2]];
  for(const[x,y]of points)a[((y+10)%h)*w+(x+10)%w]=1;
  let b=a;for(let i=0;i<4;i++)b=lifeStep(b,w,h);
  const expected=new Uint8Array(w*h);
  for(const[x,y]of points)expected[((y+11)%h)*w+(x+11)%w]=1;
  assert.deepEqual(b,expected);
});
test('Life block stays still and blinker returns after two steps',()=>{
  const a=new Uint8Array(64);for(const i of [18,19,26,27])a[i]=1;
  assert.deepEqual(lifeStep(a,8,8),a);
  const b=new Uint8Array(64);for(const i of [25,26,27])b[i]=1;
  const next=lifeStep(b,8,8);assert.notDeepEqual(next,b);assert.deepEqual(lifeStep(next,8,8),b);
});
test('Every elementary rule matches its truth table at every neighbourhood',()=>{
  for(let rule=0;rule<256;rule++)for(let n=0;n<8;n++){
    const row=Uint8Array.of((n>>2)&1,(n>>1)&1,n&1);
    assert.equal(elementaryStep(row,rule)[1],(rule>>n)&1);
  }
});
test('Elementary automata wrap horizontally; rule 0 clears and rule 255 fills',()=>{
  const row=Uint8Array.of(1,0,0,0,0);
  assert.deepEqual([...elementaryStep(row,90)],[0,1,0,0,1]);
  assert.deepEqual([...elementaryStep(row,0)],[0,0,0,0,0]);
  assert.deepEqual([...elementaryStep(row,255)],[1,1,1,1,1]);
});
