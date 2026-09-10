import { CameraEngine } from './modules/camera/cameraEngine.js';
import { FrameRenderer } from './modules/canvas/frameRenderer.js';
import { JournalStore } from './modules/storage/journalStore.js';
import { CloudinaryUploader } from './modules/storage/cloudinaryUploader.js';
import { AuthManager } from './modules/auth/authManager.js';
import { ASPECT_RATIOS, DEFAULT_ASPECT_RATIO } from './constants/aspectRatios.js';
import { NATURE_FILTERS, DEFAULT_FILTER_ID } from './constants/filters.js';
import { NATURE_FRAMES, DEFAULT_FRAME_ID } from './constants/frames.js';
import { NATURE_CATEGORIES, DEFAULT_CATEGORY_ID } from './constants/categories.js';





// DOM Elements - Camera
const videoElement = document.getElementById('camera-video');
const previewImage = document.getElementById('preview-image');
const viewfinderFrame = document.getElementById('viewfinder-frame');
const captureBar = document.getElementById('capture-bar');
const reviewPanel = document.getElementById('review-panel');
const reviewCategories = document.getElementById('review-categories');
const inputCaption = document.getElementById('input-caption');
const cameraHud = document.getElementById('camera-hud');
const cameraGrid = document.getElementById('camera-grid');
const filterCarousel = document.getElementById('filter-carousel');
const btnCapture = document.getElementById('btn-capture');
const btnRetake = document.getElementById('btn-retake');
const btnSave = document.getElementById('btn-save');
const btnFlip = document.getElementById('btn-flip');
const btnGridToggle = document.getElementById('btn-grid-toggle');
const btnAspect = document.getElementById('btn-aspect');
const btnFrame = document.getElementById('btn-frame');
const errorScreen = document.getElementById('error-screen');
const errorMessage = document.getElementById('error-message');
const btnRetry = document.getElementById('btn-retry');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

// DOM Elements - Journal & Inspector
const btnOpenJournal = document.getElementById('btn-open-journal');
const journalView = document.getElementById('journal-view');
const btnCloseJournal = document.getElementById('btn-close-journal');
const journalCategories = document.getElementById('journal-categories');
const observationsGrid = document.getElementById('observations-grid');
const emptyJournalMsg = document.getElementById('empty-journal-msg');
const detailModal = document.getElementById('detail-modal');
const btnCloseDetail = document.getElementById('btn-close-detail');
const detailImage = document.getElementById('detail-image');
const detailDate = document.getElementById('detail-date');
const detailCategoryLabel = document.getElementById('detail-category-label');
const detailSpecs = document.getElementById('detail-specs');
const detailCaption = document.getElementById('detail-caption');
const btnDeleteEntry = document.getElementById('btn-delete-entry');
const btnCloudSync = document.getElementById('btn-cloud-sync');
const syncIcon = document.getElementById('sync-icon');
const syncStatus = document.getElementById('sync-status');

// DOM Elements - Authentication
const btnAuthStatus = document.getElementById('btn-auth-status');
const authStatusIcon = document.getElementById('auth-status-icon');
const authStatusText = document.getElementById('auth-status-text');
const authModal = document.getElementById('auth-modal');
const btnCloseAuth = document.getElementById('btn-close-auth');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const btnToggleAuthMode = document.getElementById('btn-toggle-auth-mode');
const authTogglePrompt = document.getElementById('auth-toggle-prompt');
const authProfileView = document.getElementById('auth-profile-view');
const profileEmail = document.getElementById('profile-email');
const btnLogout = document.getElementById('btn-logout');

let authMode = 'login'; // 'login' or 'register'
let currentUser = null;



const camera = new CameraEngine(videoElement);

let currentRatioKey = DEFAULT_ASPECT_RATIO;
let activeFilterId = DEFAULT_FILTER_ID;
let activeFrameId = DEFAULT_FRAME_ID;
let selectedCaptureCategory = DEFAULT_CATEGORY_ID;
let currentPhotoBlob = null;
let currentPhotoUrl = null;
let toastTimeout = null;

// Journal State
let activeGalleryCategory = 'all';
let allObservations = [];
let activeInspectionRecord = null;
let createdGalleryUrls = [];

