/* Web Audio synthesizer: no audio files or network required. */
(function(){
  let ctx=null;
  function audio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)throw new Error("Web Audio is not supported in this browser.");
    if(!ctx)ctx=new AC();
    if(ctx.state==="suspended")ctx.resume();
    return ctx;
  }
  function click(time,accent=false){
    const c=audio(),osc=c.createOscillator(),gain=c.createGain();
    osc.type="sine";osc.frequency.setValueAtTime(accent?1250:850,time);
    gain.gain.setValueAtTime(0.0001,time);gain.gain.exponentialRampToValueAtTime(accent?.22:.13,time+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.055);
    osc.connect(gain);gain.connect(c.destination);osc.start(time);osc.stop(time+.06);
  }
  function sound(time,duration,rest=false){
    if(rest)return;
    const c=audio(),osc=c.createOscillator(),gain=c.createGain();
    osc.type="triangle";osc.frequency.setValueAtTime(660,time);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.18,time+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.075,Math.min(.22,duration*.16)));
    osc.connect(gain);gain.connect(c.destination);osc.start(time);osc.stop(time+Math.max(.08,Math.min(.24,duration*.18)));
  }
  const AudioEngine={
    playRhythm(rhythm,bpm,withCount=true){
      const c=audio(),beat=60/bpm,start=c.currentTime+.12;
      if(withCount){
        const count= rhythm.beats || rhythm.events.reduce((a,e)=>a+e.duration,0);
        for(let i=0;i<Math.ceil(count);i++)click(start+i*beat,i===0);
      }
      let cursor=start+(withCount?.0:0);
      rhythm.events.forEach(e=>{
        sound(cursor,e.duration*beat,e.rest);
        cursor+=e.duration*beat;
      });
      return (cursor-c.currentTime)*1000+100;
    },
    playClick(bpm){const c=audio();click(c.currentTime+.02,true);}
  };
  window.AudioEngine=AudioEngine;
})();