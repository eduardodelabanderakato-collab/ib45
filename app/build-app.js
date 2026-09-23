// Build app/index.html from template + seeds (today and next 13 days embedded so the page renders at rest).
const fs=require('fs'), path=require('path'); const D=path.join(__dirname,'seed');
const title=process.argv[2]||'Flight Deck';
const plans={}; for(const f of fs.readdirSync(path.join(D,'plan'))) plans[f.replace('.json','')]=JSON.parse(fs.readFileSync(path.join(D,'plan',f),'utf8'));
const seed={ plans, subjects:JSON.parse(fs.readFileSync(path.join(D,'subjects.json'))), assessments:JSON.parse(fs.readFileSync(path.join(D,'assessments.json'))), tour:JSON.parse(fs.readFileSync(path.join(D,'tour.json'))), stanford:JSON.parse(fs.readFileSync(path.join(D,'stanford.json'))), briefs:JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','briefs.json'))), focus:JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','state.json'))).focus||null };
const holoPath=path.join(__dirname,'assets','hologram-figure.png'); const holo=fs.existsSync(holoPath)?'data:image/png;base64,'+fs.readFileSync(holoPath).toString('base64'):null;
const avatarPath=path.join(__dirname,'assets','avatar.png'); const avatar=fs.existsSync(avatarPath)?'data:image/png;base64,'+fs.readFileSync(avatarPath).toString('base64'):null;
let html=fs.readFileSync(path.join(__dirname,'template.html'),'utf8').replace('/*__SEED__*/{}', JSON.stringify(seed)).split('__TITLE__').join(title).replace('avatar: null', 'avatar: '+JSON.stringify(avatar)).replace('holo: null', 'holo: '+JSON.stringify(holo));
fs.writeFileSync(path.join(__dirname,'index.html'), html); console.log('app/index.html', (html.length/1024).toFixed(0)+' KB');
