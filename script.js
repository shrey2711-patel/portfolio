// ─────────────────────────────────────────────────────────────────────────────
// 0. Session Memory — remember last section on refresh
// ─────────────────────────────────────────────────────────────────────────────

// Stop the browser from auto-scrolling to a remembered position OR jumping to
// a URL hash on refresh. We handle all navigation ourselves.
history.scrollRestoration = "manual";

// Clear any leftover URL hash so the browser doesn't fight us
if (window.location.hash) {
  history.replaceState(null, "", window.location.pathname);
}

// 1. Dynamic Footer Copyright Year
const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

// 2. Intersection Observer for Scroll-Reveal Animations
const revealElements = document.querySelectorAll(".reveal");
if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // trigger animation only once
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: "0px 0px -40px 0px"
  });

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });
}

// 3. Dynamic Category Filtering for Project Cards
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

if (filterButtons.length > 0 && projectCards.length > 0) {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Toggle active states on buttons
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      projectCards.forEach((card) => {
        const cardCategory = card.getAttribute("data-category");
        
        // Remove animation trigger class
        card.classList.remove("reveal-in");

        if (filterValue === "all" || cardCategory === filterValue) {
          card.classList.remove("hidden");
          // Re-trigger scale-up transition by forcing a reflow
          void card.offsetWidth; 
          card.classList.add("reveal-in");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
}

// 4. Contact Form Validation & Simulated Submission Handler
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.querySelector("#form-name");
    const emailInput = document.querySelector("#form-email");
    const messageInput = document.querySelector("#form-message");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Reset status indicator
    formStatus.style.display = "none";
    formStatus.className = "form-status";
    formStatus.textContent = "";

    // Simple validations
    if (!name || !email || !message) {
      showFormStatus("Please fill in all fields before sending.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFormStatus("Please enter a valid email address.", "error");
      return;
    }

    // Submit state indicators
    const submitBtn = contactForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending Message...";
    
    // Simulate network server delay (1.2 seconds)
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;

      // Hide the form and show a beautiful personalized Thank You card
      const parent = contactForm.parentElement;
      contactForm.style.display = "none";

      const thankYouCard = document.createElement("div");
      thankYouCard.className = "thank-you-card";
      thankYouCard.innerHTML = `
        <div class="success-checkmark">
          <svg viewBox="0 0 52 52">
            <circle class="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h3>Thank You, ${name}!</h3>
        <p>Your message has been sent successfully. I will get back to you shortly.</p>
        <button class="button secondary btn-reset-form">Send another message</button>
      `;

      parent.appendChild(thankYouCard);

      // Handle resetting the form
      thankYouCard.querySelector(".btn-reset-form").addEventListener("click", () => {
        thankYouCard.remove();
        contactForm.reset();
        contactForm.style.display = "flex";
      });
    }, 1200);
  });
}

function showFormStatus(text, type) {
  formStatus.textContent = text;
  formStatus.classList.add(type);
  formStatus.style.display = "block";
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Dock indicator — pointer drag & CSS transition animation
// ─────────────────────────────────────────────────────────────────────────────
const sections    = document.querySelectorAll("section[id]");
const dock        = document.querySelector(".floating-dock");
const dockInd     = document.querySelector(".dock-indicator");
const dockLinks   = Array.from(document.querySelectorAll(".floating-dock a"));

// ── Move the target to a given dock link ─────────────────────────────────────
function moveTo(link, animate = true) {
  if (!link || !dockInd || !dock) return;

  const lr = link.getBoundingClientRect();
  const dr = dock.getBoundingClientRect();

  const left = lr.left - dr.left;
  const top  = lr.top  - dr.top;
  const w    = lr.width;
  const h    = lr.height;

  if (!animate) {
    dockInd.style.transition = "none";
  } else {
    // Hardware accelerated smooth transition curve
    dockInd.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
  }

  dockInd.style.display = "block";
  dockInd.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  dockInd.style.width   = `${w}px`;
  dockInd.style.height  = `${h}px`;

  if (!animate) {
    // Force a browser reflow so that changing transition back to auto later works
    void dockInd.offsetHeight;
  }
}

// ── Set active link visually ──────────────────────────────────────────────────
function setActive(link) {
  dockLinks.forEach(l => l.classList.remove("active"));
  if (link) link.classList.add("active");
}

// ── Find the dock link whose center is closest to an x coordinate ─────────────
function closestLinkToX(clientX) {
  let best = null, bestDist = Infinity;
  dockLinks.forEach(link => {
    const r    = link.getBoundingClientRect();
    const cx   = r.left + r.width / 2;
    const dist = Math.abs(clientX - cx);
    if (dist < bestDist) { bestDist = dist; best = link; }
  });
  return best;
}

// ── Initial mount — restore last section or default to home ──────────────────
window.addEventListener("load", () => {
  const savedSection = localStorage.getItem("portfolio_last_section") || "home";
  const savedLink    = dockLinks.find(l => l.getAttribute("href") === `#${savedSection}`);
  const targetLink   = savedLink || dockLinks[0];

  // Scroll to saved section instantly (no smooth animation on load)
  const targetEl = document.getElementById(savedSection);
  if (targetEl && savedSection !== "home") {
    targetEl.scrollIntoView({ behavior: "instant" });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Set active dock tab
  if (targetLink) { setActive(targetLink); moveTo(targetLink, false); }
});

// ── Window resize & orientation change: snap without glide ───────────────────
window.addEventListener("resize", () => {
  const active = dock.querySelector("a.active");
  if (active) moveTo(active, false);
});
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    const active = dock.querySelector("a.active");
    if (active) moveTo(active, false);
  }, 100);
});

