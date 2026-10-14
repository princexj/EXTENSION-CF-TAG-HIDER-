/**
 * Codeforces Problem Tag Hider - Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_SETTINGS = {
    enabled: true,
    mode: 'spoiler',
    keepRating: true,
    hideInProblemset: true
  };

  const toggleEnabled = document.getElementById('toggle-enabled');
  const modeRadios = document.querySelectorAll('input[name="display-mode"]');
  const checkKeepRating = document.getElementById('check-keep-rating');
  const checkHideProblemset = document.getElementById('check-hide-problemset');
  const controlsBody = document.getElementById('controls-body');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  function updateModeCardStyles(selectedMode) {
    document.querySelectorAll('.mode-option').forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && radio.value === selectedMode) {
        card.classList.add('selected');
        radio.checked = true;
      } else {
        card.classList.remove('selected');
      }
    });
  }

  function updateStatusUI(enabled) {
    if (enabled) {
      statusDot.classList.remove('disabled');
      statusText.textContent = 'Active on Codeforces';
      controlsBody.style.opacity = '1';
      controlsBody.style.pointerEvents = 'auto';
    } else {
      statusDot.classList.add('disabled');
      statusText.textContent = 'Disabled';
      controlsBody.style.opacity = '0.5';
      controlsBody.style.pointerEvents = 'none';
    }
  }

  function saveSettings(settingsToSave) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(settingsToSave, () => {
        if (chrome.runtime.lastError && chrome.storage.local) {
          chrome.storage.local.set(settingsToSave);
        }
      });
    }
  }

  // Load existing settings
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const storageArea = chrome.storage.sync || chrome.storage.local;
    storageArea.get(DEFAULT_SETTINGS, (items) => {
      const settings = { ...DEFAULT_SETTINGS, ...items };

      toggleEnabled.checked = settings.enabled;
      checkKeepRating.checked = settings.keepRating;
      checkHideProblemset.checked = settings.hideInProblemset;

      updateModeCardStyles(settings.mode);
      updateStatusUI(settings.enabled);
    });
  }

  // Master switch
  toggleEnabled.addEventListener('change', () => {
    const enabled = toggleEnabled.checked;
    updateStatusUI(enabled);
    saveSettings({ enabled });
  });

  // Display mode
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        updateModeCardStyles(radio.value);
        saveSettings({ mode: radio.value });
      }
    });
  });

  // Mode option cards click handler
  document.querySelectorAll('.mode-option').forEach((card) => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        updateModeCardStyles(radio.value);
        saveSettings({ mode: radio.value });
      }
    });
  });

  // Keep rating checkbox
  checkKeepRating.addEventListener('change', () => {
    saveSettings({ keepRating: checkKeepRating.checked });
  });

  // Problemset table checkbox
  checkHideProblemset.addEventListener('change', () => {
    saveSettings({ hideInProblemset: checkHideProblemset.checked });
  });
});
