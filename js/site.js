/* Shared portfolio logic — loaded by index.html (view) and edit/index.html (edit). */
window.SITE_CONFIG = window.SITE_CONFIG || {
  mode: "view",
  contentPath: "data/content.json",
  assetPrefix: ""
};

const GITHUB = {
  owner: "Muhammadshamel",
  repo: "muhammadshamel.github.io",
  branch: "main"
};

const KEY = "ms.architect.draft.v1";
let data = {};
let editing = false;
let pendingPhoto = null;
let pendingCv = null;
let contentSha = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function assetUrl(path) {
  if (!path || path.startsWith("data:") || path.startsWith("http")) return path;
  return (window.SITE_CONFIG.assetPrefix || "") + path;
}

function get(path) {
  return path.split(".").reduce((o, k) => o?.[k], data);
}

function set(path, val) {
  const p = path.split(".");
  const k = p.pop();
  let o = data;
  p.forEach((x) => (o = o[x]));
  o[k] = val;
}

async function loadContent() {
  const url = window.SITE_CONFIG.contentPath + "?t=" + Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load content.json");
  data = await res.json();

  if (window.SITE_CONFIG.mode === "edit") {
    try {
      const draft = localStorage.getItem(KEY);
      if (draft) data = Object.assign(data, JSON.parse(draft));
    } catch (e) {}
  }
}

function bind() {
  $$("[data-edit]").forEach((el) => {
    const v = get(el.dataset.edit);
    if (v != null) el.innerHTML = v;
    el.contentEditable = editing;
    el.oninput = () => set(el.dataset.edit, el.innerHTML.trim());
  });
  document.body.classList.toggle("editing", editing);
  const bar = $("#editbar");
  if (bar) bar.classList.toggle("show", editing);
}