function showToast(message, duration = 2200) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function renderFilterCarousel() {
  filterCarousel.innerHTML = '';
  NATURE_FILTERS.forEach((profile) => {
    const pill = document.createElement('button');
    pill.className = `filter-pill ${profile.id === activeFilterId ? 'active' : ''}`;
    pill.textContent = profile.label;
    pill.dataset.filterId = profile.id;
    pill.addEventListener('click', () => applyFilter(profile.id));
    filterCarousel.appendChild(pill);
  });
}

function applyFilter(filterId) {
  const profile = NATURE_FILTERS.find((f) => f.id === filterId) || NATURE_FILTERS[0];
  activeFilterId = profile.id;
  videoElement.style.filter = profile.filter;
  camera.setFilter(profile.filter);

  const pills = filterCarousel.querySelectorAll('.filter-pill');
  pills.forEach((p) => {
    p.classList.toggle('active', p.dataset.filterId === activeFilterId);
  });
}

function applyAspectRatio(key) {
  const config = ASPECT_RATIOS[key];
  if (!config) return;

  Object.values(ASPECT_RATIOS).forEach((ratio) => {
    viewfinderFrame.classList.remove(ratio.cssClass);
  });
  viewfinderFrame.classList.add(config.cssClass);

  btnAspect.textContent = config.label;
  camera.setAspectRatio(config);
  currentRatioKey = key;
}

function cycleAspectRatio() {
  const keys = Object.keys(ASPECT_RATIOS);
  const nextIndex = (keys.indexOf(currentRatioKey) + 1) % keys.length;
  applyAspectRatio(keys[nextIndex]);
}

function applyFrame(frameKey) {
  const config = NATURE_FRAMES[frameKey] || NATURE_FRAMES.none;

  Object.values(NATURE_FRAMES).forEach((f) => {
    viewfinderFrame.classList.remove(f.cssClass);
  });
  viewfinderFrame.classList.add(config.cssClass);

  btnFrame.textContent = config.label;
  activeFrameId = config.id;
}

function cycleFrame() {
  const keys = Object.keys(NATURE_FRAMES);
  const nextIndex = (keys.indexOf(activeFrameId) + 1) % keys.length;
  applyFrame(keys[nextIndex]);
}

function updatePreviewMirror() {
  if (camera.facingMode === 'user') {
    videoElement.classList.add('mirror-preview');
  } else {
    videoElement.classList.remove('mirror-preview');
  }
}

function renderReviewCategories() {
  reviewCategories.innerHTML = '';
  NATURE_CATEGORIES.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = `category-chip ${cat.id === selectedCaptureCategory ? 'active' : ''}`;
    chip.textContent = `${cat.icon} ${cat.label}`;
    chip.dataset.categoryId = cat.id;

    chip.addEventListener('click', () => {
      selectedCaptureCategory = cat.id;
      reviewCategories.querySelectorAll('.category-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.categoryId === selectedCaptureCategory);
      });
    });

    reviewCategories.appendChild(chip);
  });
}

function setViewMode(mode) {
  if (mode === 'live') {
    previewImage.classList.add('hidden');
    videoElement.classList.remove('hidden');
    captureBar.classList.remove('hidden');
    filterCarousel.classList.remove('hidden');
    cameraHud.classList.remove('hidden');
    reviewPanel.classList.add('hidden');

    inputCaption.value = '';

    if (currentPhotoUrl) {
      URL.revokeObjectURL(currentPhotoUrl);
      currentPhotoUrl = null;
      currentPhotoBlob = null;
    }
  } else if (mode === 'review') {
    videoElement.classList.add('hidden');
    previewImage.classList.remove('hidden');
    captureBar.classList.add('hidden');
    filterCarousel.classList.add('hidden');
    cameraHud.classList.add('hidden');
    reviewPanel.classList.remove('hidden');

    renderReviewCategories();
  }
}

// ---------------- JOURNAL & GALLERY LOGIC ----------------

function cleanupGalleryUrls() {
  createdGalleryUrls.forEach((url) => URL.revokeObjectURL(url));
  createdGalleryUrls = [];
}

