/* Shared portfolio logic — loaded by index.html (view) and edit/index.html (edit). */
(function () {
  if (!window.SITE_CONFIG) {
    window.SITE_CONFIG = {
      mode: "view",
      contentPath: "data/content.json",
      assetPrefix: ""
    };
  }

  var GITHUB = {
    owner: "Muhammadshamel",
    repo: "muhammadshamel.github.io",
    branch: "main"
  };

  var KEY = "ms.architect.draft.v1";
  var data = {};
  var editing = false;
  var pendingPhoto = null;
  var pendingCv = null;

  function $(s) {
    return document.querySelector(s);
  }

  function $$(s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  }

  function on(el, event, fn) {
    if (el) el.addEventListener(event, fn);
  }

  function assetUrl(path) {
    if (!path || path.indexOf("data:") === 0 || path.indexOf("http") === 0) return path;
    return (window.SITE_CONFIG.assetPrefix || "") + path;
  }

  function get(path) {
    return path.split(".").reduce(function (o, k) {
      return o && o[k] !== undefined && o[k] !== null ? o[k] : undefined;
    }, data);
  }

  function set(path, val) {
    var p = path.split(".");
    var k = p.pop();
    var o = data;
    p.forEach(function (x) {
      o = o[x];
    });
    o[k] = val;
  }

  function deepMerge(base, patch) {
    var out = Object.assign({}, base);
    Object.keys(patch || {}).forEach(function (key) {
      var val = patch[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        out[key] = deepMerge(out[key] || {}, val);
      } else {
        out[key] = val;
      }
    });
    return out;
  }

  function loadContent() {
    var url = window.SITE_CONFIG.contentPath + "?t=" + Date.now();
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("Could not load content.json (" + res.status + ")");
      return res.json();
    }).then(function (json) {
      data = json;
      if (window.SITE_CONFIG.mode === "edit") {
        try {
          var draft = localStorage.getItem(KEY);
          if (draft) data = deepMerge(data, JSON.parse(draft));
        } catch (e) {}
      }
    });
  }

  function bind() {
    $$("[data-edit]").forEach(function (el) {
      var v = get(el.dataset.edit);
      if (v != null) el.innerHTML = v;
      el.contentEditable = editing;
      el.oninput = function () {
        set(el.dataset.edit, el.innerHTML.trim());
      };
    });
    document.body.classList.toggle("editing", editing);
    var bar = $("#editbar");
    if (bar) bar.classList.toggle("show", editing);
  }

  function render() {
    bind();

    var impactStrip = $("#impactStrip");
    if (impactStrip && data.impact) {
      impactStrip.innerHTML = data.impact.map(function (x, i) {
        return '<div class="impact-item"><strong data-edit="impact.' + i + '.title">' + x.title + '</strong><span data-edit="impact.' + i + '.text">' + x.text + "</span></div>";
      }).join("");
    }

    var capGrid = $("#capGrid");
    if (capGrid && data.capabilities) {
      capGrid.innerHTML = data.capabilities.map(function (x, i) {
        return '<article class="cap reveal"><div class="cap-no">0' + (i + 1) + '</div><h3 data-edit="capabilities.' + i + '.title">' + x.title + '</h3><p data-edit="capabilities.' + i + '.text">' + x.text + "</p></article>";
      }).join("");
    }

    var caseList = $("#caseList");
    if (caseList && data.engagements) {
      caseList.innerHTML = data.engagements.map(function (x, i) {
        return '<article class="case reveal" data-case="' + i + '"><div class="sector" data-edit="engagements.' + i + '.sector">' + x.sector + '</div><div><h3 data-edit="engagements.' + i + '.title">' + x.title + '</h3><p data-edit="engagements.' + i + '.intro">' + x.intro + '</p></div><div class="arrow">↗</div></article>';
      }).join("");
    }

    var timeline = $("#timeline");
    if (timeline && data.journey) {
      timeline.innerHTML = data.journey.map(function (x, i) {
        return '<article class="job reveal"><div class="year" data-edit="journey.' + i + '.year">' + x.year + '</div><h3 data-edit="journey.' + i + '.role">' + x.role + '</h3><div class="org" data-edit="journey.' + i + '.org">' + x.org + '</div><p data-edit="journey.' + i + '.text">' + x.text + "</p></article>";
      }).join("");
    }

    var photoEl = $("#photo");
    if (photoEl) {
      var photo = pendingPhoto || (data.identity && data.identity.photo);
      if (photo) {
        photoEl.src = photo.indexOf("data:") === 0 ? photo : assetUrl(photo);
      } else {
        photoEl.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="#e9edf3"/><circle cx="300" cy="260" r="105" fill="#cbd3df"/><path d="M115 650c18-150 111-230 185-230s167 80 185 230" fill="#cbd3df"/></svg>');
      }
    }

    var linkedin = (data.links && data.links.linkedin) || "#";
    var linkedinBtn = $("#linkedinBtn");
    var contactLinkedin = $("#contactLinkedin");
    if (linkedinBtn) linkedinBtn.href = linkedin;
    if (contactLinkedin) contactLinkedin.href = linkedin;
    var emailBtn = $("#emailBtn");
    if (emailBtn) emailBtn.href = "mailto:" + ((data.links && data.links.email) || "");

    setupCvButton();
    bind();
    wireCases();
    observe();
  }

  function setupCvButton() {
    var btn = $("#cvBtn");
    if (!btn) return;
    var cv = pendingCv ? "assets/cv.pdf" : (data.links && data.links.cv);
    if (cv && cv !== "#") {
      btn.href = assetUrl(cv);
      btn.setAttribute("download", "Muhammad_Shamel_CV.pdf");
      btn.removeAttribute("role");
      btn.style.display = "";
      btn.style.opacity = "1";
      btn.title = "Download CV";
      btn.onclick = null;
    } else if (window.SITE_CONFIG.mode === "view") {
      btn.style.display = "none";
    } else {
      btn.removeAttribute("href");
      btn.setAttribute("role", "button");
      btn.style.display = "";
      btn.style.opacity = "0.7";
      btn.title = "Upload a CV in edit mode first";
      btn.onclick = function (e) {
        e.preventDefault();
        toast("Upload a CV using the toolbar below, then Publish.");
      };
    }
  }

  function wireCases() {
    $$("[data-case]").forEach(function (c) {
      c.onclick = function (e) {
        if (editing && e.target.closest("[contenteditable=true]")) return;
        openCase(+c.dataset.case);
      };
    });
  }

  function openCase(i) {
    var x = data.engagements[i];
    $("#modalSector").innerHTML = x.sector;
    $("#modalSector").dataset.edit = "engagements." + i + ".sector";
    $("#modalTitle").innerHTML = x.title;
    $("#modalTitle").dataset.edit = "engagements." + i + ".title";
    $("#modalIntro").innerHTML = x.intro;
    $("#modalIntro").dataset.edit = "engagements." + i + ".intro";
    var fields = [
      ["Business challenge", "challenge"],
      ["Architecture scope", "scope"],
      ["My role", "role"],
      ["Business outcome", "outcome"]
    ];
    $("#modalDetails").innerHTML = fields.map(function (pair) {
      var h = pair[0];
      var k = pair[1];
      return "<div><h4>" + h + '</h4><p data-edit="engagements.' + i + "." + k + '">' + x[k] + "</p></div>";
    }).join("");
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
    bind();
  }

  function toast(t) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = t;
    el.classList.add("show");
    setTimeout(function () {
      el.classList.remove("show");
    }, 2800);
  }

  function observe() {
    $$(".reveal").forEach(function (x) {
      x.classList.add("in");
    });
    if (!("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          o.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    $$(".reveal").forEach(function (x) {
      o.observe(x);
    });
  }

  function wireCommon() {
    $$("[data-close]").forEach(function (x) {
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
    on($("#menuBtn"), "click", function () {
      $("#mobile").classList.toggle("open");
    });
    $$("#mobile a").forEach(function (a) {
      a.onclick = function () {
        $("#mobile").classList.remove("open");
      };
    });
    window.addEventListener("scroll", function () {
      var nav = $("#nav");
      if (nav) nav.classList.toggle("scrolled", scrollY > 10);
    });
  }

  function wireEdit() {
    editing = true;
    var editToggle = $("#editToggle");
    if (editToggle) editToggle.remove();

    on($("#done"), "click", function () {
      location.href = "../";
    });
    on($("#save"), "click", function () {
      localStorage.setItem(KEY, JSON.stringify(data));
      toast("Draft saved in this browser");
    });
    on($("#reset"), "click", function () {
      if (!confirm("Discard local draft and reload from the site?")) return;
      localStorage.removeItem(KEY);
      pendingPhoto = null;
      pendingCv = null;
      loadContent().then(render).then(function () {
        toast("Reloaded published content");
      });
    });
    on($("#editLinks"), "click", function () {
      var linkedin = prompt("LinkedIn URL", (data.links && data.links.linkedin) || "");
      if (linkedin !== null) data.links.linkedin = linkedin;
      var email = prompt("Email address", (data.links && data.links.email) || "");
      if (email !== null) data.links.email = email;
      render();
    });
    on($("#photoButton"), "click", function () {
      $("#photoInput").click();
    });
    on($("#photoInput"), "change", function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        pendingPhoto = r.result;
        data.identity.photo = "assets/photo.png";
        $("#photo").src = pendingPhoto;
        toast("Photo ready — click Publish to go live");
      };
      r.readAsDataURL(f);
    });
    on($("#uploadCv"), "click", function () {
      $("#cvInput").click();
    });
    on($("#cvInput"), "change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.type !== "application/pdf" && f.name.toLowerCase().indexOf(".pdf") === -1) {
        toast("Please select a PDF file");
        e.target.value = "";
        return;
      }
      pendingCv = f;
      data.links.cv = "assets/cv.pdf";
      setupCvButton();
      toast("CV ready — click Publish to go live");
      e.target.value = "";
    });
    on($("#removeCv"), "click", function () {
      if (!confirm("Remove CV from the site?")) return;
      pendingCv = "remove";
      data.links.cv = "";
      setupCvButton();
      toast("CV marked for removal — click Publish");
    });
    on($("#publish"), "click", publishToGitHub);
  }

  function getToken() {
    var token = sessionStorage.getItem("gh_token");
    if (!token) {
      token = prompt("Paste your GitHub Personal Access Token (needs repo Contents read/write).\nCreate one at: github.com/settings/tokens");
      if (!token) throw new Error("Token required");
      sessionStorage.setItem("gh_token", token.trim());
    }
    return sessionStorage.getItem("gh_token");
  }

  function ghGetFile(path) {
    return fetch("https://api.github.com/repos/" + GITHUB.owner + "/" + GITHUB.repo + "/contents/" + path + "?ref=" + GITHUB.branch, {
      headers: { Accept: "application/vnd.github+json" }
    }).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
      return res.json();
    });
  }

  function ghPutFile(path, base64Content, message) {
    return ghGetFile(path).then(function (existing) {
      var body = { message: message, content: base64Content, branch: GITHUB.branch };
      if (existing && existing.sha) body.sha = existing.sha;
      return fetch("https://api.github.com/repos/" + GITHUB.owner + "/" + GITHUB.repo + "/contents/" + path, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + getToken(),
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) throw new Error(json.message || "GitHub upload failed");
          return json;
        });
      });
    });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result.split(",")[1]); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function dataUrlToBase64(dataUrl) {
    return dataUrl.split(",")[1];
  }

  function publishToGitHub() {
    var btn = $("#publish");
    btn.disabled = true;
    toast("Publishing to GitHub…");
    var json = JSON.stringify(data, null, 2);
    ghPutFile("data/content.json", btoa(unescape(encodeURIComponent(json))), "Update portfolio content")
      .then(function () {
        if (pendingPhoto) {
          return ghPutFile("assets/photo.png", dataUrlToBase64(pendingPhoto), "Update portfolio photo").then(function () {
            pendingPhoto = null;
          });
        }
      })
      .then(function () {
        if (pendingCv && pendingCv !== "remove") {
          return fileToBase64(pendingCv).then(function (b64) {
            return ghPutFile("assets/cv.pdf", b64, "Update portfolio CV");
          }).then(function () {
            pendingCv = null;
          });
        }
        if (pendingCv === "remove") {
          return ghGetFile("assets/cv.pdf").then(function (existing) {
            if (!existing || !existing.sha) return;
            return fetch("https://api.github.com/repos/" + GITHUB.owner + "/" + GITHUB.repo + "/contents/assets/cv.pdf", {
              method: "DELETE",
              headers: {
                Authorization: "Bearer " + getToken(),
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ message: "Remove portfolio CV", sha: existing.sha, branch: GITHUB.branch })
            });
          }).then(function () {
            pendingCv = null;
          });
        }
      })
      .then(function () {
        localStorage.removeItem(KEY);
        toast("Published! Live in 1–2 minutes.");
      })
      .catch(function (err) {
        console.error(err);
        if (String(err.message).indexOf("401") >= 0 || String(err.message).indexOf("Bad credentials") >= 0) {
          sessionStorage.removeItem("gh_token");
        }
        toast("Publish failed: " + err.message);
      })
      .finally(function () {
        btn.disabled = false;
      });
  }

  function showLoadError(err) {
    console.error(err);
    toast("Failed to load content — check data/content.json");
    var main = document.querySelector("main");
    if (main) {
      main.insertAdjacentHTML("afterbegin", '<div style="background:#fee;border:1px solid #c73763;padding:16px 20px;margin:100px 28px 0;border-radius:12px;font-weight:600">Could not load site content. Please ensure <code>data/content.json</code> is uploaded to GitHub.</div>');
    }
  }

  function init() {
    document.documentElement.dataset.theme = localStorage.getItem("ms.theme") || "light";
    wireCommon();
    if (window.SITE_CONFIG.mode === "edit") wireEdit();
    loadContent()
      .then(function () {
        render();
        if (window.SITE_CONFIG.mode === "edit") toast("Edit mode — changes go live when you Publish");
      })
      .catch(showLoadError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
