// =========================================
// Portfolio — interactions & animations (F3)
// Runs after js/main.js has rendered the page ("page:rendered" event).
// Everything respects prefers-reduced-motion, and the mouse-only effects
// (cursor, magnetic buttons, tilt, floating preview) only run with a mouse.
// =========================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Linear interpolation: moves `from` a fraction of the way to `to`.
// Called every frame, it gives the smooth "follow" feeling.
const lerp = (from, to, amount) => from + (to - from) * amount;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Mouse position, shared by the cursor, the hero orb and the project preview
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener("pointermove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

// ----- 1. Hero entrance: .is-ready starts it (letters rise, the rest fades in) -----
// Added two frames later so the browser paints the "before" state first;
// otherwise the transition wouldn't run.
function startEntrance() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
}

// ----- 2. Custom cursor (dot that grows over links, with an optional label) -----
function setupCursor() {
  if (!hasMouse || reduceMotion) return null;

  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".cursor-label");
  const position = { x: mouse.x, y: mouse.y };
  document.body.classList.add("has-cursor");

  // Event delegation: one listener for every link/button, even future ones
  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("a, button, summary, [data-cursor]");
    cursor.classList.toggle("is-hover", Boolean(target));
    const text = target?.dataset.cursor || "";
    label.textContent = text;
    cursor.classList.toggle("has-label", Boolean(text));
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
  document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
  document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));

  return () => {
    position.x = lerp(position.x, mouse.x, 0.2);
    position.y = lerp(position.y, mouse.y, 0.2);
    cursor.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  };
}

// ----- 3. Overlay menu -----
function setupMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const text = toggle.querySelector(".menu-toggle-text");
  const nav = document.getElementById("site-nav");

  let closingTimer = null;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    text.textContent = open ? text.dataset.close : text.dataset.open;
    document.body.classList.toggle("menu-open", open);

    // The header goes back to mix-blend-mode: difference only once the
    // curtain has finished closing (CSS keeps it "normal" during .menu-closing)
    clearTimeout(closingTimer);
    document.body.classList.toggle("menu-closing", !open);
    if (!open) {
      closingTimer = setTimeout(() => document.body.classList.remove("menu-closing"), reduceMotion ? 0 : 900);
    }

    if (open) nav.querySelector("a")?.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Clicking a link closes the menu (the browser then scrolls to the anchor)
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// ----- 4. Reveal on scroll: adds .is-visible when an element enters the screen -----
function setupReveal() {
  const elements = document.querySelectorAll("[data-reveal], .section-title");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // animate only once
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
}

// ----- 5. Scroll-linked effects (progress bar, statement, parallax, process line) -----
function setupScrollEffects() {
  const progressBar = document.querySelector(".scroll-progress");
  const header = document.querySelector(".site-header");
  const statementWords = document.querySelectorAll("[data-scrub] .word");
  const statement = document.querySelector("[data-scrub]");
  const parallaxItems = document.querySelectorAll("[data-parallax]");

  let lastScroll = window.scrollY;
  let velocity = 0;

  // How far an element has travelled through the screen: 0 = entering, 1 = leaving
  function viewProgress(element, start = 1, end = 0) {
    const rect = element.getBoundingClientRect();
    const from = window.innerHeight * start;
    const to = window.innerHeight * end - rect.height;
    return clamp((from - rect.top) / (from - to), 0, 1);
  }

  return () => {
    const scroll = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Velocity is used by the marquees to speed up while scrolling
    velocity = lerp(velocity, scroll - lastScroll, 0.1);
    lastScroll = scroll;

    progressBar.style.transform = `scaleY(${maxScroll > 0 ? scroll / maxScroll : 0})`;
    header.classList.toggle("is-scrolled", scroll > 40);

    // The statement "lights up" word by word as it crosses the screen
    if (statement) {
      const lit = viewProgress(statement, 0.85, 0.35) * statementWords.length;
      statementWords.forEach((word, i) => {
        word.style.opacity = reduceMotion ? 1 : clamp(0.15 + (lit - i), 0.15, 1);
      });
    }

    if (!reduceMotion) {
      parallaxItems.forEach((item) => {
        const progress = viewProgress(item.parentElement);
        item.style.transform = `translateY(${(progress - 0.5) * -12}%) scale(1.15)`;
      });
    }

    return velocity;
  };
}

