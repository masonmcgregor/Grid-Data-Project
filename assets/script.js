
/* Story-first landing: the public QR opens at the hero, not a saved section hash */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function cleanPageUrl() {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  history.replaceState(null, "", cleanUrl);
}

let landingInteractionStarted = false;

["wheel", "touchstart", "pointerdown", "keydown"].forEach(eventName => {
  window.addEventListener(eventName, () => {
    landingInteractionStarted = true;
  }, { once: true, passive: eventName !== "keydown" });
});

function enforceStoryStart() {
  if (landingInteractionStarted) return;
  cleanPageUrl();
  window.scrollTo(0, 0);
}

window.addEventListener("pageshow", () => {
  enforceStoryStart();
  window.requestAnimationFrame(enforceStoryStart);
  window.setTimeout(enforceStoryStart, 90);
  window.setTimeout(enforceStoryStart, 260);
});

document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const targetSelector = link.getAttribute("href");
  const target = targetSelector === "#top"
    ? document.getElementById("top")
    : document.querySelector(targetSelector);

  if (!target) return;

  event.preventDefault();
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start"
  });
  cleanPageUrl();
});

const workflowData = [
  {
    icon: "01",
    title: "Raw Grid Data",
    caption: "Historical hourly records",
    heading: "Starting with the operating record",
    input: "Approximately ten years of timestamped MW, MVAR, metadata, and data-quality information.",
    process: "The workflow identifies source files and extracts the records required for analysis.",
    output: "A complete collection of raw historical operating records.",
    value: "Establishes the source material needed to understand long-term system behavior."
  },
  {
    icon: "02",
    title: "Parse & Clean",
    caption: "Standardized, validated values",
    heading: "Turning raw values into trusted data",
    input: "Raw records with inconsistent names, formats, and occasional invalid telemetry.",
    process: "Timestamps and measurements are parsed, names are standardized, and missing or impossible values are handled.",
    output: "Consistent, analysis-ready records.",
    value: "Prevents poor-quality data from distorting statistics, visualizations, and conclusions."
  },
  {
    icon: "03",
    title: "Searchable Database",
    caption: "Structured historical records",
    heading: "Making ten years instantly retrievable",
    input: "Cleaned records and standardized component metadata.",
    process: "Records are organized and imported into a structured database for repeatable retrieval.",
    output: "A searchable historical data source.",
    value: "Reduces time spent manually locating and combining years of operating information."
  },
  {
    icon: "04",
    title: "Statistical Analysis",
    caption: "Patterns, ranges, and behavior",
    heading: "Converting history into measurable behavior",
    input: "Structured component-level historical data.",
    process: "The workflow calculates averages, extrema, standard deviation, skewness, and power-factor behavior.",
    output: "Comparable statistical summaries for each component and period.",
    value: "Helps engineers identify typical behavior, variation, and unusual conditions."
  },
  {
    icon: "05",
    title: "Visual Reports",
    caption: "Automated engineering plots",
    heading: "Making patterns visible",
    input: "Historical records and calculated statistics.",
    process: "Automated reports generate time-series plots, rolling averages, seasonal overlays, markers, and event views.",
    output: "Clear visual summaries of long-term behavior.",
    value: "Makes patterns easier to interpret and communicate during engineering studies."
  },
  {
    icon: "06",
    title: "Engineering Decisions",
    caption: "Faster, defensible insight",
    heading: "Applying insight to engineering work",
    input: "Clean data, statistics, and visual reports.",
    process: "Engineers apply the results to studies, modeling, planning, compliance, and ad hoc investigations.",
    output: "Repeatable evidence that supports technical decisions.",
    value: "Shortens analysis time and improves consistency across future engineering work."
  }
];

let activeStep = 0;
let lastWorkflowTrigger = null;
let workflowFocusCloseTimer = null;
let workflowLaunchTimer = null;
let touchStartX = 0;
let touchStartY = 0;

const workflowSteps = document.getElementById("workflowSteps");
const workflowShell = document.querySelector(".workflow-shell");
const workflowFocus = document.getElementById("workflowFocus");
const workflowFocusPanel = document.getElementById("workflowFocusPanel");
const workflowFocusClose = document.getElementById("workflowFocusClose");
const focusDots = document.getElementById("focusDots");
const focusInformation = document.getElementById("focusInformation");
const focusStageCard = document.querySelector(".focus-stage-card");
const focusPrevButton = document.getElementById("focusPrev");
const focusNextButton = document.getElementById("focusNext");

workflowData.forEach((step, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "workflow-step";
  button.setAttribute("aria-label", `Zoom into stage ${index + 1}: ${step.title}`);
  button.setAttribute("aria-haspopup", "dialog");
  button.style.setProperty("--step-index", index);
  button.innerHTML = `
    <span class="workflow-icon">${step.icon}</span>
    <span class="workflow-title">${step.title}</span>
    <span class="workflow-caption">${step.caption}</span>
    <span class="workflow-open-hint">Focus view ↗</span>
  `;
  button.addEventListener("click", () => launchWorkflowFocus(index, button));
  workflowSteps.appendChild(button);

  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "focus-dot";
  dot.setAttribute("aria-label", `Go to stage ${index + 1}: ${step.title}`);
  dot.addEventListener("click", () => updateWorkflowFocus(index, index >= activeStep ? 1 : -1));
  focusDots.appendChild(dot);
});

