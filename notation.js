/* Lightweight SVG rhythm staff renderer.
   Uses a single-line percussion-style staff to keep rhythm values readable. */
(function(){
  const NS="http://www.w3.org/2000/svg";
  function el(tag,attrs,parent,text){
    const n=document.createElementNS(NS,tag);
    Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));
    if(text!==undefined)n.textContent=text;
    if(parent)parent.appendChild(n);
    return n;
  }
  function draw(svg,rhythm,options={}){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    const width=760,height=150,beats=rhythm.beats||4,left=75,right=width-22,staffY=70;
    // Staff lines
    for(let i=0;i<5;i++)el("line",{x1:left,y1:staffY-24+i*12,x2:right,y2:staffY-24+i*12,stroke:"#9ba6ad","stroke-width":1},svg);
    el("text",{x:18,y:staffY+7,"font-size":44,fill:"#263746","font-family":"serif"},svg,"𝄞");
    el("text",{x:56,y:staffY-8,"font-size":15,fill:"#263746","font-weight":"700"},svg,(rhythm.meter===6?"6/8":`${rhythm.meter||4}/4`));
    const usable=right-left-20,unit=usable/beats;
    let cursor=left+12;
    rhythm.events.forEach((event,index)=>{
      const dur=event.duration;
      const x=cursor+Math.max(9,unit*dur/2);
      if(event.rest){
        const symbol=dur>=3.5?"𝄻":dur>=1.5?"𝄼":dur>=.75?"𝄽": "𝄾";
        el("text",{x:x-8,y:staffY+8,"font-size":dur>=1.5?25:22,fill:"#1d2a36","font-family":"serif"},svg,symbol);
      }else{
        const whole=dur>=3.5,half=dur>=1.5;
        const noteY=staffY+5;
        el("ellipse",{cx:x,cy:noteY,rx:whole?7:6.5,ry:4.7,transform:`rotate(-20 ${x} ${noteY})`,fill:whole||half?"none":"#172632",stroke:"#172632","stroke-width":1.6},svg);
        if(!whole&&!half){
          el("line",{x1:x+6,y1:noteY-1,x2:x+6,y2:noteY-37,stroke:"#172632","stroke-width":1.7},svg);
          if(dur<=.5){
            el("path",{d:`M ${x+6} ${noteY-37} q 17 8 5 20`,fill:"none",stroke:"#172632","stroke-width":1.8},svg);
          }
          if(dur<=.25)el("path",{d:`M ${x+6} ${noteY-30} q 17 8 5 20`,fill:"none",stroke:"#172632","stroke-width":1.8},svg);
        }
        if(dur===1/3){
          el("text",{x:x-3,y:staffY-20,"font-size":12,fill:"#263746","font-weight":"700"},svg,"3");
        }
      }
      cursor+=unit*dur;
    });
    if(options.label)el("text",{x:right-5,y:18,"text-anchor":"end","font-size":9,fill:"#71808b"},svg,options.label);
    // barline
    el("line",{x1:right,y1:staffY-25,x2:right,y2:staffY+25,stroke:"#53616b","stroke-width":1.5},svg);
  }
  window.Notation={draw};
})();