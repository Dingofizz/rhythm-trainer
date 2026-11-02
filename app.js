(function(){
  const $=id=>document.getElementById(id);
  let mode="A",prompt=null,answer=[],choices=[],selectedChoice=0,correctChoice=0,locked=false;
  const tempo=$("tempo");
  function bpm(){return Number(tempo.value)}
  function settings(){return RhythmGenerator.settings()}
  function currentBeats(){return prompt?prompt.beats:4}
  function cloneRhythm(r){return {events:r.events.map(e=>({...e})),beats:r.beats,meter:r.meter,settings:r.settings}}
  function duration(e){return e.duration}
  function answerRhythm(){return {events:answer,beats:currentBeats(),meter:prompt.meter}}
  function displayMode(){
    $("modeEyebrow").textContent=mode==="A"?"MODE A · RHYTHM DICTATION":"MODE B · RHYTHM RECOGNITION";
    $("exerciseTitle").textContent=mode==="A"?"What did you hear?":"Which rhythm matches?";
    $("instruction").querySelector("strong").textContent=mode==="A"?"Listen to the rhythm":"Read the rhythm";
    $("instruction").querySelector("p").textContent=mode==="A"?"Play the pattern as many times as you need, then build it using the note buttons below.":"Study the notation, play the examples, and select the audio that matches.";
    $("notationLabel").textContent=mode==="A"?"YOUR ANSWER":"TARGET RHYTHM";
    $("notationHint").textContent=mode==="A"?"Select note values to build the bar":"Match this written rhythm to an audio option";
    $("answerBuilder").classList.toggle("hidden",mode!=="A");
    $("listenControls").classList.toggle("hidden",mode!=="A");
    $("modeBArea").classList.toggle("hidden",mode!=="B");
    $("playPrompt").querySelector("span:last-child").textContent=mode==="A"?"Play rhythm":"Play target rhythm";
    $("barCount").textContent="BAR 1";
    updateMeta();
  }
  function updateMeta(){
    const d=settings();
    $("exerciseMeta").textContent=`${currentBeats()} beats · ${d.difficulty[0].toUpperCase()+d.difficulty.slice(1)}`;
  }
  function makeNew(){
    locked=false;answer=[];$("feedback").classList.add("hidden");
    prompt=RhythmGenerator.make(settings());
    if(mode==="A"){
      Notation.draw($("answerNotation"),answerRhythm());
      $("durationStatus").textContent=`0 / ${prompt.beats} beats`;
      $("notationHint").textContent="Select note values to build the bar";
      $("playPrompt").disabled=false;
    }else{
      createChoices();
    }
    updateMeta();updatePalette();
  }
  function createChoices(){
    const target=cloneRhythm(prompt);
    choices=[target];
    for(let i=0;i<3;i++){
      let alt=RhythmGenerator.make(settings());
      let attempts=0;
      while(JSON.stringify(alt.events)===JSON.stringify(target.events)&&attempts++<5)alt=RhythmGenerator.make(settings());
      choices.push(alt);
    }
    // Ensure one correct answer at a random position.
    correctChoice=Math.floor(Math.random()*4);
    const correct=choices[0];choices[0]=choices[correctChoice];choices[correctChoice]=correct;
    selectedChoice=-1;
    const list=$("choiceList");list.innerHTML="";
    choices.forEach((r,i)=>{
      const button=document.createElement("button");button.className="rhythm-option";button.type="button";
      button.innerHTML=`<div class="option-head"><span>OPTION ${String.fromCharCode(65+i)}</span><span>▶ Play</span></div><svg viewBox="0 0 760 150" aria-label="Rhythm option ${i+1}"></svg>`;
      Notation.draw(button.querySelector("svg"),r);
      button.addEventListener("click",()=>{selectedChoice=i;[...list.children].forEach((b,j)=>b.classList.toggle("selected",j===i));playOption(i)});
      list.appendChild(button);
    });
    Notation.draw($("answerNotation"),prompt);
    $("durationStatus").textContent=`${prompt.beats} beats`;
  }
  function playOption(i){if(i<0)return;AudioEngine.playRhythm(choices[i],bpm(),true)}
  function updatePalette(){
    const used=answer.reduce((a,e)=>a+e.duration,0),remaining=prompt.beats-used;
    $("durationStatus").textContent=`${Math.min(used,prompt.beats).toFixed(2).replace(/\.00$/,"")} / ${prompt.beats} beats`;
    document.querySelectorAll(".note-choice").forEach(btn=>{
      const v=btn.dataset.value;
      let dur=v==="triplet"?1/3:v.startsWith("rest")?Number(v.slice(4)):Number(v);
      btn.disabled=locked||remaining<dur-.001;
      if(v==="triplet"&&!settings().triplets)btn.disabled=true;
    });
    Notation.draw($("answerNotation"),answerRhythm());
  }
  function addValue(v){
    if(locked)return;
    const event=v==="triplet"?{duration:1/3,rest:false}:v.startsWith("rest")?{duration:Number(v.slice(4)),rest:true}:{duration:Number(v),rest:false};
    const used=answer.reduce((a,e)=>a+e.duration,0);
    if(used+event.duration>prompt.beats+.001)return;
    answer.push(event);updatePalette();
  }
  function showFeedback(ok,title,text){
    const f=$("feedback");f.classList.remove("hidden","incorrect");if(!ok)f.classList.add("incorrect");
    $("feedbackIcon").textContent=ok?"✓":"×";$("feedbackTitle").textContent=title;$("feedbackText").textContent=text;
  }
  function checkA(){
    const used=answer.reduce((a,e)=>a+e.duration,0);
    if(Math.abs(used-prompt.beats)>.001){showFeedback(false,"Bar not complete",`Your answer is ${Math.max(0,prompt.beats-used).toFixed(2)} beats short. Add notes or rests to fill the bar.`);return}
    const a=answer.map(e=>`${Math.round(e.duration*12)/12}:${e.rest?1:0}`).join("|");
    const b=prompt.events.map(e=>`${Math.round(e.duration*12)/12}:${e.rest?1:0}`).join("|");
    const ok=a===b;locked=true;updatePalette();
    showFeedback(ok,"Correct rhythm!", "Excellent listening. You matched the rhythm exactly.",);
    if(!ok)showFeedback(false,"Not quite", "The rhythm is different. Listen again, clear your answer, and give it another try.");
  }
  function checkB(){
    if(selectedChoice<0){showFeedback(false,"Choose an option","Select one of the four rhythm examples first.");return}
    const ok=selectedChoice===correctChoice;locked=true;
    showFeedback(ok,"Correct match!","You identified the written rhythm. Nice work.");
    if(!ok)showFeedback(false,"Not quite","Try listening to the options again and compare their note groupings.");
  }
  document.querySelectorAll(".mode-tab").forEach(btn=>btn.addEventListener("click",()=>{
    mode=btn.dataset.mode;document.querySelectorAll(".mode-tab").forEach(b=>b.classList.toggle("active",b===btn));displayMode();makeNew();
  }));
  document.querySelectorAll(".note-choice").forEach(btn=>btn.addEventListener("click",()=>addValue(btn.dataset.value)));
  $("newExercise").addEventListener("click",makeNew);
  $("nextExercise").addEventListener("click",makeNew);
  $("clearAnswer").addEventListener("click",()=>{answer=[];locked=false;$("feedback").classList.add("hidden");updatePalette()});
  $("undoNote").addEventListener("click",()=>{if(!locked){answer.pop();$("feedback").classList.add("hidden");updatePalette()}});
  $("checkAnswer").addEventListener("click",checkA);
  $("checkChoice").addEventListener("click",checkB);
  $("playPrompt").addEventListener("click",()=>AudioEngine.playRhythm(prompt,bpm(),true));
  $("replayPrompt").addEventListener("click",()=>AudioEngine.playRhythm(prompt,bpm(),true));
  $("playChoices").addEventListener("click",()=>playOption(selectedChoice));
  tempo.addEventListener("input",()=>{$("tempoValue").textContent=bpm()});
  ["difficulty","meter","allowTriplets","allowSync"].forEach(id=>$(id).addEventListener("change",makeNew));
  $("helpBtn").addEventListener("click",()=>$("helpDialog").showModal());
  $("closeHelp").addEventListener("click",()=>$("helpDialog").close());
  $("helpDialog").addEventListener("click",e=>{if(e.target===$("helpDialog"))$("helpDialog").close()});
  displayMode();makeNew();
})();