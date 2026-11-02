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
    for(let i=0;i<5;i++)el("line",{x1:left,y1:staffY-24+i*12,x2:right,y2:staffY-24+i*12,stroke:"#9ba6ad","stroke-width":1},svg);
    el("text",{x:18,y:staffY+7,"font-size":44,fill:"#263746","font-family":"serif"},svg,"𝄞");
    el("text",{x:56,y:staffY-8,"font-size":15,fill:"#263746","font-weight":"700"},svg,(rhythm.meter===6?"6/8":`${rhythm.meter||4}/4`));

    const usable=right-left-20,unit=usable/beats;
    const groupLength=rhythm.meter===6?1.5:1;
    let cursor=left+12;
    const positioned=[];
    rhythm.events.forEach((event,index)=>{
      const start=cursor-(left+12);
      const x=cursor+Math.max(9,unit*event.duration/2);
      positioned.push({
        event,
        index,
        x,
        start,
        group:Math.floor((start+0.001)/(unit*groupLength))
      });
      cursor+=unit*event.duration;
    });

    const isBeamable=item=>item&&!item.event.rest&&(item.event.duration===.5||item.event.duration===.25);
    const sameBeamGroup=(a,b)=>isBeamable(a)&&isBeamable(b)&&a.group===b.group;
    const isTriplet=item=>item&&!item.event.rest&&Math.abs(item.event.duration-1/3)<.001;
    const stemY=staffY+5-37;
    const stemX=item=>item.x+6;
    const lineColor=(item)=>options.eventColors?.[item.index]||"#172632";
    const drawBeam=(x1,y1,x2,y2,color,width=4)=>{
      el("line",{x1,y1,x2,y2,stroke:color,"stroke-width":width,"stroke-linecap":"round"},svg);
    };

    positioned.forEach((item,index)=>{
      const {event,x}=item;
      const color=lineColor(item);
      if(event.rest){
        const symbol=event.duration>=3.5?"𝄻":event.duration>=1.5?"𝄼":event.duration>=.75?"𝄽":event.duration>=.5?"𝄾":"𝄿";
        el("text",{x:x-8,y:staffY+8,"font-size":event.duration>=1.5?25:22,fill:color,"font-family":"serif"},svg,symbol);
        return;
      }
      const whole=event.duration>=3.5,half=event.duration>=1.5;
      const noteY=staffY+5;
      el("ellipse",{cx:x,cy:noteY,rx:whole?7:6.5,ry:4.7,transform:`rotate(-20 ${x} ${noteY})`,fill:whole||half?"none":color,stroke:color,"stroke-width":1.6},svg);
      if(!whole&&!half)el("line",{x1:x+6,y1:noteY-1,x2:x+6,y2:noteY-37,stroke:color,"stroke-width":1.7},svg);
    });

    positioned.forEach((item,index)=>{
      const previous=positioned[index-1],next=positioned[index+1];
      const event=item.event;
      if(event.rest||event.duration>=1)return;
      const previousBeam=sameBeamGroup(previous,item);
      const nextBeam=sameBeamGroup(item,next);
      const previousTripletBeam=isTriplet(previous)&&isTriplet(item)&&previous.group===item.group;
      const nextTripletBeam=isTriplet(item)&&isTriplet(next)&&item.group===next.group;
      const color=lineColor(item);

      if(event.duration===.5&&!previousBeam&&!nextBeam){
        el("path",{d:`M ${stemX(item)} ${stemY} q 17 8 5 20`,fill:"none",stroke:color,"stroke-width":1.8},svg);
      }
      if(event.duration===.25&&!previousBeam&&!nextBeam){
        el("path",{d:`M ${stemX(item)} ${stemY} q 17 8 5 20`,fill:"none",stroke:color,"stroke-width":1.8},svg);
        el("path",{d:`M ${stemX(item)} ${stemY+7} q 17 8 5 20`,fill:"none",stroke:color,"stroke-width":1.8},svg);
      }
      if(event.duration===1/3&&!previousTripletBeam&&!nextTripletBeam){
        el("path",{d:`M ${stemX(item)} ${stemY} q 17 8 5 20`,fill:"none",stroke:color,"stroke-width":1.8},svg);
      }

      if(nextBeam){
        drawBeam(stemX(item),stemY,stemX(next),stemY,color);
      }
      if(nextTripletBeam){
        drawBeam(stemX(item),stemY,stemX(next),stemY,color);
      }

      if(event.duration===.25){
        if(next?.event.duration===.25&&next.group===item.group&&!next.event.rest){
          drawBeam(stemX(item),stemY+7,stemX(next),stemY+7,color);
        }else if(next?.event.duration===.5&&next.group===item.group&&!next.event.rest){
          drawBeam(stemX(item),stemY+7,(stemX(item)+stemX(next))/2,stemY+7,color);
        }
        if(previous?.event.duration===.5&&previous.group===item.group&&!previous.event.rest){
          drawBeam((stemX(previous)+stemX(item))/2,stemY+7,stemX(item),stemY+7,color);
        }
      }
    });

    const tripletGroups=[];
    positioned.forEach((item,index)=>{
      if(!isTriplet(item))return;
      const previous=positioned[index-1];
      if(isTriplet(previous)&&previous.group===item.group)return;
      const group=[item];
      for(let next=index+1;next<positioned.length;next++){
        const candidate=positioned[next];
        if(!isTriplet(candidate)||candidate.group!==item.group)break;
        group.push(candidate);
      }
      tripletGroups.push(group);
    });
    tripletGroups.forEach(group=>{
      const first=group[0],last=group[group.length-1];
      const y=staffY-49;
      const start=first.x-8,end=last.x+8,middle=(start+end)/2;
      el("line",{x1:start,y1:y+5,x2:start,y2:y,stroke:"#263746","stroke-width":1.2},svg);
      el("line",{x1:start,y1:y,x2:middle-9,y2:y,stroke:"#263746","stroke-width":1.2},svg);
      el("line",{x1:middle+9,y1:y,x2:end,y2:y,stroke:"#263746","stroke-width":1.2},svg);
      el("line",{x1:end,y1:y,x2:end,y2:y+5,stroke:"#263746","stroke-width":1.2},svg);
      el("text",{x:middle,y:y+4,"text-anchor":"middle","font-size":12,fill:"#263746","font-weight":"700"},svg,"3");
    });

    if(options.label)el("text",{x:right-5,y:18,"text-anchor":"end","font-size":9,fill:"#71808b"},svg,options.label);
    el("line",{x1:right,y1:staffY-25,x2:right,y2:staffY+25,stroke:"#53616b","stroke-width":1.5},svg);
  }
  window.Notation={draw};
})();