// ----- 5b. Process: pinned section whose cards slide sideways while scrolling -----
// The pin is made as tall as the sideways distance + one screen; while it is
// pinned (position: sticky), the vertical scroll is turned into translateX.
// Narrow screens and reduced motion get the vertical timeline instead.
function setupProcess() {
  const pin = document.querySelector("[data-process]");
  if (!pin) return () => {};

  const track = pin.querySelector(".process-steps");
  const steps = [...pin.querySelectorAll(".process-step")];
  const count = pin.querySelector(".process-count b");
  const wide = window.matchMedia("(min-width: 900px)");
  let horizontal = false;
  let distance = 0;
  let lastActive = null;

  function layout() {
    horizontal = wide.matches && !reduceMotion;
    pin.classList.toggle("is-horizontal", horizontal);
    track.style.transform = "";
    if (horizontal) {
      distance = Math.max(0, track.offsetWidth - window.innerWidth);
      // At least ~1 screen of scroll, so every card gets its turn as the
      // active one even on very wide screens where the cards barely move
      pin.style.height = `${Math.max(distance, window.innerHeight) + window.innerHeight}px`;
    } else {
      pin.style.height = "";
    }
  }

  layout();
  window.addEventListener("resize", layout);
  document.fonts?.ready.then(layout); // card widths change once the fonts load

  return () => {
    const rect = pin.getBoundingClientRect();
    let progress;
    let active;

    if (horizontal) {
      progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
      track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
      active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    } else {
      // Timeline: the "reading line" is at 60% of the screen height
      const line = window.innerHeight * 0.6;
      progress = clamp((line - rect.top) / rect.height, 0, 1);
      active = steps.findLastIndex((step) => step.getBoundingClientRect().top < line);
    }

    pin.style.setProperty("--progress", progress.toFixed(4));
    pin.classList.toggle("is-done", progress > 0.97);

    if (active !== lastActive) {
      lastActive = active;
      steps.forEach((step, i) => {
        step.classList.toggle("is-active", i === active);
        step.classList.toggle("is-past", i <= active);
      });
      if (count) count.textContent = String(Math.max(active, 0) + 1).padStart(2, "0");
    }
  };
}

// ----- 6. Marquees: infinite loop that speeds up (and follows) the scroll -----
function setupMarquees() {
  const marquees = [...document.querySelectorAll(".marquee")].map((element) => ({
    element,
    tracks: element.querySelectorAll(".marquee-track"),
    speed: Number(element.dataset.speed) || 1,
    x: 0,
  }));

  if (reduceMotion) return () => {};

  return (velocity) => {
    marquees.forEach((marquee) => {
      const width = marquee.tracks[0].offsetWidth;
      if (!width) return;
      // Base speed + a boost from the scroll velocity
      marquee.x -= marquee.speed * (0.6 + Math.abs(velocity) * 0.15);
      // Keep x between -width and 0 so the loop never ends
      marquee.x = ((marquee.x % width) - width) % width;
      marquee.tracks.forEach((track) => {
        track.style.transform = `translate3d(${marquee.x}px, 0, 0)`;
      });
    });
  };
}

// ----- 7. Hero: rotating words + orb that follows the mouse -----
function setupHero() {
  const words = document.querySelectorAll(".hero-rotator-words span");
  const hero = document.querySelector(".hero");
  let current = 0;

  if (words.length > 1 && !reduceMotion) {
    setInterval(() => {
      words[current].classList.replace("is-active", "is-leaving");
      const previous = words[current];
      setTimeout(() => previous.classList.remove("is-leaving"), 700);
      current = (current + 1) % words.length;
      words[current].classList.add("is-active");
    }, 2400);
  }

  if (!hasMouse || reduceMotion) return () => {};

  const offset = { x: 0, y: 0 };
  return () => {
    offset.x = lerp(offset.x, mouse.x / window.innerWidth - 0.5, 0.06);
    offset.y = lerp(offset.y, mouse.y / window.innerHeight - 0.5, 0.06);
    hero.style.setProperty("--mx", offset.x.toFixed(3));
    hero.style.setProperty("--my", offset.y.toFixed(3));
  };
}

// ----- 8. Magnetic buttons: they lean toward the cursor -----
function setupMagnetic() {
  if (!hasMouse || reduceMotion) return;

  document.querySelectorAll(".btn-magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
      button.firstElementChild.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
    });
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
      button.firstElementChild.style.transform = "";
    });
  });
}

