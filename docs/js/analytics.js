/* Production analytics for Muhammad Shamel's portfolio.
 * Google Analytics 4: G-M8ZXN0602X
 * Microsoft Clarity: xvm2myrajs
 * This file is loaded by docs/index.html only. The local editor does not load it.
 */
(function () {
  "use strict";

  var initialized = false;
  var sectionObserver = null;
  var viewedSections = Object.create(null);
  var scrollMilestones = Object.create(null);
  var timeMilestones = Object.create(null);

  function safeGtag(eventName, parameters) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, parameters || {});
  }

  function safeClarity(eventName) {
    if (typeof window.clarity !== "function") return;
    window.clarity("event", eventName);
  }

  function track(eventName, parameters) {
    safeGtag(eventName, parameters);
    safeClarity(eventName);
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
  }

  function closest(element, selector) {
    return element && element.closest ? element.closest(selector) : null;
  }

  function trackClick(event) {
    var target = event.target;
    if (!target) return;

    var engagementCard = closest(target, "[data-case]");
    if (engagementCard) {
      var titleElement = engagementCard.querySelector("h3");
      var sectorElement = engagementCard.querySelector(".sector");
      var engagementIndex = Number(engagementCard.getAttribute("data-case"));
      var engagementParameters = {
        engagement_name: cleanText(titleElement && titleElement.textContent),
        engagement_category: cleanText(sectorElement && sectorElement.textContent),
        engagement_index: engagementIndex + 1
      };

      /* Keep one generic event for combined reporting. */
      track("engagement_open", engagementParameters);

      /* Also send a dedicated event for simple per-engagement reporting. */
      var engagementEvents = [
        "view_banking_transformation",
        "view_cloud_modernization",
        "view_regional_platform",
        "view_operational_excellence"
      ];

      if (engagementEvents[engagementIndex]) {
        track(engagementEvents[engagementIndex], engagementParameters);
      }
      return;
    }

    var link = closest(target, "a,button");
    if (!link) return;

    if (link.id === "cvBtn") {
      track("download_cv", {
        link_text: cleanText(link.textContent),
        file_name: "Muhammad_Shamel_CV.pdf"
      });
      return;
    }

    if (link.id === "linkedinBtn") {
      track("linkedin_click", {
        link_location: "hero",
        link_url: link.href || ""
      });
      return;
    }

    if (link.id === "contactLinkedin") {
      track("linkedin_click", {
        link_location: "contact",
        link_url: link.href || ""
      });
      return;
    }

    if (link.id === "emailBtn") {
      track("email_click", {
        link_location: "contact"
      });
      return;
    }

    if (link.matches('a[href="#engagements"]')) {
      track("view_engagements_click", {
        link_location: closest(link, ".hero") ? "hero" : "navigation",
        link_text: cleanText(link.textContent)
      });
      return;
    }

    if (closest(link, ".nav") && link.getAttribute("href") && link.getAttribute("href").charAt(0) === "#") {
      track("navigation_click", {
        destination_section: link.getAttribute("href").slice(1),
        link_text: cleanText(link.textContent)
      });
    }
  }

  function observeSections() {
    if (!("IntersectionObserver" in window)) return;

    if (sectionObserver) sectionObserver.disconnect();

    var sections = [
      { selector: ".hero", name: "hero" },
      { selector: "#profile", name: "profile" },
      { selector: "#expertise", name: "expertise" },
      { selector: "#practice", name: "architecture_in_practice" },
      { selector: "#engagements", name: "engagements" },
      { selector: "#journey", name: "journey" },
      { selector: ".philosophy", name: "architecture_philosophy" },
      { selector: "#contact", name: "contact" }
    ];

    sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var sectionName = entry.target.getAttribute("data-analytics-section");
        if (!sectionName || viewedSections[sectionName]) return;

        viewedSections[sectionName] = true;
        track("section_view", {
          section_name: sectionName
        });
        sectionObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.35
    });

    sections.forEach(function (definition) {
      var element = document.querySelector(definition.selector);
      if (!element) return;
      element.setAttribute("data-analytics-section", definition.name);
      sectionObserver.observe(element);
    });
  }

  function calculateScrollPercent() {
    var documentElement = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
    var documentHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      documentElement.clientHeight,
      documentElement.scrollHeight,
      documentElement.offsetHeight
    );
    var viewportHeight = window.innerHeight || documentElement.clientHeight || 0;
    var maximumScroll = Math.max(documentHeight - viewportHeight, 1);
    return Math.min(100, Math.round((scrollTop / maximumScroll) * 100));
  }

  function trackScrollDepth() {
    var currentPercent = calculateScrollPercent();
    [25, 50, 75, 100].forEach(function (milestone) {
      if (currentPercent < milestone || scrollMilestones[milestone]) return;
      scrollMilestones[milestone] = true;
      track("scroll_depth", {
        percent_scrolled: milestone
      });
    });
  }

  function scheduleTimeMilestones() {
    [30, 60, 120].forEach(function (seconds) {
      window.setTimeout(function () {
        if (timeMilestones[seconds]) return;
        timeMilestones[seconds] = true;
        track("time_on_page", {
          seconds_elapsed: seconds
        });
      }, seconds * 1000);
    });
  }

  function trackCampaignContext() {
    var parameters = new URLSearchParams(window.location.search);
    var campaign = {
      utm_source: parameters.get("utm_source") || undefined,
      utm_medium: parameters.get("utm_medium") || undefined,
      utm_campaign: parameters.get("utm_campaign") || undefined,
      utm_content: parameters.get("utm_content") || undefined,
      utm_term: parameters.get("utm_term") || undefined
    };

    var hasCampaign = Object.keys(campaign).some(function (key) {
      return Boolean(campaign[key]);
    });

    if (hasCampaign) track("campaign_landing", campaign);
  }

  function initialize() {
    if (initialized) return;
    initialized = true;

    document.addEventListener("click", trackClick, true);
    window.addEventListener("scroll", trackScrollDepth, { passive: true });

    observeSections();
    trackScrollDepth();
    scheduleTimeMilestones();
    trackCampaignContext();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  /* Re-observe sections after site.js dynamically renders its collections. */
  window.addEventListener("portfolio:ready", observeSections);
  window.addEventListener("portfolio:rendered", observeSections);
})();
