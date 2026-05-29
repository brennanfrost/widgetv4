// Redtail Air Charter Quote Widget v1.3
// Adds: Same-Day Return Trip, ground wait fee, removes 72hr constraint
(function(){
const CRUISE_ALT=12500;
const HS_PORTAL='242418063';
const HS_FORM='70adfa52-03f7-457a-8254-2615d5545d50';
const WAIT_RATE=200; // $200/hr ground wait, per aircraft
const IMGS={
  tbm_ext:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f61a2377c80edeb3f0e_TBM%20Exterior.png',
  tbm_int:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f854fc11f0b40e706f9_Screenshot%202026-04-14%20at%2011.39.42%E2%80%AFAM.png',
  kodiak_ext:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f94bb2a912aaeeba280_Kodiak%20100%20exterior%20.JPG',
  kodiak_int:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f61d6bdea8424f2bac7_Kodiak%20Interior.png',
  airvan_ext:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f942f870b570e0786a8_Airvan%20Exterior.png',
  airvan_int:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f6152c7f011404f03c6_Airvan%20Interior.png',
  c207_ext:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187ffe413dc05d2d1061e4_Screenshot%202026-05-28%20at%2011.47.59%E2%80%AFAM.jpg',
  c207_int:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f6152c7f011404f03c3_207%20Interior.png',
  c172_ext:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f94f1a3b21cf5f6ae37_Cessna%20Exterior%20.JPG',
  c172_int:'https://cdn.prod.website-files.com/6763978141891b5385add7b5/6a187f613bf54d6415c55e27_172%20interior.png'
};
const FLEET=[
  {id:'tmb700',name:'TBM 700',      type:'Turboprop',seats:'Up to 5',pax:5, range_nm:1650,rate:2200,fet:true, ext:'tbm_ext',   int_:'tbm_int',   climb_kts:150,climb_fpm:1875,cruise_kts:240,desc_kts:180,desc_fpm:1500},
  {id:'kodiak',name:'Kodiak 100',   type:'Turboprop',seats:'Up to 9',pax:9, range_nm:1005,rate:1750,fet:true, ext:'kodiak_ext',int_:'kodiak_int',climb_kts:120,climb_fpm:800, cruise_kts:150,desc_kts:160,desc_fpm:500},
  {id:'airvan',name:'Gipps Airvan', type:'Piston',   seats:'Up to 7',pax:7, range_nm:600, rate:1030,fet:false,ext:'airvan_ext',int_:'airvan_int',climb_kts:90, climb_fpm:400, cruise_kts:120,desc_kts:125,desc_fpm:300},
  {id:'c207',  name:'Cessna 207',   type:'Piston',   seats:'Up to 6',pax:6, range_nm:520, rate:875, fet:false,ext:'c207_ext',  int_:'c207_int',  climb_kts:95, climb_fpm:500, cruise_kts:115,desc_kts:100,desc_fpm:500},
  {id:'c172',  name:'Cessna 172',   type:'Piston',   seats:'Up to 3',pax:3, range_nm:640, rate:590, fet:false,ext:'c172_ext',  int_:'c172_int',  climb_kts:70, climb_fpm:500, cruise_kts:105,desc_kts:110,desc_fpm:500}
];
const CLR={
  bg:'#F0EBE3',bgCard:'#FFFFFF',bgInput:'#F7F4EF',border:'#E0D8CE',
  text:'#1C1C1A',textSub:'#6B6560',textMuted:'#9E9890',
  red:'#C0392B',redHover:'#A93226',redLight:'#FDECEA',
  infoBar:'#F7F4EF',infoBorder:'#E8E2D9'
};
const HOME={la:38.755,lo:-109.755,t:0};
const HOME_CODES=new Set(['KCNY','CNY']);
// mode: 'oneway' | 'roundtrip' | 'sdrt'
let mode='oneway',tripData=null,leadData=null,selectedAC=null,origSelected=null,destSelected=null;
let hsSubmitted=false;
const AP=window.RT_AP||{};
const AL=window.RT_AL||{};
const CM=window.RT_CM||{};

const style=document.createElement('style');
style.textContent=`
html,body{overflow-x:hidden!important;-webkit-overflow-scrolling:touch;}
.rt-w{width:100%;max-width:900px;background:${CLR.bg};border-radius:16px;padding:40px 48px;color:${CLR.text};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 32px rgba(0,0,0,0.08);}
.rt-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${CLR.textMuted};font-weight:600;margin-bottom:8px;}
.rt-title{font-size:26px;font-weight:700;color:${CLR.text};line-height:1.2;margin-bottom:28px;}
.rt-tabs{display:flex;gap:8px;margin-bottom:28px;flex-wrap:wrap;}
.rt-tab{padding:8px 20px;border-radius:999px;font-size:13px;cursor:pointer;border:1.5px solid ${CLR.border};background:${CLR.bgCard};color:${CLR.textSub};transition:all .15s;font-family:inherit;font-weight:500;}
.rt-tab.active{background:${CLR.red};border-color:${CLR.red};color:#fff;font-weight:600;}
.rt-tab:hover:not(.active){background:${CLR.bgInput};border-color:${CLR.textMuted};color:${CLR.text};}
.rt-g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.rt-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;}
.rt-g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:16px;}
.rt-f{display:flex;flex-direction:column;gap:6px;position:relative;}
.rt-f label{font-size:11px;color:${CLR.textMuted};font-weight:600;letter-spacing:.08em;text-transform:uppercase;}
.rt-f input,.rt-f select{padding:11px 14px;border-radius:8px;border:1.5px solid ${CLR.border};background:${CLR.bgInput};color:${CLR.text};font-size:14px;width:100%;font-family:inherit;outline:none;transition:border-color .15s;-webkit-appearance:none;appearance:none;}
.rt-f input::placeholder{color:${CLR.textMuted};}
.rt-f input:focus,.rt-f select:focus{border-color:${CLR.red};background:${CLR.bgCard};}
.rt-drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:${CLR.bgCard};border:1.5px solid ${CLR.red};border-radius:8px;z-index:200;max-height:220px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.12);}
.rt-di{padding:10px 14px;cursor:pointer;font-size:13px;color:${CLR.text};border-bottom:1px solid ${CLR.border};transition:background .1s;}
.rt-di:last-child{border-bottom:none;}
.rt-di:hover,.rt-di.h{background:${CLR.redLight};}
.rt-code{font-size:11px;color:${CLR.red};font-weight:700;margin-right:6px;}
.rt-aname{color:${CLR.textSub};}
.rt-btn{width:100%;padding:14px;background:${CLR.red};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s;letter-spacing:.02em;margin-top:8px;}
.rt-btn:hover{background:${CLR.redHover};}
.rt-btn:active{transform:scale(.99);}
.rt-err{color:${CLR.red};font-size:12px;margin-top:8px;}
.rt-info-note{font-size:12px;color:${CLR.textSub};background:${CLR.bgCard};border:1px solid ${CLR.border};border-radius:8px;padding:10px 14px;margin-bottom:16px;line-height:1.5;}
.rt-lh{margin-bottom:24px;}
.rt-lh h2{font-size:22px;font-weight:700;color:${CLR.text};margin-bottom:8px;}
.rt-lh p{font-size:14px;color:${CLR.textSub};line-height:1.6;}
.rt-rs{background:${CLR.bgCard};border:1.5px solid ${CLR.border};border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:${CLR.textSub};line-height:1.7;}
.rt-rs strong{color:${CLR.text};font-weight:600;}
.rt-list{display:flex;flex-direction:column;gap:16px;margin-bottom:20px;}
.rt-card{border:2px solid ${CLR.border};border-radius:12px;background:${CLR.bgCard};overflow:hidden;transition:border-color .2s,box-shadow .2s;cursor:pointer;user-select:none;display:flex;flex-direction:column;box-shadow:0 1px 4px rgba(0,0,0,0.06);}
.rt-card:hover{border-color:${CLR.textMuted};box-shadow:0 4px 12px rgba(0,0,0,0.1);}
.rt-card.sel{border-color:${CLR.red};box-shadow:0 4px 16px rgba(192,57,43,0.15);}
.rt-card.un{opacity:.35;pointer-events:none;cursor:default;}
.rt-photos{display:grid;grid-template-columns:1fr 1fr;height:190px;gap:2px;background:${CLR.border};flex-shrink:0;}
.rt-photo{width:100%;height:100%;object-fit:cover;display:block;}
.rt-info{display:grid;grid-template-columns:auto auto auto 1fr auto;align-items:stretch;background:${CLR.infoBar};border-top:1.5px solid ${CLR.infoBorder};flex-shrink:0;}
.rt-cell{padding:14px 18px;border-right:1px solid ${CLR.infoBorder};display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:0;}
.rt-cell:last-child{border-right:none;}
.rt-cell.g{flex:1;}
.rt-cl{font-size:10px;color:${CLR.textMuted};text-transform:uppercase;letter-spacing:.07em;font-weight:600;white-space:nowrap;}
.rt-cv{font-size:14px;font-weight:600;color:${CLR.text};white-space:nowrap;}
.rt-cv.t{color:${CLR.red};font-size:22px;font-weight:700;line-height:1.1;}
.rt-cv.p{color:${CLR.text};font-size:22px;font-weight:700;line-height:1.1;}
.rt-cv.na{color:${CLR.textMuted};font-size:13px;font-weight:400;}
.rt-div{display:flex;align-items:center;gap:12px;margin:8px 0;}
.rt-div span{font-size:11px;color:${CLR.textMuted};text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;}
.rt-div:before,.rt-div:after{content:'';flex:1;border-top:1px solid ${CLR.border};}
.rt-book{width:100%;padding:14px;background:${CLR.red};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;letter-spacing:.02em;}
.rt-book:hover{background:${CLR.redHover};}
.rt-book:disabled{background:${CLR.border};color:${CLR.textMuted};cursor:not-allowed;}
.rt-berr{color:${CLR.red};font-size:12px;margin-top:8px;text-align:center;min-height:18px;}
.rt-fn{margin-top:20px;padding:14px 18px;background:${CLR.bgCard};border-radius:8px;border:1.5px solid ${CLR.border};font-size:13px;font-weight:600;color:${CLR.textSub};text-align:center;line-height:1.6;}
.rt-ty{text-align:center;padding:32px 0 16px;}
.rt-ty .ic{font-size:48px;margin-bottom:16px;}
.rt-ty h3{font-size:22px;font-weight:700;color:${CLR.text};margin-bottom:10px;}
.rt-ty p{font-size:14px;color:${CLR.textSub};line-height:1.7;}
.rt-ty a{color:${CLR.red};font-weight:600;text-decoration:none;}
.rt-back{display:inline-block;margin-top:16px;font-size:13px;color:${CLR.red};cursor:pointer;background:none;border:none;font-family:inherit;font-weight:500;}
.rt-back:hover{text-decoration:underline;}
.rt-note{font-size:11px;color:${CLR.textMuted};text-align:center;margin-top:14px;}
.rt-sel-sum{background:${CLR.redLight};border:1.5px solid #f5c6c2;border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:${CLR.text};line-height:1.7;}
.rt-hs-err{background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;font-size:13px;color:#856404;margin-top:12px;text-align:center;}
@media(max-width:680px){
  .rt-w{padding:24px 18px;}
  .rt-title{font-size:20px;}
  .rt-g2,.rt-g3,.rt-g4{grid-template-columns:1fr 1fr;}
  .rt-photos{height:130px;}
  .rt-info{grid-template-columns:1fr 1fr;}
  .rt-cell{border-right:none;border-bottom:1px solid ${CLR.infoBorder};}
  .rt-cv.t,.rt-cv.p{font-size:18px;}
}
@media(max-width:400px){.rt-g2,.rt-g3,.rt-g4{grid-template-columns:1fr;}}
`;
document.head.appendChild(style);

const container=document.getElementById('rt-app');
if(!container){console.error('Redtail widget: element id="rt-app" not found');return;}
container.className='rt-w';

function hav(la1,lo1,la2,lo2){const R=3440.065,dL=(la2-la1)*Math.PI/180,dO=(lo2-lo1)*Math.PI/180,a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function fmtT(h){const hh=Math.floor(h),mm=Math.round((h-hh)*60);return mm>0?`${hh}h ${mm}m`:`${hh}h`;}
function fmtDate(d){if(!d)return'';const[y,m,day]=d.split('-');const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return`${mo[parseInt(m)-1]} ${parseInt(day)}, ${y}`;}
function esc(s){const d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML;}
function lu(c){return AP[c.trim().toUpperCase()]||null;}
function pad(a){return a.t?0.1:0.05;}
function isHomeCode(c){return HOME_CODES.has(c.toUpperCase());}

function flightTime(ac,nm){
  const ch=CRUISE_ALT/ac.climb_fpm/60,dh=CRUISE_ALT/ac.desc_fpm/60;
  const cn=ac.climb_kts*ch,dn=ac.desc_kts*dh;
  if(nm<=(cn+dn))return nm/((ac.climb_kts+ac.desc_kts)/2);
  return ch+(nm-cn-dn)/ac.cruise_kts+dh;
}

function calcPad(orig,dest,hasOutFerry,hasRetFerry,isRT){
  const hp=0.05,op=pad(orig),dp=pad(dest);
  if(!hasOutFerry&&!hasRetFerry)return isRT?hp+dp+dp+hp:hp+dp;
  if(!isRT)return hp+op+dp+(hasRetFerry?hp:0);
  return hp+op+dp+dp+op+hp;
}

function calcTotal(ac,orig,dest,pax,oc,dc,isRT,waitHrs){
  const legNm=Math.round(hav(orig.la,orig.lo,dest.la,dest.lo));
  if(pax>ac.pax)return{unavail:true,reason:'pax'};
  if(legNm>ac.range_nm)return{unavail:true,reason:'range'};

  const origIsHome=isHomeCode(oc);
  const destIsHome=isHomeCode(dc);

  const outFerryNm=origIsHome?0:Math.round(hav(HOME.la,HOME.lo,orig.la,orig.lo));
  const retFerryNm=(destIsHome||(isRT&&origIsHome))?0:Math.round(hav(dest.la,dest.lo,HOME.la,HOME.lo));

  const hasOutFerry=outFerryNm>5;
  const hasRetFerry=retFerryNm>5;

  const oneLegFly=flightTime(ac,legNm);
  const tripFly=oneLegFly*(isRT?2:1);
  const outFerryFly=hasOutFerry?flightTime(ac,outFerryNm):0;
  const retFerryFly=hasRetFerry?flightTime(ac,retFerryNm):0;
  const taxi=calcPad(orig,dest,hasOutFerry,hasRetFerry,isRT);
  const billed=tripFly+outFerryFly+retFerryFly+taxi;

  // Ground wait: $200/hr per aircraft, minimum 1hr, whole hours only
  const waitCost=(waitHrs||0)*WAIT_RATE;

  const sub=Math.round(billed*ac.rate)+waitCost;
  const fet=ac.fet?Math.round(sub*0.075):0;
  const total=Math.round((sub+fet)*1.03);
  return{unavail:false,total,flightTime:oneLegFly,legNm,waitCost};
}

function searchAirports(query){
  if(!query||query.length<2)return[];
  const q=query.toLowerCase().trim();
  const results=[],seen=new Set();
  const direct=lu(q.toUpperCase());
  if(direct){seen.add(q.toUpperCase());results.push({code:q.toUpperCase(),...direct});}
  for(const[alias,codes]of Object.entries(AL)){
    if(alias===q||alias.startsWith(q)||q.startsWith(alias)){
      codes.forEach(code=>{if(!seen.has(code)&&AP[code]){seen.add(code);results.push({code,...AP[code]});}});
    }
  }
  const matched=new Set();
  for(const[word,codes]of Object.entries(CM)){
    if(word.startsWith(q)||q.startsWith(word)||word===q)codes.forEach(c=>matched.add(c));
  }
  matched.forEach(code=>{if(!seen.has(code)&&AP[code]){seen.add(code);results.push({code,...AP[code]});}});
  results.sort((a,b)=>{
    const an=a.n.toLowerCase(),bn=b.n.toLowerCase();
    const ae=an.startsWith(q)||a.code.toLowerCase()===q;
    const be=bn.startsWith(q)||b.code.toLowerCase()===q;
    if(ae&&!be)return -1;if(!ae&&be)return 1;
    return an.localeCompare(bn);
  });
  return results.slice(0,8);
}

let dO=-1,dD=-1;
function setupSearch(iId,dId){
  const inp=document.getElementById(iId),drp=document.getElementById(dId);
  if(!inp||!drp)return;
  const isO=iId==='rt-orig';
  inp.addEventListener('input',()=>{
    if(isO)origSelected=null;else destSelected=null;
    const res=searchAirports(inp.value.trim());
    if(!res.length){drp.innerHTML='';drp.style.display='none';return;}
    if(isO)dO=-1;else dD=-1;
    drp.innerHTML=res.map(r=>`<div class="rt-di" onmousedown="event.preventDefault()" onclick="rtSel('${iId}','${dId}','${r.code}')"><span class="rt-code">${r.code}</span><span class="rt-aname">${r.n}</span></div>`).join('');
    drp.style.display='block';
  });
  inp.addEventListener('blur',()=>setTimeout(()=>drp.style.display='none',150));
  inp.addEventListener('keydown',(e)=>{
    const its=[...drp.querySelectorAll('.rt-di')];
    if(!its.length)return;
    let idx=isO?dO:dD;
    if(e.key==='ArrowDown')idx=Math.min(idx+1,its.length-1);
    else if(e.key==='ArrowUp')idx=Math.max(idx-1,0);
    else if(e.key==='Enter'&&idx>=0){e.preventDefault();its[idx].click();return;}
    else return;
    e.preventDefault();
    its.forEach(el=>el.classList.remove('h'));
    if(idx>=0)its[idx].classList.add('h');
    if(isO)dO=idx;else dD=idx;
  });
}

window.rtSel=function(iId,dId,code){
  const inp=document.getElementById(iId),drp=document.getElementById(dId);
  if(inp)inp.value=code;
  if(drp)drp.style.display='none';
  if(iId==='rt-orig')origSelected=code;else destSelected=code;
};

window.rtToggle=function(id){
  if(selectedAC===id){
    selectedAC=null;
    document.querySelectorAll('.rt-card').forEach(el=>el.classList.remove('sel'));
    document.getElementById('rt-book').disabled=true;
  }else{
    selectedAC=id;
    document.querySelectorAll('.rt-card:not(.un)').forEach(el=>el.classList.toggle('sel',el.dataset.id===id));
    document.getElementById('rt-book').disabled=false;
  }
  const e=document.getElementById('rt-berr');
  if(e)e.textContent='';
};

window.rtMode=function(m){mode=m;render('search');};

window.rtSearch=function(){
  const oInp=document.getElementById('rt-orig').value.trim();
  const dInp=document.getElementById('rt-dest').value.trim();
  const pax=parseInt(document.getElementById('rt-pax').value)||1;
  const date=document.getElementById('rt-date').value;
  const err=document.getElementById('rt-serr');
  const oc=(origSelected||oInp).toUpperCase();
  const dc=(destSelected||dInp).toUpperCase();
  const orig=lu(oc),dest=lu(dc);

  if(!orig){err.textContent=`"${oInp}" not found. Try a city name like "Moab" or code like "SLC".`;return;}
  if(!dest){err.textContent=`"${dInp}" not found.`;return;}
  if(oc===dc){err.textContent='Origin and destination must be different.';return;}

  // Past date guard
  const today=new Date();today.setHours(0,0,0,0);
  const depDate=new Date(date+'T00:00:00');
  if(depDate<today){err.textContent='Departure date cannot be in the past.';return;}

  // Round trip validation
  if(mode==='roundtrip'){
    const retDate=document.getElementById('rt-retdate')?document.getElementById('rt-retdate').value:'';
    if(!retDate){err.textContent='Please select a return date.';return;}
    const retD=new Date(retDate+'T00:00:00');
    if(retD<=depDate){err.textContent='Return date must be after departure date.';return;}
  }

  // SDRT validation
  if(mode==='sdrt'){
    const retDate=document.getElementById('rt-retdate')?document.getElementById('rt-retdate').value:'';
    const waitHrs=parseInt(document.getElementById('rt-wait')?document.getElementById('rt-wait').value:'1')||1;
    if(!retDate){err.textContent='Please select a return date.';return;}
    const retD=new Date(retDate+'T00:00:00');
    // Must be same day
    if(retD.toDateString()!==depDate.toDateString()){
      err.textContent='Same-day return requires both dates to be the same. For overnight trips, use the Round Trip option.';
      return;
    }
  }

  err.textContent='';
  const waitHrs=mode==='sdrt'?(parseInt(document.getElementById('rt-wait')?document.getElementById('rt-wait').value:'1')||1):0;
  const retDate=(['roundtrip','sdrt'].includes(mode))?(document.getElementById('rt-retdate')?document.getElementById('rt-retdate').value:''):'';
  const isRT=['roundtrip','sdrt'].includes(mode);

  tripData={oc,dc,orig,dest,pax,date,retDate,isRT,isSdrt:mode==='sdrt',waitHrs,origName:orig.n,destName:dest.n};
  selectedAC=null;
  hsSubmitted=false;
  render('results');
};

window.rtBook=function(){
  if(!selectedAC){
    document.getElementById('rt-berr').textContent='Please select an aircraft before continuing.';
    document.getElementById('rt-berr').scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  if(leadData){
    if(!hsSubmitted)submitHS();
    render('thankyou');
  }else{
    render('lead');
  }
};

window.rtLead=function(){
  const first=document.getElementById('rt-first').value.trim().slice(0,100);
  const last=document.getElementById('rt-last').value.trim().slice(0,100);
  const email=document.getElementById('rt-email').value.trim().slice(0,200);
  const phone=document.getElementById('rt-phone').value.trim().slice(0,20);
  const err=document.getElementById('rt-lerr');
  if(!first||!last){err.textContent='Please enter your full name.';return;}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){err.textContent='Please enter a valid email address.';return;}
  if(phone.replace(/\D/g,'').length<7){err.textContent='Please enter a valid phone number.';return;}
  err.textContent='';
  leadData={first,last,email,phone};
  submitHS();
  render('thankyou');
};

window.rtRender=function(s){render(s);};

function submitHS(){
  if(hsSubmitted)return;
  hsSubmitted=true;
  const ac=FLEET.find(a=>a.id===selectedAC);
  const q=ac?calcTotal(ac,tripData.orig,tripData.dest,tripData.pax,tripData.oc,tripData.dc,tripData.isRT,tripData.waitHrs):null;
  const tripType=tripData.isSdrt?'Same-day return':tripData.isRT?'Round trip':'One way';
  const waitNote=tripData.isSdrt&&tripData.waitHrs?` | Ground wait: ${tripData.waitHrs}hr`:'';
  const msg=ac&&q&&!q.unavail
    ?`Aircraft: ${ac.name} | Route: ${tripData.oc} to ${tripData.dc} | ${tripData.pax} passenger${tripData.pax>1?'s':''} | Date: ${fmtDate(tripData.date)} | Type: ${tripType}${waitNote} | Est. total: $${q.total.toLocaleString()} | Flight time: ${fmtT(q.flightTime)}`
    :`Route: ${tripData.oc} to ${tripData.dc} | ${tripData.pax} pax | ${fmtDate(tripData.date)} | ${tripType}`;

  fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HS_PORTAL}/${HS_FORM}`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:[
      {name:'firstname',value:leadData.first},
      {name:'lastname',value:leadData.last},
      {name:'email',value:leadData.email},
      {name:'phone',value:leadData.phone},
      {name:'message',value:msg}
    ],context:{pageUri:window.location.href,pageName:document.title}})
  }).then(res=>{
    if(!res.ok){
      hsSubmitted=false;
      const errDiv=document.getElementById('rt-hs-err');
      if(errDiv)errDiv.style.display='block';
    }
  }).catch(()=>{
    hsSubmitted=false;
    const errDiv=document.getElementById('rt-hs-err');
    if(errDiv)errDiv.style.display='block';
  });
}

function render(screen){
  const app=document.getElementById('rt-app');
  if(screen==='search')rSearch(app);
  else if(screen==='lead')rLead(app);
  else if(screen==='results')rResults(app);
  else if(screen==='thankyou')rThankyou(app);
}

function todayStr(){return new Date().toISOString().split('T')[0];}
function maxDateStr(){const d=new Date();d.setFullYear(d.getFullYear()+1);return d.toISOString().split('T')[0];}

function rSearch(app){
  const isRT=mode==='roundtrip';
  const isSdrt=mode==='sdrt';
  const today=todayStr(),max=maxDateStr();

  app.innerHTML=`
<div class="rt-eyebrow">Redtail Air &middot; Moab, Utah</div>
<div class="rt-title">Get an instant charter quote</div>
<div class="rt-tabs">
  <button class="rt-tab ${mode==='oneway'?'active':''}" onclick="rtMode('oneway')">One way</button>
  <button class="rt-tab ${mode==='roundtrip'?'active':''}" onclick="rtMode('roundtrip')">Round trip</button>
  <button class="rt-tab ${mode==='sdrt'?'active':''}" onclick="rtMode('sdrt')">Same-day return</button>
</div>
${isSdrt?`<div class="rt-info-note">&#9997; Aircraft waits at your destination and returns the same day.</div>`:''}
<div class="rt-g2">
  <div class="rt-f"><label>From</label><input type="text" id="rt-orig" placeholder="City or airport code" autocomplete="off" oninput="origSelected=null"/><div id="rt-drop-o" class="rt-drop" style="display:none"></div></div>
  <div class="rt-f"><label>To</label><input type="text" id="rt-dest" placeholder="City or airport code" autocomplete="off" oninput="destSelected=null"/><div id="rt-drop-d" class="rt-drop" style="display:none"></div></div>
</div>
${isSdrt?`
<div class="rt-g4">
  <div class="rt-f"><label>Passengers</label><select id="rt-pax">${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}"${n===3?' selected':''}>${n} passenger${n>1?'s':''}</option>`).join('')}</select></div>
  <div class="rt-f"><label>Depart date</label><input type="date" id="rt-date" min="${today}" max="${max}" style="color-scheme:light;"/></div>
  <div class="rt-f"><label>Return date</label><input type="date" id="rt-retdate" min="${today}" max="${max}" style="color-scheme:light;"/></div>
  <div class="rt-f"><label>Ground wait (hrs)</label><select id="rt-wait">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===2?' selected':''}>${n} hour${n>1?'s':''}</option>`).join('')}</select></div>
</div>`:
isRT?`
<div class="rt-g3">
  <div class="rt-f"><label>Passengers</label><select id="rt-pax">${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}"${n===3?' selected':''}>${n} passenger${n>1?'s':''}</option>`).join('')}</select></div>
  <div class="rt-f"><label>Depart date</label><input type="date" id="rt-date" min="${today}" max="${max}" style="color-scheme:light;"/></div>
  <div class="rt-f"><label>Return date</label><input type="date" id="rt-retdate" min="${today}" max="${max}" style="color-scheme:light;"/></div>
