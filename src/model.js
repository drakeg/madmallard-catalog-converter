import Papa from 'papaparse';
export const fields=['sku','description','price','unit'];
export function parseCsv(text){
 const out=Papa.parse(text,{skipEmptyLines:'greedy'});
 if(out.errors.length)throw Error('CSV could not be parsed: '+out.errors[0].message);
 if(out.data.length>501)throw Error('Limit: 500 product rows plus one header.');
 return out.data.map((cells,i)=>({cells:cells.map(String),source:'row '+(i+1)}));
}
export function pdfLines(items,page){
 const lines=[];
 for(const item of items){if(!item.str?.trim())continue;const y=item.transform[5];let line=lines.find(l=>Math.abs(l.y-y)<3);if(!line){line={y,items:[]};lines.push(line);}line.items.push(item);}
 return lines.sort((a,b)=>b.y-a.y).map(l=>({cells:l.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str.trim()),source:'page '+page}));
}
export function mapRows(raw,mapping){return raw.map((r,i)=>Object.assign({id:i,source:r.source,verified:false},Object.fromEntries(fields.map(f=>[f,r.cells[mapping[f]]||'']))));}
export function warnings(row,rows){const w=[];if(!row.sku.trim())w.push('Missing SKU');if(!row.description.trim())w.push('Missing description');if(!/^\d+(?:\.\d{1,2})?$/.test(row.price.trim()))w.push('Price must be a nonnegative decimal, without currency symbols');if(row.sku&&rows.filter(r=>r.sku.trim()===row.sku.trim()).length>1)w.push('Duplicate SKU');return w;}
export function safeCell(value){return /^[\s]*[=+@-]/.test(value)?"'"+value:value;}
export function exportCsv(rows){return Papa.unparse({fields:[...fields,'source'],data:rows.map(r=>[...fields.map(f=>safeCell(r[f])),safeCell(r.source)])},{newline:'\r\n'});}

export function exportExceptions(rows,allRows=rows){return Papa.unparse({fields:[...fields,'source','review_status','warnings'],data:rows.map(r=>[...fields.map(f=>safeCell(r[f])),safeCell(r.source),r.verified?'verified':'unverified',warnings(r,allRows).join('; ')])},{newline:'\r\n'});}
