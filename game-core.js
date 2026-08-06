
const SIZE=8;
const THEMES={
  fruits:['🍓','🍊','🍇','🍋','🍒','🍑'],
  legumes:['🥕','🌽','🍆','🥒','🍅','🫑'],
  petitdej:['🥐','🥞','🍩','🧇','🥯','🍪'],
  glace:['🍦','🍨','🍧','🧁','🍰','🍭'],
  fastfood:['🍕','🍟','🍔','🌮','🍿','🌭'],
  sodas:['🥤','🧋','🥫','🧊','🍹','🫧'],
  fruitsmer:['🦐','🦀','🦞','🦪','🐙','🦑'],
  viande:['🥩','🍖','🍗','🥓','🌭','🍔'],
  poisson:['🐟','🐠','🐡','🍣','🍤','🍥']
};
const AVATARS=['😎','🤩','🥳','😋','🦊','🐱','👾','🔥'];
let FRUITS=THEMES.fruits, selectedTheme=null, selectedAvatar=AVATARS[0];
let grid=[], score=0, moves=25, level=1, target=1000, timeLeft=90, timer=null, busy=false, over=false, bottles={}, shuffle=2;
let comboChain=0, lastComboTime=0, multiplier=1;
const $=id=>document.getElementById(id);
const board=$('board'), fx=$('fx'), frame=$('frame');
function idx(r,c){return r*SIZE+c}
function randF(){return FRUITS[Math.floor(Math.random()*FRUITS.length)]}
function tgt(l){return 1000 + (l-1)*800}
let audioCtx=null;
function ensureAudio(){if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume()}
function tone(f,d,type='sine',del=0,g=0.2){try{ensureAudio();const t0=audioCtx.currentTime+del;const o=audioCtx.createOscillator(),gn=audioCtx.createGain();o.type=type;o.frequency.value=f;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(g,t0+0.02);gn.gain.exponentialRampToValueAtTime(0.001,t0+d);o.connect(gn);gn.connect(audioCtx.destination);o.start(t0);o.stop(t0+d+0.07)}catch(e){}}
function sfxPop(n){
  if(n<3){tone(500,0.1);tone(700,0.1,'triangle',0.06)}
  else if(n<5){tone(500,0.09);tone(650,0.09,'triangle',0.05);tone(850,0.14,'sine',0.11,0.25)}
  else if(n<7){[400,620,900,1200].forEach((f,i)=>tone(f,0.12,'square',i*0.05,0.22)); tone(150,0.3,'sawtooth',0.18,0.25)}
  else {[300,520,750,1000,1350,1700].forEach((f,i)=>tone(f,0.14,i%2?'square':'sine',i*0.04,0.24)); tone(60,0.45,'sawtooth',0.12,0.35); tone(900,0.6,'triangle',0.25,0.15)}
}
function sfxBad(){tone(130,0.2,'sawtooth',0,0.14)}

// === VOIX COMBOS ===
let voiceEnabled=true;
let frenchVoice=null;
function loadVoice(){
  const voices=speechSynthesis.getVoices();
  frenchVoice = voices.find(v=>v.lang.startsWith('fr') && v.name.toLowerCase().includes('google')) 
             || voices.find(v=>v.lang.startsWith('fr'))
             || voices.find(v=>v.lang.startsWith('en')) || null;
}
if('speechSynthesis' in window){
  loadVoice();
  speechSynthesis.onvoiceschanged=loadVoice;
}
function speakCombo(n){
  if(!voiceEnabled) return;
  const native = window.SnackNativeFeedback;
  const voiceId = n>=10?'legendary':n>=8?'mega':n>=5?'super':n>=4?'combo':null;
  if(voiceId && native?.announce){
    native.announce(voiceId);
    return;
  }
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  let text='';
  if(n>=10) text='Légendaire !';
  else if(n>=8) text='Méga combo !';
  else if(n>=5) text='Super !';
  else if(n>=4) text='Combo !';
  else return;
  const ut=new SpeechSynthesisUtterance(text);
  ut.voice=frenchVoice; ut.lang=frenchVoice?frenchVoice.lang:'fr-FR'; ut.rate=1.05; ut.pitch=1.15; ut.volume=1;
  speechSynthesis.speak(ut);
}
function getGroup(r,c,g=grid){
  const st=g[idx(r,c)]; if(!st) return [];
  const fruit=st.fruit; const vis=new Set([idx(r,c)]); const q=[[r,c]]; let qi=0;
  while(qi<q.length){
    const [cr,cc]=q[qi++];
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nr=cr+dr,nc=cc+dc; if(nr<0||nr>=SIZE||nc<0||nc>=SIZE) continue;
      const ni=idx(nr,nc); if(vis.has(ni)) continue;
      const cell=g[ni]; if(!cell) continue;
      if(cell.fruit===fruit){vis.add(ni); q.push([nr,nc])}
    }
  }
  return [...vis];
}
function hasGroup(g){
  const seen=new Set();
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    const i=idx(r,c); if(seen.has(i)||!g[i]) continue;
    const gr=getGroup(r,c,g); gr.forEach(x=>seen.add(x)); if(gr.length>=2) return true;
  }
  return false;
}
function makeGrid(){
  let g=[]; for(let i=0;i<SIZE*SIZE;i++) g.push({fruit:randF()});
  let tries=0; while(!hasGroup(g)&&tries<100){ for(let i=0;i<SIZE*SIZE;i++) g[i]={fruit:randF()}; tries++; }
  return g;
}