</div>`:
`
<div class="rt-g2">
  <div class="rt-f"><label>Passengers</label><select id="rt-pax">${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}"${n===3?' selected':''}>${n} passenger${n>1?'s':''}</option>`).join('')}</select></div>
  <div class="rt-f"><label>Depart date</label><input type="date" id="rt-date" min="${today}" max="${max}" style="color-scheme:light;"/></div>
</div>`}
<div id="rt-serr" class="rt-err"></div>
<button class="rt-btn" onclick="rtSearch()">See available aircraft &rarr;</button>
<p class="rt-note">Pricing based on Redtail's fleet departing from Canyonlands (KCNY), Moab UT &middot; All flights subject to aircraft availability</p>`;

  const dateEl=document.getElementById('rt-date');
  if(dateEl)dateEl.value=today;
  origSelected=null;destSelected=null;dO=-1;dD=-1;
  setupSearch('rt-orig','rt-drop-o');
  setupSearch('rt-dest','rt-drop-d');
}

function rResults(app){
  const{oc,dc,orig,dest,pax,date,retDate,isRT,isSdrt,waitHrs,origName,destName}=tripData;
  const legNm=Math.round(hav(orig.la,orig.lo,dest.la,dest.lo));
  const results=FLEET.map(ac=>({ac,q:calcTotal(ac,orig,dest,pax,oc,dc,isRT,waitHrs)}));
  const avail=results.filter(r=>!r.q.unavail);
  const unavail=results.filter(r=>r.q.unavail);
  const tripLabel=isSdrt?'Same-day return':isRT?'Round trip':'One way';

  const aC=avail.map(({ac,q})=>`
<div class="rt-card" data-id="${ac.id}" onclick="rtToggle('${ac.id}')">
  <div class="rt-photos">
    <img class="rt-photo" src="${IMGS[ac.ext]}" alt="${esc(ac.name)} exterior" loading="lazy"/>
    <img class="rt-photo" src="${IMGS[ac.int_]}" alt="${esc(ac.name)} interior" loading="lazy"/>
  </div>
  <div class="rt-info">
    <div class="rt-cell"><span class="rt-cl">Aircraft</span><span class="rt-cv">${esc(ac.name)}</span></div>
    <div class="rt-cell"><span class="rt-cl">Type</span><span class="rt-cv">${esc(ac.type)}</span></div>
    <div class="rt-cell"><span class="rt-cl">Seats</span><span class="rt-cv">${esc(ac.seats)}</span></div>
    <div class="rt-cell g"><span class="rt-cl">Flight time</span><span class="rt-cv t">${fmtT(q.flightTime)}</span></div>
    <div class="rt-cell"><span class="rt-cl">Est. total</span><span class="rt-cv p">$${q.total.toLocaleString()}</span></div>
  </div>
</div>`).join('');

  const uC=unavail.length?`
<div class="rt-div"><span>Not available for this route</span></div>
${unavail.map(({ac,q})=>`
<div class="rt-card un">
  <div class="rt-photos">
    <img class="rt-photo" src="${IMGS[ac.ext]}" loading="lazy"/>
    <img class="rt-photo" src="${IMGS[ac.int_]}" loading="lazy"/>
  </div>
  <div class="rt-info">
    <div class="rt-cell"><span class="rt-cl">Aircraft</span><span class="rt-cv">${esc(ac.name)}</span></div>
    <div class="rt-cell"><span class="rt-cl">Type</span><span class="rt-cv">${esc(ac.type)}</span></div>
    <div class="rt-cell"><span class="rt-cl">Seats</span><span class="rt-cv">${esc(ac.seats)}</span></div>
    <div class="rt-cell g"></div>
    <div class="rt-cell"><span class="rt-cl">&nbsp;</span><span class="rt-cv na">${q.reason==='pax'?'Insufficient seating':'Outside range'}</span></div>
  </div>
</div>`).join('')}`:'';

  app.innerHTML=`
<div class="rt-rs">
  <strong>${esc(origName)} &rarr; ${esc(destName)}</strong> &middot; ${tripLabel}<br>
  ${pax} passenger${pax>1?'s':''} &middot; ${fmtDate(date)}${isSdrt&&waitHrs?` &middot; ${waitHrs}hr ground wait`:''}${isRT&&retDate&&!isSdrt?` &ndash; ${fmtDate(retDate)}`:''} &middot; ${legNm} nm
</div>
<div class="rt-list">${aC}${uC}</div>
<button id="rt-book" class="rt-book" onclick="rtBook()" disabled>Book now &rarr;</button>
<div id="rt-berr" class="rt-berr"></div>
<div style="text-align:center;margin-top:14px"><button class="rt-back" onclick="rtRender('search')">&larr; New search</button></div>
<div class="rt-fn">Prices are estimates. Final quotes confirmed by our team. Rates include aircraft, crew, and fuel. All flights subject to aircraft availability.</div>`;
}