// ═════════════════════════════════════════════════════════════════════════════
//  DRAG INTERACTION  (press-hold and slide across the dock)
// ═════════════════════════════════════════════════════════════════════════════
let isDragging = false;
let dragLink   = null;


// ── Pointer DOWN — navigate instantly on first touch/click ───────────────────
dock.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;

  isDragging = true;
  dragLink   = closestLinkToX(e.clientX);

  setActive(dragLink);
  moveTo(dragLink);
  scrollToSection(dragLink);   // ← LIVE: open section immediately on touch

  dock.setPointerCapture(e.pointerId);
  dock.style.cursor = "grabbing";
  e.preventDefault();
}, { passive: false });

// ── Pointer MOVE — follow finger, open each section as you slide ──────────────
dock.addEventListener("pointermove", (e) => {
  if (!isDragging) return;

  const nearest = closestLinkToX(e.clientX);
  if (nearest && nearest !== dragLink) {
    dragLink = nearest;
    setActive(dragLink);
    moveTo(dragLink);
    scrollToSection(dragLink); // ← LIVE: section changes as finger slides
  }
}, { passive: true });

// ── Pointer UP — just clean up, navigation already happened live ─────────────
function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  dock.style.cursor = "";
  // indicator and active state are already correct — nothing extra needed
  if (dragLink) { setActive(dragLink); moveTo(dragLink); }
}

dock.addEventListener("pointerup",     endDrag);
dock.addEventListener("pointercancel", endDrag);

let scrollTargetSectionId = null;

// Clear programmatic scroll lock on manual user scroll/interaction
const clearProgrammaticLock = () => {
  scrollTargetSectionId = null;
};
window.addEventListener("wheel", clearProgrammaticLock, { passive: true });
window.addEventListener("touchmove", clearProgrammaticLock, { passive: true });
window.addEventListener("mousedown", clearProgrammaticLock, { passive: true });

// ── Immediately scroll to the section a dock link points to ───────────────────
function scrollToSection(link) {
  if (!link) return;
  const href = link.getAttribute("href");
  if (href && href.startsWith("#")) {
    const sectionId = href.substring(1);
    const target    = document.getElementById(sectionId);
    if (target) {
      scrollTargetSectionId = sectionId;
      target.scrollIntoView({ behavior: "smooth" });
    }
    // Save so refresh lands here
    localStorage.setItem("portfolio_last_section", sectionId);
  }
}

// ── Plain click (no drag) still works ────────────────────────────────────────
dockLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    if (isDragging) { e.preventDefault(); return; }
    setActive(link);
    moveTo(link);
    scrollToSection(link); // also saves section
  });
});

