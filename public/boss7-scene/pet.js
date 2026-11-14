// Registered base + three transparent tongues, independently deformed.
(async function () {
 const canvas=document.querySelector('#pet');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});
 const status=document.querySelector('#pet-status');
 try {
 if(!gl)throw Error('WebGL недоступний для пета');
 const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;varying vec2 uv;uniform sampler2D picture,tongueLeft,tongueCenter,tongueRight;uniform float time,strength,tongues,pendant,eyes,tail,crouch;
 float area(vec2 p,vec2 c,vec2 r){vec2 a=(p-c)/r;return exp(-dot(a,a)*3.);}

 vec4 over(vec4 bg,vec4 fg){float alpha=fg.a+bg.a*(1.-fg.a);return vec4((fg.rgb*fg.a+bg.rgb*bg.a*(1.-fg.a))/max(alpha,.00001),alpha);}
 vec2 tonguePoint(vec2 p,vec2 root,float phase){
  vec2 rel=p-root;float reach=length(rel);float freeTip=smoothstep(12.,330.,reach);
  float motion=tongues*strength;
  float angle=(sin(time*1.85+phase)*.095+sin(time*2.7-reach*.009+phase)*.055*freeTip)*freeTip*motion;
  float cs=cos(angle),sn=sin(angle);rel=mat2(cs,-sn,sn,cs)*rel;
  rel-=vec2(sin(time*2.4-reach*.014+phase)*15.,cos(time*2.1-reach*.012+phase)*10.)*freeTip*freeTip*motion;
  return (root+rel)/1254.;
 }
 vec2 registered(vec2 point,vec2 root,vec2 assetRoot,float scale){return ((point*1254.-root)/scale+assetRoot)/1254.;}
 void main(){vec2 p=uv*1254.;vec2 d=vec2(0.);
 // Inverse compression towards the floor; toes stay planted at their own heights.
 float squat=pow(.5+.5*sin(time*1.45-.8),2.)*.022*crouch*min(strength,2.);
 float floorY=mix(1147.,1230.,smoothstep(490.,715.,p.x));
 p.y=floorY+(p.y-floorY)/(1.-squat);
 float tailArea=area(p,vec2(200.,465.),vec2(205.,175.));
 d+=tail*vec2(sin(time*1.6-p.y*.007)*11.,cos(time*1.6-p.x*.008)*6.)*tailArea;
 float jewel=area(p,vec2(1129.,386.),vec2(74.,84.));
 float angle=sin(time*1.9)*.09*pendant;vec2 rel=p-vec2(1126.,320.);
 d+=vec2(-rel.y*angle,rel.x*angle)*jewel;
 vec2 q=(p-d*strength)/1254.;vec4 color=texture2D(picture,q);vec2 pos=q*1254.;
 float eyeA=1.-smoothstep(.7,1.,length((pos-vec2(626.,350.))/vec2(72.,65.)));
 float eyeB=1.-smoothstep(.7,1.,length((pos-vec2(887.,429.))/vec2(64.,69.)));
 float cosmic=max(eyeA,eyeB);float pulse=.5+.5*sin(time*2.3+pos.y*.022);
 color.rgb+=vec3(.08,.045,.19)*cosmic*pulse*eyes;
 // Tiny moving cross-shaped glints stay within the eyes.
 vec2 star1=pos-(vec2(599.,366.)+vec2(sin(time*.8)*13.,cos(time)*9.));
 vec2 star2=pos-(vec2(880.,415.)+vec2(cos(time*.9)*12.,sin(time*.8)*13.));
 float spark1=exp(-abs(star1.x)*.7-abs(star1.y)*.10)+exp(-abs(star1.x)*.10-abs(star1.y)*.7);
 float spark2=exp(-abs(star2.x)*.65-abs(star2.y)*.10)+exp(-abs(star2.x)*.10-abs(star2.y)*.65);
 color.rgb+=vec3(.55,.72,1.)*(spark1+spark2)*cosmic*eyes*(.45+.55*pow(.5+.5*sin(time*3.),2.));

 color=over(color,texture2D(tongueLeft,registered(tonguePoint(p,vec2(602.,467.),.3),vec2(602.,467.),vec2(790.,345.),.40)));
 color=over(color,texture2D(tongueRight,registered(tonguePoint(p,vec2(800.,540.),2.4),vec2(800.,540.),vec2(670.,490.),.72)));
 color=over(color,texture2D(tongueCenter,registered(tonguePoint(p,vec2(710.,500.),1.3),vec2(710.,500.),vec2(744.,490.),.78)));
 gl_FragColor=color;}`;
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

 const layers=[['picture','pet-base.webp'],['tongueLeft','tongue-left.webp'],['tongueCenter','tongue-center.webp'],['tongueRight','tongue-right.webp']];
 const images=await Promise.all(layers.map(async ([,path])=>{const image=new Image();image.src=path;await image.decode();return image;}));
 for(let i=0;i<layers.length;i++){const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,images[i]);gl.uniform1i(gl.getUniformLocation(program,layers[i][0]),i);}

 const names=['time','strength','tongues','pendant','eyes','tail','crouch'];const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]));let t=0,previous=performance.now();
 document.querySelector('#pet-visible').onchange=e=>canvas.hidden=!e.target.checked;
 document.querySelector('#pet-size').oninput=e=>canvas.style.width=e.target.value+'%';
 const frameControls=Object.fromEntries(names.filter(n=>n!=='time').map(n=>[n,document.querySelector((n==='strength'?'#strength':'#pet-'+n))]));
 function render(now,resumed){if(resumed)previous=now;const paused=document.querySelector('#pause').getAttribute('aria-pressed')==='true';if(!paused&&!document.hidden)t+=Math.min((now-previous)/1000,.05);previous=now;gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.strength,frameControls.strength.value/100);for(const name of names.slice(2))gl.uniform1f(uniforms[name],frameControls[name].checked?1:0);gl.drawArrays(gl.TRIANGLES,0,6);if(!window.__petReady){canvas.style.backgroundImage='none';window.__petReady=true;requestAnimationFrame(()=>parent.postMessage({type:'planet4:cleopatra-layer-ready',layer:'pet'},location.origin));}}status.textContent='Пет готовий';window.cleopatraRenderLoop(canvas,render);
 }catch(error){status.textContent=error.message;console.error(error);window.dispatchEvent(new CustomEvent('cleopatra-layer-error',{detail:'pet'}));}
})();
