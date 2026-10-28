/* Millionaire Habit Builder — Momentum OS. Browser-only, no external services. */
(() => {
  'use strict';
  const Core = window.HabitCore;
  if (!Core) return;
  const $ = id => document.getElementById(id);
  const KEY = 'cornelius_millionaire_habit_builder_v2';
  let plan = null, selectedDay = 1, storageOK = true;
  const today = () => Core.toDay();
  function status(message) { $('statusMessage').textContent = message; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(plan));status('Saved on this device.');storageOK=true; } catch { storageOK=false;status('Browser storage is unavailable. Export a backup to keep this progress.'); } }
  function load() { try { const value=localStorage.getItem(KEY); if(value)plan=Core.parseImport(value); } catch {plan=null;storageOK=false;} }
  function el(tag, cls, text) { const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n; }
  function availableDay(day) { return Core.differenceDays(today(),plan.startDate) >= day-1; }
  function checked(day,id){return Array.isArray(plan.completed[String(day)])&&plan.completed[String(day)].includes(id)}
  function count(day) {return plan.tasks.filter(t=>checked(day,t.id)).length}
  function updateDay(day) { selectedDay=day; if(!plan)return; render(); }
  function render(){
    const yes=!!plan;$('tracker').hidden=!yes;$('emptyState').hidden=yes;
    for(const id of ['exportText','exportJson','clearPlan'])$(id).disabled=!yes;
    if(!yes){$('planSubtitle').textContent='Build your first plan to unlock tracking.';return;}
    const m=Core.metrics(plan,today());
    $('planSubtitle').textContent=plan.goal;
    $('goal').value=plan.goal;$('experience').value=plan.experience;$('energy').value=plan.energy;$('pace').value=plan.pace;
    $('percent').textContent=m.percent+'%';$('tasksDone').textContent=m.tasksDone+' of 90 tasks';$('daysDone').innerHTML=String(m.daysDone)+'<span class="denominator">/30</span>';$('streak').innerHTML=String(m.streak)+'<span class="denominator"> days</span>';
    $('progressFill').style.width=m.percent+'%';
    const cal=$('calendar');cal.replaceChildren();
    for(const d of plan.days){const n=count(d.number),future=!availableDay(d.number);const btn=el('button','day'+(n===3?' done':n>0?' partial':'')+(future?' future':''),d.number);btn.type='button';btn.disabled=future;btn.setAttribute('aria-pressed',String(selectedDay===d.number));btn.setAttribute('aria-label',`Day ${d.number}, ${d.date}; ${n} of 3 completed${future?'; future day':''}`);btn.title=`Day ${d.number} — ${d.date}`;btn.addEventListener('click',()=>updateDay(d.number));cal.append(btn);}
    if(!availableDay(selectedDay)){selectedDay=Math.max(1,Math.min(30,Core.differenceDays(today(),plan.startDate)+1));}
    const day=plan.days[selectedDay-1],n=count(day.number),future=!availableDay(day.number);
    $('phaseLabel').textContent=day.phase.toUpperCase();$('dayTitle').textContent=`Day ${day.number} · ${day.date}`;$('dailyFocus').textContent=day.theme+' — '+day.focus;
    $('dayStatus').textContent=n===3?'COMPLETE':n?'IN PROGRESS':'READY';$('dayCaption').textContent=`Day ${selectedDay} of 30`;
    const tasks=$('dailyTasks');tasks.replaceChildren();
    for(const t of plan.tasks){const label=el('label','task'+(checked(day.number,t.id)?' checked':''));const check=document.createElement('input');check.type='checkbox';check.checked=checked(day.number,t.id);check.disabled=future;check.setAttribute('aria-label',t.name);check.addEventListener('change',()=>{try{plan=Core.toggleTask(plan,selectedDay,t.id,today());save();render();}catch(e){status(e.message)}});const block=el('span');block.append(el('strong','',t.name),el('small','',t.detail));label.append(check,block);tasks.append(label);}
    $('dayNote').disabled=future;$('dayNote').value=plan.notes[String(selectedDay)]||'';
    $('noteHelp').textContent=future?'Future notes cannot be edited.':'Private journal — saved on this device when you leave the field.';
    const bars=$('weekBars');bars.replaceChildren();for(const w of m.weekScores){const item=el('div','week');item.append(el('div','week-count',`${w.done}/${w.total}`));const track=el('div','week-bar-track');const fill=el('div','week-fill');fill.style.height=(w.done/w.total*100)+'%';track.append(fill);item.append(track,el('span','week-label',w.label));bars.append(item);}bars.setAttribute('aria-label',m.weekScores.map(w=>`${w.label}: ${w.done} of ${w.total} complete`).join('; '));
  }
  function download(text,name,type){const blob=new Blob([text],{type});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),500);}
  $('planForm').addEventListener('submit',event=>{
    event.preventDefault();const error=$('formError');error.hidden=true;
    try{
      const goal=$('goal').value,pace=$('pace').value,experience=$('experience').value,energy=$('energy').value;
      if(plan&&!window.confirm('Create a new 30-day plan? This replaces your current locally saved progress. Export a backup first if you want to keep it.'))return;
      const next=Core.makePlan({goal,pace,experience,energy},today());plan=next;selectedDay=1;save();render();status('Your 30-day plan is ready. Start by checking off a task.');
    }catch(e){error.textContent=e.message;error.hidden=false;}
  });
  $('dayNote').addEventListener('change',()=>{if(!plan)return;try{plan=Core.setNote(plan,selectedDay,$('dayNote').value,today());save();}catch(e){status(e.message)}});
  $('exportText').addEventListener('click',()=>{if(plan)download(Core.exportText(plan,today()),'millionaire-habit-builder-report.txt','text/plain;charset=utf-8');});
  $('exportJson').addEventListener('click',()=>{if(plan)download(JSON.stringify(plan,null,2),'millionaire-habit-builder-backup.json','application/json');});
  $('clearPlan').addEventListener('click',()=>{if(!plan)return;if(!window.confirm('Permanently delete this browser’s saved plan? Export a backup first if needed.'))return;try{localStorage.removeItem(KEY)}catch{}plan=null;selectedDay=1;$('goal').value='';render();status('Saved plan deleted from this browser.');});
  $('importFile').addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;try{if(file.size>100000)throw Error('Backup must be under 100 KB.');const data=Core.parseImport(await file.text());if(plan&&!window.confirm('Replace your current plan with the imported backup?'))return;plan=data;selectedDay=Math.min(30,Math.max(1,Core.differenceDays(today(),plan.startDate)+1));save();render();status('Backup imported successfully.');}catch(e){status('Import failed: '+e.message);}});
  load();if(plan){selectedDay=Math.max(1,Math.min(30,Core.differenceDays(today(),plan.startDate)+1));}
  render();if(!storageOK)status('Browser storage is unavailable. Export a JSON backup to keep your progress.');
})();