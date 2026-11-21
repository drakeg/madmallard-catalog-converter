import {test,expect} from '@playwright/test';
import {PDFDocument,StandardFonts} from 'pdf-lib';
test('CSV upload, corrections, verification gate and export',async({page})=>{
 await page.goto('/');await page.locator('#file').setInputFiles({name:'supplier.csv',mimeType:'text/csv',buffer:Buffer.from('RV-1,Filter,12.50,each\nRV-2,Hose,7.00,each')});
 await expect(page.locator('#rows tr')).toHaveCount(2);await expect(page.locator('#download')).toBeDisabled();
 await page.getByLabel('Verify row 1 0',{exact:true}).check();await expect(page.locator('#download')).toBeEnabled();
 await page.getByLabel('price 0',{exact:true}).fill('13.00');await page.getByLabel('price 0',{exact:true}).press('Tab');await expect(page.locator('#download')).toBeDisabled();
 await page.getByLabel('Verify row 1 0',{exact:true}).check();const download=page.waitForEvent('download');await page.locator('#download').click();expect((await download).suggestedFilename()).toBe('reviewed-catalog.csv');
 await page.locator('#clear').click();await expect(page.locator('#review')).toBeHidden();
});
test('text PDF upload extracts positioned cells with source page',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pdf=await PDFDocument.create();const p=pdf.addPage();const font=await pdf.embedFont(StandardFonts.Helvetica);
 for(const [text,x]of [['RV-9',30],['Filter',150],['19.95',300],['each',400]])p.drawText(text,{x,y:700,size:12,font});
 await page.goto('/');await page.locator('#file').setInputFiles({name:'supplier.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
 await expect(page.locator('#rows tr')).toHaveCount(1);await expect(page.getByLabel('sku 0',{exact:true})).toHaveValue('RV-9');await expect(page.getByLabel('price 0',{exact:true})).toHaveValue('19.95');await expect(page.locator('#rows')).toContainText('page 1');await page.locator('#clear').click();await page.locator('#sample').click();await expect(page.locator('#rows tr')).toHaveCount(2);expect(errors).toEqual([]);
});

test('PDF header skipping is opt-in and re-applying requires verification',async({page})=>{
 const pdf=await PDFDocument.create();const p=pdf.addPage();const font=await pdf.embedFont(StandardFonts.Helvetica);
 for(const [text,x,y] of [['SKU',30,740],['Description',150,740],['Price',300,740],['Unit',400,740],['RV-10',30,700],['Hose',150,700],['8.50',300,700],['each',400,700]])p.drawText(text,{x,y,size:12,font});
 await page.goto('/');await page.locator('#file').setInputFiles({name:'supplier.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
 await expect(page.locator('#rows tr')).toHaveCount(2);
 await page.locator('#skip-headers').check();await expect(page.locator('#rows tr')).toHaveCount(1);
 await expect(page.getByLabel('sku 0',{exact:true})).toHaveValue('RV-10');
 await page.getByLabel('Verify page 1 0',{exact:true}).check();await expect(page.locator('#download')).toBeEnabled();
 await page.locator('#skip-headers').uncheck();await expect(page.locator('#rows tr')).toHaveCount(2);
 await expect(page.locator('#download')).toBeDisabled();
 await page.locator('#clear').click();await expect(page.locator('#header-control')).toBeHidden();
});

test('guided sample is loaded in place, with actionable export instructions',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'How to use this converter'})).toBeVisible();
 await page.getByRole('button',{name:'Try sample data (opens here)'}).click();
 await expect(page.locator('#rows tr')).toHaveCount(2);
 await expect(page.locator('#status')).toContainText('Two fictional sample products');
 await expect(page.locator('#download')).toBeDisabled();
 await page.locator('.export-help summary').click();
 await expect(page.getByText('only verified and valid products',{exact:false})).toBeVisible();
 await page.getByLabel('Verify row 1 0',{exact:true}).check();
 const d=page.waitForEvent('download');await page.locator('#download').click();
 expect((await d).suggestedFilename()).toBe('reviewed-catalog.csv');
 await expect(page.locator('#status')).toContainText('does not update inventory');
});

test('exception CSV is corrected, previewed and safely re-imported',async({page})=>{
 await page.goto('/');
 await page.locator('#sample').click();
 const first=page.locator('#rows tr').first();
 await first.getByLabel('price 0',{exact:true}).fill('bad');
 await first.getByLabel('price 0',{exact:true}).press('Tab');
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#exceptions').click();
 const download=await downloadPromise;
 const stream=await download.createReadStream();
 const chunks=[];for await(const chunk of stream)chunks.push(chunk);
 let csv=Buffer.concat(chunks).toString('utf8');
 expect(csv).toContain('workspace_id,row_id');
 csv=csv.replace('bad','29.95');
 await page.locator('#correction-file').setInputFiles({name:'needs-review.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await expect(page.locator('#correction-preview')).toBeVisible();
 await expect(page.locator('#correction-changes')).toContainText('29.95');
 await expect(first.getByLabel('price 0',{exact:true})).toHaveValue('bad');
 await page.locator('#apply-corrections').click();
 await expect(first.getByLabel('price 0',{exact:true})).toHaveValue('29.95');
 await expect(page.locator('#correction-status')).toContainText('Verification was reset');
 await expect(page.locator('#download')).toBeDisabled();
});
