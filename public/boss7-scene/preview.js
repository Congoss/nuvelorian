/* One source image; continuous local deformation, no separate sprite layers. */
const canvas = document.querySelector('#boss');
const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
const status = document.querySelector('#status');
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
uniform sampler2D picture; uniform float time, strength, arms, cloth, worms, shine, breath, hair;
uniform float hitAge;
varying vec2 uv;
float region(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.5);}
vec2 worm(vec2 p,vec2 c,vec2 r,float phase){float w=region(p,c,r);return vec2(sin(time*3.3+phase+(p.y-c.y)*.15)*3.2,cos(time*2.8+phase)*1.4)*w;}
void main(){
 vec2 p=uv*vec2(853.,1280.);vec2 d=vec2(0.);
 float upper=region(p,vec2(430.,420.),vec2(210.,440.));
 d+=vec2(sin(time*1.4)*1.4,-sin(time*1.4)*2.2)*upper*breath;
 d.x+=(p.x-430.)*.006*sin(time*1.4)*region(p,vec2(430.,400.),vec2(100.,130.))*breath;
 d+=vec2(sin(time*1.5)*6.,cos(time*1.5)*1.7)*region(p,vec2(205.,580.),vec2(85.,160.))*arms;
 d+=vec2(sin(time*1.5+.9)*5.5,cos(time*1.5+.9)*1.5)*region(p,vec2(660.,715.),vec2(73.,160.))*arms;
 d.x+=cloth*(sin(time*1.9+p.y*.015)*5.*region(p,vec2(275.,740.),vec2(25.,200.))+sin(time*1.65+p.y*.012+1.)*7.*region(p,vec2(638.,1000.),vec2(44.,245.))+sin(time*1.8+p.y*.013+2.)*4.*region(p,vec2(342.,833.),vec2(30.,135.))+sin(time*1.9+p.y*.012)*3.*region(p,vec2(555.,807.),vec2(23.,143.)));
 d+=worms*(worm(p,vec2(358.,281.),vec2(39.,29.),0.)+worm(p,vec2(252.,454.),vec2(23.,37.),1.)+worm(p,vec2(429.,468.),vec2(38.,40.),2.)+worm(p,vec2(598.,534.),vec2(38.,43.),3.)+worm(p,vec2(433.,761.),vec2(28.,35.),4.)+worm(p,vec2(510.,926.),vec2(33.,37.),5.)+worm(p,vec2(524.,1049.),vec2(28.,40.),6.));
 // Long side locks move with different phases; the crown stays anchored.
 float tips=smoothstep(190.,580.,p.y);
 float leftLock=region(p,vec2(330.-(p.y-220.)*.29,405.),vec2(33.,205.));
 float innerLock=region(p,vec2(327.,540.),vec2(27.,135.));
 float rightLock=region(p,vec2(520.+(p.y-220.)*.28,400.),vec2(28.,175.));
 d.x+=hair*tips*(sin(time*1.25-p.y*.009)*5.5*leftLock+sin(time*1.45-p.y*.011+1.2)*5.*innerLock+sin(time*1.15-p.y*.009+2.)*6.*rightLock);
 d.y+=hair*tips*cos(time*1.25-p.y*.009)*.65*(leftLock+rightLock);
 float impact=exp(-hitAge*8.)*sin(hitAge*48.);
 float anger=smoothstep(0.,.045,hitAge)*(1.-smoothstep(.28,.6,hitAge));
 vec2 recoil=vec2(impact*11.,-sin(min(hitAge/.55,1.)*3.14159)*3.)*(1.-smoothstep(170.,1250.,p.y));
 recoil.x+=impact*4.*(leftLock+rightLock+region(p,vec2(638.,1000.),vec2(44.,245.)));
 recoil+=vec2(impact*3.,-impact*2.)*(region(p,vec2(429.,468.),vec2(38.,40.))+region(p,vec2(598.,534.),vec2(38.,43.))+region(p,vec2(510.,926.),vec2(33.,37.)));
 vec2 sampleUV=(p-d*strength-recoil)/vec2(853.,1280.); vec4 color=texture2D(picture,sampleUV);
 vec2 q=sampleUV*vec2(853.,1280.);
 float gold=step(color.b,color.r*.48)*step(color.g*.95,color.r)*smoothstep(.3,.7,color.r)*step(.28,color.g);
 float jewelry=region(q,vec2(455.,52.),vec2(57.,53.))+region(q,vec2(425.,293.),vec2(85.,44.))+region(q,vec2(308.,383.),vec2(34.,28.))+region(q,vec2(195.,563.),vec2(36.,27.))+region(q,vec2(499.,573.),vec2(79.,39.))+region(q,vec2(646.,672.),vec2(31.,37.))+region(q,vec2(337.,1090.),vec2(40.,37.))+region(q,vec2(487.,1051.),vec2(38.,31.));
 float sweep=pow(max(0.,1.-abs(fract((q.x+q.y*.55)/750.-time*.19)*2.-1.)*15.),3.);
 color.rgb+=vec3(1.,.9,.63)*gold*min(1.,jewelry*2.)*sweep*.85*shine*min(strength,1.);
 float leftEye=1.-smoothstep(.83,1.,length((q-vec2(420.,150.))/vec2(19.,20.)));
 float rightEye=1.-smoothstep(.83,1.,length((q-vec2(479.,160.))/vec2(15.,17.)));
 float leftEdge=140.+(q.x-401.)*.46;
 float rightEdge=159.-(q.x-464.)*.43;
 float lidLeft=1.-smoothstep(leftEdge,leftEdge+1.2,q.y);
 float lidRight=1.-smoothstep(rightEdge,rightEdge+1.2,q.y);
 // Sample the adjacent forehead so eyelids match the original skin palette.
 vec3 leftSkin=texture2D(picture,vec2(418.,124.)/vec2(853.,1280.)).rgb;
 vec3 rightSkin=texture2D(picture,vec2(476.,138.)/vec2(853.,1280.)).rgb;
 float leftRim=smoothstep(leftEdge-2.,leftEdge-.5,q.y);
 float rightRim=smoothstep(rightEdge-2.,rightEdge-.5,q.y);
 color.rgb=mix(color.rgb,mix(leftSkin,vec3(.22,.17,.12),leftRim*.85),leftEye*lidLeft*anger);
 color.rgb=mix(color.rgb,mix(rightSkin,vec3(.22,.17,.12),rightRim*.85),rightEye*lidRight*anger);
 gl_FragColor=color;
}`;
function shader(type, source) { const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s; }
async function start(){
 if(!gl)throw Error('WebGL недоступний у цьому браузері.');
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const image=new Image();image.src='boss-22.webp';await image.decode();
 const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,image.width,image.height);const data=pixels.data;
 // Remove only background pixels connected to an image edge; keep enclosed gold.
 const w=image.width,h=image.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 function add(i){if(i<0||i>=w*h||seen[i])return;seen[i]=1;const j=i*4,r=data[j],g=data[j+1],b=data[j+2];if(data[j+3]<10||(r>245&&g>175&&g<215&&b<18)||(r>248&&g>248&&b>248)){queue[tail++]=i;data[j+3]=0;}}
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}while(head<tail){const i=queue[head++];if(i%w)add(i-1);if(i%w<w-1)add(i+1);add(i-w);add(i+w);}ctx.putImageData(pixels,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
 const names=['time','strength','arms','cloth','worms','shine','breath','hair'];const uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program,name)]));let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,t=0,previous=performance.now();const pause=document.querySelector('#pause');function label(){pause.textContent=paused?'Продовжити':'Пауза';pause.setAttribute('aria-pressed',String(paused));}label();pause.onclick=()=>{paused=!paused;label();};document.querySelector('#strength').oninput=e=>document.querySelector('#amount').value=e.target.value+'%';document.querySelector('#background').onchange=e=>{document.querySelector('.stage').style.background={dark:'radial-gradient(ellipse at 50% 65%,#454133,#16191f 70%)',sand:'radial-gradient(ellipse at 50% 65%,#b19460,#615540 80%)',yellow:'#ffc600'}[e.target.value];};
 const hitUniform=gl.getUniformLocation(program,'hitAge');let hitStarted=-10000;
 const figure=document.querySelector('.figure');
 function hit(){hitStarted=performance.now();figure.classList.remove('struck');void figure.offsetWidth;figure.classList.add('struck');}
 document.querySelector('#hit').onclick=hit;canvas.onclick=hit;canvas.tabIndex=0;canvas.setAttribute('role','button');canvas.setAttribute('aria-label','Вдарити боса');canvas.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();hit();}};
 const frameControls=Object.fromEntries(names.filter(n=>n!=='time').map(n=>[n,document.querySelector('#'+n)]));
 function render(now,resumed){if(resumed)previous=now;gl.uniform1f(hitUniform,Math.max(0,(now-hitStarted)/1000));if(!paused&&!document.hidden)t+=Math.min((now-previous)/1000,.05);previous=now;gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.strength,frameControls.strength.value/100);for(const name of names.slice(2))gl.uniform1f(uniforms[name],frameControls[name].checked?1:0);gl.drawArrays(gl.TRIANGLES,0,6);if(!window.__bossReady){canvas.style.backgroundImage='none';window.__bossReady=true;requestAnimationFrame(()=>parent.postMessage({type:'planet4:cleopatra-layer-ready',layer:'boss'},location.origin));}}status.textContent='Готово · одна картинка · локальний перегляд';window.cleopatraRenderLoop(canvas,render);
}
start().catch(error=>{status.textContent=error.message;console.error(error);window.dispatchEvent(new CustomEvent('cleopatra-layer-error',{detail:'boss'}));});