// ----- 9. Projects: floating cover that follows the cursor over the list -----
function setupProjectPreview() {
  const list = document.querySelector(".project-list");
  const preview = document.querySelector(".project-preview");
  if (!list || !preview || !hasMouse) return () => {};

  const image = preview.querySelector("img");
  const position = { x: mouse.x, y: mouse.y };
  let rotation = 0;

  list.addEventListener("pointerover", (event) => {
    const link = event.target.closest("[data-cover]");
    if (!link) return;
    if (image.getAttribute("src") !== link.dataset.cover) image.src = link.dataset.cover;
    preview.classList.add("is-visible");
  });
  list.addEventListener("pointerleave", () => preview.classList.remove("is-visible"));
  // Opening a case hides it too
  list.addEventListener("click", () => preview.classList.remove("is-visible"));

  // Scrolling moves the list away without moving the mouse (no pointerleave),
  // so we also check if the mouse is still over the list
  window.addEventListener("scroll", () => {
    const rect = list.getBoundingClientRect();
    const inside = mouse.x >= rect.left && mouse.x <= rect.right && mouse.y >= rect.top && mouse.y <= rect.bottom;
    if (!inside) preview.classList.remove("is-visible");
  }, { passive: true });

  return () => {
    const previousX = position.x;
    position.x = lerp(position.x, mouse.x, reduceMotion ? 1 : 0.12);
    position.y = lerp(position.y, mouse.y, reduceMotion ? 1 : 0.12);
    // Tilts slightly in the direction it moves
    rotation = lerp(rotation, clamp((position.x - previousX) * 0.4, -12, 12), 0.1);
    preview.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotation}deg)`;
  };
}

// ----- 10. Case studies side panel -----
function setupCasePanel() {
  const panel = document.getElementById("case-panel");
  const backdrop = document.querySelector(".case-backdrop");
  const closeButton = panel.querySelector(".case-close");
  let lastTrigger = null;
  let closeTimer = null;

  function open(id, trigger) {
    const article = document.getElementById(id);
    if (!article || !panel.contains(article)) return false;

    clearTimeout(closeTimer);
    lastTrigger = trigger || null;
    panel.querySelectorAll(".case").forEach((item) => item.classList.toggle("is-active", item === article));
    panel.hidden = false;
    backdrop.hidden = false;
    panel.scrollTop = 0;
    // Wait one frame so the transition runs after display changes
    requestAnimationFrame(() => document.body.classList.add("case-open"));
    closeButton.focus({ preventScroll: true });
    history.replaceState(null, "", `#${id}`);
    return true;
  }

  function close() {
    if (!document.body.classList.contains("case-open")) return;
    document.body.classList.remove("case-open");
    history.replaceState(null, "", location.pathname + location.search);
    closeTimer = setTimeout(() => {
      panel.hidden = true;
      backdrop.hidden = true;
    }, reduceMotion ? 0 : 700);
    lastTrigger?.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-case]");
    if (!link) return;
    event.preventDefault();
    open(link.dataset.case, link);
  });

  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return open;
}

// ----- 11. Lab: cards tilt in 3D following the mouse -----
function setupTilt() {
  if (!hasMouse || reduceMotion) return;

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      card.style.setProperty("--glare-x", `${(x + 0.5) * 100}%`);
      card.style.setProperty("--glare-y", `${(y + 0.5) * 100}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

// ----- 11b. Videos: play only while on screen (saves battery and data) -----
// With reduced motion they don't autoplay: they get controls instead.
function setupVideos() {
  const videos = document.querySelectorAll("video[data-autoplay]");

  if (reduceMotion) {
    videos.forEach((video) => (video.controls = true));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // play() returns a promise that rejects if the browser blocks it; ignore that
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    });
  });

  videos.forEach((video) => observer.observe(video));
}

// ----- 12. FAQ: smooth open/close for <details> -----
function setupFaq() {
  document.querySelectorAll(".faq details").forEach((details) => {
    const summary = details.querySelector("summary");
    const answer = details.querySelector(".faq-answer");

    summary.addEventListener("click", (event) => {
      if (reduceMotion) return; // native instant toggle
      event.preventDefault();

      if (details.open) {
        details.classList.remove("is-open");
        const animation = answer.animate(
          [{ height: `${answer.offsetHeight}px` }, { height: "0px" }],
          { duration: 400, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }
        );
        animation.onfinish = () => (details.open = false);
      } else {
        details.open = true;
        details.classList.add("is-open");
        answer.animate(
          [{ height: "0px" }, { height: `${answer.offsetHeight}px` }],
          { duration: 500, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }
        );
      }
    });
  });
}

// ----- 13. Contact: copy email to the clipboard -----
function setupCopyEmail() {
  const button = document.querySelector(".copy-email");
  if (!button) return;
  const label = button.querySelector("span");
  const original = label.textContent;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      label.textContent = "¡Copiado!";
    } catch {
      label.textContent = button.dataset.email; // clipboard blocked: show it instead
    }
    setTimeout(() => (label.textContent = original), 2000);
  });
}

// ----- Start -----
function initEffects() {
  // Enables the CSS "before" states of the animations (see .has-fx in style.css)
  document.body.classList.add("has-fx");

  setupMenu();
  setupReveal();
  setupMagnetic();
  setupTilt();
  setupVideos();
  setupFaq();
  setupCopyEmail();
  const openCase = setupCasePanel();

  // One animation loop for every per-frame effect
  const updateCursor = setupCursor();
  const updateScroll = setupScrollEffects();
  const updateProcess = setupProcess();
  const updateMarquees = setupMarquees();
  const updateHero = setupHero();
  const updatePreview = setupProjectPreview();

  function frame() {
    updateCursor?.();
    const velocity = updateScroll();
    updateProcess();
    updateMarquees(velocity);
    updateHero();
    updatePreview();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  startEntrance();

  // The sections didn't exist when the page loaded, so if the URL has a
  // #hash we act on it now: open a case study, or scroll to the section
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!openCase(id)) document.getElementById(id)?.scrollIntoView();
  }
}

if (document.body.dataset.rendered) {
  initEffects();
} else {
  document.addEventListener("page:rendered", initEffects, { once: true });
}
