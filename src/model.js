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
 return lines.sort((a,b)=>b.y-a.y).map(l=>{
  const ordered=l.items.sort((a,b)=>a.transform[4]-b.transform[4]);
  const cells=[];let previous=null;
  for(const item of ordered){
   const value=item.str.trim();if(!value)continue;
   const x=item.transform[4],width=Number(item.width);
   const previousEnd=previous&&Number.isFinite(previous.width)&&previous.width>0
    ? previous.transform[4]+previous.width : null;
   // PDF.js may split a single cell into multiple text runs. Only join runs
   // when both have measurable geometry and the gap is small; never infer
   // missing prices or join columns from ordering alone.
   if(previousEnd!==null&&Number.isFinite(width)&&width>0&&x-previousEnd>=-2&&x-previousEnd<=8){
    cells[cells.length-1]+=(x-previousEnd>2?' ':'')+value;
   }else cells.push(value);
   previous=item;
  }
  return {cells,source:'page '+page};
 });
}
// Explicitly opt-in: the first extracted line of each PDF page may be a product.
export function skipPdfPageHeaders(raw){
 const encountered=new Set();
 return raw.filter(row=>{
  if(!/^page \d+$/.test(row.source))return true;
  if(encountered.has(row.source))return true;
  encountered.add(row.source);
  return false;
 });
}
export function mapRows(raw,mapping){return raw.map((r,i)=>Object.assign({id:i,source:r.source,verified:false},Object.fromEntries(fields.map(f=>[f,r.cells[mapping[f]]||'']))));}
export function warnings(row,rows){const w=[];if(!row.sku.trim())w.push('Missing SKU');if(!row.description.trim())w.push('Missing description');if(!/^\d+(?:\.\d{1,2})?$/.test(row.price.trim()))w.push('Price must be a nonnegative decimal, without currency symbols');if(row.sku&&rows.filter(r=>r.sku.trim()===row.sku.trim()).length>1)w.push('Duplicate SKU');return w;}
export function safeCell(value){return /^[\s]*[=+@-]/.test(value)?"'"+value:value;}
export function exportCsv(rows){return Papa.unparse({fields:[...fields,'source'],data:rows.map(r=>[...fields.map(f=>safeCell(r[f])),safeCell(r.source)])},{newline:'\r\n'});}

export function exportExceptions(rows,allRows=rows){return Papa.unparse({fields:[...fields,'source','review_status','warnings'],data:rows.map(r=>[...fields.map(f=>safeCell(r[f])),safeCell(r.source),r.verified?'verified':'unverified',warnings(r,allRows).join('; ')])},{newline:'\r\n'});}
