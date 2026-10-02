/* =========================================================
   SOLARIS — main.js
   ========================================================= */
(function(){
  "use strict";

  var WHATSAPP_NUMBER = "393513866250"; // +39 351 386 6250

  // Optional lead-capture webhook (abandoned-form recovery). Leave empty and
  // the feature quietly does nothing — the site works perfectly without it.
  // Set this to a Google Apps Script Web App URL to log every prospect who
  // starts the simulator (including those who don't finish) to a Google
  // Sheet you can open or export to CSV/TXT at any time. Full setup guide:
  // /LEAD-CAPTURE-SETUP.md
  var LEAD_WEBHOOK_URL = "";

  /* ---------- Lead capture (progressive + abandonment recovery) ---------- */
  function sendLead(status, data, useBeacon){
    if(!LEAD_WEBHOOK_URL) return; // not configured — no-op, see LEAD-CAPTURE-SETUP.md
    var payload = {
      status: status,                 // "in_progress" | "completed" | "abandoned"
      lang: currentLang,
      page: location.pathname,
      when: new Date().toISOString(),
      type: data.type || "",
      goal: data.goal || "",
      budget: data.budget || "",
      address: data.address || "",
      firstname: data.firstname || "",
      lastname: data.lastname || "",
      phone: data.phone || "",
      email: data.email || "",
      step: data.step || "",
      totalSteps: data.totalSteps || ""
    };
    try{
      var body = JSON.stringify(payload);
      if(useBeacon && navigator.sendBeacon){
        navigator.sendBeacon(LEAD_WEBHOOK_URL, new Blob([body], { type: "text/plain;charset=UTF-8" }));
      } else {
        fetch(LEAD_WEBHOOK_URL, { method: "POST", mode: "no-cors", keepalive: true, body: body });
      }
    }catch(e){ /* never let lead tracking break the site */ }
  }

  /* ---------- i18n engine ---------- */
  function detectLang(){
    var saved = null;
    try{ saved = localStorage.getItem("solaris_lang"); }catch(e){}
    if(saved === "fr" || saved === "en" || saved === "it") return saved;
    var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || navigator.userLanguage || "fr"];
    for(var i=0; i<langs.length; i++){
      var l = (langs[i] || "").toLowerCase();
      if(l.indexOf("fr") === 0) return "fr";
      if(l.indexOf("it") === 0) return "it";
      if(l.indexOf("en") === 0) return "en";
    }
    return "en";
  }

  var currentLang = detectLang();

  function t(key){
    var dict = window.SOLARIS_I18N[currentLang] || {};
    return (key in dict) ? dict[key] : (window.SOLARIS_I18N.fr[key] || key);
  }

  function applyI18n(){
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el){
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function(el){
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    var titleKey = document.body.getAttribute("data-page-title") || "meta.title";
    var descKey = document.body.getAttribute("data-page-desc") || "meta.desc";
    document.title = t(titleKey);
    var metaDesc = document.querySelector('meta[name="description"]');
    if(metaDesc) metaDesc.setAttribute("content", t(descKey));

    document.querySelectorAll(".lang-switch button").forEach(function(btn){
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === currentLang);
    });
  }

  function setLang(lang){
    currentLang = lang;
    try{ localStorage.setItem("solaris_lang", lang); }catch(e){}
    applyI18n();
    if(window.SOLARIS_SIM && window.SOLARIS_SIM.refresh) window.SOLARIS_SIM.refresh();
  }

  document.addEventListener("click", function(e){
    var btn = e.target.closest("[data-lang]");
    if(btn){ setLang(btn.getAttribute("data-lang")); }
  });

  /* ---------- Mobile nav ---------- */
  function initMobileNav(){
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".mobile-nav");
    var close = document.querySelector(".mobile-nav-top button");
    if(!toggle || !nav) return;
    function open(){ nav.classList.add("is-open"); document.body.style.overflow = "hidden"; }
    function shut(){ nav.classList.remove("is-open"); document.body.style.overflow = ""; }
    toggle.addEventListener("click", open);
    if(close) close.addEventListener("click", shut);
    nav.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", shut); });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq(){
    document.querySelectorAll(".faq-item").forEach(function(item){
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if(!q || !a) return;
      q.addEventListener("click", function(){
        var isOpen = item.classList.contains("is-open");
        item.parentNode.querySelectorAll(".faq-item").forEach(function(other){
          other.classList.remove("is-open");
          other.querySelector(".faq-a").style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add("is-open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- Cookie banner ---------- */
  /* Compliance note: auto-hiding the banner is NEVER treated as consent.
     Only an explicit tap on "accept" records consent. If the banner is
     auto-hidden or dismissed without a choice, no value is stored, so the
     banner reappears next visit and no non-essential cookie is enabled.
     A persistent reopen button lets the visitor decide at any time. */
  function initCookieBar(){
    var bar = document.querySelector(".cookie-bar");
    var reopen = document.querySelector(".cookie-reopen");
    if(!bar) return;
    var consent = null;
    try{ consent = localStorage.getItem("solaris_cookie_consent"); }catch(e){}

    var autoHideTimer = null;

    function show(){
      bar.classList.add("is-visible");
      requestAnimationFrame(function(){ bar.classList.add("is-shown"); });
      autoHideTimer = setTimeout(dismiss, 8000);
    }
    function dismiss(){
      bar.classList.remove("is-shown");
      setTimeout(function(){ bar.classList.remove("is-visible"); }, 300);
      if(reopen) reopen.classList.add("is-visible");
      if(autoHideTimer){ clearTimeout(autoHideTimer); autoHideTimer = null; }
    }

    if(!consent){
      setTimeout(show, 600);
    } else if(reopen){
      reopen.classList.add("is-visible");
    }

    bar.querySelectorAll("[data-cookie]").forEach(function(btn){
      btn.addEventListener("click", function(){
        try{ localStorage.setItem("solaris_cookie_consent", btn.getAttribute("data-cookie")); }catch(e){}
        dismiss();
      });
    });

    if(reopen){
      reopen.addEventListener("click", function(){
        reopen.classList.remove("is-visible");
        show();
      });
    }
  }

  /* ---------- WhatsApp helper ---------- */
  function waLink(message){
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }
  function isMobileUA(){
    // User-Agent strings are increasingly trimmed by browsers (Chrome's
    // "UA reduction"), so UA sniffing alone can miss real mobile devices.
    // Back it up with touch + coarse-pointer + viewport-width signals.
    var uaMatch = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var uaDataMobile = !!(navigator.userAgentData && navigator.userAgentData.mobile);
    var touchCapable = (navigator.maxTouchPoints || 0) > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    var narrowViewport = window.innerWidth <= 820;
    return uaMatch || uaDataMobile || (touchCapable && narrowViewport);
  }
  // On mobile, a new-tab window.open() often just opens a silent background
  // tab instead of handing off to the WhatsApp app — navigating the current
  // tab is what reliably triggers the OS-level app link. On desktop there is
  // no app to hand off to, so a new tab (WhatsApp Web) is the better choice,
  // since it keeps the site open behind it.
  function openWhatsApp(url){
    if(isMobileUA()){
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  function initWhatsAppCtas(){
    document.querySelectorAll("[data-wa-cta]").forEach(function(el){
      var msgKey = el.getAttribute("data-wa-cta");
      var messages = {
        fr: "Bonjour SOLARIS, je souhaite être contacté au sujet d'un projet (" + (msgKey || "site web") + ").",
        en: "Hello SOLARIS, I'd like to be contacted about a project (" + (msgKey || "website") + ").",
        it: "Ciao SOLARIS, vorrei essere contattato per un progetto (" + (msgKey || "sito web") + ")."
      };
      el.setAttribute("href", "#");
      el.addEventListener("click", function(ev){
        ev.preventDefault();
        openWhatsApp(waLink(messages[currentLang] || messages.fr));
      });
    });
    document.querySelectorAll("[data-wa-call]").forEach(function(el){
      var messages = {
        fr: "Bonjour SOLARIS, je souhaite parler à un expert.",
        en: "Hello SOLARIS, I'd like to talk to an expert.",
        it: "Ciao SOLARIS, vorrei parlare con un esperto."
      };
      el.setAttribute("href", "#");
      el.addEventListener("click", function(ev){
        ev.preventDefault();
        openWhatsApp(waLink(messages[currentLang] || messages.fr));
      });
    });
  }

  /* ---------- Objective cards -> jump to simulator ---------- */
  function initObjectiveCards(){
    document.querySelectorAll("[data-sim-goal]").forEach(function(card){
      card.addEventListener("click", function(){
        var goal = card.getAttribute("data-sim-goal");
        var sim = document.getElementById("simulateur");
        if(!sim) return;
        if(window.SOLARIS_SIM){
          window.SOLARIS_SIM.presetGoal(goal);
        }
        sim.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ---------- Simulator ---------- */
  function initSimulator(){
    var root = document.querySelector(".simulator");
    if(!root) return;

    var steps = Array.prototype.slice.call(root.querySelectorAll(".sim-step"));
    var progressItems = Array.prototype.slice.call(root.querySelectorAll(".sim-progress i"));
    var successPanel = root.querySelector(".sim-success");
    var backBtn = root.querySelector(".sim-back");
    var nextBtn = root.querySelector(".sim-next");
    var current = 0;
    var autoAdvanceTimer = null;
    var started = false;
    var completed = false;

    var state = { type: null, goal: null, budget: null, address: "", firstname: "", lastname: "", phone: "", email: "" };

    function updateProgress(){
      progressItems.forEach(function(el, i){
        el.classList.toggle("is-done", i < current);
        el.classList.toggle("is-active", i === current);
      });
    }

    function showStep(i){
      steps.forEach(function(s, idx){ s.classList.toggle("is-active", idx === i); });
      current = i;
      updateProgress();
      backBtn.disabled = (i === 0);
      var isLast = (i === steps.length - 1);
      nextBtn.textContent = isLast ? t("sim.s5.cta") : t("sim.nav.next");
      root.querySelector(".sim-nav").style.display = "flex";
    }

    function canAdvance(i){
      if(i === 0) return !!state.type;
      if(i === 1) return !!state.goal;
      if(i === 2) return !!state.budget;
      if(i === 3) return true;
      if(i === 4) return !!(state.firstname && (state.phone || state.email));
      return true;
    }

    function advance(){
      if(!canAdvance(current)){
        var activeStep = root.querySelectorAll(".sim-step.is-active")[0];
        activeStep.classList.remove("shake");
        void activeStep.offsetWidth;
        activeStep.classList.add("shake");
        return;
      }
      if(current === steps.length - 1){ submit(); return; }
      showStep(current + 1);
      sendLead("in_progress", snapshotState());
    }

    function selectChoice(choice, opts){
      var group = choice.closest(".choice-grid");
      var field = group.getAttribute("data-field");
      var value = choice.getAttribute("data-value");
      group.querySelectorAll(".choice").forEach(function(c){
        c.classList.remove("is-selected");
        c.setAttribute("aria-checked", "false");
      });
      choice.classList.add("is-selected");
      choice.setAttribute("aria-checked", "true");
      state[field] = value;
      started = true;
      if(!(opts && opts.silent)){
        window.clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = window.setTimeout(advance, 380); // brief pause so the selection is visible before advancing
      }
    }

    root.querySelectorAll(".choice").forEach(function(choice){
      choice.addEventListener("click", function(){ selectChoice(choice); });
      choice.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " " || e.key === "Spacebar"){
          e.preventDefault();
          selectChoice(choice);
        }
      });
    });

    root.querySelectorAll("input[data-field]").forEach(function(input){
      input.addEventListener("input", function(){
        state[input.getAttribute("data-field")] = input.value.trim();
        started = true;
      });
    });

    // Neutral keys stored in state.type/goal/budget (language-independent) →
    // translated display text, resolved in the *current* language. This
    // keeps the recap and the WhatsApp message consistent with whichever
    // language the visitor was actually using, instead of always showing
    // the French option label regardless of UI language.
    var VALUE_LABELS = {
      type:   { individual: "sim.s1.o1", apartment: "sim.s1.o2", business: "sim.s1.o3", other: "sim.s1.o4" },
      goal:   { bill: "sim.s2.o1", produce: "sim.s2.o2", secure: "sim.s2.o3", automate: "sim.s2.o4", all: "sim.s2.o5" },
      budget: { low: "sim.s3.o1", mid: "sim.s3.o2", high: "sim.s3.o3", veryhigh: "sim.s3.o4", unknown: "sim.s3.o5" }
    };
    function displayValue(field, key){
      var map = VALUE_LABELS[field];
      if(!map || !key || !map[key]) return "—";
      return t(map[key]);
    }

    function buildRecap(){
      var recap = root.querySelector(".recap");
      if(!recap) return;
      // Built via DOM methods (not innerHTML) so free-text input like the
      // address field is always treated as plain text, never as markup.
      recap.textContent = "";
      [
        [t("sim.recap.type"), displayValue("type", state.type)],
        [t("sim.recap.goal"), displayValue("goal", state.goal)],
        [t("sim.recap.budget"), displayValue("budget", state.budget)],
        [t("sim.recap.address"), state.address || "—"]
      ].forEach(function(pair){
        var row = document.createElement("div");
        var b = document.createElement("b");
        b.textContent = pair[0] + ":";
        row.appendChild(b);
        row.appendChild(document.createTextNode(" " + pair[1]));
        recap.appendChild(row);
      });
    }

    // Rough, clearly-labelled indicative ranges (EUR/year) — never a precise
    // promise. Keyed on the stated consumption bracket; halved for
    // "automate" (smart-home automation alone saves less than solar
    // production). Security-only projects get no financial estimate at all
    // — protection isn't a monetary gain and shouldn't be framed as one.
    var ESTIMATE_RANGES = { low: [150, 350], mid: [400, 800], high: [800, 1400], veryhigh: [1200, 2200] };
    var ENERGY_GOALS = ["bill", "produce", "all"];

    function computeEstimate(){
      var goal = state.goal, budget = state.budget;
      var isEnergyGoal = ENERGY_GOALS.indexOf(goal) !== -1;
      var isAutomateGoal = goal === "automate";
      if(!isEnergyGoal && !isAutomateGoal) return { applicable: false };
      var range = ESTIMATE_RANGES[budget];
      if(!range) return { applicable: true, known: false };
      var min = range[0], max = range[1];
      if(isAutomateGoal){ min = Math.round(min * 0.45 / 10) * 10; max = Math.round(max * 0.45 / 10) * 10; }
      return { applicable: true, known: true, min: min, max: max };
    }

    function buildEstimate(){
      var box = root.querySelector(".estimate-box");
      var valueEl = root.querySelector(".estimate-value");
      if(!box || !valueEl) return;
      var est = computeEstimate();
      if(!est.applicable){ box.style.display = "none"; return; }
      box.style.display = "block";
      if(est.known){
        var perYear = { fr: "an", en: "yr", it: "anno" }[currentLang] || "an";
        valueEl.textContent = est.min + " € – " + est.max + " € / " + perYear;
      } else {
        valueEl.textContent = t("sim.estimate.unknown");
      }
    }

    function buildWaMessage(){
      var templates = {
        fr: [
          "Bonjour SOLARIS, voici ma demande d'étude :",
          "Type de projet : " + displayValue("type", state.type),
          "Objectif : " + displayValue("goal", state.goal),
          "Consommation : " + displayValue("budget", state.budget),
          "Adresse : " + (state.address || "—"),
          "Nom : " + (state.firstname || "") + " " + (state.lastname || ""),
          "Téléphone : " + (state.phone || "—"),
          "Email : " + (state.email || "—")
        ],
        en: [
          "Hello SOLARIS, here is my study request:",
          "Project type: " + displayValue("type", state.type),
          "Goal: " + displayValue("goal", state.goal),
          "Energy spend: " + displayValue("budget", state.budget),
          "Address: " + (state.address || "—"),
          "Name: " + (state.firstname || "") + " " + (state.lastname || ""),
          "Phone: " + (state.phone || "—"),
          "Email: " + (state.email || "—")
        ],
        it: [
          "Ciao SOLARIS, ecco la mia richiesta di studio:",
          "Tipo di progetto: " + displayValue("type", state.type),
          "Obiettivo: " + displayValue("goal", state.goal),
          "Consumo: " + displayValue("budget", state.budget),
          "Indirizzo: " + (state.address || "—"),
          "Nome: " + (state.firstname || "") + " " + (state.lastname || ""),
          "Telefono: " + (state.phone || "—"),
          "Email: " + (state.email || "—")
        ]
      };
      return (templates[currentLang] || templates.fr).join("\n");
    }

    function snapshotState(){
      var s = {};
      for(var k in state){ s[k] = state[k]; }
      s.step = current + 1;
      s.totalSteps = steps.length;
      return s;
    }

    function submit(){
      buildRecap();
      buildEstimate();
      steps.forEach(function(s){ s.classList.remove("is-active"); });
      root.querySelector(".sim-nav").style.display = "none";
      root.querySelector(".sim-progress").style.display = "none";
      successPanel.classList.add("is-active");
      completed = true;
      sendLead("completed", snapshotState());

      // Hand off to WhatsApp automatically — no extra click required.
      // Desktop: open a new tab immediately (WhatsApp Web), the site stays open.
      // Mobile: a new-tab window.open() often just opens silently in the
      // background instead of switching to the WhatsApp app, so we navigate
      // the current tab instead — the reliable way to trigger the OS app
      // link. A short pause first lets the visitor actually see the
      // confirmation screen (and their estimate) before the handoff.
      var waUrl = waLink(buildWaMessage());
      if(isMobileUA()){
        window.setTimeout(function(){ window.location.href = waUrl; }, 900);
      } else {
        window.open(waUrl, "_blank", "noopener");
      }

      var waBtn = successPanel.querySelector("[data-wa-submit]");
      if(waBtn){
        // Kept as a manual fallback in case the automatic handoff didn't
        // fire (e.g. the visitor navigated back before the redirect ran).
        waBtn.onclick = function(){ openWhatsApp(waLink(buildWaMessage())); };
      }
    }

    nextBtn.addEventListener("click", advance);

    backBtn.addEventListener("click", function(){
      if(current > 0) showStep(current - 1);
    });

    var retryBtn = successPanel.querySelector("[data-sim-retry]");
    if(retryBtn){
      retryBtn.addEventListener("click", function(){
        successPanel.classList.remove("is-active");
        root.querySelector(".sim-progress").style.display = "flex";
        showStep(0);
      });
    }

    // Recover an abandoned form: if the visitor leaves or hides the tab after
    // starting the simulator but before finishing it, send one last snapshot
    // with sendBeacon (works during unload, no click required).
    function handleLeaveIfAbandoned(){
      if(started && !completed){
        sendLead("abandoned", snapshotState(), true);
      }
    }
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "hidden") handleLeaveIfAbandoned();
    });
    window.addEventListener("pagehide", handleLeaveIfAbandoned);

    window.SOLARIS_SIM = {
      presetGoal: function(goalKey){
        var map = {
          bill: 0, secure: 2, automate: 3, all: 4
        };
        var idx = map[goalKey];
        if(idx === undefined) return;
        var group = steps[1].querySelector(".choice-grid");
        var choice = group.querySelectorAll(".choice")[idx];
        if(choice){ selectChoice(choice, { silent: true }); }
        showStep(1);
      },
      refresh: function(){
        updateProgress();
        nextBtn.textContent = (current === steps.length - 1) ? t("sim.s5.cta") : t("sim.nav.next");
        if(successPanel.classList.contains("is-active")){ buildRecap(); buildEstimate(); }
      }
    };

    showStep(0);
  }

  /* ---------- Active nav link on scroll (best-effort, light) ---------- */
  function initActiveNav(){
    var links = document.querySelectorAll(".main-nav a[href^='#']");
    if(!links.length) return;
    var sections = Array.prototype.map.call(links, function(a){
      return document.querySelector(a.getAttribute("href"));
    }).filter(Boolean);
    if(!sections.length) return;
    var onScroll = function(){
      var pos = window.scrollY + 120;
      var activeIdx = 0;
      sections.forEach(function(sec, i){ if(sec.offsetTop <= pos) activeIdx = i; });
      links.forEach(function(a, i){ a.classList.toggle("is-active", i === activeIdx); });
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Intro carousel (hero / objectif / positionnement) ---------- */
  function initCarousel(){
    var section = document.querySelector(".intro-carousel");
    var track = document.querySelector(".carousel-track");
    if(!track || !section) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll(".carousel-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".carousel-dot"));
    var prevBtn = document.querySelector(".carousel-arrow--prev");
    var nextBtn = document.querySelector(".carousel-arrow--next");
    var hint = document.querySelector(".carousel-hint");
    if(!slides.length) return;

    var AUTOPLAY_MS = 2200;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var inView = false;
    var userInteracted = false;
    var timer = null;

    function activeIndex(){
      var w = track.clientWidth || 1;
      return Math.round(track.scrollLeft / w);
    }
    function update(){
      var idx = activeIndex();
      dots.forEach(function(d,i){ d.classList.toggle("is-active", i === idx); });
      if(prevBtn) prevBtn.classList.toggle("is-disabled", idx === 0);
      if(nextBtn) nextBtn.classList.toggle("is-disabled", idx === slides.length - 1);
    }
    function goTo(i, silent){
      i = ((i % slides.length) + slides.length) % slides.length; // wrap around, loop
      track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
      if(!silent) hideHint();
    }
    function hideHint(){
      if(hint && !userInteracted){
        userInteracted = true;
        hint.classList.add("is-hidden");
      }
    }

    function stopAutoplay(){
      if(timer){ clearTimeout(timer); timer = null; }
    }
    function startAutoplay(){
      stopAutoplay();
      if(reduceMotion) return; // respect vestibular/motion preferences
      var currentSlide = slides[activeIndex()];
      var duration = (currentSlide && parseInt(currentSlide.getAttribute("data-duration"), 10)) || AUTOPLAY_MS;
      timer = setTimeout(function(){
        if(inView && document.visibilityState === "visible"){
          goTo(activeIndex() + 1, true);
        }
        startAutoplay(); // reschedule using whichever slide is now active
      }, duration);
    }

    var ticking = false;
    var settleTimer = null;
    track.addEventListener("scroll", function(){
      if(!ticking){
        window.requestAnimationFrame(function(){ update(); ticking = false; });
        ticking = true;
      }
      // Once the swipe/scroll settles on a slide, restart autoplay so the
      // delay always matches whichever slide the visitor actually landed on.
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function(){ if(inView) startAutoplay(); }, 160);
    }, { passive: true });

    dots.forEach(function(d, i){ d.addEventListener("click", function(){ goTo(i); }); });
    if(prevBtn) prevBtn.addEventListener("click", function(){ goTo(activeIndex() - 1); });
    if(nextBtn) nextBtn.addEventListener("click", function(){ goTo(activeIndex() + 1); });
    track.addEventListener("pointerdown", hideHint, { passive: true });
    track.addEventListener("touchstart", hideHint, { passive: true });
    window.addEventListener("resize", function(){ goTo(activeIndex(), true); });
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "visible" && inView) startAutoplay(); else stopAutoplay();
    });

    if("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          inView = entry.isIntersecting;
          if(inView) startAutoplay(); else stopAutoplay();
        });
      }, { threshold: 0.4 });
      io.observe(section);
    } else {
      inView = true;
      startAutoplay();
    }

    update();
  }

  /* ---------- SOLARIS Connect — fast 2-step conversion form ---------- */
  function initConnectForm(){
    var root = document.querySelector(".fast-form");
    if(!root) return;

    var steps = Array.prototype.slice.call(root.querySelectorAll(".sim-step"));
    var progressItems = Array.prototype.slice.call(root.querySelectorAll(".sim-progress i"));
    var successPanel = root.querySelector(".sim-success");
    var backBtn = root.querySelector(".sim-back");
    var nextBtn = root.querySelector(".sim-next");
    var current = 0;
    var autoAdvanceTimer = null;
    var started = false;
    var completed = false;

    var state = { target: null, firstname: "", phone: "" };

    var TARGET_LABELS = { home: "connect.form.s1.o1", car: "connect.form.s1.o2", office: "connect.form.s1.o3", all: "connect.form.s1.o4" };
    function displayTarget(){
      return state.target && TARGET_LABELS[state.target] ? t(TARGET_LABELS[state.target]) : "—";
    }

    function updateProgress(){
      progressItems.forEach(function(el, i){
        el.classList.toggle("is-done", i < current);
        el.classList.toggle("is-active", i === current);
      });
    }
    function showStep(i){
      steps.forEach(function(s, idx){ s.classList.toggle("is-active", idx === i); });
      current = i;
      updateProgress();
      backBtn.disabled = (i === 0);
      nextBtn.textContent = (i === steps.length - 1) ? t("connect.form.cta") : t("sim.nav.next");
    }
    function canAdvance(i){
      if(i === 0) return !!state.target;
      if(i === 1) return !!(state.firstname && state.phone);
      return true;
    }
    function advance(){
      if(!canAdvance(current)){
        var activeStep = root.querySelectorAll(".sim-step.is-active")[0];
        activeStep.classList.remove("shake");
        void activeStep.offsetWidth;
        activeStep.classList.add("shake");
        return;
      }
      if(current === steps.length - 1){ submit(); return; }
      showStep(current + 1);
    }
    function selectChoice(choice){
      var group = choice.closest(".choice-grid");
      var field = group.getAttribute("data-field");
      group.querySelectorAll(".choice").forEach(function(c){ c.classList.remove("is-selected"); c.setAttribute("aria-checked","false"); });
      choice.classList.add("is-selected");
      choice.setAttribute("aria-checked","true");
      state[field] = choice.getAttribute("data-value");
      started = true;
      window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = window.setTimeout(advance, 380);
    }
    root.querySelectorAll(".choice").forEach(function(choice){
      choice.addEventListener("click", function(){ selectChoice(choice); });
      choice.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " " || e.key === "Spacebar"){ e.preventDefault(); selectChoice(choice); }
      });
    });
    root.querySelectorAll("input[data-field]").forEach(function(input){
      input.addEventListener("input", function(){
        state[input.getAttribute("data-field")] = input.value.trim();
        started = true;
      });
    });

    function buildMessage(){
      var templates = {
        fr: [
          "Bonjour SOLARIS, je souhaite activer SOLARIS Connect :",
          "Je veux connecter : " + displayTarget(),
          "Prénom : " + (state.firstname || "—"),
          "Téléphone : " + (state.phone || "—")
        ],
        en: [
          "Hello SOLARIS, I'd like to activate SOLARIS Connect:",
          "I want to connect: " + displayTarget(),
          "First name: " + (state.firstname || "—"),
          "Phone: " + (state.phone || "—")
        ],
        it: [
          "Ciao SOLARIS, vorrei attivare SOLARIS Connect:",
          "Voglio collegare: " + displayTarget(),
          "Nome: " + (state.firstname || "—"),
          "Telefono: " + (state.phone || "—")
        ]
      };
      return (templates[currentLang] || templates.fr).join("\n");
    }
    function snapshotState(){
      return { type: "connect", goal: state.target || "", budget: "", address: "",
        firstname: state.firstname, lastname: "", phone: state.phone, email: "",
        step: current + 1, totalSteps: steps.length };
    }

    function submit(){
      steps.forEach(function(s){ s.classList.remove("is-active"); });
      root.querySelector(".sim-nav").style.display = "none";
      root.querySelector(".sim-progress").style.display = "none";
      successPanel.classList.add("is-active");
      completed = true;
      sendLead("completed", snapshotState());

      var waUrl = waLink(buildMessage());
      if(isMobileUA()){
        window.setTimeout(function(){ window.location.href = waUrl; }, 900);
      } else {
        window.open(waUrl, "_blank", "noopener");
      }
    }

    nextBtn.addEventListener("click", advance);
    backBtn.addEventListener("click", function(){ if(current > 0) showStep(current - 1); });

    function handleLeaveIfAbandoned(){
      if(started && !completed) sendLead("abandoned", snapshotState(), true);
    }
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState === "hidden") handleLeaveIfAbandoned();
    });
    window.addEventListener("pagehide", handleLeaveIfAbandoned);

    showStep(0);
  }

  document.addEventListener("DOMContentLoaded", function(){
    applyI18n();
    initMobileNav();
    initFaq();
    initCookieBar();
    initWhatsAppCtas();
    initObjectiveCards();
    initSimulator();
    initConnectForm();
    initActiveNav();
    initCarousel();
  });
})();
