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
 await expect(page.locator('#rows tr')).toHaveCount(1);await expect(page.getByLabel('sku 0',{exact:true})).toHaveValue('RV-9');await expect(page.getByLabel('price 0',{exact:true})).toHaveValue('19.95');await expect(page.locator('#rows')).toContainText('page 1');await page.locator('#clear').click();await page.locator('#sample').click();await expect(page.locator('#rows tr')).toHaveCount(3);expect(errors).toEqual([]);
});
