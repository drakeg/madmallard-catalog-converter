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

export const PROFILE_STORAGE_KEY='madmallard.catalog.mapping-profiles.v1';
export function validateMappingProfile(profile,columnCount){
 if(!profile||typeof profile!=='object'||profile.version!==1)throw Error('Unsupported mapping profile.');
 if(typeof profile.name!=='string'||!profile.name.trim()||profile.name.length>60)throw Error('Profile name must be 1–60 characters.');
 if(!['pdf','csv'].includes(profile.format))throw Error('Unsupported profile format.');
 if(typeof profile.skipHeaders!=='boolean')throw Error('Invalid header option.');
 if(profile.format==='csv'&&profile.skipHeaders)throw Error('CSV profiles cannot skip PDF page headers.');
 if(!profile.mapping||fields.some(f=>!Number.isSafeInteger(profile.mapping[f])||profile.mapping[f]<0||profile.mapping[f]>=columnCount))throw Error('Profile refers to columns not present in this catalog.');
 return {version:1,name:profile.name.trim(),format:profile.format,skipHeaders:profile.skipHeaders,mapping:Object.fromEntries(fields.map(f=>[f,profile.mapping[f]]))};
}
export function parseMappingProfiles(json){
 if(json==null||json==='')return [];
 const value=JSON.parse(json);
 if(!Array.isArray(value)||value.length>20)throw Error('Saved profiles have an invalid format.');
 const names=new Set();
 return value.map(p=>{
  const profile=validateMappingProfile(p,501);
  const normalized=profile.name.toLocaleLowerCase();
  if(names.has(normalized))throw Error('Duplicate saved mapping profiles.');
  names.add(normalized);return profile;
 });
}

export function mapRows(raw,mapping){return raw.map((r,i)=>Object.assign({id:i,source:r.source,verified:false},Object.fromEntries(fields.map(f=>[f,r.cells[mapping[f]]||'']))));}
export function warnings(row,rows){const w=[];if(!row.sku.trim())w.push('Missing SKU');if(!row.description.trim())w.push('Missing description');if(!/^\d+(?:\.\d{1,2})?$/.test(row.price.trim()))w.push('Price must be a nonnegative decimal, without currency symbols');if(row.sku&&rows.filter(r=>r.sku.trim()===row.sku.trim()).length>1)w.push('Duplicate SKU');return w;}
export function safeCell(value){return /^[\s]*[=+@-]/.test(value)?"'"+value:value;}
export function exportCsv(rows){return Papa.unparse({fields:[...fields,'source'],data:rows.map(r=>[...fields.map(f=>safeCell(r[f])),safeCell(r.source)])},{newline:'\r\n'});}

export function exportExceptions(rows,allRows=rows,workspaceId=''){
 return Papa.unparse({
  fields:['workspace_id','row_id',...fields,'source','review_status','warnings'],
  data:rows.map(r=>[workspaceId,String(r.id ?? ''),...fields.map(f=>safeCell(r[f])),safeCell(r.source),r.verified?'verified':'unverified',warnings(r,allRows).join('; ')])
 },{newline:'\r\n'});
}

// Validate the complete correction file before changing any row. Identity is
// workspace + immutable row ID + source; the SKU may legitimately be wrong.
export function prepareExceptionImport(csv,rows,workspaceId){
 const parsed=Papa.parse(csv,{header:true,skipEmptyLines:'greedy'});
 if(parsed.errors.length)throw Error('Corrections CSV could not be parsed: '+parsed.errors[0].message);
 const required=['workspace_id','row_id',...fields,'source'];
 if(required.some(k=>!parsed.meta.fields?.includes(k)))throw Error('Not a supported corrections CSV. Download a fresh needs-review.csv from this workspace.');
 if(!parsed.data.length)throw Error('Corrections CSV contains no product rows.');
 if(parsed.data.length>500)throw Error('Corrections CSV exceeds 500 product rows.');
 const ids=new Set(),current=new Map(rows.map(r=>[String(r.id),r]));
 const changes=[];
 for(const item of parsed.data){
  const id=String(item.row_id);
  if(!id || ids.has(id))throw Error('Corrections CSV has a missing or repeated row ID.');
  ids.add(id);
  const original=current.get(id);
  if(!workspaceId || item.workspace_id!==workspaceId || !original || item.source!==original.source)
   throw Error('Corrections do not match the current workspace and source rows. Reload the original catalog and export a fresh exceptions file.');
  const next=Object.fromEntries(fields.map(k=>[k,item[k]]));
  if(fields.some(k=>typeof next[k]!=='string'))throw Error('A product field is missing from the corrections CSV.');
  const modified=fields.filter(k=>next[k]!==original[k]).map(k=>({field:k,before:original[k],after:next[k]}));
  if(modified.length)changes.push({id:original.id,source:original.source,modified,next});
 }
 return changes;
}
