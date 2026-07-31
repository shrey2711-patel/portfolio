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

// ── Window resize: snap without glide ────────────────────────────────────────
window.addEventListener("resize", () => {
  const active = dock.querySelector("a.active");
  if (active) moveTo(active, false);
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

