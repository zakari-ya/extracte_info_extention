document.addEventListener("DOMContentLoaded", () => {
  // UI Elements
  const loadingEl = document.getElementById("loading");
  const noResultsEl = document.getElementById("no-results");
  const resultsContainer = document.getElementById("results-container");
  const statusMsg = document.getElementById("status");
  const sourcePageEl = document.getElementById("source-page");
  const scanTargetEl = document.getElementById("scan-target");

  // Section Elements
  const emailSection = document.getElementById("email-section");
  const phoneSection = document.getElementById("phone-section");
  const socialSection = document.getElementById("social-section");
  const emailList = document.getElementById("email-list");
  const phoneList = document.getElementById("phone-list");
  const socialList = document.getElementById("social-list");

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || tabs.length === 0) {
      showError("No active tab found.");
      return;
    }

    const activeTab = tabs[0];
    sourcePageEl.textContent = new URL(activeTab.url).hostname;

    // Send message to content script
    try {
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "EXTRACT_INFO" },
        function (response) {
          if (chrome.runtime.lastError) {
            // This happens if content script isn't loaded (e.g. browser restricted page)
            console.error(chrome.runtime.lastError);
            showError("Please refresh the page or try another site.");
            return;
          }

          if (!response) {
            showError("No response from extractor.");
            return;
          }

          displayResults(response);
        }
      );
    } catch (e) {
      showError("Error communicating with page.");
    }
  });

  function displayResults(data) {
    loadingEl.classList.add("hidden");

    const hasEmails = data.emails && data.emails.length > 0;
    const hasPhones = data.phones && data.phones.length > 0;
    const hasSocials = data.socials && Object.keys(data.socials).length > 0;

    if (!hasEmails && !hasPhones && !hasSocials) {
      noResultsEl.classList.remove("hidden");
      return;
    }

    resultsContainer.classList.remove("hidden");
    scanTargetEl.textContent = data.foundIn || "Page";

    // Render Emails
    if (hasEmails) {
      emailSection.classList.remove("hidden");
      data.emails.forEach((email) => {
        const li = document.createElement("li");
        li.className = "item";
        li.innerHTML = `
                    <span>${escapeHtml(email)}</span>
                    <button class="copy-btn" title="Copy">
                        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                `;
        li.querySelector(".copy-btn").addEventListener("click", () =>
          copyToClipboard(email, li.querySelector(".copy-btn"))
        );
        emailList.appendChild(li);
      });
    } else {
      emailSection.classList.add("hidden");
    }

    // Render Phones
    if (hasPhones) {
      phoneSection.classList.remove("hidden");
      data.phones.forEach((phone) => {
        const li = document.createElement("li");
        li.className = "item";
        li.innerHTML = `
                    <span>${escapeHtml(phone)}</span>
                    <button class="copy-btn" title="Copy">
                        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                `;
        li.querySelector(".copy-btn").addEventListener("click", () =>
          copyToClipboard(phone, li.querySelector(".copy-btn"))
        );
        phoneList.appendChild(li);
      });
    } else {
      phoneSection.classList.add("hidden");
    }

    // Render Socials
    if (hasSocials) {
      socialSection.classList.remove("hidden");
      Object.entries(data.socials).forEach(([network, links]) => {
        links.forEach((link) => {
          const a = document.createElement("a");
          a.href = link;
          a.target = "_blank";
          a.className = "social-chip";
          a.textContent = capitalizeFirstLetter(network);
          socialList.appendChild(a);
        });
      });
    } else {
      socialSection.classList.add("hidden");
    }
  }

  function showError(msg) {
    loadingEl.classList.add("hidden");
    noResultsEl.classList.remove("hidden");
    statusMsg.textContent = msg;
  }

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const originalIcon = btn.innerHTML;
      // Change icon to checkmark temporarily
      btn.innerHTML = `<svg viewBox="0 0 24 24" style="color:var(--success-color)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
      setTimeout(() => {
        btn.innerHTML = originalIcon;
      }, 1500);
    });
  }

  function escapeHtml(text) {
    if (!text) return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});
