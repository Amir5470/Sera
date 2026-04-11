(function(){
  const slides = Array.from(document.querySelectorAll('#carousel .slide'));
  let idx = 0;
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const reduceToggle = document.getElementById('reduceMotionToggle');
  const phone = document.querySelector('.phone-frame');
  let anim = true;

  function show(i){
    slides.forEach((s,si)=>{
      s.style.opacity = si===i? '1' : '0';
      s.style.transform = si===i? 'translateZ(0px) scale(1)' : 'translateZ(-60px) scale(0.98)';
      s.style.transition = 'opacity 420ms cubic-bezier(.22,.9,.33,1), transform 420ms';
    });
  }

  function next(){ idx = (idx+1) % slides.length; show(idx); }
  function prev(){ idx = (idx-1 + slides.length) % slides.length; show(idx); }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // simple auto rotate / bob animation for phone
  let t = 0;
  function animate(){
    if(!anim) return;
    t += 0.02;
    const rotY = Math.sin(t)*4;
    const bob = Math.sin(t*0.8)*8;
    phone.style.transform = `rotateY(${rotY}deg) translateY(${bob}px)`;
    requestAnimationFrame(animate);
  }
  animate();

  reduceToggle.addEventListener('change', (e)=>{
    anim = !e.target.checked;
    if(!anim) phone.style.transform = 'none';
  });

  // keyboard support
  document.addEventListener('keydown',(e)=>{
    if(e.key === 'ArrowRight') next();
    if(e.key === 'ArrowLeft') prev();
  });

  // init
  show(0);
})();
