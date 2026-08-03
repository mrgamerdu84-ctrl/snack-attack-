function render(withFall=false){
  board.innerHTML='';
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    const i=idx(r,c); const d=grid[i];
    const el=document.createElement('div'); el.className='cell'+(withFall?' fall':''); el.dataset.r=r; el.dataset.c=c;
    if(d){ el.textContent=d.fruit; if(withFall) el.style.animationDelay=((SIZE-1 - r)*0.05 + Math.random()*0.07)+'s'; }
    else el.style.visibility='hidden';
    el.addEventListener('pointerenter', ()=>{ if(busy||over) return; highlight(r,c) });
    el.addEventListener('click', ()=>{ if(busy||over) return; tap(r,c) });
    board.appendChild(el);
  }
}
function highlight(r,c){
  fx.querySelectorAll('.laser').forEach(e=>e.remove());
  board.querySelectorAll('.cell').forEach(x=>x.classList.remove('hl'));
  const gr=getGroup(r,c);
  if(gr.length>=2){
    gr.forEach(i=>{ const rr=Math.floor(i/SIZE),cc=i%SIZE; const el=board.querySelector(`.cell[data-r="${rr}"][data-c="${cc}"]`); if(el) el.classList.add('hl') });
    const cs=board.clientWidth/SIZE;
    const cx0=c*cs+cs/2, cy0=r*cs+cs/2;
    gr.forEach(i=>{
      if(i===idx(r,c)) return;
      const rr=Math.floor(i/SIZE),cc=i%SIZE;
      const x1=cc*cs+cs/2, y1=rr*cs+cs/2;
      const dx=x1-cx0, dy=y1-cy0;
      const len=Math.sqrt(dx*dx+dy*dy);
      const ang=Math.atan2(dy,dx)*180/Math.PI;
      const laser=document.createElement('div'); laser.className='laser';
      laser.style.left=cx0+'px'; laser.style.top=cy0+'px'; laser.style.width=len+'px'; laser.style.transform=`rotate(${ang}deg)`;
      fx.appendChild(laser);
      laser.animate([{opacity:0,transform:`rotate(${ang}deg) scaleX(0)`},{opacity:1,transform:`rotate(${ang}deg) scaleX(1)`}],{duration:120,easing:'ease-out'}).onfinish=()=>{
        laser.animate([{opacity:1},{opacity:0}],{duration:200,delay:100}).onfinish=()=>laser.remove();
      };
    });
    $('msg').textContent=`💥 Groupe ${gr.length} → +${calcBase(gr.length)} pts • Multi x${multiplier.toFixed(1)}`;
  } else {
    $('msg').textContent="Il faut 2+ collées 🙃";
  }
}
function calcBase(n){ if(n<2) return 0; let b=n*35; if(n>=5) b+=(n-4)*60; if(n>=7) b+=180; if(n>=10) b+=400; return b }
function calcScore(n){ return Math.floor(calcBase(n)*multiplier) }
function screenShake(p=1){ document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); if(navigator.vibrate) navigator.vibrate(p*60); setTimeout(()=>document.body.classList.remove('shake'),360); }
function slowMo(ms=400){ document.body.classList.add('slowmo'); setTimeout(()=>document.body.classList.remove('slowmo'),ms); }
function createParticles(x,y,emoji,count){
  for(let i=0;i<count;i++){
    const p=document.createElement('div'); p.className='particle';
    p.textContent = Math.random()<0.3? ['✨','⭐','💥','💫'][Math.floor(Math.random()*4)] : emoji;
    p.style.left=x+'px'; p.style.top=y+'px';
    const ang=Math.random()*Math.PI*2; const dist=20+Math.random()*55;
    const dx=Math.cos(ang)*dist, dy=Math.sin(ang)*dist;
    fx.appendChild(p);
    p.animate([
      {transform:`translate(-50%,-50%) translate(0,0) scale(0.5)`,opacity:1},
      {transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1.3)`,opacity:1,offset:0.6},
      {transform:`translate(-50%,-50%) translate(${dx}px,${dy+22}px) scale(0)`,opacity:0}
    ],{duration:600+Math.random()*350,easing:'cubic-bezier(.25,.46,.45,.94)'}).onfinish=()=>p.remove();
  }
}
function createRing(x,y){ const r=document.createElement('div'); r.className='ring'; r.style.left=x+'px'; r.style.top=y+'px'; r.style.width='14px'; r.style.height='14px'; fx.appendChild(r); r.animate([{transform:'translate(-50%,-50%) scale(0)',opacity:1},{transform:'translate(-50%,-50%) scale(5)',opacity:0}],{duration:550,easing:'ease-out'}).onfinish=()=>r.remove(); }
function createScoreFloat(x,y,pts,isMult=false){
  const s=document.createElement('div'); s.className='score-float'; s.textContent=(isMult?`x${multiplier.toFixed(1)} `:'')+`+${pts}`; s.style.left=x+'px'; s.style.top=y+'px';
  if(isMult) s.style.color='#ffb700';
  fx.appendChild(s);
  s.animate([
    {transform:'translate(-50%,-50%) scale(0.5)',opacity:0},
    {transform:'translate(-50%,-50%) scale(1.5)',opacity:1,offset:0.2},
    {transform:'translate(-50%,-130%) scale(1)',opacity:0}
  ],{duration:900,easing:'ease-out'}).onfinish=()=>s.remove();
}
function createCombo(n,pts){
  const c=document.createElement('div'); c.className='combo';
  const main=document.createElement('div'); main.className='combo-main';
  const sub=document.createElement('div'); sub.className='combo-sub';
  if(n>=10){ main.textContent=`INSANE x${n}!!!`; sub.textContent=`+${pts} • x${multiplier.toFixed(1)} • ULTRA`; }
  else if(n>=7){ main.textContent=`MEGA x${n}!!`; sub.textContent=`+${pts} • x${multiplier.toFixed(1)}`; }
  else if(n>=5){ main.textContent=`SUPER x${n}!`; sub.textContent=`+${pts} • x${multiplier.toFixed(1)}`; }
  else { main.textContent=`COMBO x${n}!`; sub.textContent=`+${pts}`; }
  c.appendChild(main); c.appendChild(sub); fx.appendChild(c);
  c.animate([{transform:'translate(-50%,-50%) scale(0)',opacity:0},{transform:'translate(-50%,-50%) scale(1.4)',opacity:1,offset:0.4},{transform:'translate(-50%,-90%) scale(1)',opacity:0}],{duration:1000,easing:'ease-out',delay:80}).onfinish=()=>c.remove();
}
function createConfetti(){
  const colors=['#ff5da2','#ffe066','#3ee6b0','#4fc3ff','#a855f7','#ffb700'];
  for(let i=0;i<32;i++){
    const cf=document.createElement('div'); cf.className='confetti';
    cf.style.left=Math.random()*100+'%'; cf.style.background=colors[Math.floor(Math.random()*colors.length)];
    cf.style.width=(5+Math.random()*8)+'px'; cf.style.height=(5+Math.random()*8)+'px';
    cf.style.borderRadius=Math.random()<0.5?'50%':'3px';
    fx.appendChild(cf);
    cf.animate([{transform:`translateY(0) rotate(0deg)`,opacity:1},{transform:`translateY(${frame.clientHeight+80}px) rotate(${700+Math.random()*500}deg)`,opacity:0}],{duration:800+Math.random()*700,delay:Math.random()*200,easing:'cubic-bezier(.25,.46,.45,.94)'}).onfinish=()=>cf.remove();
  }
}