// ── Smooth scroll for other non-dock anchor links ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    if (this.closest(".floating-dock")) return; // dock click handler handles dock links
    e.preventDefault();
    const href = this.getAttribute("href");
    if (href && href.startsWith("#")) {
      const sectionId = href.substring(1);
      const target    = document.getElementById(sectionId);
      if (target) {
        scrollTargetSectionId = sectionId;
        const match = dockLinks.find(l => l.getAttribute("href") === href);
        if (match) {
          setActive(match);
          moveTo(match);
        }
        target.scrollIntoView({ behavior: "smooth" });
        localStorage.setItem("portfolio_last_section", sectionId);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Scrollspy via Intersection Observer (High performance, no layout thrashing)
// ─────────────────────────────────────────────────────────────────────────────
if (sections.length > 0) {
  const scrollspyOptions = {
    root: null,
    rootMargin: "-25% 0px -55% 0px", // focus on the middle section of the screen
    threshold: 0
  };

  const scrollspyObserver = new IntersectionObserver((entries) => {
    // Only process if user is not currently dragging the dock
    if (isDragging) return;

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const currentId = entry.target.getAttribute("id");

        // If programmatic scroll is active, ignore scrollspy updates until we reach the target
        if (scrollTargetSectionId) {
          if (currentId === scrollTargetSectionId) {
            scrollTargetSectionId = null;
          } else {
            return;
          }
        }

        const match = dockLinks.find(l => l.getAttribute("href") === `#${currentId}`);
        if (match && !match.classList.contains("active")) {
          setActive(match);
          moveTo(match);
          localStorage.setItem("portfolio_last_section", currentId);
        }
      }
    });
  }, scrollspyOptions);

  sections.forEach((sec) => {
    scrollspyObserver.observe(sec);
  });
}

// Throttled scroll listener to detect scrolled-to-bottom (contact section fallback)
let scrollTimeout;
window.addEventListener("scroll", () => {
  if (scrollTimeout) return;

  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;

    if (!isDragging && (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60)) {
      const match = dockLinks.find(l => l.getAttribute("href") === "#contact");
      if (match && !match.classList.contains("active")) {
        setActive(match);
        moveTo(match);
        localStorage.setItem("portfolio_last_section", "contact");
      }
    }
  }, 150);
}, { passive: true });