function setActiveWorkflowCard(index) {
  const progress = workflowData.length > 1
    ? (index / (workflowData.length - 1)) * 100
    : 0;
  workflowShell.style.setProperty("--workflow-progress", `${progress}%`);

  document.querySelectorAll(".workflow-step").forEach((button, buttonIndex) => {
    const isActive = buttonIndex === index;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll(".focus-dot").forEach((dot, dotIndex) => {
    const isActive = dotIndex === index;
    dot.classList.toggle("active", isActive);
    dot.setAttribute("aria-current", isActive ? "step" : "false");
  });
}

function populateWorkflowFocus(index) {
  const step = workflowData[index];
  document.getElementById("focusIcon").textContent = step.icon;
  document.getElementById("focusNumber").textContent =
    `STAGE ${String(index + 1).padStart(2, "0")} OF ${String(workflowData.length).padStart(2, "0")}`;
  document.getElementById("focusTitle").textContent = step.title;
  document.getElementById("focusCaption").textContent = step.caption;
  document.getElementById("focusHeading").textContent = step.heading;
  focusStageCard.style.setProperty(
    "--stage-progress",
    `${((index + 1) / workflowData.length) * 100}%`
  );
  document.getElementById("focusInput").textContent = step.input;
  document.getElementById("focusProcess").textContent = step.process;
  document.getElementById("focusOutput").textContent = step.output;
  document.getElementById("focusValue").textContent = step.value;
  document.getElementById("focusProgressText").textContent = `${index + 1} / ${workflowData.length}`;
}

function updateWorkflowFocus(index, direction = 1) {
  activeStep = (index + workflowData.length) % workflowData.length;
  setActiveWorkflowCard(activeStep);

  const swapClass = direction >= 0 ? "focus-swap-forward" : "focus-swap-backward";

  focusInformation.classList.remove("focus-swap-forward", "focus-swap-backward");
  focusStageCard.classList.remove("focus-stage-swap-forward", "focus-stage-swap-backward");
  void focusInformation.offsetWidth;
  void focusStageCard.offsetWidth;
  focusInformation.classList.add(swapClass);
  focusStageCard.classList.add(
    direction >= 0 ? "focus-stage-swap-forward" : "focus-stage-swap-backward"
  );

  populateWorkflowFocus(activeStep);
}


function launchWorkflowFocus(index, trigger) {
  if (workflowLaunchTimer) {
    window.clearTimeout(workflowLaunchTimer);
  }

  setActiveWorkflowCard(index);
  trigger.classList.remove("launching");
  void trigger.offsetWidth;
  trigger.classList.add("launching");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  workflowLaunchTimer = window.setTimeout(() => {
    trigger.classList.remove("launching");
    openWorkflowFocus(index, trigger);
  }, reduceMotion ? 0 : 190);
}

function openWorkflowFocus(index, trigger) {
  if (workflowFocusCloseTimer) {
    window.clearTimeout(workflowFocusCloseTimer);
    workflowFocusCloseTimer = null;
  }

  lastWorkflowTrigger = trigger;
  const rect = trigger.getBoundingClientRect();
  workflowFocus.style.setProperty("--focus-x", `${rect.left + rect.width / 2}px`);
  workflowFocus.style.setProperty("--focus-y", `${rect.top + rect.height / 2}px`);

  updateWorkflowFocus(index, 1);
  workflowSteps.classList.add("focus-mode");
  workflowFocus.classList.add("open");
  workflowFocus.setAttribute("aria-hidden", "false");
  document.body.classList.add("workflow-focus-open");

  workflowFocusPanel.scrollTop = 0;
  window.requestAnimationFrame(() => {
    workflowFocusPanel.scrollTop = 0;
    workflowFocusClose.focus({ preventScroll: true });
  });
}

function closeWorkflowFocus() {
  if (!workflowFocus.classList.contains("open")) return;

  workflowFocus.classList.remove("open");
  workflowFocus.setAttribute("aria-hidden", "true");
  workflowSteps.classList.remove("focus-mode");
  document.body.classList.remove("workflow-focus-open");

  workflowFocusCloseTimer = window.setTimeout(() => {
    if (lastWorkflowTrigger) lastWorkflowTrigger.focus();
  }, 520);
}

function moveWorkflowFocus(amount) {
  updateWorkflowFocus(activeStep + amount, amount);
}

document.getElementById("focusPrev").addEventListener("click", () => moveWorkflowFocus(-1));
document.getElementById("focusNext").addEventListener("click", () => moveWorkflowFocus(1));
workflowFocusClose.addEventListener("click", closeWorkflowFocus);


workflowFocusPanel.addEventListener("touchstart", event => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

workflowFocusPanel.addEventListener("touchend", event => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < 65 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) {
    return;
  }

  moveWorkflowFocus(deltaX < 0 ? 1 : -1);
}, { passive: true });



workflowFocus.addEventListener("click", event => {
  if (event.target.hasAttribute("data-workflow-close")) closeWorkflowFocus();
});

document.addEventListener("keydown", event => {
  if (!workflowFocus.classList.contains("open")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeWorkflowFocus();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveWorkflowFocus(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveWorkflowFocus(1);
  }

  if (event.key === "Tab") {
    const focusable = [...workflowFocusPanel.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(element => element.offsetParent !== null);

    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

setActiveWorkflowCard(0);
populateWorkflowFocus(0);


/* Assemble the workflow cards once when the visitor reaches the section */
workflowSteps.classList.add("assemble-ready");

const workflowAssemblyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    workflowSteps.classList.add("assembled");
    workflowAssemblyObserver.unobserve(workflowSteps);
  });
}, { threshold: 0.22 });

workflowAssemblyObserver.observe(workflowSteps);



/* Scroll reveal */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach(element => {
  revealObserver.observe(element);
});

/* Animated counters */
function formatCounter(value) {
  return value >= 1000 ? value.toLocaleString("en-US") : String(value);
}

const counterObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const element = entry.target;
      const target = Number(element.dataset.target);
      const duration = target > 1000 ? 1500 : 900;
      const start = performance.now();

      function updateCounter(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        element.textContent = formatCounter(current);

        if (progress < 1) requestAnimationFrame(updateCounter);
      }

      requestAnimationFrame(updateCounter);
      counterObserver.unobserve(element);
    });
  },
  { threshold: 0.55 }
);

