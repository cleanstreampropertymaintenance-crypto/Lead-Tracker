<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0B1120">
<title>Lead Tracker</title>
<link rel="manifest" href="manifest.json">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0B1120;color:#E2E8F0;min-height:100vh;-webkit-tap-highlight-color:transparent}
input,textarea,button{font-family:inherit}
.header{padding:16px 20px;border-bottom:1px solid #1E293B;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:20px;font-weight:700;color:#F1F5F9}
.header span{font-size:12px;color:#64748B}
.btn{padding:8px 14px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600}
.btn-primary{background:#3B82F6;color:#fff}
.btn-outline{border:1px solid #334155;background:#1E293B;color:#E2E8F0}
.legend{padding:8px 20px;display:flex;gap:16px;flex-wrap:wrap;border-bottom:1px solid #1E293B}
.legend-item{display:flex;align-items:center;gap:4px;font-size:11px;color:#94A3B8}
.legend-dot{width:8px;height:8px;border-radius:4px}
.content{padding:16px 20px}
.cal-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.cal-nav button{background:none;border:none;color:#94A3B8;font-size:20px;cursor:pointer;padding:8px}
.cal-nav h2{font-size:16px;color:#F1F5F9}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.cal-header{text-align:center;font-size:11px;color:#475569;padding:4px}
.cal-day{min-height:44px;border-radius:8px;padding:2px 4px;cursor:pointer;border:1px solid transparent;transition:all .15s}
.cal-day.selected{background:#3B82F6}
.cal-day.today{background:#1E3A5F;border-color:#3B82F6}
.cal-day.has-events{background:#1a2332}
.cal-day-num{font-size:12px;text-align:right;padding:2px 4px;color:#94A3B8}
.cal-day.selected .cal-day-num{color:#fff;font-weight:700}
.cal-day.today .cal-day-num{color:#60A5FA;font-weight:700}
.cal-dots{display:flex;gap:2px;flex-wrap:wrap;padding:0 2px}
.cal-dot{width:6px;height:6px;border-radius:3px}
.section-title{font-size:15px;color:#F1F5F9;margin:20px 0 12px}
.section-sub{font-size:13px;color:#64748B;font-weight:400}
.card{background:#1E293B;border-radius:12px;padding:14px;margin-bottom:8px}
.card-empty{text-align:center;padding:24px;color:#475569;font-size:14px}
.lead-name{font-size:15px;font-weight:600;color:#F1F5F9}
.lead-phone{font-size:13px;color:#94A3B8}
.lead-meta{font-size:11px;color:#64748B;margin-top:2px}
.badge{padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600}
.actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.action-btn{padding:7px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;background:transparent}
.action-btn.no-answer{border:1px solid #F59E0B;color:#F59E0B;background:#F59E0B15}
.action-btn.callback{border:1px solid #8B5CF6;color:#8B5CF6;background:#8B5CF615}
.action-btn.accepted{border:1px solid #10B981;color:#10B981;background:#10B98115}
.action-btn.declined{border:1px solid #EF4444;color:#EF4444;background:#EF444415}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;justify-content:center;align-items:center;z-index:999;padding:20px}
.modal{background:#1E293B;border-radius:16px;padding:24px;width:100%;max-width:400;max-height:90vh;overflow:auto}
.modal h2,.modal h3{color:#F1F5F9;margin-bottom:16px}
.form-label{display:block;font-size:12px;color:#94A3B8;margin-bottom:4px}
.form-input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #334155;background:#0F172A;color:#E2E8F0;font-size:14px;box-sizing:border-box}
.form-group{margin-bottom:12px}
.source-btn{flex:1;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600}
.source-btn.active-fb{border:2px solid #1877F2;background:#1877F222;color:#1877F2}
.source-btn.active-g{border:2px solid #EA4335;background:#EA433522;color:#EA4335}
.source-btn.inactive{border:1px solid #334155;background:#0F172A;color:#94A3B8}
.btn-row{display:flex;gap:8px}
.btn-cancel{flex:1;padding:12px;border-radius:8px;border:1px solid #334155;background:transparent;color:#94A3B8;cursor:pointer;font-size:14px}
.btn-submit{flex:1;padding:12px;border-radius:8px;border:none;color:#fff;cursor:pointer;font-size:14px;font-weight:600}
.text-preview{background:#0F172A;border-radius:12px;padding:14px;margin-bottom:16px;font-size:14px;color:#E2E8F0;line-height:1.5;white-space:pre-wrap}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.info-box{background:#0F172A;border-radius:8px;padding:10px}
.info-label{font-size:11px;color:#64748B}
.info-value{font-size:13px;color:#E2E8F0}
.log-item{display:flex;gap:8px;align-items:start;padding:6px 0;border-bottom:1px solid #1a2332}
.log-dot{width:8px;height:8px;border-radius:4px;margin-top:5px;flex-shrink:0}
.log-text{font-size:13px;color:#E2E8F0}
.log-date{font-size:11px;color:#475569}
.list-card{cursor:pointer;border:1px solid transparent;transition:border .15s}
</style>
</head>
<body>
<div id="app"></div>
<script>
const STORAGE_KEY="leads-tracker-v3";
const CADENCE=[1,3,6,10,15,20,25,30];
const TEXTS=[
"Hey {name}! Just tried calling and left a voicemail — went ahead and sent your estimate over. Just hit the accept button at the top to get your spot locked in 👍",
"Hey {name}! Just making sure you got that estimate okay — just hit accept at the top whenever you're ready and I'll get you on the schedule!",
"Hey {name}! We've got an opening this week — just hit accept on that estimate to grab your spot before it's gone 👍",
"Hey {name}! Still got you in mind — did you get a chance to look everything over?",
"Hey {name}! Just checking in — is there anything on the estimate that didn't look right?",
"Hey {name}! No worries if life's been busy — still here whenever you're ready!",
"Hey {name}! Still thinking it over? Happy to answer anything — just text me back 👍",
"Hey {name}! Last time reaching out — if you still want to get the house taken care of just let me know. Hope to hear from you! 😊"
];
const SRC_COLORS={Facebook:"#1877F2",Google:"#EA4335"};
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];

function load(){try{const d=localStorage.getItem(STORAGE_KEY);return d?JSON.parse(d):[];}catch(e){return[];}}
function save(leads){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(leads));}catch(e){}}
function firstName(n){return n.trim().split(/\s+/)[0];}
function fmtPhone(p){const d=p.replace(/\D/g,"");if(d.length===10)return`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;if(d.length===11)return`(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;return p;}
function toDS(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function daysLeft(ed){const s=new Date(ed);s.setHours(0,0,0,0);const t=new Date();t.setHours(0,0,0,0);return 30-Math.floor((t-s)/864e5);}

function getSchedule(ed,actions){
  const s=new Date(ed);s.setHours(0,0,0,0);
  const nc=actions.filter(a=>a.type==="no_answer").length;
  if(nc>=CADENCE.length)return[];
  let days=CADENCE[nc],ti=nc;
  if(days>30){days=30;ti=TEXTS.length-1;}
  const nd=new Date(s);nd.setDate(nd.getDate()+days);
  return[{date:toDS(nd),daysSince:days,stepIndex:nc,textIndex:ti}];
}

let state={
  leads:load(),
  view:"calendar",
  currentMonth:{year:new Date().getFullYear(),month:new Date().getMonth()},
  selectedDate:toDS(new Date()),
  showForm:false,
  editingLead:null,
  textMessage:null,
  copied:false,
  confirmAction:null,
  callbackLeadId:null,
  callbackDate:"",
  callbackTime:"",
  form:{name:"",phone:"",source:"Facebook",estimateDate:toDS(new Date()),notes:""}
};

function setState(updates){Object.assign(state,updates);render();}

function getActiveLeads(){return state.leads.filter(l=>l.status==="active"&&daysLeft(l.estimateDate)>=0);}

function getCalendarFollowUps(){
  const map={},active=getActiveLeads();
  active.forEach(l=>{
    const lastCb=[...l.actions].reverse().find(a=>a.type==="callback");
    const lastNA=[...l.actions].reverse().find(a=>a.type==="no_answer");
    const cbFailed=lastCb&&lastNA&&new Date(lastNA.date)>new Date(lastCb.date);
    if(lastCb&&!cbFailed){
      const d=lastCb.callbackDate;
      if(!map[d])map[d]=[];
      map[d].push({...l,followUpType:"callback",callbackTime:lastCb.callbackTime});
      return;
    }
    if(cbFailed){
      const es=new Date(l.estimateDate);es.setHours(0,0,0,0);
      const cd=new Date(lastCb.callbackDate+"T12:00:00");
      const ds=Math.floor((cd-es)/864e5);
      if(ds<30){
        const d30=new Date(es);d30.setDate(d30.getDate()+30);
        const d=toDS(d30);
        if(!map[d])map[d]=[];
        map[d].push({...l,followUpType:"call",daysSince:30,textIndex:TEXTS.length-1});
      }
      return;
    }
    const sched=getSchedule(l.estimateDate,l.actions);
    sched.forEach(s=>{
      if(!map[s.date])map[s.date]=[];
      map[s.date].push({...l,followUpType:"call",daysSince:s.daysSince,stepIndex:s.stepIndex,textIndex:s.textIndex});
    });
  });
  return map;
}

function addLead(){
  const f=state.form;
  if(!f.name.trim()||!f.phone.trim())return;
  const nl={id:Date.now().toString(),name:f.name.trim(),phone:f.phone.trim(),source:f.source,estimateDate:f.estimateDate,notes:f.notes.trim(),status:"active",actions:[],createdAt:new Date().toISOString()};
  const leads=[...state.leads,nl];
  save(leads);
  setState({leads,showForm:false,form:{name:"",phone:"",source:"Facebook",estimateDate:toDS(new Date()),notes:""}});
}

function handleNoAnswer(id){
  const lead=state.leads.find(l=>l.id===id);
  if(!lead)return;
  const nc=lead.actions.filter(a=>a.type==="no_answer").length;
  const fn=firstName(lead.name);
  const lastCb=[...lead.actions].reverse().find(a=>a.type==="callback");
  let ti=nc,msg=null;
  if(lastCb){
    const es=new Date(lead.estimateDate);es.setHours(0,0,0,0);
    const cd=new Date(lastCb.callbackDate+"T12:00:00");
    const ds=Math.floor((cd-es)/864e5);
    ti=TEXTS.length-1;
    msg=TEXTS[ti].replace(/{name}/g,fn);
  } else {
    const nsi=nc+1;
    if(nsi<CADENCE.length&&CADENCE[nsi]>30)ti=TEXTS.length-1;
    msg=ti<TEXTS.length?TEXTS[ti].replace(/{name}/g,fn):null;
  }
  const leads=state.leads.map(l=>{
    if(l.id!==id)return l;
    const na=[...l.actions,{type:"no_answer",date:new Date().toISOString()}];
    let ns=l.status;
    if(lastCb){
      const es=new Date(l.estimateDate);es.setHours(0,0,0,0);
      const cd=new Date(lastCb.callbackDate+"T12:00:00");
      if(Math.floor((cd-es)/864e5)>=30)ns="expired";
    } else {
      const nnc=na.filter(a=>a.type==="no_answer").length;
      const next=nnc<CADENCE.length?CADENCE[nnc]:999;
      if(next>30)ns="expired";
    }
    return{...l,actions:na,status:ns};
  });
  save(leads);
  setState({leads,confirmAction:null,textMessage:msg?{leadName:lead.name,phone:lead.phone,message:msg,stepNumber:ti+1}:null,copied:false});
}

function recordAction(id,type){
  const leads=state.leads.map(l=>{
    if(l.id!==id)return l;
    const na=[...l.actions,{type,date:new Date().toISOString()}];
    let ns=l.status;
    if(type==="accepted")ns="accepted";
    if(type==="declined")ns="declined";
    return{...l,actions:na,status:ns};
  });
  save(leads);
  setState({leads,confirmAction:null});
}

function setCallback(id){
  if(!state.callbackDate)return;
  const leads=state.leads.map(l=>{
    if(l.id!==id)return l;
    return{...l,actions:[...l.actions,{type:"callback",date:new Date().toISOString(),callbackDate:state.callbackDate,callbackTime:state.callbackTime}]};
  });
  save(leads);
  setState({leads,callbackLeadId:null,callbackDate:"",callbackTime:""});
}

function deleteLead(id){
  const leads=state.leads.filter(l=>l.id!==id);
  save(leads);
  setState({leads,editingLead:null});
}

function copyText(text){
  navigator.clipboard.writeText(text).then(()=>{
    setState({copied:true});
    setTimeout(()=>setState({copied:false}),2000);
  }).catch(()=>{
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);
    setState({copied:true});setTimeout(()=>setState({copied:false}),2000);
  });
}

function render(){
  const app=document.getElementById("app");
  const active=getActiveLeads();
  const calFU=getCalendarFollowUps();
  const selLeads=calFU[state.selectedDate]||[];
  const{year,month}=state.currentMonth;
  const firstDay=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate();
  const todayStr=toDS(new Date());

  let calDays="";
  for(let i=0;i<firstDay;i++)calDays+=`<div style="min-height:44px"></div>`;
  for(let d=1;d<=dim;d++){
    const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const fups=calFU[ds]||[];
    const isToday=ds===todayStr,isSel=ds===state.selectedDate;
    let cls="cal-day";
    if(isSel)cls+=" selected";else if(isToday)cls+=" today";else if(fups.length)cls+=" has-events";
    let dots="";
    if(fups.length){
      dots=`<div class="cal-dots">${fups.slice(0,3).map(f=>`<div class="cal-dot" style="background:${f.followUpType==="callback"?"#8B5CF6":SRC_COLORS[f.source]||"#3B82F6"}"></div>`).join("")}${fups.length>3?`<span style="font-size:9px;color:#64748B">+${fups.length-3}</span>`:""}</div>`;
    }
    calDays+=`<div class="${cls}" onclick="setState({selectedDate:'${ds}'})"><div class="cal-day-num">${d}</div>${dots}</div>`;
  }

  let selectedHTML="";
  if(selLeads.length===0){
    selectedHTML=`<div class="card card-empty">No follow-ups scheduled</div>`;
  } else {
    selectedHTML=selLeads.map(l=>{
      const nc=l.actions.filter(a=>a.type==="no_answer").length;
      let meta="";
      if(l.followUpType==="callback"&&l.callbackTime)meta=`<div style="font-size:12px;color:#8B5CF6;margin-top:2px">📞 Callback at ${l.callbackTime}</div>`;
      else if(l.followUpType==="call")meta=`<div class="lead-meta">Follow-up #${nc+1} of 8 · Day ${l.daysSince}</div>`;
      return`<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
          <div onclick="setState({editingLead:state.leads.find(x=>x.id==='${l.id}')})" style="cursor:pointer">
            <div class="lead-name">${l.name}</div>
            <div class="lead-phone">${fmtPhone(l.phone)}</div>${meta}
          </div>
          <span class="badge" style="background:${SRC_COLORS[l.source]}22;color:${SRC_COLORS[l.source]}">${l.source}</span>
        </div>
        <div class="actions">
          <button class="action-btn no-answer" onclick="handleNoAnswer('${l.id}')">No Answer</button>
          <button class="action-btn callback" onclick="setState({callbackLeadId:'${l.id}'})">Callback</button>
          <button class="action-btn accepted" onclick="setState({confirmAction:{msg:'${l.name} accepted the estimate?',label:'Accepted',color:'#10B981',id:'${l.id}',type:'accepted'}})">Accepted</button>
          <button class="action-btn declined" onclick="setState({confirmAction:{msg:'${l.name} declined the estimate?',label:'Declined',color:'#EF4444',id:'${l.id}',type:'declined'}})">Declined</button>
        </div>
      </div>`;
    }).join("");
  }

  const selDateLabel=new Date(state.selectedDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  let listHTML="";
  if(state.view==="list"){
    if(state.leads.length===0){
      listHTML=`<div class="card card-empty">No leads yet. Add your first lead!</div>`;
    } else {
      listHTML=[...state.leads].reverse().map(l=>{
        const sc=l.status==="active"?SRC_COLORS[l.source]||"#3B82F6":l.status==="accepted"?"#10B981":l.status==="declined"?"#EF4444":"#64748B";
        const sl=l.status==="active"?l.source:l.status.charAt(0).toUpperCase()+l.status.slice(1);
        const dl=l.status==="active"?`<div style="font-size:11px;color:#64748B;margin-top:4px">${daysLeft(l.estimateDate)}d left</div>`:"";
        return`<div class="card list-card" onclick="setState({editingLead:state.leads.find(x=>x.id==='${l.id}')})">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><div class="lead-name">${l.name}</div><div class="lead-phone">${fmtPhone(l.phone)}</div></div>
            <div style="text-align:right"><span class="badge" style="background:${sc}22;color:${sc}">${sl}</span>${dl}</div>
          </div></div>`;
      }).join("");
    }
  }

  // Modals
  let modals="";

  if(state.showForm){
    modals+=`<div class="modal-overlay"><div class="modal">
      <h2 style="font-size:18px">Add New Lead</h2>
      <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="f-name" placeholder="John Smith" value="${state.form.name}"></div>
      <div class="form-group"><label class="form-label">Phone *</label><input class="form-input" id="f-phone" type="tel" placeholder="(555) 123-4567" value="${state.form.phone}"></div>
      <div class="form-group"><label class="form-label">Estimate Date</label><input class="form-input" id="f-date" type="date" value="${state.form.estimateDate}"></div>
      <div class="form-group"><label class="form-label">Lead Source</label>
        <div style="display:flex;gap:8px">
          <button class="source-btn ${state.form.source==="Facebook"?"active-fb":"inactive"}" onclick="setState({form:{...state.form,source:'Facebook'}})">Facebook</button>
          <button class="source-btn ${state.form.source==="Google"?"active-g":"inactive"}" onclick="setState({form:{...state.form,source:'Google'}})">Google</button>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-input" id="f-notes" rows="2" placeholder="Any notes...">${state.form.notes}</textarea></div>
      <div class="btn-row">
        <button class="btn-cancel" onclick="setState({showForm:false})">Cancel</button>
        <button class="btn-submit" style="background:#3B82F6" onclick="state.form.name=document.getElementById('f-name').value;state.form.phone=document.getElementById('f-phone').value;state.form.estimateDate=document.getElementById('f-date').value;state.form.notes=document.getElementById('f-notes').value;addLead()">Add Lead</button>
      </div>
    </div></div>`;
  }

  if(state.textMessage){
    const tm=state.textMessage;
    modals+=`<div class="modal-overlay"><div class="modal" style="max-width:400px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="font-size:16px;margin:0">📱 Text to ${tm.leadName}</h3>
        <span class="badge" style="background:#3B82F622;color:#60A5FA">#${tm.stepNumber} of 8</span>
      </div>
      <p style="font-size:12px;color:#64748B;margin-bottom:8px">${fmtPhone(tm.phone)}</p>
      <div class="text-preview">${tm.message}</div>
      <div class="btn-row">
        <button class="btn-cancel" onclick="setState({textMessage:null})">Close</button>
        <button class="btn-submit" style="background:${state.copied?"#10B981":"#3B82F6"};flex:2" onclick="copyText(state.textMessage.message)">${state.copied?"✓ Copied!":"📋 Copy Text"}</button>
      </div>
    </div></div>`;
  }

  if(state.callbackLeadId){
    modals+=`<div class="modal-overlay"><div class="modal" style="max-width:340px">
      <h3 style="font-size:16px">Schedule Callback</h3>
      <div class="form-group"><label class="form-label">Date *</label><input class="form-input" id="cb-date" type="date" value="${state.callbackDate}"></div>
      <div class="form-group"><label class="form-label">Time (optional)</label><input class="form-input" id="cb-time" type="time" value="${state.callbackTime}"></div>
      <div class="btn-row">
        <button class="btn-cancel" onclick="setState({callbackLeadId:null,callbackDate:'',callbackTime:''})">Cancel</button>
        <button class="btn-submit" style="background:#8B5CF6" onclick="state.callbackDate=document.getElementById('cb-date').value;state.callbackTime=document.getElementById('cb-time').value;setCallback(state.callbackLeadId)">Set Callback</button>
      </div>
    </div></div>`;
  }

  if(state.confirmAction){
    const ca=state.confirmAction;
    modals+=`<div class="modal-overlay"><div class="modal" style="max-width:340px;text-align:center">
      <p style="font-size:15px;margin-bottom:16px">${ca.msg}</p>
      <div class="btn-row">
        <button class="btn-cancel" onclick="setState({confirmAction:null})">Cancel</button>
        <button class="btn-submit" style="background:${ca.color}" onclick="recordAction('${ca.id}','${ca.type}')">${ca.label}</button>
      </div>
    </div></div>`;
  }

  if(state.editingLead){
    const el=state.editingLead;
    const dl=daysLeft(el.estimateDate);
    let logHTML=el.actions.length===0?`<p style="font-size:13px;color:#475569">No actions yet</p>`:
      el.actions.map(a=>{
        const col=a.type==="no_answer"?"#F59E0B":a.type==="callback"?"#8B5CF6":a.type==="accepted"?"#10B981":"#EF4444";
        let txt=a.type==="no_answer"?"No Answer":a.type==="callback"?`Callback: ${new Date(a.callbackDate+"T12:00:00").toLocaleDateString()}${a.callbackTime?" at "+a.callbackTime:""}`:a.type==="accepted"?"Estimate Accepted ✓":"Estimate Declined ✗";
        return`<div class="log-item"><div class="log-dot" style="background:${col}"></div><div><div class="log-text">${txt}</div><div class="log-date">${new Date(a.date).toLocaleString()}</div></div></div>`;
      }).join("");
    modals+=`<div class="modal-overlay" style="z-index:998"><div class="modal" style="max-width:420px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
        <div><h3 style="font-size:18px;margin:0">${el.name}</h3><p style="font-size:13px;color:#94A3B8;margin-top:4px">${fmtPhone(el.phone)}</p></div>
        <span class="badge" style="background:${SRC_COLORS[el.source]}22;color:${SRC_COLORS[el.source]}">${el.source}</span>
      </div>
      <div class="info-grid">
        <div class="info-box"><div class="info-label">Estimate Date</div><div class="info-value">${new Date(el.estimateDate+"T12:00:00").toLocaleDateString()}</div></div>
        <div class="info-box"><div class="info-label">Days Left</div><div class="info-value" style="color:${dl<=5?"#EF4444":"#E2E8F0"}">${Math.max(0,dl)}</div></div>
      </div>
      ${el.notes?`<div style="background:#0F172A;border-radius:8px;padding:10px;margin-bottom:16px;font-size:13px;color:#94A3B8">${el.notes}</div>`:""}
      <h4 style="font-size:13px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Activity Log</h4>
      <div style="margin-bottom:16px">${logHTML}</div>
      <div style="display:flex;gap:8px">
        <button style="padding:10px 16px;border-radius:8px;border:1px solid #EF4444;background:transparent;color:#EF4444;cursor:pointer;font-size:13px" onclick="deleteLead('${el.id}')">Delete</button>
        <div style="flex:1"></div>
        <button style="padding:10px 20px;border-radius:8px;border:none;background:#334155;color:#E2E8F0;cursor:pointer;font-size:13px" onclick="setState({editingLead:null})">Close</button>
      </div>
    </div></div>`;
  }

  app.innerHTML=`
    <div class="header">
      <div><h1>Lead Tracker</h1><span>${active.length} active lead${active.length!==1?"s":""}</span></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="setState({view:state.view==='calendar'?'list':'calendar'})">${state.view==="calendar"?"📋 List":"📅 Calendar"}</button>
        <button class="btn btn-primary" onclick="setState({showForm:true})">+ Add Lead</button>
      </div>
    </div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#1877F2"></div>Facebook</div>
      <div class="legend-item"><div class="legend-dot" style="background:#EA4335"></div>Google</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8B5CF6"></div>Callback</div>
    </div>
    ${state.view==="calendar"?`
    <div class="content">
      <div class="cal-nav">
        <button onclick="setState({currentMonth:state.currentMonth.month===0?{year:state.currentMonth.year-1,month:11}:{...state.currentMonth,month:state.currentMonth.month-1}})">‹</button>
        <h2>${MONTHS[month]} ${year}</h2>
        <button onclick="setState({currentMonth:state.currentMonth.month===11?{year:state.currentMonth.year+1,month:0}:{...state.currentMonth,month:state.currentMonth.month+1}})">›</button>
      </div>
      <div class="cal-grid">
        ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="cal-header">${d}</div>`).join("")}
        ${calDays}
      </div>
      <h3 class="section-title">${selDateLabel}${selLeads.length?` <span class="section-sub">— ${selLeads.length} follow-up${selLeads.length!==1?"s":""}</span>`:""}</h3>
      ${selectedHTML}
    </div>
    `:`<div class="content"><h3 class="section-title">All Leads (${state.leads.length})</h3>${listHTML}</div>`}
    ${modals}
  `;
}

render();
</script>
</body>
</html>
