/* Rhythm generation and duration helpers.
   Durations are measured in quarter-note beats. */
(function(){
  const RhythmGenerator = {
    settings(){
      return {
        difficulty: document.getElementById("difficulty").value,
        meter: Number(document.getElementById("meter").value),
        triplets: document.getElementById("allowTriplets").checked,
        syncopation: document.getElementById("allowSync").checked
      };
    },
    make(settings){
      const s=settings || this.settings();
      const beats=s.meter===6?3:s.meter;
      const pool = s.difficulty==="beginner"
        ? [1,1,1,1,0.5,0.5,2]
        : s.difficulty==="advanced" ? [0.25,0.5,0.5,0.5,1,1,2] : [0.5,0.5,1,1,1,2];
      const events=[];
      let remaining=beats, guard=0;
      while(remaining>0.001 && guard++<80){
        let candidates=pool.filter(v=>v<=remaining+0.001);
        if(!s.triplets) candidates=candidates.filter(v=>v!==0.333333);
        if(!s.syncopation && events.length%2===1) candidates=candidates.filter(v=>v>=0.5);
        if(s.triplets && s.difficulty!=="beginner" && remaining>=1 && Math.random()<0.13) candidates.push(1/3);
        if(!candidates.length)candidates=[remaining];
        let v=candidates[Math.floor(Math.random()*candidates.length)];
        if(v>remaining)v=remaining;
        // Keep event durations on useful subdivisions.
        const canRest=s.difficulty!=="beginner"||v===1;
        events.push({duration:v,rest:canRest&&Math.random()<(s.difficulty==="beginner"?.12:.2)});
        remaining=Math.round((remaining-v)*12)/12;
      }
      // If rounding leaves a tiny remainder, fold it into the final event.
      const total=events.reduce((a,e)=>a+e.duration,0);
      if(Math.abs(total-beats)>0.001 && events.length)events[events.length-1].duration+=beats-total;
      return {events,beats,meter:s.meter,settings:s};
    },
    beats(r){return r.events.reduce((a,e)=>a+e.duration,0);}
  };
  window.RhythmGenerator=RhythmGenerator;
})();