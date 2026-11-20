import {test} from 'node:test';import assert from 'node:assert/strict';import {parseCsv,mapRows,warnings,exportCsv,exportExceptions,pdfLines} from '../src/model.js';
test('quoted CSV and duplicate/invalid prices are surfaced',()=>{const raw=parseCsv('sku,description,price,unit\nA,"Filter, blue",12.50,each\nA,Other,free,each');const rows=mapRows(raw.slice(1),{sku:0,description:1,price:2,unit:3});assert.equal(rows[0].description,'Filter, blue');assert.ok(warnings(rows[1],rows).length>=2);});
test('CSV output neutralizes formula cells',()=>{assert.match(exportCsv([{sku:'=SUM(A1)',description:'x',price:'1',unit:'each',source:'page 1'}]),/'=SUM/);});
test('PDF text lines retain page reference and x order',()=>{const rows=pdfLines([{str:'19.95',transform:[1,0,0,1,300,100]},{str:'RV-1',transform:[1,0,0,1,20,100]}],2);assert.deepEqual(rows,[{cells:['RV-1','19.95'],source:'page 2'}]);});

test('exceptions retain reasons and verification status',()=>{const csv=exportExceptions([{sku:'',description:'x',price:'bad',unit:'each',source:'page 1',verified:false}]);assert.match(csv,/review_status/);assert.match(csv,/Missing SKU/);assert.match(csv,/unverified/);});
