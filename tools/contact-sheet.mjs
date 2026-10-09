import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { readJson } from './lib/io.mjs';
export function contactSheet(directories,out) {
  const tileW=480,tileH=300,pad=12,sheet=new PNG({width:tileW*4+pad*5,height:(tileH+pad)*directories.length+pad});
  for(let i=0;i<sheet.data.length;i+=4){sheet.data[i]=12;sheet.data[i+1]=20;sheet.data[i+2]=36;sheet.data[i+3]=255;}
  const rows=[];
  for(const [row,directory] of directories.entries()) {
    const capture=readJson(path.join(directory,'capture-report.json'));
    rows.push({row:row+1,effect:capture.effect,times:capture.captures.map(x=>x.time)});
    for(const [column,item] of capture.captures.entries()) {
      const src=PNG.sync.read(fs.readFileSync(path.join(directory,item.file)));
      for(let y=0;y<tileH;y++)for(let x=0;x<tileW;x++) {
        const s=(Math.floor(y*src.height/tileH)*src.width+Math.floor(x*src.width/tileW))*4,d=((row*(tileH+pad)+pad+y)*sheet.width+column*(tileW+pad)+pad+x)*4;
        src.data.copy(sheet.data,d,s,s+4);
      }
    }
  }
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,PNG.sync.write(sheet));return rows;
}
if(process.argv[1]?.endsWith('contact-sheet.mjs')) {
  const [out,...dirs]=process.argv.slice(2);console.log(JSON.stringify({out,rows:contactSheet(dirs,out)},null,2));
}
