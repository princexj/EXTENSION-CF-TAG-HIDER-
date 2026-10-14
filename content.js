/**
 * Codeforces Problem Tag Hider - Content Script
 */

(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    enabled: true,
    mode: 'spoiler', // 'spoiler' | 'hover' | 'hidden'
    keepRating: true,
    hideInProblemset: true
  };

  let currentSettings = { ...DEFAULT_SETTINGS };
  let isRevealed = false;

  // 1. Initialize attributes on <html> as early as possible (document_start)
  function applyHtmlAttributes() {
    const html = document.documentElement;
    html.setAttribute('data-cfth-init', 'true');
    html.setAttribute('data-cfth-enabled', currentSettings.enabled ? 'true' : 'false');
    html.setAttribute('data-cfth-mode', currentSettings.mode);
    html.setAttribute('data-cfth-keep-rating', currentSettings.keepRating ? 'true' : 'false');
    html.setAttribute('data-cfth-hide-problemset', currentSettings.hideInProblemset ? 'true' : 'false');
    html.setAttribute('data-cfth-revealed', isRevealed ? 'true' : 'false');
  }

  // Load saved settings
  function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        if (chrome.runtime.lastError) {
          // Fallback to local
          if (chrome.storage.local) {
            chrome.storage.local.get(DEFAULT_SETTINGS, (localItems) => {
              currentSettings = { ...DEFAULT_SETTINGS, ...localItems };
              applyHtmlAttributes();
              if (callback) callback();
            });
            return;
          }
        }
        currentSettings = { ...DEFAULT_SETTINGS, ...items };
        applyHtmlAttributes();
        if (callback) callback();
      });
    } else {
      applyHtmlAttributes();
      if (callback) callback();
    }
  }

  // Apply default attributes immediately to prevent flicker
  applyHtmlAttributes();
  loadSettings(() => {
    setupPageUI();
  });

  // Listen for storage changes from the extension popup
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      let changed = false;
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (changes[key]) {
          currentSettings[key] = changes[key].newValue;
          changed = true;
        }
      }
      if (changed) {
        applyHtmlAttributes();
        updateUI();
      }
    });
  }

  // Helper to find Problem Tags box in sidebar
  function findProblemTagsBox() {
    const sideboxes = document.querySelectorAll('#sidebar .sidebox, .sidebox');
    for (const box of sideboxes) {
      if (box.querySelector('.tag-box')) {
        return box;
      }
      const caption = box.querySelector('.caption');
      if (caption && /problem tags|теги задачи/i.test(caption.textContent)) {
        return box;
      }
    }
    return null;
  }

  // Annotate tag elements and their outer roundbox wrappers
  function annotateTags(box) {
    const tags = box.querySelectorAll('.tag-box');
    tags.forEach((tag) => {
      const text = tag.textContent.trim();
      const title = (tag.getAttribute('title') || '').toLowerCase();
      const isRating = text.startsWith('*') || title.includes('difficult') || title.includes('сложност');
      const tagType = isRating ? 'rating' : 'topic';

      tag.setAttribute('data-cfth-type', tagType);
      const wrapper = tag.closest('.roundbox');
      if (wrapper && wrapper !== box) {
        wrapper.setAttribute('data-cfth-type', tagType);
      }
    });
  }

  // Toggle reveal state
  function toggleReveal(forceState) {
    if (typeof forceState === 'boolean') {
      isRevealed = forceState;
    } else {
      isRevealed = !isRevealed;
    }
    document.documentElement.setAttribute('data-cfth-revealed', isRevealed ? 'true' : 'false');
    updateUI();
  }

  // Inject or update the UI in the Problem Tags box
  function setupPageUI() {
    const box = findProblemTagsBox();
    if (!box) return;

    // Annotate tags for fast styling
    annotateTags(box);

    // 1. Inject Toggle button in caption .top-links
    const caption = box.querySelector('.caption');
    if (caption) {
      let topLinks = caption.querySelector('.top-links');
      if (!topLinks) {
        topLinks = document.createElement('div');
        topLinks.className = 'top-links';
        caption.appendChild(topLinks);
      }

      let btn = topLinks.querySelector('.cfth-top-btn');
      if (!btn) {
        btn = document.createElement('a');
        btn.href = '#';
        btn.setAttribute('role', 'button');
        btn.className = 'cfth-top-btn';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleReveal();
        });
        topLinks.insertBefore(btn, topLinks.firstChild);
      }
    }

    // 2. Inject spoiler placeholder inside the tag container
    const contentDiv = box.querySelector('div[style*="padding"]') || box.querySelector('.tag-box')?.closest('div');
    if (contentDiv) {
      let spoilerBox = contentDiv.querySelector('.cfth-spoiler-box');
      if (!spoilerBox) {
        spoilerBox = document.createElement('div');
        spoilerBox.className = 'cfth-spoiler-box';
        spoilerBox.innerHTML = `
          <button type="button" class="cfth-spoiler-btn">
            <span>👁️</span> <span>Reveal Problem Tags</span>
          </button>
          <span class="cfth-spoiler-hint">Hidden by Tag Hider extension</span>
        `;

        const spoilerBtn = spoilerBox.querySelector('.cfth-spoiler-btn');
        if (spoilerBtn) {
          spoilerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleReveal(true);
          });
        }

        // Insert before notice or at end of tag list
        const noticeDiv = contentDiv.querySelector('div[style*="clear:both"], div[style*="clear: both"]');
        if (noticeDiv) {
          contentDiv.insertBefore(spoilerBox, noticeDiv);
        } else {
          contentDiv.appendChild(spoilerBox);
        }
      }
    }

    updateUI();
  }

  // Update UI text and visibility according to current state
  function updateUI() {
    const box = findProblemTagsBox();
    if (!box) return;

    annotateTags(box);

    const btn = box.querySelector('.cfth-top-btn');
    if (btn) {
      if (!currentSettings.enabled) {
        btn.style.display = 'none';
      } else {
        btn.style.display = 'inline-flex';
        if (isRevealed) {
          btn.classList.add('revealed');
          btn.innerHTML = '<span>🙈</span> <span>Hide Tags</span>';
          btn.title = 'Click to hide problem tags';
        } else {
          btn.classList.remove('revealed');
          btn.innerHTML = '<span>👁️</span> <span>Show Tags</span>';
          btn.title = 'Click to reveal problem tags';
        }
      }
    }

    const spoilerBox = box.querySelector('.cfth-spoiler-box');
    if (spoilerBox) {
      if (
        currentSettings.enabled &&
        currentSettings.mode === 'spoiler' &&
        !isRevealed
      ) {
        spoilerBox.style.display = 'block';
      } else {
        spoilerBox.style.display = 'none';
      }
    }
  }

  // Initialize once DOM is accessible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPageUI);
  } else {
    setupPageUI();
  }

  // MutationObserver to handle late-rendered elements or dynamic navigation
  const observer = new MutationObserver((mutations) => {
    const box = findProblemTagsBox();
    if (box) {
      if (!box.querySelector('.cfth-top-btn') || !box.querySelector('.cfth-spoiler-box') || !box.querySelector('[data-cfth-type]')) {
        setupPageUI();
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