document.querySelectorAll(".counter").forEach(counter => {
  counterObserver.observe(counter);
});

/* Animate graph once it becomes visible */
const chartCard = document.querySelector(".chart-card");

const chartObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        chartCard.classList.add("chart-animate");
        chartObserver.unobserve(chartCard);
      }
    });
  },
  { threshold: 0.35 }
);

chartObserver.observe(chartCard);

/* Footer year */
document.getElementById("year").textContent = new Date().getFullYear();


/* Highlight navigation only after the visitor leaves the hero */
const navLinks = [...document.querySelectorAll(".site-header nav a")];
const observedSections = navLinks
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const siteHeader = document.querySelector(".site-header");
const challengeSection = document.getElementById("challenge");
let navFrameRequested = false;

function updateActiveNavigation() {
  navFrameRequested = false;
  const headerOffset = (siteHeader?.offsetHeight || 76) + 48;
  const readingLine = window.scrollY + headerOffset;
  let activeSectionId = "";

  if (challengeSection && readingLine >= challengeSection.offsetTop) {
    observedSections.forEach(section => {
      if (readingLine >= section.offsetTop) {
        activeSectionId = section.id;
      }
    });
  }

  navLinks.forEach(link => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${activeSectionId}`
    );
  });
}

function requestNavigationUpdate() {
  if (navFrameRequested) return;
  navFrameRequested = true;
  window.requestAnimationFrame(updateActiveNavigation);
}

window.addEventListener("scroll", requestNavigationUpdate, { passive: true });
window.addEventListener("resize", requestNavigationUpdate);
updateActiveNavigation();



/* Compact mobile navigation */
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

function setMobileMenu(open) {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.classList.toggle("open", open);
  mobileMenu.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute(
    "aria-label",
    open ? "Close site navigation" : "Open site navigation"
  );
  mobileMenu.setAttribute("aria-hidden", String(!open));
}

menuToggle?.addEventListener("click", event => {
  event.stopPropagation();
  setMobileMenu(!mobileMenu.classList.contains("open"));
});

mobileMenu?.addEventListener("click", event => {
  if (event.target.closest("a")) setMobileMenu(false);
});

document.addEventListener("click", event => {
  if (!mobileMenu?.classList.contains("open")) return;
  if (event.target.closest("#mobileMenu, #menuToggle")) return;
  setMobileMenu(false);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && mobileMenu?.classList.contains("open")) {
    setMobileMenu(false);
    menuToggle?.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 800) setMobileMenu(false);
});

/* Expand project images without leaving the page */
const lightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

function closeLightbox(){
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden","true");
  document.body.classList.remove("lightbox-open");
  lightboxImage.src = "";
}

document.addEventListener("click", event => {
  const trigger = event.target.closest(".lightbox-trigger");
  if (!trigger || !lightbox) return;

  event.preventDefault();

  const previewImage = trigger.querySelector("img");
  lightboxImage.src = trigger.dataset.image || trigger.getAttribute("href");
  lightboxImage.alt = previewImage ? previewImage.alt : "Expanded project image";
  lightboxCaption.textContent = trigger.dataset.caption || "";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden","false");
  document.body.classList.add("lightbox-open");
  lightboxClose.focus();
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", event => {
  if(event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", event => {
  if(event.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
});
