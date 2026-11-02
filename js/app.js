(function(){
  const $=id=>document.getElementById(id);
  let mode="A",prompt=null,answer=[],choices=[],selectedChoice=0,correctChoice=0,locked=false;
  let correctCount=0,totalCount=0,questionScored=false;
  let answerColors=[];
  let rhythmPlaying=false;
  let runName="";
  let completedAt="";
  let runSubmitted=false;
  const submissionUrl="https://script.google.com/macros/s/AKfycbyKIPbLaJpdliB8xwdvbNo5RzzifzwyhONVPrg2H3eEtrbj_tlfx28eFUbGQv_U_oc3/exec";
  const beginnerValues=new Set(["2","1","0.5","rest1"]);
  const tempo=$("tempo");
  function bpm(){return Number(tempo.value)}
  function formatCompletedAt(date){
    const pad=value=>String(value).padStart(2,"0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  function settings(){return RhythmGenerator.settings()}
  function prepareMeter(){
    if(!$("randomMeter").checked)return;
    const meters=["4","3","2","6"];
    $("meter").value=meters[Math.floor(Math.random()*meters.length)];
  }
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
    locked=false;answer=[];answerColors=[];questionScored=false;$("feedback").classList.add("hidden");
    $("correctAnswer").classList.add("hidden");
    $("showAnswerA").classList.remove("hidden");$("showAnswerB").classList.remove("hidden");$("undoNote").classList.remove("hidden");
    prepareMeter();
    prompt=RhythmGenerator.make(settings());
    if(mode==="A"){
      if(mode==="A")Notation.draw($("answerNotation"),answerRhythm(),{eventColors:answerColors});
      $("durationStatus").textContent=`0 / ${prompt.beats} beats`;
      $("notationHint").textContent="Select note values to build the bar";
      $("playPrompt").disabled=false;
    }else{
      createChoices();
    }
    updateMeta();updatePalette();
  }
  function updateScore(){
    $("scoreValue").textContent=`${correctCount} / ${totalCount}`;
  }
  function recordResult(correct){
    if(questionScored)return;
    questionScored=true;totalCount++;
    if(correct)correctCount++;
    updateScore();
  }
  function showNextButton(show){
    $("nextExercise").classList.toggle("hidden",!show);
  }
  function similarChoice(target,variation){
    const events=target.events.map(event=>({...event}));
    const firstIndex=variation%events.length;
    const secondIndex=(firstIndex+1)%events.length;
    events[firstIndex].rest=!events[firstIndex].rest;
    if(variation===1&&events.length>1)events[secondIndex].rest=!events[secondIndex].rest;
    return {events,beats:target.beats,meter:target.meter,settings:target.settings};
  }
  function createChoices(){
    const target=cloneRhythm(prompt);
    choices=[target];
    const signatures=new Set([JSON.stringify(target.events)]);
    for(let i=0;i<3;i++){
      let alt=similarChoice(target,i);
      let attempts=0;
      while(signatures.has(JSON.stringify(alt.events))&&attempts++<5)alt=RhythmGenerator.make(settings());
      signatures.add(JSON.stringify(alt.events));
      choices.push(alt);
    }
    // Ensure one correct answer at a random position.
    correctChoice=Math.floor(Math.random()*4);
    const correct=choices[0];choices[0]=choices[correctChoice];choices[correctChoice]=correct;
    selectedChoice=-1;
    const list=$("choiceList");list.innerHTML="";
    choices.forEach((r,i)=>{
      const button=document.createElement("button");button.className="rhythm-option";button.type="button";
      button.innerHTML=`<div class="option-head"><span>OPTION ${String.fromCharCode(65+i)}</span><span>▶ Play sound</span></div><div class="sound-option">Hear this rhythm</div>`;
      button.addEventListener("click",()=>{selectedChoice=i;[...list.children].forEach((b,j)=>b.classList.toggle("selected",j===i));playOption(i)});
      list.appendChild(button);
    });
    Notation.draw($("answerNotation"),prompt);
    $("durationStatus").textContent=`${prompt.beats} beats`;
  }
  function playOption(i){if(i<0)return;AudioEngine.playRhythm(choices[i],bpm(),false)}
  function updatePalette(){
    const used=answer.reduce((a,e)=>a+e.duration,0),remaining=prompt.beats-used;
    $("durationStatus").textContent=`${Math.min(used,prompt.beats).toFixed(2).replace(/\.00$/,"")} / ${prompt.beats} beats`;
    document.querySelectorAll(".note-choice").forEach(btn=>{
      const v=btn.dataset.value;
      let dur=v==="triplet"?1/3:v.startsWith("rest")?Number(v.slice(4)):Number(v);
      const beginnerHidden=settings().difficulty==="beginner"&&!beginnerValues.has(v);
      const tripletHidden=v==="triplet"&&!settings().triplets;
      const hidden=beginnerHidden||tripletHidden;
      btn.classList.toggle("hidden",hidden);
      btn.disabled=hidden||locked||remaining<dur-.001;
    });
    if(mode==="A")Notation.draw($("answerNotation"),answerRhythm(),{eventColors:answerColors});
  }
  function addValue(v){
    if(locked)return;
    const event=v==="triplet"?{duration:1/3,rest:false}:v.startsWith("rest")?{duration:Number(v.slice(4)),rest:true}:{duration:Number(v),rest:false};
    const used=answer.reduce((a,e)=>a+e.duration,0);
    if(used+event.duration>prompt.beats+.001)return;
    answer.push(event);updatePalette();
  }
  function compareEvent(a,b){
    return a&&b&&Math.abs(a.duration-b.duration)<.001&&a.rest===b.rest;
  }
  function colorAnswer(){
    let mismatch=false;
    answerColors=answer.map((event,index)=>{
      if(mismatch||!compareEvent(event,prompt.events[index])){mismatch=true;return "#d95d5d"}
      return "#3aaf78";
    });
    Notation.draw($("answerNotation"),answerRhythm(),{eventColors:answerColors});
  }
  function showCorrectAnswer(){
    $("correctAnswer").classList.remove("hidden");
    Notation.draw($("correctNotation"),prompt);
  }
  function updateRoundControls(){
    $("undoNote").classList.toggle("hidden",locked);
    const unavailable=locked||rhythmPlaying;
    $("showAnswerA").classList.toggle("hidden",unavailable);
    $("showAnswerB").classList.toggle("hidden",unavailable);
  }
  function showFeedback(ok,title,text,showNext=false){
    const f=$("feedback");f.classList.remove("hidden","incorrect");if(!ok)f.classList.add("incorrect");
    $("feedbackIcon").textContent=ok?"✓":"×";$("feedbackTitle").textContent=title;$("feedbackText").textContent=text;
    showNextButton(ok||showNext);
  }
  function checkA(){
    const used=answer.reduce((a,e)=>a+e.duration,0);
    if(Math.abs(used-prompt.beats)>.001){showFeedback(false,"Bar not complete",`Your answer is ${Math.max(0,prompt.beats-used).toFixed(2)} beats short. Add notes or rests to fill the bar.`);return}
    const a=answer.map(e=>`${Math.round(e.duration*12)/12}:${e.rest?1:0}`).join("|");
    const b=prompt.events.map(e=>`${Math.round(e.duration*12)/12}:${e.rest?1:0}`).join("|");
    const ok=a===b;
    recordResult(ok);
    if(ok){answerColors=answer.map(()=>"#3aaf78");locked=true}
    else colorAnswer();
    updateRoundControls();updatePalette();
    showFeedback(ok,"Correct rhythm!", "Excellent listening. You matched the rhythm exactly.",);
    if(!ok)showFeedback(false,"Not quite", "The rhythm is different. Clear your answer and give it another try.");
  }
  function checkB(){
    if(selectedChoice<0){showFeedback(false,"Choose an option","Select one of the four rhythm examples first.");return}
    const ok=selectedChoice===correctChoice;
    recordResult(ok);
    locked=ok;
    updateRoundControls();
    showFeedback(ok,"Correct match!","You identified the written rhythm. Nice work.");
    if(!ok)showFeedback(false,"Not quite","That was not the matching rhythm. Choose another option and try again.");
  }
  function revealAnswer(){
    if(questionScored)return;
    recordResult(false);locked=true;updateRoundControls();
    if(mode==="A"){
      showCorrectAnswer();
      $("notationHint").textContent="Your answer did not match";
      answer=prompt.events.map(event=>({...event}));
      answerColors=answer.map(()=>"#d95d5d");
      updatePalette();
    }else{
      const list=$("choiceList");
      [...list.children].forEach((button,index)=>button.classList.toggle("selected",index===correctChoice));
      selectedChoice=correctChoice;
    }
    showFeedback(false,"Answer revealed","This round counts as incorrect.",true);
  }
  document.querySelectorAll(".mode-tab").forEach(btn=>btn.addEventListener("click",()=>{
    mode=btn.dataset.mode;document.querySelectorAll(".mode-tab").forEach(b=>b.classList.toggle("active",b===btn));displayMode();makeNew();
  }));
  document.querySelectorAll(".note-choice").forEach(btn=>btn.addEventListener("click",()=>addValue(btn.dataset.value)));
  $("nextExercise").addEventListener("click",makeNew);
  $("undoNote").addEventListener("click",()=>{if(!locked){answer.pop();answerColors=[];$("feedback").classList.add("hidden");updatePalette()}});
  $("checkAnswer").addEventListener("click",checkA);
  $("checkChoice").addEventListener("click",checkB);
  $("showAnswerA").addEventListener("click",revealAnswer);
  $("showAnswerB").addEventListener("click",revealAnswer);
  $("playPrompt").addEventListener("click",()=>{
    if(rhythmPlaying)return;
    rhythmPlaying=true;
    $("playPrompt").disabled=true;
    updateRoundControls();
    const playbackTime=AudioEngine.playRhythm(prompt,bpm(),false);
    window.setTimeout(()=>{
      rhythmPlaying=false;
      $("playPrompt").disabled=false;
      updateRoundControls();
    },playbackTime);
  });
  $("playChoices").addEventListener("click",()=>playOption(selectedChoice));
  tempo.addEventListener("input",()=>{$("tempoValue").textContent=bpm()});
  $("randomMeter").addEventListener("change",()=>{
    $("meter").disabled=$("randomMeter").checked;
  });
  document.querySelectorAll(".setup-option").forEach(btn=>btn.addEventListener("click",()=>{
    mode=btn.dataset.setupMode;
    document.querySelectorAll(".setup-option").forEach(option=>option.classList.toggle("selected",option===btn));
  }));
  $("startPractice").addEventListener("click",()=>{
    runName=$("playerName").value.trim();
    if(!runName){
      $("playerName").setCustomValidity("Please enter your name before starting.");
      $("playerName").reportValidity();
      $("playerName").focus();
      return;
    }
    $("playerName").setCustomValidity("");
    correctCount=0;totalCount=0;updateScore();
    $("setupScreen").classList.add("hidden");
    $("workspace").classList.remove("hidden");
    displayMode();
    makeNew();
  });
  $("endRun").addEventListener("click",()=>{
    $("workspace").classList.add("hidden");
    $("scoreScreen").classList.remove("hidden");
    $("finalScore").textContent=`${correctCount} / ${totalCount}`;
    $("finalScoreText").textContent=totalCount===0?"No questions completed yet.":`You got ${correctCount} of ${totalCount} questions right.`;
    $("finalName").textContent=runName;
    completedAt=formatCompletedAt(new Date());
    runSubmitted=false;
    $("finalCompleted").textContent=completedAt;
    $("submitStatus").textContent="";
    $("submitRun").disabled=false;
    const selectedDifficulty=$("difficulty").value;
    const randomMeter=$("randomMeter").checked;
    const selectedMeter=$("meter").value;
    $("finalDifficulty").textContent=selectedDifficulty[0].toUpperCase()+selectedDifficulty.slice(1);
    $("finalMeter").textContent=randomMeter?"Random":selectedMeter==="6"?"6/8":`${selectedMeter}/4`;
    $("finalMode").textContent=mode==="A"?"Listen & recreate":"Read & identify";
    $("finalTriplets").textContent=$("allowTriplets").checked?"On":"Off";
    $("finalSync").textContent=$("allowSync").checked?"On":"Off";
  });
  $("submitRun").addEventListener("click",async()=>{
    if(runSubmitted)return;
    const selectedDifficulty=$("difficulty").value;
    const randomMeter=$("randomMeter").checked;
    const selectedMeter=$("meter").value;
    const data={
      name:runName.toLowerCase(),
      score:correctCount,
      total:totalCount,
      difficulty:selectedDifficulty,
      meter:randomMeter?"Random":selectedMeter==="6"?"6/8":`${selectedMeter}/4`,
      exercise:mode==="A"?"Listen & recreate":"Read & identify",
      triplets:$("allowTriplets").checked?"On":"Off",
      syncopation:$("allowSync").checked?"On":"Off",
      completed:completedAt
    };
    const button=$("submitRun");
    button.disabled=true;
    $("submitStatus").textContent="Submitting…";
    try{
      await fetch(submissionUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
      runSubmitted=true;
      $("submitStatus").textContent="Run submitted.";
    }catch(error){
      button.disabled=false;
      $("submitStatus").textContent="Could not submit this run. Please try again.";
      console.error("Run submission failed",error);
    }
  });
  $("newRun").addEventListener("click",()=>{
    $("scoreScreen").classList.add("hidden");
    $("setupScreen").classList.remove("hidden");
  });
  document.querySelectorAll(".help-button").forEach(button=>button.addEventListener("click",()=>$("helpDialog").showModal()));
  $("playNormalSound").addEventListener("click",()=>AudioEngine.playNormalHit());
  $("playRestSound").addEventListener("click",()=>AudioEngine.playRestSound());
  $("closeHelp").addEventListener("click",()=>$("helpDialog").close());
  $("helpDialog").addEventListener("click",e=>{if(e.target===$("helpDialog"))$("helpDialog").close()});
})();