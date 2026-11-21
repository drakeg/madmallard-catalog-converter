import {test} from 'node:test';import assert from 'node:assert/strict';import {parseCsv,mapRows,warnings,exportCsv,exportExceptions,pdfLines,skipPdfPageHeaders,prepareExceptionImport} from '../src/model.js';
test('quoted CSV and duplicate/invalid prices are surfaced',()=>{const raw=parseCsv('sku,description,price,unit\nA,"Filter, blue",12.50,each\nA,Other,free,each');const rows=mapRows(raw.slice(1),{sku:0,description:1,price:2,unit:3});assert.equal(rows[0].description,'Filter, blue');assert.ok(warnings(rows[1],rows).length>=2);});
test('CSV output neutralizes formula cells',()=>{assert.match(exportCsv([{sku:'=SUM(A1)',description:'x',price:'1',unit:'each',source:'page 1'}]),/'=SUM/);});
test('PDF text lines retain page reference and x order',()=>{const rows=pdfLines([{str:'19.95',transform:[1,0,0,1,300,100]},{str:'RV-1',transform:[1,0,0,1,20,100]}],2);assert.deepEqual(rows,[{cells:['RV-1','19.95'],source:'page 2'}]);});

test('exceptions retain reasons and verification status',()=>{const csv=exportExceptions([{sku:'',description:'x',price:'bad',unit:'each',source:'page 1',verified:false}]);assert.match(csv,/review_status/);assert.match(csv,/Missing SKU/);assert.match(csv,/unverified/);});

test('PDF split text runs in one cell are reconstructed without merging columns',()=>{
 const item=(str,x,width,y=100)=>({str,width,transform:[1,0,0,1,x,y]});
 const result=pdfLines([item('Filter',120,30),item('blue',154,22),item('RV-3',20,30),item('19.95',300,30)],1);
 assert.deepEqual(result,[{cells:['RV-3','Filter blue','19.95'],source:'page 1'}]);
});
test('PDF fragments lacking measured widths remain separate rather than guessing',()=>{
 const item=(str,x)=>({str,transform:[1,0,0,1,x,100]});
 assert.deepEqual(pdfLines([item('A',10),item('B',13)],1)[0].cells,['A','B']);
});
test('PDF page ordering and separate adjacent rows remain stable',()=>{
 const item=(str,x,y,width)=>({str,width,transform:[1,0,0,1,x,y]});
 const result=pdfLines([item('Bottom',10,60,36),item('Top',10,100,20),item('Part',33,100,25)],2);
 assert.deepEqual(result,[{cells:['Top Part'],source:'page 2'},{cells:['Bottom'],source:'page 2'}]);
});

test('PDF page header opt-in skips only the first extracted line of each page',()=>{
 const raw=[
  {source:'page 1',cells:['SKU','Price']},
  {source:'page 1',cells:['A','1.00']},
  {source:'page 2',cells:['SKU','Price']},
  {source:'page 2',cells:['B','2.00']},
  {source:'row 1',cells:['CSV','3.00']}
 ];
 assert.deepEqual(skipPdfPageHeaders(raw).map(r=>r.cells[0]),['A','B','CSV']);
 assert.equal(raw.length,5,'source rows must not be mutated');
});
test('header control never drops the only row from unrelated CSV input',()=>{
 assert.deepEqual(skipPdfPageHeaders([{source:'row 1',cells:['SKU']}]),[{source:'row 1',cells:['SKU']}]);
});

test('corrected exceptions match workspace and ID even when SKU changes',()=>{
 const rows=[{id:9,source:'page 2',sku:'BAD',description:'Filter',price:'oops',unit:'each',verified:false}];
 const csv=exportExceptions(rows,rows,'w-1');
 const edited=csv.replace('BAD','FIXED').replace('oops','19.99');
 const changes=prepareExceptionImport(edited,rows,'w-1');
 assert.equal(changes.length,1);assert.equal(changes[0].id,9);
 assert.equal(changes[0].next.sku,'FIXED');assert.equal(changes[0].next.price,'19.99');
 assert.equal(rows[0].sku,'BAD','preview must never mutate products');
});
test('wrong workspace, duplicate IDs and missing row IDs abort import',()=>{
 const rows=[{id:1,source:'row 1',sku:'SKU',description:'Item',price:'1.00',unit:'each',verified:false}];
 const csv=exportExceptions(rows,rows,'workspace');
 assert.throws(()=>prepareExceptionImport(csv,rows,'other'),/do not match/);
 assert.throws(()=>prepareExceptionImport(csv.replace('row 1','row 2'),rows,'workspace'),/do not match/);
 assert.throws(()=>prepareExceptionImport(csv+csv.split('\r\n')[1]+'\r\n',rows,'workspace'),/repeated row ID/);
 assert.throws(()=>prepareExceptionImport('sku,price\nA,1',rows,'workspace'),/Not a supported/);
});