function rLead(app){
  const ac=FLEET.find(a=>a.id===selectedAC);
  const q=ac?calcTotal(ac,tripData.orig,tripData.dest,tripData.pax,tripData.oc,tripData.dc,tripData.isRT,tripData.waitHrs):null;
  const tripLabel=tripData.isSdrt?'Same-day return':tripData.isRT?'Round trip':'One way';
  app.innerHTML=`
<div class="rt-lh"><h2>Almost there</h2><p>Enter your contact details and a Redtail team member will follow up to confirm availability and finalize your booking.</p></div>
${ac&&q&&!q.unavail?`<div class="rt-sel-sum">
  <strong>${esc(ac.name)}</strong> &middot; ${esc(tripData.origName)} &rarr; ${esc(tripData.destName)} &middot; ${tripLabel}<br>
  ${tripData.pax} passenger${tripData.pax>1?'s':''} &middot; ${fmtDate(tripData.date)}${tripData.isSdrt&&tripData.waitHrs?` &middot; ${tripData.waitHrs}hr ground wait`:''} &middot; <strong>Est. $${q.total.toLocaleString()}</strong>
</div>`:''}
<div class="rt-g2" style="margin-bottom:16px">
  <div class="rt-f"><label>First name</label><input type="text" id="rt-first" placeholder="John" maxlength="100"/></div>
  <div class="rt-f"><label>Last name</label><input type="text" id="rt-last" placeholder="Smith" maxlength="100"/></div>
</div>
<div class="rt-f" style="margin-bottom:16px"><label>Email address</label><input type="email" id="rt-email" placeholder="john@example.com" maxlength="200"/></div>
<div class="rt-f"><label>Phone number</label><input type="tel" id="rt-phone" placeholder="(555) 000-0000" maxlength="20"/></div>
<div id="rt-lerr" class="rt-err"></div>
<button class="rt-btn" onclick="rtLead()">Confirm booking request &rarr;</button>
<div id="rt-hs-err" class="rt-hs-err" style="display:none">Something went wrong. Please call us at <a href="tel:4352597421">(435) 259-7421</a>.</div>
<div style="text-align:center;margin-top:14px"><button class="rt-back" onclick="rtRender('results')">&larr; Back to results</button></div>`;
}

