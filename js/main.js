(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Note entrance (IntersectionObserver) ---------- */
  const notes = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (Math.random() * 0.2).toFixed(2) + 's';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    notes.forEach((n) => io.observe(n));
  } else {
    notes.forEach((n) => n.classList.add('in'));
  }

  /* ---------- Bot journey ---------- */
  const bot = document.getElementById('bot');
  const stops = [...document.querySelectorAll('.stop')];
  if (!bot || !stops.length) return;

  // Reduced motion: park the bot quietly in a corner.
  if (reduce) {
    bot.style.transform = `translate(${innerWidth - 100}px, ${innerHeight - 120}px)`;
    return;
  }

  // Horizontal "side" per section (0 = left gutter, 1 = right gutter), hero -> contact.
  const sides = [1, 0, 1, 0, 1, 0, 0.5];
  let centers = [], lastY = scrollY, vel = 0, ticking = false, lastX = 0;

  const measure = () => {
    centers = stops.map((s) => s.offsetTop + s.offsetHeight / 2);
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const place = () => {
    ticking = false;
    const vw = innerWidth, vh = innerHeight;
    const mobile = vw <= 640;
    const botW = bot.offsetWidth;
    const probe = scrollY + vh * 0.5;

    // Find the segment between two section centres.
    let i = 0;
    while (i < centers.length - 2 && probe > centers[i + 1]) i++;
    let t = clamp((probe - centers[i]) / (centers[i + 1] - centers[i]), 0, 1);
    if (probe < centers[0]) t = 0;

    // Pause: stay at the section for the first/last 30% of each segment.
    const eased = smooth(clamp((t - 0.3) / 0.4, 0, 1));
    const s = sides[i] + (sides[i + 1] - sides[i]) * eased;

    const edgeL = 6, edgeR = vw - botW - 6;
    let x = edgeL + (edgeR - edgeL) * s;
    if (mobile) x = edgeR - (edgeR - edgeL) * 0.12 * Math.sin(eased * Math.PI) - 0; // simple path on phones

    // Curved path: a vertical sweep while crossing between sections.
    const y = vh * (mobile ? 0.82 : 0.68) - Math.sin(eased * Math.PI) * vh * 0.12;

    const moving = Math.abs(vel) > 1.5 || (eased > 0.02 && eased < 0.98);
    const dx = x - lastX;
    if (Math.abs(dx) > 0.5) bot.classList.toggle('flip', dx < 0);
    lastX = x;
    bot.classList.toggle('moving', moving);
    bot.classList.toggle('point', !moving && !mobile);
    // Point toward the content (towards page centre).
    if (!moving) bot.classList.toggle('flip', x > vw / 2);

    bot.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    vel *= 0.8;
  };

  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } };
  addEventListener('scroll', () => {
    vel = scrollY - lastY; lastY = scrollY; request();
    clearTimeout(request.t); request.t = setTimeout(() => { vel = 0; request(); }, 140);
  }, { passive: true });
  addEventListener('resize', () => { measure(); request(); });
  addEventListener('load', () => { measure(); request(); });
  measure(); place();
})();
