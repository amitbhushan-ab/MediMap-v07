const fs=require('fs'); 
const path=require('path'); 
const backendUrl = 'https://medimap-backend-production.up.railway.app';

function walk(dir){
  fs.readdirSync(dir).forEach(f=>{
    let p=path.join(dir,f); 
    if(fs.statSync(p).isDirectory()) {
      walk(p); 
    } else if(p.endsWith('.jsx') || p.endsWith('.js')) { 
      let c=fs.readFileSync(p,'utf8'); 
      let modified = false;
      if(c.includes("'/api")) { c = c.replaceAll("'/api", "'" + backendUrl + "/api"); modified = true; }
      if(c.includes('"/api')) { c = c.replaceAll('"/api', '"' + backendUrl + '/api'); modified = true; }
      if(c.includes("`/api")) { c = c.replaceAll("`/api", "`" + backendUrl + "/api"); modified = true; }
      if(modified) {
        fs.writeFileSync(p, c); 
        console.log('Fixed', p);
      }
    } 
  })
} 
walk('src');
