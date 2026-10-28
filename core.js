/* Millionaire Habit Builder — Momentum OS. Original concept by Cornelius Aurelius.
   Pure, deterministic habit planning and record calculations. No remote API. */
(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.HabitCore = value;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const MS = 86400000;
  const CATEGORIES = {
    business: { label:'Business building', focus:'Complete one customer-facing action', learn:'Study a real customer problem', review:'Review the offer, feedback and next test' },
    career: { label:'Career & skills', focus:'Produce a portfolio or job-ready work sample', learn:'Practise one job-relevant skill', review:'Review feedback, applications and next opportunity' },
    money: { label:'Money management', focus:'Review spending and make one realistic budget decision', learn:'Learn a personal-finance concept from a reliable source', review:'Review actual spending and savings, without assumed returns' },
    fitness: { label:'Health & wellbeing', focus:'Take an achievable movement or recovery break', learn:'Plan one healthy, sustainable daily choice', review:'Reflect on energy and what felt sustainable' },
    creative: { label:'Creative projects', focus:'Create one small finished piece of work', learn:'Practise one technique and note what improved', review:'Review output and gather useful feedback' },
    general: { label:'Personal progress', focus:'Complete one concrete action toward the goal', learn:'Practise one useful skill or research step', review:'Review progress and adjust the next step' }
  };
  const PACE = { gentle: 10, steady: 25, focused: 45 };
  function safeText(v, max = 260) { return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
  function validDay(day) { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) return false;const d = new Date(day+'T12:00:00Z');return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===day; }
  function toDay(date = new Date()) { const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`; }
  function addDays(day, offset) { if(!validDay(day)) throw Error('Invalid day'); const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10); }
  function differenceDays(day, start) { if(!validDay(day)||!validDay(start)) throw Error('Invalid day');return Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/MS); }
  function classify(goal) { const v=safeText(goal).toLowerCase(); if(/business|start.?up|entrepreneur|customer|client|sell|sales|store|company|product|agency/.test(v))return 'business';if(/career|job|promotion|resume|cv\b|interview|employment|skill|study|exam|learn/.test(v))return 'career';if(/saving|savings|budget|spend|finance|invest|debt|money/.test(v))return 'money';if(/health|fitness|exercise|running|walking|sleep|wellbeing/.test(v))return 'fitness';if(/write|book|music|design|paint|art|video|creative|content/.test(v))return 'creative';return 'general'; }
  function makePlan(options, today = toDay()) {
    if(!validDay(today)) throw Error('Invalid start date');
    const goal=safeText(options.goal,180);if(goal.length<4)throw Error('Add a specific goal (at least four characters).');
    const pace=Object.hasOwn(PACE,options.pace)?options.pace:'steady';
    const energy=['low','medium','high'].includes(options.energy)?options.energy:'medium';
    const experience=['beginner','intermediate','advanced'].includes(options.experience)?options.experience:'beginner';
    const kind=classify(goal), subject=CATEGORIES[kind];
    const base=PACE[pace], minutes=Math.max(5,Math.round(base*(energy==='low'?0.6:energy==='high'?1.2:1)));
    const tasks=[
      {id:'priority',name:`${minutes}-minute priority block`,detail:subject.focus},
      {id:'learning',name:'Learn or practise',detail:subject.learn},
      {id:'reflection',name:'Reflect and reset',detail:'Record one result, one obstacle and the next action'}
    ];
    const days=Array.from({length:30},(_,i)=>({number:i+1,date:addDays(today,i),phase:i<7?'Foundation':i<14?'Rhythm':i<21?'Improve':'Sustain',theme:(i+1)%7===0?'Weekly reflection':i<7?'Start small':i<14?'Build consistency':i<21?'Improve the system':'Make it sustainable',focus:(i+1)%7===0?subject.review:subject.focus}));
    return {version:2,goal,pace,energy,experience,category:kind,startDate:today,tasks,days,completed:{},notes:{}};
  }
  function isPlan(p) { return !!p&&p.version===2&&typeof p.goal==='string'&&p.goal.length>=4&&validDay(p.startDate)&&Array.isArray(p.days)&&p.days.length===30&&p.days.every((d,i)=>d.number===i+1&&d.date===addDays(p.startDate,i))&&Array.isArray(p.tasks)&&p.tasks.length===3&&['priority','learning','reflection'].every(id=>p.tasks.some(t=>t.id===id))&&typeof p.completed==='object'&&p.completed!==null&&typeof p.notes==='object'&&p.notes!==null; }
  function toggleTask(p,day,taskId,today=toDay()) { if(!isPlan(p)) throw Error('Invalid plan');if(!Number.isInteger(day)||day<1||day>30||!p.tasks.some(t=>t.id===taskId))throw Error('Invalid task');if(differenceDays(today,p.startDate)<day-1)throw Error('Future days cannot be completed yet.');const copy=JSON.parse(JSON.stringify(p));const key=String(day),values=Array.isArray(copy.completed[key])?copy.completed[key].filter(x=>copy.tasks.some(t=>t.id===x)):[];copy.completed[key]=values.includes(taskId)?values.filter(x=>x!==taskId):[...values,taskId];return copy; }
  function setNote(p,day,note,today=toDay()) { if(!isPlan(p)||day<1||day>30||differenceDays(today,p.startDate)<day-1)throw Error('Invalid day');const copy=JSON.parse(JSON.stringify(p));copy.notes[String(day)]=safeText(note,600);return copy; }
  function metrics(p,today=toDay()) {
    if(!isPlan(p))throw Error('Invalid plan');const elapsed=Math.min(30,Math.max(0,differenceDays(today,p.startDate)+1));const done=[];let tasksDone=0;
    for(let i=1;i<=30;i++){const active=new Set(Array.isArray(p.completed[String(i)])?p.completed[String(i)]:[]);const n=p.tasks.filter(t=>active.has(t.id)).length;tasksDone+=n;if(n===p.tasks.length)done.push(i)}
    let streak=0;let i=elapsed;if(i>0&&!done.includes(i))i--;while(i>0&&done.includes(i)){streak++;i--}
    return {elapsed,daysDone:done.length,tasksDone,percent:Math.round(tasksDone/(30*p.tasks.length)*100),streak,daysRemaining:30-elapsed,weekScores:Array.from({length:5},(_,w)=>{const start=w*7+1,end=Math.min(30,(w+1)*7);return {label:`W${w+1}`,done:done.filter(d=>d>=start&&d<=end).length,total:end-start+1}})};
  }
  function parseImport(raw) {if(typeof raw!=='string'||raw.length>100000)throw Error('File is too large or invalid');let p;try{p=JSON.parse(raw)}catch{throw Error('This is not a valid JSON file')}if(!isPlan(p))throw Error('This file is not a valid Habit Builder plan');const clean=makePlan({goal:p.goal,pace:p.pace,energy:p.energy,experience:p.experience},p.startDate);for(let d=1;d<=30;d++){const value=p.completed[String(d)];if(Array.isArray(value))clean.completed[String(d)]=[...new Set(value.filter(id=>clean.tasks.some(t=>t.id===id)))];if(typeof p.notes[String(d)]==='string')clean.notes[String(d)]=safeText(p.notes[String(d)],600)}return clean; }
  function exportText(p,today=toDay()){const m=metrics(p,today);return [`MILLIONAIRE HABIT BUILDER — MOMENTUM OS`,`Created by Cornelius Aurelius`,`Goal: ${p.goal}`,`Start: ${p.startDate}`,`Progress: ${m.daysDone}/30 complete days; ${m.tasksDone}/90 completed tasks; current streak: ${m.streak}`,``,`30-DAY JOURNAL`,...p.days.map(d=>{const done=p.completed[String(d.number)]||[];return [`Day ${d.number} — ${d.date} (${d.phase})`,...p.tasks.map(t=>`${done.includes(t.id)?'[x]':'[ ]'} ${t.name}: ${t.detail}`),`Note: ${p.notes[String(d.number)]||'—'}`].join('\n')})].join('\n\n');}
  return Object.freeze({CATEGORIES,PACE,safeText,validDay,toDay,addDays,differenceDays,classify,makePlan,isPlan,toggleTask,setNote,metrics,parseImport,exportText});
});