function rThankyou(app){
  const ac=FLEET.find(a=>a.id===selectedAC);
  const q=ac?calcTotal(ac,tripData.orig,tripData.dest,tripData.pax,tripData.oc,tripData.dc,tripData.isRT,tripData.waitHrs):null;
  const tripLabel=tripData.isSdrt?'same-day return':tripData.isRT?'round trip':'one-way';
  app.innerHTML=`
<div class="rt-ty">
  <div class="ic">&#9992;&#65039;</div>
  <h3>Request received!</h3>
  <p>Thanks${leadData?.first?`, ${esc(leadData.first)}`:''}. ${ac&&q&&!q.unavail?`Your ${tripLabel} booking request for the <strong>${esc(ac.name)}</strong> from ${esc(tripData.origName)} to ${esc(tripData.destName)} on ${fmtDate(tripData.date)} has been received. Estimated total: <strong>$${q.total.toLocaleString()}</strong>.`:''}</p>
  <p style="margin-top:8px;font-size:13px;color:${CLR.textMuted}">A team member will contact you to confirm availability.</p>
  <p style="margin-top:16px">Need to talk now?<br><a href="tel:4352597421">(435) 259-7421</a></p>
  <div id="rt-hs-err" class="rt-hs-err" style="display:none;margin-top:16px">We had trouble recording your request. Please call us at <a href="tel:4352597421">(435) 259-7421</a>.</div>
  <button class="rt-back" onclick="rtRender('search')">&larr; Start a new quote</button>
</div>`;
}

render('search');
})();