function render() {
  bind();
  $("#impactStrip").innerHTML = data.impact
    .map(
      (x, i) =>
        `<div class="impact-item"><strong data-edit="impact.${i}.title">${x.title}</strong><span data-edit="impact.${i}.text">${x.text}</span></div>`
    )
    .join("");
  $("#capGrid").innerHTML = data.capabilities
    .map(
      (x, i) =>
        `<article class="cap reveal"><div class="cap-no">0${i + 1}</div><h3 data-edit="capabilities.${i}.title">${x.title}</h3><p data-edit="capabilities.${i}.text">${x.text}</p></article>`
    )
    .join("");
  $("#caseList").innerHTML = data.engagements
    .map(
      (x, i) =>
        `<article class="case reveal" data-case="${i}"><div class="sector" data-edit="engagements.${i}.sector">${x.sector}</div><div><h3 data-edit="engagements.${i}.title">${x.title}</h3><p data-edit="engagements.${i}.intro">${x.intro}</p></div><div class="arrow">↗</div></article>`
    )
    .join("");
  $("#timeline").innerHTML = data.journey
    .map(
      (x, i) =>
        `<article class="job reveal"><div class="year" data-edit="journey.${i}.year">${x.year}</div><h3 data-edit="journey.${i}.role">${x.role}</h3><div class="org" data-edit="journey.${i}.org">${x.org}</div><p data-edit="journey.${i}.text">${x.text}</p></article>`
    )
    .join("");

  const photo = pendingPhoto || data.identity?.photo;
  $("#photo").src =
    photo ||
    `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="#e9edf3"/><circle cx="300" cy="260" r="105" fill="#cbd3df"/><path d="M115 650c18-150 111-230 185-230s167 80 185 230" fill="#cbd3df"/><text x="300" y="700" text-anchor="middle" font-family="Arial" font-size="22" fill="#7a8799">ADD PHOTO</text></svg>'
    )}";
  if (photo && !photo.startsWith("data:")) $("#photo").src = assetUrl(photo);

  $("#linkedinBtn").href = $("#contactLinkedin").href = data.links.linkedin || "#";
  $("#emailBtn").href = "mailto:" + (data.links.email || "");

  setupCvButton();
  bind();
  wireCases();
  observe();
}

function setupCvButton() {
  const btn = $("#cvBtn");
  if (!btn) return;
  const cv = pendingCv ? "assets/cv.pdf" : data.links?.cv;
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
    btn.onclick = (e) => {
      e.preventDefault();
      toast("Upload a CV using the toolbar below, then Publish.");
    };
  }
}

function wireCases() {
  $$("[data-case]").forEach((c) =>
    (c.onclick = (e) => {
      if (editing && e.target.closest("[contenteditable=true]")) return;
      openCase(+c.dataset.case);
    })
  );
}

function openCase(i) {
  const x = data.engagements[i];
  $("#modalSector").innerHTML = x.sector;
  $("#modalSector").dataset.edit = `engagements.${i}.sector`;
  $("#modalTitle").innerHTML = x.title;
  $("#modalTitle").dataset.edit = `engagements.${i}.title`;
  $("#modalIntro").innerHTML = x.intro;
  $("#modalIntro").dataset.edit = `engagements.${i}.intro`;
  const fields = [
    ["Business challenge", "challenge"],
    ["Architecture scope", "scope"],
    ["My role", "role"],
    ["Business outcome", "outcome"]
  ];
  $("#modalDetails").innerHTML = fields
    .map(
      ([h, k]) =>
        `<div><h4>${h}</h4><p data-edit="engagements.${i}.${k}">${x[k]}</p></div>`
    )
    .join("");
  $("#modal").classList.add("open");
  document.body.style.overflow = "hidden";
  bind();
}

function toast(t) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = t;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

function observe() {
  const o = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          o.unobserve(e.target);
        }
      }),
    { threshold: 0.1 }
  );
  $$(".reveal").forEach((x) => o.observe(x));
}

function wireCommon() {
  $$("[data-close]").forEach(
    (x) =>
      (x.onclick = () => {
        $("#modal").classList.remove("open");
        document.body.style.overflow = "";
      })
  );
  $("#themeToggle").onclick = () => {
    const t = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("ms.theme", t);
  };
  $("#menuBtn").onclick = () => $("#mobile").classList.toggle("open");
  $$("#mobile a").forEach((a) => (a.onclick = () => $("#mobile").classList.remove("open")));
  window.addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 10));
}

function wireEdit() {
  editing = true;
  $("#editToggle")?.remove();

  $("#done")?.addEventListener("click", () => {
    location.href = "../";
  });

  $("#save")?.addEventListener("click", () => {
    localStorage.setItem(KEY, JSON.stringify(data));
    toast("Draft saved in this browser");
  });

  $("#reset")?.addEventListener("click", async () => {
    if (!confirm("Discard local draft and reload from the site?")) return;
    localStorage.removeItem(KEY);
    pendingPhoto = null;
    pendingCv = null;
    await loadContent();
    render();
    toast("Reloaded published content");
  });

  $("#editLinks")?.addEventListener("click", () => {
    const linkedin = prompt("LinkedIn URL", data.links.linkedin || "");
    if (linkedin !== null) data.links.linkedin = linkedin;
    const email = prompt("Email address", data.links.email || "");
    if (email !== null) data.links.email = email;
    render();
  });

  $("#photoButton")?.addEventListener("click", () => $("#photoInput").click());
  $("#photoInput")?.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      pendingPhoto = r.result;
      data.identity.photo = "assets/photo.png";
      $("#photo").src = pendingPhoto;
      toast("Photo ready — click Publish to go live");
    };
    r.readAsDataURL(f);
  });

  $("#uploadCv")?.addEventListener("click", () => $("#cvInput").click());
  $("#cvInput")?.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
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

  $("#removeCv")?.addEventListener("click", () => {
    if (!confirm("Remove CV from the site?")) return;
    pendingCv = "remove";
    data.links.cv = "";
    setupCvButton();
    toast("CV marked for removal — click Publish");
  });

  $("#publish")?.addEventListener("click", publishToGitHub);
}

function getToken() {
  let token = sessionStorage.getItem("gh_token");
  if (!token) {
    token = prompt(
      "Paste your GitHub Personal Access Token (needs repo Contents read/write).\nCreate one at: github.com/settings/tokens"
    );
    if (!token) throw new Error("Token required");
    sessionStorage.setItem("gh_token", token.trim());
  }
  return sessionStorage.getItem("gh_token");
}

async function ghGetFile(path) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}?ref=${GITHUB.branch}`,
    { headers: { Accept: "application/vnd.github+json" } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function ghPutFile(path, base64Content, message) {
  const token = getToken();
  const existing = await ghGetFile(path);
  const body = {
    message,
    content: base64Content,
    branch: GITHUB.branch
  };
  if (existing?.sha) body.sha = existing.sha;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "GitHub upload failed");
  return json;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(",")[1];
}

async function publishToGitHub() {
  const btn = $("#publish");
  btn.disabled = true;
  toast("Publishing to GitHub…");
  try {
    const json = JSON.stringify(data, null, 2);
    await ghPutFile(
      "data/content.json",
      btoa(unescape(encodeURIComponent(json))),
      "Update portfolio content"
    );

    if (pendingPhoto) {
      await ghPutFile(
        "assets/photo.png",
        dataUrlToBase64(pendingPhoto),
        "Update portfolio photo"
      );
      pendingPhoto = null;
    }

    if (pendingCv && pendingCv !== "remove") {
      await ghPutFile(
        "assets/cv.pdf",
        await fileToBase64(pendingCv),
        "Update portfolio CV"
      );
      pendingCv = null;
    } else if (pendingCv === "remove") {
      const existing = await ghGetFile("assets/cv.pdf");
      if (existing?.sha) {
        const token = getToken();
        await fetch(
          `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/assets/cv.pdf`,
          {
            method: "DELETE",
            headers: {
              Authorization: "Bearer " + token,
              Accept: "application/vnd.github+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: "Remove portfolio CV",
              sha: existing.sha,
              branch: GITHUB.branch
            })
          }
        );
      }
      pendingCv = null;
    }

    localStorage.removeItem(KEY);
    toast("Published! Live in 1–2 minutes.");
  } catch (err) {
    console.error(err);
    if (String(err.message).includes("401") || String(err.message).includes("Bad credentials")) {
      sessionStorage.removeItem("gh_token");
    }
    toast("Publish failed: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function init() {
  document.documentElement.dataset.theme = localStorage.getItem("ms.theme") || "light";
  wireCommon();
  if (window.SITE_CONFIG.mode === "edit") wireEdit();
  try {
    await loadContent();
    render();
    if (window.SITE_CONFIG.mode === "edit") toast("Edit mode — changes go live when you Publish");
  } catch (err) {
    console.error(err);
    toast("Failed to load content.json");
  }
}

init();

