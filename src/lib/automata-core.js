export function lifeStep(cells, width, height) {
    const next = new Uint8Array(cells.length);
    for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
      let n=0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++)
        if(dx||dy) n+=cells[((y+dy+height)%height)*width+(x+dx+width)%width];
      next[y*width+x]=Number(n===3||(cells[y*width+x]&&n===2));
    }
    return next;
  }
export function elementaryStep(row, rule) {
    return Uint8Array.from(row, (_,x)=> (rule >> ((row[(x+row.length-1)%row.length]<<2)|(row[x]<<1)|row[(x+1)%row.length]))&1);
  }
