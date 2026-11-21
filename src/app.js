import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {fields,parseCsv,pdfLines,mapRows,warnings,exportCsv,exportExceptions,skipPdfPageHeaders,prepareExceptionImport} from './model.js';
import './style.css';
pdfjs.GlobalWorkerOptions.workerSrc=worker;
const $=id=>document.getElementById(id);let raw=[],rows=[],busy=false,generation=0,sourceIsPdf=false,workspaceId='',pendingCorrections=[];
function tell(s){$('status').textContent=s;}
function clearPending(){pendingCorrections=[];$('correction-preview').hidden=true;$('correction-file').value='';$('correction-status').textContent='';}

function clear(){clearPending();workspaceId='';generation++;raw=[];rows=[];sourceIsPdf=false;$('skip-headers').checked=false;$('header-control').hidden=true;$('review').hidden=true;$('rows').replaceChildren();$('mapping').replaceChildren();$('file').value='';tell('Workspace cleared. No data was stored.');}
function load(data){workspaceId=crypto.randomUUID();clearPending();if(data.length>501)throw Error('Maximum 500 rows plus a header.');raw=data;const n=Math.max(4,...data.map(r=>r.cells.length));$('mapping').replaceChildren();fields.forEach((f,i)=>{const label=document.createElement('label');label.textContent=f;const select=document.createElement('select');select.id='map-'+f;for(let j=0;j<n;j++){const opt=document.createElement('option');opt.value=j;opt.textContent='Column '+(j+1)+' — '+(data[0]?.cells[j]||'empty').slice(0,35);select.append(opt);}select.value=i;label.append(select);$('mapping').append(label);});$('review').hidden=false;apply();}
function apply(){clearPending();workspaceId=crypto.randomUUID();const selected=sourceIsPdf&&$('skip-headers').checked?skipPdfPageHeaders(raw):raw;rows=mapRows(selected,Object.fromEntries(fields.map(f=>[f,Number($('map-'+f).value)])));render();tell('Rows loaded below. Check column mapping, review SKUs and prices, verify products, then download reviewed CSV.');}
function summary(){const good=rows.filter(r=>r.verified&&!warnings(r,rows).length).length;$('summary').textContent=rows.length+' extracted rows · '+good+' verified and valid · '+(rows.length-good)+' needing attention';$('download').disabled=!good;}
function render(){const tbody=$('rows');tbody.replaceChildren();for(const row of rows){const tr=document.createElement('tr');const td=document.createElement('td');const check=document.createElement('input');check.type='checkbox';check.checked=row.verified;check.setAttribute('aria-label','Verify '+row.source+' '+row.id);check.onchange=()=>{clearPending();row.verified=check.checked;summary();};td.append(check);tr.append(td);for(const f of fields){const cell=document.createElement('td');const input=document.createElement('input');input.value=row[f];input.setAttribute('aria-label',f+' '+row.id);input.onchange=()=>{clearPending();row[f]=input.value;row.verified=false;render();};cell.append(input);tr.append(cell);}const source=document.createElement('td');source.textContent=row.source;tr.append(source);const warning=document.createElement('td');warning.textContent=warnings(row,rows).join('; ');tr.append(warning);const removeCell=document.createElement('td');const remove=document.createElement('button');remove.textContent='Remove';remove.setAttribute('aria-label','Remove row '+row.id);remove.onclick=()=>{clearPending();rows=rows.filter(r=>r.id!==row.id);render();};removeCell.append(remove);tr.append(removeCell);tbody.append(tr);}summary();}
async function choose(file){if(!file||busy)return;busy=true;const run=++generation;$('review').hidden=true;rows=[];raw=[];tell('Reading locally…');let pdf,loadingTask;try{if(file.size>10*1024*1024)throw Error('File exceeds 10 MB.');let data;if(file.name.toLowerCase().endsWith('.csv')){data=parseCsv(await file.text());}else if(file.name.toLowerCase().endsWith('.pdf')){loadingTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});pdf=await loadingTask.promise;if(pdf.numPages>20)throw Error('PDF exceeds the 20-page pilot limit.');data=[];for(let n=1;n<=pdf.numPages;n++){if(run!==generation)return;const page=await pdf.getPage(n);data.push(...pdfLines((await page.getTextContent()).items,n));if(data.length>501)throw Error('Too many extracted rows. Choose a smaller PDF.');}if(!data.length)throw Error('No readable text found. Scanned PDFs need OCR and are not supported.');}else throw Error('Choose a .pdf or .csv file.');if(run===generation){sourceIsPdf=file.name.toLowerCase().endsWith('.pdf');$('header-control').hidden=!sourceIsPdf;load(data);}}catch(e){if(run===generation)tell('Unable to load: '+e.message);}finally{if(loadingTask)await loadingTask.destroy();busy=false;}}
function download(data,name,exceptions=false){const blob=new Blob([exceptions?exportExceptions(data,rows,workspaceId):exportCsv(data)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);tell(name+' downloaded. Open it in a spreadsheet editor and match its columns to your inventory import format. This converter does not update inventory.');}
$('file').onchange=()=>choose($('file').files[0]);$('clear').onclick=clear;$('apply').onclick=apply;$('skip-headers').onchange=apply;
$('sample').onclick=()=>{if(busy)return;clear();load(parseCsv('RV-001,Water filter,19.95,each\nRV-002,Hose adapter,8.50,pack of 2'));tell('Two fictional sample products loaded below. Verify their values, check Verified?, then download reviewed CSV.');$('review').scrollIntoView({behavior:'smooth',block:'start'});};
$('download').onclick=()=>download(rows.filter(r=>r.verified&&!warnings(r,rows).length),'reviewed-catalog.csv');
$('exceptions').onclick=()=>download(rows.filter(r=>!r.verified||warnings(r,rows).length),'needs-review.csv',true);

$('correction-file').onchange=async()=>{
 const file=$('correction-file').files[0];
 clearPending();
 if(!file)return;
 try{
  if(file.size>10*1024*1024)throw Error('Corrections CSV exceeds 10 MB.');
  const changes=prepareExceptionImport(await file.text(),rows,workspaceId);
  if(!changes.length){$('correction-status').textContent='No product changes found. Edit SKU, description, price, or unit in the exceptions CSV, save it, then choose the file again.';return;}
  pendingCorrections=changes;
  const body=$('correction-changes');body.replaceChildren();
  for(const change of changes){
   for(const diff of change.modified){
    const tr=document.createElement('tr');
    for(const value of [String(change.id),change.source,diff.field,diff.before,diff.after]){
     const td=document.createElement('td');td.textContent=value;tr.append(td);
    }
    body.append(tr);
   }
  }
  $('correction-preview').hidden=false;
  $('correction-status').textContent=changes.length+' matching product row(s) will be updated. Review the changes, then select Apply corrections. Nothing has changed yet.';
 }catch(e){$('correction-status').textContent='Corrections not applied: '+e.message;}
};
$('apply-corrections').onclick=()=>{
 if(!pendingCorrections.length)return;
 const changes=pendingCorrections;
 const lookup=new Map(rows.map(r=>[r.id,r]));
 for(const change of changes){
  const row=lookup.get(change.id);
  if(!row)throw Error('Review workspace changed. Export a fresh exceptions file.');
  Object.assign(row,change.next,{verified:false});
 }
 clearPending();render();
 $('correction-status').textContent=changes.length+' row(s) updated. Verification was reset for every changed product. Check warnings and compare corrected SKUs/prices with the source before approving export.';
};
$('cancel-corrections').onclick=()=>{clearPending();$('correction-status').textContent='Correction preview discarded. No products were changed.';};
