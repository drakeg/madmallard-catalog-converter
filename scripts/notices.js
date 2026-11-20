import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/licenses',{recursive:true});
for(const [pkg,file] of [['pdfjs-dist','LICENSE'],['papaparse','LICENSE'],['vite','LICENSE.md']])await copyFile('node_modules/'+pkg+'/'+file,'dist/licenses/'+pkg+'.txt');
