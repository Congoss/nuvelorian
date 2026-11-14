const canvas=document.querySelector('#scene');
const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 uv;uniform sampler2D art;uniform float time, strength, eyes, body, props, forcedBlink;
const vec2 size=vec2(1036.,1518.);
float area(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return exp(-dot(q,q)*2.);}
vec2 rotate(vec2 p,vec2 pivot,float a){float s=sin(a),c=cos(a);p-=pivot;return pivot+mat2(c,s,-s,c)*p;}
vec4 tex(vec2 p){vec4 c=texture2D(art,vec2(p.x/size.x,1.-p.y/size.y));return vec4(c.rgb/max(c.a,1./255.),c.a);}
float pulse(float t,float at){float x=abs(t-at);return 1.-smoothstep(.035,.14,x);}
float blink(float offset){float t=mod(time+offset,6.7);return max(max(pulse(t,1.7),pulse(t,1.99)*.85),pulse(t,5.4));}
vec4 eye(vec4 color,vec2 p,vec2 center,vec2 radius,float angle,float offset){
 if(eyes<.5||strength<=0.)return color;
 vec2 q=rotate(p,center,-angle)-center;vec2 e=q/radius;float ellipse=dot(e,e);
 if(ellipse>1.40)return color;
 float b=max(blink(offset),forcedBlink)*eyes*min(strength,1.);
 // Close the complete eyeball and its outline onto a horizontal seam.
 // Skin behind the moving lid is sampled from actual adjacent pink fur.
 float opening=max(.018,1.-b);
 vec2 squeezed=vec2(q.x,q.y/opening);
 vec2 source=rotate(center+squeezed,center,angle);
 float inner=dot(squeezed/radius,squeezed/radius);
 vec4 eyeball=tex(source);
 // Move only dark pupil pixels; the sclera and its outline do not wobble.
 vec2 gaze=vec2(sin(time*.95+offset)*5.8,sin(time*.71+offset*.7)*2.6)*eyes*min(strength,1.3);
 gaze*=radius.x/29.;
 float oldPupil=(1.-smoothstep(10.,14.,length(source-center)))*(1.-smoothstep(.22,.38,max(max(eyeball.r,eyeball.g),eyeball.b)));
 vec4 sclera=tex(center+vec2(-radius.x*.47,radius.y*.18));
 eyeball.rgb=mix(eyeball.rgb,sclera.rgb,oldPupil);
 vec4 moved=tex(source-gaze);
 float newPupil=(1.-smoothstep(10.,14.,length(source-gaze-center)))*(1.-smoothstep(.22,.38,max(max(moved.r,moved.g),moved.b)));
 eyeball.rgb=mix(eyeball.rgb,moved.rgb,newPupil);
 vec2 furBase=offset<.5?vec2(336.,372.):offset<2.?vec2(224.,1318.):vec2(875.,1318.);
 vec2 furPoint=furBase+q*vec2(.20,.10);
 vec4 fur=tex(furPoint);
 float outer=1.-smoothstep(1.04,1.34,ellipse);
 float visible=1.-smoothstep(.99,1.10,inner);
 vec3 closed=mix(fur.rgb,eyeball.rgb,visible);
 float seam=(1.-smoothstep(.7,1.7,abs(q.y)))*(1.-smoothstep(.85,1.03,abs(e.x)))*smoothstep(.93,.995,b);
 closed=mix(closed,vec3(.12,.045,.075),seam);
 color.rgb=mix(color.rgb,closed,outer);
 return color;
}
void main(){
 vec2 p=vec2(uv.x,1.-uv.y)*size;vec2 q=p;float a=strength*body;
 float breath=sin(time*1.5);
 q-=vec2((p.x-537.)*.009,-1.15)*area(p,vec2(540.,454.),vec2(148.,105.))*breath*a;
 // Broad gentle bends keep joints connected; the hand and its prop move together.
 q-=vec2(sin(time*.91)*7.,cos(time*.91)*3.)*area(p,vec2(192.,300.),vec2(95.,235.))*a;
 q-=vec2(sin(time*.83+1.2)*6.,sin(time*.83)*3.5)*area(p,vec2(851.,260.),vec2(150.,235.))*a;
 q-=vec2(sin(time*.74+.4)*3.2,breath*2.)*area(p,vec2(343.,564.),vec2(150.,90.))*a;
 q-=vec2(sin(time*.78+2.)*5.,sin(time*.78)*3.)*area(p,vec2(850.,590.),vec2(150.,110.))*a;
 // Cloth motion grows toward each hanging tip without a moving cut edge.
 q.x-=sin(time*1.42+(p.y-600.)*.003)*2.7*smoothstep(592.,990.,p.y)*area(p,vec2(585.,820.),vec2(40.,250.))*a;
 q.x-=sin(time*1.5+1.)*1.8*area(p,vec2(642.,667.),vec2(27.,100.))*a;
 // Flexible antennae, constrained to the narrow silhouettes and clear surrounding alpha.
 q.x-=sin(time*1.8)*6.5*area(p,vec2(585.,91.),vec2(65.,65.))*a;
 q.y-=cos(time*1.8)*2.2*area(p,vec2(598.,80.),vec2(34.,35.))*a;
 q.y-=sin(time*1.65+1.6)*5.5*area(p,vec2(638.,148.),vec2(57.,26.))*a;
 // Flyaway hair tips sway independently; the face, fringe and roots stay anchored.
 q-=vec2(sin(time*1.55+.5)*3.8,cos(time*1.3)*2.)*area(p,vec2(369.,137.),vec2(60.,45.))*a;
 q-=vec2(sin(time*1.8+1.)*4.5,cos(time*1.6)*2.2)*area(p,vec2(343.,195.),vec2(40.,59.))*a;
 q-=vec2(sin(time*1.65+2.)*3.5,cos(time*1.4)*1.7)*area(p,vec2(368.,285.),vec2(32.,55.))*a;
 q-=vec2(sin(time*1.55+2.5)*4.,cos(time*1.7)*2.)*area(p,vec2(644.,223.),vec2(37.,59.))*a;
 q-=vec2(sin(time*1.8+3.)*3.8,cos(time*1.5)*2.)*area(p,vec2(625.,315.),vec2(40.,54.))*a;
 // Rigid key swing below the stationary held ring, with no rubber deformation.
 if(p.x>832. && p.y>590. && p.y<800.)q=rotate(q,vec2(911.,597.),sin(time*1.45)*.024*strength*props);
 // Flame tip movement increases with height; metal lighter stays motionless.
 if(p.x>183.&&p.x<245.&&p.y>126.&&p.y<217.){
  float h=clamp((216.-p.y)/78.,0.,1.);
  q.x-=sin(time*10.+p.y*.055)*2.3*h*props*strength;
  q.y+=sin(time*13.1)*2.*h*props*strength;
 }
 vec4 color=tex(q);
 color=eye(color,q,vec2(336.,410.),vec2(30.,28.),-.12,0.);
 color=eye(color,q,vec2(405.,399.),vec2(25.,21.),-.12,0.);
 color=eye(color,q,vec2(177.,1352.),vec2(30.,26.),0.,1.25);
 color=eye(color,q,vec2(269.,1354.),vec2(25.,23.),0.,1.25);
 color=eye(color,q,vec2(833.,1355.),vec2(30.,25.),0.,2.8);
 color=eye(color,q,vec2(915.,1354.),vec2(26.,23.),0.,2.8);
 float fire=area(p,vec2(214.,187.),vec2(25.,45.))*step(p.y,213.);
 color.rgb*=1.+fire*(sin(time*18.)*.08+sin(time*27.)*.035)*props*strength;
 // All transparent pixels stay transparent, including animated silhouettes.
 gl_FragColor=color;
}`;
try{
 if(!gl)throw Error('WebGL недоступний');
 gl.disable(gl.DITHER);
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const image=new Image();image.src='character-edge-v6.webp';await image.decode();canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;gl.viewport(0,0,canvas.width,canvas.height);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 const names=['time','strength','eyes','body','props','forcedBlink'];const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]));
 let t=0,previous=performance.now(),paused=matchMedia('(prefers-reduced-motion: reduce)').matches,original=false,blinkStart=-100;
 const pause=document.querySelector('#pause');const setPause=()=>pause.textContent=paused?'Продовжити':'Пауза';setPause();pause.onclick=()=>{paused=!paused;setPause();};
 document.querySelector('#original').onclick=e=>{original=!original;e.target.setAttribute('aria-pressed',String(original));};
 document.querySelector('#blink').onclick=()=>{blinkStart=t;};
 const backdrop=document.querySelector('#background');
 backdrop.add(new Option('Гараж королеви','garage'),0);
 const backgroundStyle=document.createElement('style');backgroundStyle.textContent=`
 .stage{position:relative;isolation:isolate}.stage canvas{position:relative;z-index:1}
 .stage.garage{background:#14151b url('garage-background.webp') center / auto 100% no-repeat}
 .stage.garage:before{content:'';position:absolute;bottom:.7%;left:50%;transform:translateX(-50%);width:min(54vh,80%);height:3%;background:radial-gradient(ellipse at 18% 50%,#0009,transparent 28%),radial-gradient(ellipse at 82% 50%,#0009,transparent 28%);filter:blur(5px)}
 .stage.garage:after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 12% 15%,#f349b30c,transparent 40%),radial-gradient(ellipse at 90% 35%,#e841b00b,transparent 35%);animation:neon 7s infinite}
 @keyframes neon{0%,35%,39%,75%,100%{opacity:.45}36%,38%{opacity:.1}60%,85%{opacity:1}}
 @media(prefers-reduced-motion:reduce){.stage.garage:after{animation:none}}
 `;document.head.append(backgroundStyle);
 backdrop.onchange=e=>{const s=document.querySelector('.stage');s.classList.toggle('checker',e.target.value==='checker');s.classList.toggle('garage',e.target.value==='garage');s.style.background=e.target.value==='light'?'#e9e5eb':e.target.value==='green'?'#294238':'';};
 document.querySelector('#save').onclick=()=>{const link=document.createElement('a');link.download='gum-queen-frame.png';link.href=canvas.toDataURL();link.click();};
 const strengthControl=document.querySelector('#strength');
 const amount=document.querySelector('#amount');
 const controls=['eyes','body','props'].map(name=>[uniforms[name],document.querySelector('#'+name)]);
 let lastFrame='';
 function render(now){
  requestAnimationFrame(render);
  if(!paused&&!document.hidden)t+=Math.min(.05,(now-previous)/1000);
  previous=now;
  if(document.hidden)return;
  const strength=original?0:Number(strengthControl.value);
  const flags=controls.map(([,control])=>original?0:Number(control.checked));
  const blink=pulseJS(t-blinkStart);
  const stamp=[t,strength,blink,...flags].join(':');
  if(stamp===lastFrame)return;
  lastFrame=stamp;
  const label=Math.round(strength*100)+'%';
  if(amount.value!==label)amount.value=label;
  gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.strength,strength);
  controls.forEach(([location],index)=>gl.uniform1f(location,flags[index]));
  gl.uniform1f(uniforms.forcedBlink,blink);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);
 }
 function pulseJS(x){return x<0||x>.32?0:Math.sin(Math.PI*x/.32);}
 // Deterministic local review hooks; no game state or network integration.
 let initialized=false;
 window.gumQueenPreview={setTime(value){t=value;paused=true;setPause();},get time(){return t;},get original(){return original;},setPaused(value){paused=Boolean(value);setPause();},get ready(){return initialized;}};
 await import('./background.js?edge-clean=6');
 initialized=true;
 requestAnimationFrame(render);document.querySelector('#status').textContent='Анімація готова · прозорий PNG';
}catch(e){document.querySelector('#status').textContent=e.message;console.error(e);}
