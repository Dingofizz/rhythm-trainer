/* Web Audio drum sounds: no audio files or network required. */
(function(){
  let ctx=null;
  function audio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)throw new Error("Web Audio is not supported in this browser.");
    if(!ctx)ctx=new AC();
    if(ctx.state==="suspended")ctx.resume();
    return ctx;
  }
  function noiseBuffer(c,length){
    const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*length),c.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    return buffer;
  }
  function drumNoise(time,length,volume,frequency,type){
    const c=audio(),source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    source.buffer=noiseBuffer(c,length);
    filter.type=type;filter.frequency.setValueAtTime(frequency,time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(volume,time+.002);
    gain.gain.exponentialRampToValueAtTime(.0001,time+length);
    source.connect(filter);filter.connect(gain);gain.connect(c.destination);
    source.start(time);source.stop(time+length+.01);
  }
  function snare(time,accent=false){
    const c=audio(),osc=c.createOscillator(),bodyGain=c.createGain();
    osc.type="triangle";osc.frequency.setValueAtTime(accent?190:165,time);
    bodyGain.gain.setValueAtTime(.0001,time);
    bodyGain.gain.exponentialRampToValueAtTime(accent?.2:.14,time+.002);
    bodyGain.gain.exponentialRampToValueAtTime(.0001,time+.12);
    osc.connect(bodyGain);bodyGain.connect(c.destination);osc.start(time);osc.stop(time+.13);
    drumNoise(time,.16,accent?.42:.32,1800,"highpass");
  }
  function restTone(time){
    const c=audio(),osc=c.createOscillator(),gain=c.createGain();
    osc.type="sine";
    osc.frequency.setValueAtTime(880,time);
    osc.frequency.exponentialRampToValueAtTime(660,time+.1);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(.12,time+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.12);
    osc.connect(gain);gain.connect(c.destination);osc.start(time);osc.stop(time+.13);
  }
  function sound(time,duration,rest=false){
    if(rest)restTone(time);
    else snare(time);
  }
  const AudioEngine={
    playRhythm(rhythm,bpm,withCount=false){
      const c=audio(),beat=60/bpm,start=c.currentTime+.12;
      const count= rhythm.beats || rhythm.events.reduce((a,e)=>a+e.duration,0);
      const countBeats=withCount?Math.ceil(count):0;
      if(withCount){
        for(let i=0;i<countBeats;i++)snare(start+i*beat,i===0);
      }
      let cursor=start+countBeats*beat;
      rhythm.events.forEach(e=>{
        sound(cursor,e.duration*beat,e.rest);
        cursor+=e.duration*beat;
      });
      return (cursor-c.currentTime)*1000+100;
    },
    playNormalHit(){
      const c=audio();
      sound(c.currentTime+.02,0.1,false);
    },
    playRestSound(){
      const c=audio();
      sound(c.currentTime+.02,0.1,true);
    },
    playClick(bpm){const c=audio();snare(c.currentTime+.02,true);}
  };
  window.AudioEngine=AudioEngine;
})();