(async function(){
 const canvas=document.querySelector('#arena');const gl=canvas.getContext('webgl',{alpha:false});
 const status=document.querySelector('#arena-status');
 try{
 if(!gl)throw Error('WebGL недоступний для фону');
 const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;varying vec2 uv;uniform sampler2D picture;uniform float time,fire,dust,haze;
 float area(vec2 p,vec2 c,vec2 r){vec2 a=(p-c)/r;return exp(-dot(a,a)*3.);}
 float hash(float n){return fract(sin(n*127.1)*43758.5453);}
 void main(){vec2 p=uv*vec2(853.,1280.);vec2 d=vec2(0.);
 float flames=area(p,vec2(302.,463.),vec2(23.,24.))+area(p,vec2(357.,576.),vec2(20.,30.))+area(p,vec2(303.,603.),vec2(15.,24.))+area(p,vec2(427.,657.),vec2(14.,26.))+area(p,vec2(485.,623.),vec2(20.,22.))+area(p,vec2(538.,543.),vec2(23.,25.));
 float greenFlame=area(p,vec2(61.,616.),vec2(53.,63.));
 d.x=sin(time*6.5-p.y*.15)*2.2*(flames+greenFlame)*fire;
 d.y=cos(time*5.2+p.x*.12)*1.7*(flames+greenFlame)*fire;
 vec3 color=texture2D(picture,(p-d)/vec2(853.,1280.)).rgb;
 float flicker=sin(time*5.7)*.38+sin(time*9.1+1.)*.2+sin(time*2.8)*.42;
 float warm=area(p,vec2(350.,596.),vec2(180.,235.))+area(p,vec2(531.,600.),vec2(95.,140.));
 color+=vec3(.075,.038,.009)*warm*flicker*fire;
 color+=vec3(.12,.065,.014)*flames*(.5+.5*sin(time*7.+p.y*.1))*fire;
 float slime=area(p,vec2(56.,651.),vec2(80.,77.))+area(p,vec2(145.,1100.),vec2(51.,123.))+area(p,vec2(797.,824.),vec2(37.,110.));
 color+=vec3(.021,.032,.001)*slime*(.5+.5*sin(time*1.5))*fire;
 // Soft drifting vapor confined to the green brazier.
 vec2 fogPos=p-vec2(56.+sin(time*.8-p.y*.014)*15.,535.);
 float smoke=exp(-pow(fogPos.x/43.,2.)-pow(fogPos.y/125.,2.));
 float wisps=.5+.5*sin(p.y*.045+time*1.65+sin(p.x*.04-time*.6));
 color=mix(color,vec3(.51,.52,.21),smoke*(.35+wisps*.65)*.24*haze);
 for(int i=0;i<48;i++){float seed=float(i)+1.;float x=hash(seed)*853.+sin(time*.12+seed)*13.;float y=mod(hash(seed+71.)*1280.-time*(6.+hash(seed+24.)*12.)+1280.,1280.);vec2 delta=p-vec2(x,y);float size=1.3+hash(seed+90.)*1.7;float speck=exp(-dot(delta,delta)/(size*size));float fade=.35+.65*pow(.5+.5*sin(time*.55+seed),2.);color+=vec3(.88,.73,.48)*speck*.65*fade*dust;}
 gl_FragColor=vec4(color,1.);}`;
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const image=new Image();image.src='arena.webp';await image.decode();const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const [key,value] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 const names=['time','fire','dust','haze'];const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]));let time=0,previous=performance.now();
 const select=document.querySelector('#background');select.addEventListener('change',()=>canvas.hidden=select.value!=='temple');
 const frameControls=Object.fromEntries(names.filter(n=>n!=='time').map(n=>[n,document.querySelector('#'+"arena-"+n)]));
 function render(now,resumed){if(resumed)previous=now;if(document.querySelector('#pause').getAttribute('aria-pressed')!=='true'&&!document.hidden)time+=Math.min((now-previous)/1000,.05);previous=now;gl.uniform1f(uniforms.time,time);for(const name of names.slice(1))gl.uniform1f(uniforms[name],frameControls[name].checked?1:0);if(!canvas.hidden)gl.drawArrays(gl.TRIANGLES,0,6);if(!window.__backgroundReady){canvas.style.backgroundImage='none';window.__backgroundReady=true;requestAnimationFrame(()=>parent.postMessage({type:'planet4:cleopatra-layer-ready',layer:'background'},location.origin));}}status.textContent='Фон готовий';window.cleopatraRenderLoop(canvas,render);
 }catch(error){status.textContent=error.message;console.error(error);window.dispatchEvent(new CustomEvent('cleopatra-layer-error',{detail:'background'}));}
})();