// ─────────────────────────────────────────────────────────────────────────────
// 7. Cinematic 3D Hero: Canvas Particle Network, Trailing Cursor & 3D Parallax
// ─────────────────────────────────────────────────────────────────────────────
(function initCinematicHero() {
  const heroSection = document.querySelector("#home");
  const canvas = document.getElementById("hero-particle-canvas");
  if (!heroSection || !canvas) return;

  const ctx = canvas.getContext("2d");
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

  let width = (canvas.width = heroSection.offsetWidth);
  let height = (canvas.height = heroSection.offsetHeight);

  function resizeCanvas() {
    if (!heroSection || !canvas) return;
    width = canvas.width = heroSection.offsetWidth;
    height = canvas.height = heroSection.offsetHeight;
  }
  window.addEventListener("resize", resizeCanvas, { passive: true });

  // ── Node Network State ─────────────────────────────────────────────────────
  const particleCount = isTouchDevice ? 24 : 65;
  const connectionDist = isTouchDevice ? 85 : 120;
  const mouseConnectionDist = 160;

  class Node {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 1.8 + 1;
      this.color = Math.random() > 0.4 ? "255, 30, 45" : "255, 255, 255";
      this.baseAlpha = Math.random() * 0.45 + 0.2;
    }
    update(mx, my, isHovering) {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Gentle mouse attraction/reaction
      if (isHovering && !isTouchDevice) {
        const dx = mx - this.x;
        const dy = my - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseConnectionDist && dist > 10) {
          const force = (1 - dist / mouseConnectionDist) * 0.04;
          this.x += dx * force;
          this.y += dy * force;
        }
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.baseAlpha})`;
      ctx.shadowBlur = this.color.startsWith("255, 30") ? 8 : 4;
      ctx.shadowColor = `rgba(${this.color}, 0.8)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  const nodes = [];
  for (let i = 0; i < particleCount; i++) {
    nodes.push(new Node());
  }

  // ── Trailing Cursor Particles ──────────────────────────────────────────────
  const trailParticles = [];
  class TrailParticle {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 6;
      this.y = y + (Math.random() - 0.5) * 6;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5 - 0.3; // subtle upward drift
      this.size = Math.random() * 3 + 1.5;
      this.alpha = 0.85;
      this.decay = Math.random() * 0.02 + 0.015;
      this.color = Math.random() > 0.3 ? "255, 30, 45" : "255, 200, 205";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.size *= 0.96;
      this.alpha -= this.decay;
    }
    draw() {
      if (this.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${this.color}, ${this.alpha})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── Mouse & Parallax State ─────────────────────────────────────────────────
  let mouse = { x: -1000, y: -1000, isOver: false };
  let targetRotX = 0, targetRotY = 0;
  let curRotX = 0, curRotY = 0;
  let targetParallaxX = 0, targetParallaxY = 0;
  let curParallaxX = 0, curParallaxY = 0;

  const card3d = document.getElementById("hero-3d-card");
  const backdropText = document.querySelector(".hero-backdrop-typography");
  const glowPrimary = document.querySelector(".glow-crimson-primary");
  const glowSecondary = document.querySelector(".glow-crimson-secondary");

  if (!isTouchDevice) {
    heroSection.addEventListener("mousemove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isOver = true;

      // Spawn trailing spark particles
      for (let i = 0; i < 2; i++) {
        if (trailParticles.length < 90) {
          trailParticles.push(new TrailParticle(mouse.x, mouse.y));
        }
      }

      // Normalized coordinates from -1 to 1
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      // 3D Card tilt target angles (max ~14 degrees)
      targetRotY = normX * 12;
      targetRotX = -normY * 12;

      // Parallax offsets
      targetParallaxX = normX * 20;
      targetParallaxY = normY * 15;
    }, { passive: true });

    heroSection.addEventListener("mouseleave", () => {
      mouse.isOver = false;
      targetRotX = 0;
      targetRotY = 0;
      targetParallaxX = 0;
      targetParallaxY = 0;
    }, { passive: true });
  }

  // ── Render & Physics Loop ──────────────────────────────────────────────────
  function renderHeroCanvas() {
    ctx.clearRect(0, 0, width, height);

    // 1. Update and connect background nodes
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].update(mouse.x, mouse.y, mouse.isOver);
      nodes[i].draw();

      // Inter-node connection lines
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDist) {
          const lineAlpha = (1 - dist / connectionDist) * 0.22;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(255, 30, 45, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Mouse-to-node dynamic connection lines
      if (mouse.isOver && !isTouchDevice) {
        const dx = mouse.x - nodes[i].x;
        const dy = mouse.y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseConnectionDist) {
          const lineAlpha = (1 - dist / mouseConnectionDist) * 0.35;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(nodes[i].x, nodes[i].y);
          ctx.strokeStyle = `rgba(255, 60, 75, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // 2. Trailing cursor particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0 || p.size <= 0.2) {
        trailParticles.splice(i, 1);
      }
    }

    // 3. Smooth Lerp 3D Parallax Transforms
    if (!isTouchDevice) {
      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;
      curParallaxX += (targetParallaxX - curParallaxX) * 0.08;
      curParallaxY += (targetParallaxY - curParallaxY) * 0.08;

      if (card3d) {
        card3d.style.transform = `perspective(1000px) rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
      }

      if (backdropText) {
        backdropText.style.transform = `translateX(calc(-50% + ${(-curParallaxX * 0.8).toFixed(1)}px)) translateY(${(-curParallaxY * 0.8).toFixed(1)}px)`;
      }

      if (glowPrimary) {
        glowPrimary.style.transform = `translate3d(${(curParallaxX * 1.2).toFixed(1)}px, ${(curParallaxY * 1.2).toFixed(1)}px, 0)`;
      }
      if (glowSecondary) {
        glowSecondary.style.transform = `translate3d(${(-curParallaxX * 0.9).toFixed(1)}px, ${(-curParallaxY * 0.9).toFixed(1)}px, 0)`;
      }
    }

    requestAnimationFrame(renderHeroCanvas);
  }

  requestAnimationFrame(renderHeroCanvas);

  // ── GSAP Entrance Timeline Sequence ────────────────────────────────────────
  function triggerHeroEntrance() {
    if (typeof gsap === "undefined") return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Initial hidden states
    gsap.set(".hero-ambient-glow, .hero-particle-canvas", { opacity: 0 });
    gsap.set(".hero-backdrop-typography", { opacity: 0, y: 50, scale: 0.96 });
    gsap.set(".hero-badge-group, .hero-name, .hero-identity-tag, .hero-headline", { opacity: 0, y: 35 });
    gsap.set(".hero-3d-card", { opacity: 0, y: 45, scale: 0.92 });
    gsap.set(".hero-description, .hero-cta-group, .hero-bottom-bar", { opacity: 0, y: 25 });

    // Sequence
    tl.to(".hero-ambient-glow, .hero-particle-canvas", {
      opacity: 1,
      duration: 1.2
    })
    .to(".hero-backdrop-typography", {
      opacity: 0.85,
      y: 0,
      scale: 1,
      duration: 1.3
    }, "-=0.8")
    .to(".hero-badge-group, .hero-name, .hero-identity-tag, .hero-headline", {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 1
    }, "-=0.9")
    .to(".hero-3d-card", {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: "back.out(1.2)"
    }, "-=0.8")
    .to(".hero-description, .hero-cta-group, .hero-bottom-bar", {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      duration: 0.9
    }, "-=0.7");
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(triggerHeroEntrance, 100);
  } else {
    window.addEventListener("DOMContentLoaded", triggerHeroEntrance);
  }
})();

