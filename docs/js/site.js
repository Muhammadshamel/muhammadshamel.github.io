/* Shared portfolio renderer for production and local editor. */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || { mode: "view", contentPath: "data/content.json", assetPrefix: "" };
  var state = {
    data: {},
    editing: CONFIG.mode === "edit",
    pendingPhoto: null,
    pendingCv: null
  };

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function on(el, event, fn) { if (el) el.addEventListener(event, fn); }

  function assetUrl(path) {
    if (!path || /^(?:data:|blob:|https?:|\/)/.test(path)) return path;
    return (CONFIG.assetPrefix || "") + path;
  }

  function get(path) {
    return path.split(".").reduce(function (o, k) {
      return o && o[k] !== undefined && o[k] !== null ? o[k] : undefined;
    }, state.data);
  }

  function set(path, val) {
    var parts = path.split(".");
    var key = parts.pop();
    var obj = state.data;
    parts.forEach(function (part) {
      if (!obj[part] || typeof obj[part] !== "object") obj[part] = {};
      obj = obj[part];
    });
    obj[key] = val;
  }

  function deepMerge(base, patch) {
    var out = Object.assign({}, base);
    Object.keys(patch || {}).forEach(function (key) {
      var val = patch[key];
      if (val && typeof val === "object" && !Array.isArray(val)) out[key] = deepMerge(out[key] || {}, val);
      else out[key] = val;
    });
    return out;
  }

  function loadContent() {
    return fetch(CONFIG.contentPath + "?t=" + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load content.json (" + res.status + ")");
        return res.json();
      })
      .then(function (json) {
        state.data = json;
        return state.data;
      });
  }

  function bindEditable() {
    $$('[data-edit]').forEach(function (el) {
      var value = get(el.dataset.edit);
      if (value !== undefined && value !== null) el.innerHTML = value;
      el.contentEditable = state.editing ? "true" : "false";
      el.oninput = state.editing ? function () { set(el.dataset.edit, el.innerHTML.trim()); } : null;
    });
    document.body.classList.toggle("editing", state.editing);
  }

  function renderCollections() {
    var impactStrip = $("#impactStrip");
    if (impactStrip && state.data.impact) {
      impactStrip.innerHTML = state.data.impact.map(function (x, i) {
        return '<div class="impact-item"><strong data-edit="impact.' + i + '.title">' + x.title + '</strong><span data-edit="impact.' + i + '.text">' + x.text + '</span></div>';
      }).join("");
    }

    var capGrid = $("#capGrid");
    if (capGrid && state.data.capabilities) {
      capGrid.innerHTML = state.data.capabilities.map(function (x, i) {
        return '<article class="cap reveal"><div class="cap-no">0' + (i + 1) + '</div><h3 data-edit="capabilities.' + i + '.title">' + x.title + '</h3><p data-edit="capabilities.' + i + '.text">' + x.text + '</p></article>';
      }).join("");
    }

    var caseList = $("#caseList");
    if (caseList && state.data.engagements) {
      caseList.innerHTML = state.data.engagements.map(function (x, i) {
        return '<article class="case reveal" data-case="' + i + '"><div class="sector" data-edit="engagements.' + i + '.sector">' + x.sector + '</div><div><h3 data-edit="engagements.' + i + '.title">' + x.title + '</h3><p data-edit="engagements.' + i + '.intro">' + x.intro + '</p></div><div class="arrow">↗</div></article>';
      }).join("");
    }

    var timeline = $("#timeline");
    if (timeline && state.data.journey) {
      timeline.innerHTML = state.data.journey.map(function (x, i) {
        return '<article class="job reveal"><div class="year" data-edit="journey.' + i + '.year">' + x.year + '</div><h3 data-edit="journey.' + i + '.role">' + x.role + '</h3><div class="org" data-edit="journey.' + i + '.org">' + x.org + '</div><p data-edit="journey.' + i + '.text">' + x.text + '</p></article>';
      }).join("");
    }
  }

  function renderPhoto() {
    var el = $("#photo");
    if (!el) return;
    var photo = state.pendingPhoto || (state.data.identity && state.data.identity.photo);
    if (!photo) return;
    var source = typeof photo === "string" ? photo : photo.previewUrl;
    if (source) el.src = assetUrl(source);
  }

  function setupCvButton() {
    var btn = $("#cvBtn");
    if (!btn) return;
    var cv = state.data.links && state.data.links.cv;
    if (state.pendingCv && state.pendingCv !== "remove") cv = state.pendingCv.previewUrl || "assets/cv.pdf";
    if (state.pendingCv === "remove") cv = "";
    if (cv && cv !== "#") {
      btn.href = assetUrl(cv);
      btn.setAttribute("download", "Muhammad_Shamel_CV.pdf");
      btn.removeAttribute("role");
      btn.style.display = "";
      btn.style.opacity = "1";
      btn.onclick = null;
    } else if (CONFIG.mode === "view") {
      btn.style.display = "none";
    } else {
      btn.removeAttribute("href");
      btn.setAttribute("role", "button");
      btn.style.display = "";
      btn.style.opacity = "0.7";
      btn.onclick = function (e) { e.preventDefault(); toast("Upload a CV from the editor toolbar first."); };
    }
  }

  function renderLinks() {
    var links = state.data.links || {};
    var linkedin = links.linkedin || "#";
    if ($("#linkedinBtn")) $("#linkedinBtn").href = linkedin;
    if ($("#contactLinkedin")) $("#contactLinkedin").href = linkedin;
    if ($("#emailBtn")) $("#emailBtn").href = "mailto:" + (links.email || "");
    setupCvButton();
  }

  function wireCases() {
    $$('[data-case]').forEach(function (card) {
      card.onclick = function (e) {
        if (state.editing && e.target.closest('[contenteditable="true"]')) return;
        openCase(Number(card.dataset.case));
      };
    });
  }

  function openCase(i) {
    var x = state.data.engagements[i];
    if (!x) return;
    $("#modalSector").innerHTML = x.sector;
    $("#modalSector").dataset.edit = "engagements." + i + ".sector";
    $("#modalTitle").innerHTML = x.title;
    $("#modalTitle").dataset.edit = "engagements." + i + ".title";
    $("#modalIntro").innerHTML = x.intro;
    $("#modalIntro").dataset.edit = "engagements." + i + ".intro";
    var fields = [["Business challenge", "challenge"], ["Architecture scope", "scope"], ["My role", "role"], ["Business outcome", "outcome"]];
    $("#modalDetails").innerHTML = fields.map(function (pair) {
      return '<div><h4>' + pair[0] + '</h4><p data-edit="engagements.' + i + '.' + pair[1] + '">' + (x[pair[1]] || "") + '</p></div>';
    }).join("");
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
    bindEditable();
  }

  function observe() {
    $$('.reveal').forEach(function (x) { x.classList.add("in"); });
  }

  function render() {
    renderCollections();
    renderPhoto();
    renderLinks();
    bindEditable();
    wireCases();
    observe();
    window.dispatchEvent(new CustomEvent("portfolio:rendered"));
  }

  function setEditing(enabled) {
    state.editing = Boolean(enabled);
    bindEditable();
  }

  function toast(message) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove("show"); }, 3000);
  }

  function wireCommon() {
    $$('[data-close]').forEach(function (x) {
      x.onclick = function () {
        $("#modal").classList.remove("open");
        document.body.style.overflow = "";
      };
    });
    on($("#themeToggle"), "click", function () {
      var t = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = t;
      localStorage.setItem("ms.theme", t);
    });
    on($("#menuBtn"), "click", function () { $("#mobile").classList.toggle("open"); });
    $$("#mobile a").forEach(function (a) { a.onclick = function () { $("#mobile").classList.remove("open"); }; });
    window.addEventListener("scroll", function () {
      var nav = $("#nav");
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  function init() {
    document.documentElement.dataset.theme = localStorage.getItem("ms.theme") || "light";
    wireCommon();
    loadContent().then(function () {
      render();
      window.dispatchEvent(new CustomEvent("portfolio:ready"));
    }).catch(function (err) {
      console.error(err);
      toast("Failed to load content.json");
    });
  }

  window.PortfolioApp = {
    config: CONFIG,
    state: state,
    get: get,
    set: set,
    render: render,
    loadContent: loadContent,
    setEditing: setEditing,
    setupCvButton: setupCvButton,
    toast: toast,
    deepMerge: deepMerge
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
