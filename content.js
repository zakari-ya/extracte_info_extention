// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "EXTRACT_INFO") {
    const info = extractContactInfo();
    sendResponse(info);
  }
});

function extractContactInfo() {
  // Strategy: Try to find a footer first. If not found, use the whole body.
  let scope = findFooter();
  if (!scope) {
    console.log("No footer found, searching extracting entire body.");
    scope = document.body;
  }

  const html = scope.innerHTML;
  const text = scope.innerText;

  return {
    emails: extractEmails(html),
    phones: extractPhones(text),
    socials: extractSocials(scope),
    foundIn: scope === document.body ? "Body (Full Page)" : "Footer Section",
  };
}

function findFooter() {
  // Common selectors for footers
  const selectors = [
    "footer",
    "#footer",
    ".footer",
    "[id*='footer']",
    "[class*='footer']",
    ".site-footer",
    "#contact", // Sometimes contact info is in a contact section
    ".contact-section",
  ];

  for (let selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function extractEmails(text) {
  // Robust email regex
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = text.match(emailRegex);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

function extractPhones(text) {
  // Phone numbers are tricky. We'll look for common patterns.
  // This is a basic one that covers many international formats:
  // (?:[-+() ]*\d){10,13} -> 10 to 13 digits with optional separators
  // But we need to avoid capturing random numbers.
  // We'll look for strings that start with + or have typical grouping.

  // Pattern: (+\d{1,3}[- ]?)?\(?\d{2,4}\)?[- ]?\d{3,4}[- ]?\d{3,4}
  // This is a simplified version.
  const phoneRegex =
    /(?:\+?\d{1,3}[ -]?)?\(?\d{2,4}\)?[ -]?\d{3,4}[ -]?\d{3,4}/g;

  // Filter out short matches or obvious non-phones (like dates often matched by simple regexes)
  const matches = text.match(phoneRegex);
  if (!matches) return [];

  return [...new Set(matches)].filter((p) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  });
}

function extractSocials(scope) {
  const socialDomains = {
    facebook: "facebook.com",
    twitter: "twitter.com",
    x: "x.com",
    instagram: "instagram.com",
    linkedin: "linkedin.com",
    youtube: "youtube.com",
    tiktok: "tiktok.com",
    pinterest: "pinterest.com",
    whatsapp: "whatsapp.com",
  };

  const links = Array.from(scope.querySelectorAll("a[href]"));
  const found = {};

  links.forEach((link) => {
    const href = link.href;
    for (const [network, domain] of Object.entries(socialDomains)) {
      if (href.includes(domain)) {
        if (!found[network]) found[network] = [];
        // Avoid adding duplicate links for the same network if possible,
        // or just collect them all. Let's Set them later.
        found[network].push(href);
      }
    }
  });

  // Clean up duplicates
  for (const network in found) {
    found[network] = [...new Set(found[network])];
  }

  return found;
}
