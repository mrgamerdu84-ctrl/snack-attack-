function updateMultiplier(){
  const now=Date.now();
  if(now - lastComboTime < 3000){ comboChain++; multiplier = Math.min(3.5, 1 + comboChain*0.25); }
  else { comboChain=1; multiplier=1; }
  lastComboTime=now;
  $('mult').textContent='x'+multiplier.toFixed(1);
  $('chain').textContent=`COMBO x${comboChain}`; $('chain').classList.add('show');
  setTimeout(()=>{ if(Date.now()-lastComboTime>=3000){ $('chain').classList.remove('show'); comboChain=0; multiplier=1; $('mult').textContent='x1.0'; } },3000);
}
function tap(r,c){
  const gr=getGroup(r,c);
  if(gr.length<2){ sfxBad(); const el=board.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); if(el){ el.classList.add('shake'); setTimeout(()=>el.classList.remove('shake'),300); } return; }
  doRemove(gr,r,c);
}
function doRemove(indices,cr,cc){
  busy=true; moves--; updateMultiplier();
  const n=indices.length; const base=calcBase(n); const gain=Math.floor(base*multiplier); score+=gain;
  const cs=board.clientWidth/SIZE; const cx=cc*cs+cs/2; const cy=cr*cs+cs/2;
  createRing(cx,cy);
  const sorted=[...indices].sort((a,b)=>{
    const ar=Math.floor(a/SIZE),ac=a%SIZE, br=Math.floor(b/SIZE),bc=b%SIZE;
    return (Math.abs(ar-cr)+Math.abs(ac-cc)) - (Math.abs(br-cr)+Math.abs(bc-cc));
  });
  sorted.forEach((i,pos)=>{
    const rr=Math.floor(i/SIZE), cc2=i%SIZE;
    const x=cc2*cs+cs/2, y=rr*cs+cs/2;
    setTimeout(()=>{
      const el=board.querySelector(`.cell[data-r="${rr}"][data-c="${cc2}"]`);
      if(el) el.classList.add('pop');
      const f=grid[i]?.fruit;
      if(f){ bottles[f]=(bottles[f]||0)+1; createParticles(x,y,f, n>=8?7 : n>=5?5:3); }
      if(pos===Math.floor(n/2)) createScoreFloat(x,y,gain, multiplier>1.1);
    }, pos*38);
  });
  setTimeout(()=>{ if(n>=4) createCombo(n,gain); }, n*18);
  if(n>=5) screenShake(n>=7?2.5:1.2);
  if(n>=7){ slowMo(450); setTimeout(()=>createConfetti(), 60); }
  if(n>=10){ slowMo(700); setTimeout(()=>{createConfetti(); setTimeout(()=>createConfetti(),120)},80); screenShake(3); }
  sfxPop(n);
  speakCombo(n);
  $('msg').textContent = n>=7?`🔥 MEGA x${n} • x${multiplier.toFixed(1)} +${gain}` : n>=5?`💥 SUPER x${n} • x${multiplier.toFixed(1)} +${gain}` : `💥 ${n} → +${gain}`;
  const totalDelay = sorted.length*38 + 360;
  setTimeout(()=>{
    sorted.forEach(i=> grid[i]=null);
    for(let c=0;c<SIZE;c++){ let w=SIZE-1; for(let r=SIZE-1;r>=0;r--){ const i=idx(r,c); if(grid[i]){ if(w!==r){ grid[idx(w,c)]=grid[i]; grid[i]=null } w-- } } for(let r=w;r>=0;r--) grid[idx(r,c)]={fruit:randF()} }
    render(true); updBottles(); updHUD();
    if(score>=target){ win(); busy=false; return; }
    if(moves<=0){ lose(); busy=false; return; }
    if(!hasGroup(grid)){ $('msg').textContent="Plus de groupe → mélange auto 🔀"; setTimeout(()=>{ shuffleGrid(false); busy=false; },600); } else busy=false;
  }, totalDelay);
}
function updBottles(){
  const cont=$('bottles'); cont.innerHTML=''; FRUITS.forEach(f=>{ const cnt=bottles[f]||0; const pct=Math.min(100,cnt/25*100); const el=document.createElement('div'); el.className='bot'+(pct>=100?' done':''); el.innerHTML=`<div>${f}</div><div class="bbar"><div class="bar-i" style="width:${pct}%"></div></div><div>${cnt}</div>`; cont.appendChild(el) })
}
function updHUD(){ $('lvl').textContent=level; $('sc').textContent=score; $('mv').textContent=moves; $('tm').textContent=Math.floor(timeLeft/60)+':'+String(timeLeft%60).padStart(2,'0'); $('obj').textContent=score+' / '+target; $('fill').style.width=Math.min(100,score/target*100)+'%'; $('shuffleBtn').textContent=`🔀 Mélanger (${shuffle})` }
function startTimer(){ clearInterval(timer); timeLeft=90; updHUD(); timer=setInterval(()=>{ if(over) return; timeLeft--; updHUD(); if(timeLeft<=0) lose() },1000) }
function stopTimer(){ clearInterval(timer) }
function win(){ over=true; stopTimer(); createConfetti(); setTimeout(()=>createConfetti(),180); setTimeout(()=>createConfetti(),360); $('winLvl').textContent=level; $('winTxt').textContent=`${score} pts • Multi max x${multiplier.toFixed(1)} • ${moves} coups restants !`; $('ovWin').classList.add('show') }
function lose(){ over=true; stopTimer(); $('loseTxt').textContent=`Score ${score} / ${target}. Multi max x${multiplier.toFixed(1)} • Enchaîne vite pour monter le multi !`; $('ovLose').classList.add('show') }
function shuffleGrid(cost=true){
  if(cost){ if(shuffle<=0) return; shuffle-- }
  let fruits=grid.filter(x=>x).map(x=>x.fruit); for(let i=fruits.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [fruits[i],fruits[j]]=[fruits[j],fruits[i]] }
  let k=0; for(let i=0;i<SIZE*SIZE;i++) if(grid[i]) grid[i].fruit=fruits[k++]; else grid[i]={fruit:randF()};
  let tries=0; while(!hasGroup(grid)&&tries<60){ for(let i=0;i<SIZE*SIZE;i++) grid[i]={fruit:randF()}; tries++ }
  render(true); updHUD(); screenShake(1); comboChain=0; multiplier=1; $('mult').textContent='x1.0'; $('chain').classList.remove('show');
}
function startLevel(){
  score=0; moves=25; target=tgt(level); bottles={}; over=false; busy=false; shuffle=2; grid=makeGrid(); render(true); updBottles(); updHUD(); startTimer(); $('msg').textContent="Touche un groupe de 2+ 💥 Enchaîne pour monter le multi !";
}
const avRow=$('avatarRow'); AVATARS.forEach((av,i)=>{ const b=document.createElement('button'); b.className='a-card'+(i===0?' selected':''); b.textContent=av; b.onclick=()=>{ avRow.querySelectorAll('.a-card').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); selectedAvatar=av }; avRow.appendChild(b) });
document.querySelectorAll('.t-card').forEach(c=>{ c.onclick=()=>{ document.querySelectorAll('.t-card').forEach(x=>x.classList.remove('selected')); c.classList.add('selected'); selectedTheme=c.dataset.theme; FRUITS=THEMES[selectedTheme]; document.body.className='theme-'+selectedTheme; $('playBtn').disabled=false } });
$('playBtn').onclick=()=>{ if(!selectedTheme) return; FRUITS=THEMES[selectedTheme]; document.body.className='theme-'+selectedTheme; $('startMenu').style.display='none'; $('gameWrap').style.display='flex'; $('welcome').textContent=`Salut ${selectedAvatar} ${$('pseudo').value.trim()||'Joueur'} ! Mode ULTIMATE activé 👑`; level=1; comboChain=0; multiplier=1; startLevel() };
$('restartBtn').onclick=()=>{ level=1; comboChain=0; multiplier=1; startLevel() };
$('backBtn').onclick=()=>{ stopTimer(); $('gameWrap').style.display='none'; $('startMenu').style.display='flex'; $('ovWin').classList.remove('show'); $('ovLose').classList.remove('show') };
$('shuffleBtn').onclick=()=>shuffleGrid(true);
$('voiceBtn').onclick=()=>{
  voiceEnabled=!voiceEnabled;
  $('voiceBtn').textContent=voiceEnabled?'🔊 Voix ON':'🔇 Voix OFF';
  $('voiceBtn').style.background=voiceEnabled?'linear-gradient(160deg,#3ee6b0,#4fc3ff)':'linear-gradient(160deg,#666,#999)';
  if(voiceEnabled){ speechSynthesis.cancel(); const t=new SpeechSynthesisUtterance('Voix activée !'); t.lang='fr-FR'; t.rate=1.1; speechSynthesis.speak(t); }
};
$('nextBtn').onclick=()=>{ $('ovWin').classList.remove('show'); level++; startLevel() };
$('retryBtn').onclick=()=>{ $('ovLose').classList.remove('show'); level=1; comboChain=0; multiplier=1; startLevel() };