function renderJournalCategories() {
  journalCategories.innerHTML = '';

  const allPill = document.createElement('button');
  allPill.className = `cat-pill ${activeGalleryCategory === 'all' ? 'active' : ''}`;
  allPill.textContent = 'All Moments';
  allPill.addEventListener('click', () => {
    activeGalleryCategory = 'all';
    renderJournalCategories();
    renderJournalGrid();
  });
  journalCategories.appendChild(allPill);

  NATURE_CATEGORIES.forEach((cat) => {
    const pill = document.createElement('button');
    pill.className = `cat-pill ${activeGalleryCategory === cat.id ? 'active' : ''}`;
    pill.textContent = `${cat.icon} ${cat.label}`;
    pill.addEventListener('click', () => {
      activeGalleryCategory = cat.id;
      renderJournalCategories();
      renderJournalGrid();
    });
    journalCategories.appendChild(pill);
  });
}

function renderJournalGrid() {
  cleanupGalleryUrls();
  observationsGrid.innerHTML = '';

  const filtered = activeGalleryCategory === 'all'
    ? allObservations
    : allObservations.filter((obs) => obs.category === activeGalleryCategory);

  if (filtered.length === 0) {
    emptyJournalMsg.classList.remove('hidden');
    return;
  }

  emptyJournalMsg.classList.add('hidden');

  filtered.forEach((obs) => {
    const card = document.createElement('article');
    card.className = 'obs-card';

    const thumbUrl = URL.createObjectURL(obs.photoBlob);
    createdGalleryUrls.push(thumbUrl);

    const formattedTime = new Date(obs.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const categoryConfig = NATURE_CATEGORIES.find((c) => c.id === obs.category);
    const catIcon = categoryConfig ? categoryConfig.icon : '🌿';

    card.innerHTML = `
      <div class="obs-thumbnail-wrap">
        <img src="${thumbUrl}" alt="Nature observation" loading="lazy" />
      </div>
      <div class="obs-meta">
        <span class="obs-meta-time">${formattedTime}</span>
        <span class="obs-meta-category">${catIcon}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      // Push history state when opening detail inspection
      history.pushState({ modal: 'detail' }, '');
      openDetailModal(obs, thumbUrl);
    });
    observationsGrid.appendChild(card);
  });
}

async function openJournalUI() {
  try {
    allObservations = await JournalStore.getAllObservations();
    renderJournalCategories();
    renderJournalGrid();
    journalView.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to open journal:', err);
  }
}

function closeJournalUI() {
  journalView.classList.add('hidden');
  cleanupGalleryUrls();
}

function openDetailModal(record, thumbUrl) {
  activeInspectionRecord = record;
  detailImage.src = thumbUrl;

  detailDate.textContent = new Date(record.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const category = NATURE_CATEGORIES.find((c) => c.id === record.category);
  detailCategoryLabel.textContent = `${category ? category.icon : '🌿'} ${category ? category.label : 'Observation'}`;
  detailSpecs.textContent = `${record.aspectRatio || '4:3'} • ${record.filter || 'natural'} • ${record.frame || 'raw'}`;

  if (record.caption && record.caption.trim().length > 0) {
    detailCaption.textContent = `“${record.caption}”`;
    detailCaption.classList.remove('hidden');
  } else {
    detailCaption.classList.add('hidden');
  }

  // Update Cloud Sync Button state
  if (record.cloudUrl) {
    btnCloudSync.classList.add('synced');
    syncIcon.textContent = '✓';
    syncStatus.textContent = 'Backed up on Cloud';
    btnCloudSync.disabled = true;
  } else {
    btnCloudSync.classList.remove('synced');
    syncIcon.textContent = '☁️';
    syncStatus.textContent = 'Backup to Cloud';
    btnCloudSync.disabled = false;
  }

  detailModal.classList.remove('hidden');
}


function closeDetailModalUI() {
  detailModal.classList.add('hidden');
  activeInspectionRecord = null;
  detailImage.src = '';
}

// ---------------- ANDROID BACK BUTTON ROUTER ----------------

window.addEventListener('popstate', () => {
  // If the detail inspector is visible, close it
  if (!detailModal.classList.contains('hidden')) {
    closeDetailModalUI();
    return;
  }

  // If the field journal is open, close it
  if (!journalView.classList.contains('hidden')) {
    closeJournalUI();
    return;
  }

  // If we are currently reviewing a captured photo, discard and return to live camera
  if (!reviewPanel.classList.contains('hidden')) {
    setViewMode('live');
    return;
  }
});

// Explicit UI buttons delegate to native history back
btnCloseDetail.addEventListener('click', () => history.back());
btnCloseJournal.addEventListener('click', () => history.back());
btnRetake.addEventListener('click', () => history.back());

btnOpenJournal.addEventListener('click', () => {
  history.pushState({ modal: 'journal' }, '');
  openJournalUI();
});

// ---------------- INITIALIZATION & CAMERA ----------------

async function initCamera() {
  errorScreen.classList.add('hidden');
  try {
    renderFilterCarousel();
    applyFilter(DEFAULT_FILTER_ID);
    applyAspectRatio(DEFAULT_ASPECT_RATIO);
    applyFrame(DEFAULT_FRAME_ID);
    await camera.start();
    updatePreviewMirror();
    setViewMode('live');
  } catch (err) {
    showError(err);
  }
}

function showError(err) {
  errorScreen.classList.remove('hidden');
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    errorMessage.textContent = 'Camera permission denied. Allow access in Chrome site settings.';
  } else if (err.name === 'NotFoundError') {
    errorMessage.textContent = 'No camera sensor was detected on this device.';
  } else {
    errorMessage.textContent = `Camera error: ${err.message || 'Unable to open camera.'}`;
  }
}

// Pipeline: Capture -> Frame Compositing -> Blob -> Push History State
btnCapture.addEventListener('click', () => {
  try {
    const rawCanvas = camera.captureFrameCanvas();
    const framedCanvas = FrameRenderer.applyFrame(rawCanvas, activeFrameId);

    framedCanvas.toBlob((blob) => {
      currentPhotoBlob = blob;
      currentPhotoUrl = URL.createObjectURL(blob);
      previewImage.src = currentPhotoUrl;

      // Push history state so Android back gesture cancels the review instead of closing page
      history.pushState({ view: 'review' }, '');
      setViewMode('review');
    }, 'image/jpeg', 0.92);
  } catch (err) {
    console.error('Capture pipeline failed:', err);
  }
});

btnAspect.addEventListener('click', cycleAspectRatio);
btnFrame.addEventListener('click', cycleFrame);

btnFlip.addEventListener('click', async () => {
  btnFlip.disabled = true;
  try {
    await camera.flipCamera();
    updatePreviewMirror();
  } catch (err) {
    console.error('Failed to flip camera:', err);
    showToast(`Lens error: ${err.name || 'Sensor busy'}`, 3500);
  } finally {
    btnFlip.disabled = false;
  }
});


btnGridToggle.addEventListener('click', () => {
  const isHidden = cameraGrid.classList.toggle('hidden');
  btnGridToggle.classList.toggle('active', !isHidden);
});

// Save to IndexedDB & pop the review history state
btnSave.addEventListener('click', async () => {
  if (!currentPhotoBlob) return;
  btnSave.disabled = true;

  try {
    const captionNote = inputCaption.value.trim();

    await JournalStore.saveObservation({
      photoBlob: currentPhotoBlob,
      category: selectedCaptureCategory,
      caption: captionNote,
      filter: activeFilterId,
      aspectRatio: currentRatioKey,
      frame: activeFrameId,
      timestamp: Date.now()
    });

    const categoryObj = NATURE_CATEGORIES.find((c) => c.id === selectedCaptureCategory);
    showToast(`${categoryObj ? categoryObj.icon : '🌱'} Saved to Journal`);

    // Go back in history (which closes review mode via popstate)
    history.back();
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
    showToast('Storage error');
  } finally {
    btnSave.disabled = false;
  }
});

btnDeleteEntry.addEventListener('click', async () => {
  if (!activeInspectionRecord) return;

  try {
    await JournalStore.deleteObservation(activeInspectionRecord.id);
    history.back(); // Closes inspector via popstate
    showToast('Observation deleted');
    allObservations = await JournalStore.getAllObservations();
    renderJournalGrid();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('Failed to delete');
  }
});

// Upload local photo blob directly to Cloudinary
btnCloudSync.addEventListener('click', async () => {
  if (!activeInspectionRecord || !activeInspectionRecord.photoBlob) return;

  btnCloudSync.disabled = true;
  syncIcon.textContent = '⏳';
  syncStatus.textContent = 'Uploading...';

  try {
    const uploadResult = await CloudinaryUploader.uploadPhoto(activeInspectionRecord.photoBlob, [
      'nature-journal',
      activeInspectionRecord.category || 'general'
    ]);

    // Update local IndexedDB with the new cloud CDN data
    await JournalStore.updateObservationCloudData(activeInspectionRecord.id, uploadResult);
    activeInspectionRecord.cloudUrl = uploadResult.cloudUrl;
    activeInspectionRecord.publicId = uploadResult.publicId;

    btnCloudSync.classList.add('synced');
    syncIcon.textContent = '✓';
    syncStatus.textContent = 'Backed up on Cloud';
    showToast('Photo backed up to Cloud CDN!');
  } catch (err) {
    console.error('Cloud backup error:', err);
    btnCloudSync.disabled = false;
    syncIcon.textContent = '⚠️';
    syncStatus.textContent = 'Upload Failed';
    showToast(err.message || 'Upload failed');
  }
});


btnRetry.addEventListener('click', initCamera);

document.addEventListener('DOMContentLoaded', initCamera);

// ---------------- SERVICE WORKER & OFFLINE RESILIENCE ----------------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('🌿 Nature Camera Service Worker active:', reg.scope);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
}

// Listen for network connectivity shifts
window.addEventListener('offline', () => {
  showToast('Offline — Field Mode active', 3000);
});

window.addEventListener('online', () => {
  showToast('Connection restored', 2500);
});



function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    authStatusIcon.textContent = '🌿';
    authStatusText.textContent = user.email.split('@')[0];
    profileEmail.textContent = user.email;
    authForm.classList.add('hidden');
    authProfileView.classList.remove('hidden');
    authTitle.textContent = 'Observer Profile';
    authSubtitle.textContent = 'Account active & verified';
  } else {
    authStatusIcon.textContent = '👤';
    authStatusText.textContent = 'Sign In';
    authForm.classList.remove('hidden');
    authProfileView.classList.add('hidden');
    setAuthMode('login');
  }
}

function setAuthMode(mode) {
  authMode = mode;
  if (mode === 'register') {
    authTitle.textContent = 'Create Observer ID';
    authSubtitle.textContent = 'Join the quiet nature observation network';
    btnAuthSubmit.textContent = 'Create Account';
    authTogglePrompt.textContent = 'Already have an ID?';
    btnToggleAuthMode.textContent = 'Sign In';
  } else {
    authTitle.textContent = 'Observer Identity';
    authSubtitle.textContent = 'Sign in to sync observations to the cloud';
    btnAuthSubmit.textContent = 'Sign In';
    authTogglePrompt.textContent = "Don't have an account?";
    btnToggleAuthMode.textContent = 'Register';
  }
}

function openAuthModal() {
  history.pushState({ modal: 'auth' }, '');
  authModal.classList.remove('hidden');
}

function closeAuthModalUI() {
  authModal.classList.add('hidden');
  authEmail.value = '';
  authPassword.value = '';
}

btnToggleAuthMode.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

btnAuthStatus.addEventListener('click', openAuthModal);
btnCloseAuth.addEventListener('click', () => history.back());

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;

  btnAuthSubmit.disabled = true;
  btnAuthSubmit.textContent = 'Processing...';

  try {
    if (authMode === 'register') {
      await AuthManager.register(email, password);
      showToast('Observer account created!');
    } else {
      await AuthManager.login(email, password);
      showToast('Welcome back, observer');
    }
    history.back(); // Closes modal via popstate
  } catch (err) {
    console.error('Auth error:', err);
    showToast(err.message.replace('Firebase: ', ''));
  } finally {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.textContent = authMode === 'register' ? 'Create Account' : 'Sign In';
  }
});

btnLogout.addEventListener('click', async () => {
  try {
    await AuthManager.logout();
    history.back();
    showToast('Signed out');
  } catch (err) {
    showToast('Failed to sign out');
  }
});

// Update Android Back-Button handler to handle Auth Modal
window.addEventListener('popstate', () => {
  if (!authModal.classList.contains('hidden')) {
    closeAuthModalUI();
    return;
  }
  if (!detailModal.classList.contains('hidden')) {
    closeDetailModalUI();
    return;
  }
  if (!journalView.classList.contains('hidden')) {
    closeJournalUI();
    return;
  }
  if (!reviewPanel.classList.contains('hidden')) {
    setViewMode('live');
    return;
  }
});

// Subscribe to auth state on boot
AuthManager.onAuthStateChange((user) => {
  updateAuthUI(user);
});
