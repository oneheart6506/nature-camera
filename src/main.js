import { CameraEngine } from './modules/camera/cameraEngine.js';
import { FrameRenderer } from './modules/canvas/frameRenderer.js';
import { JournalStore } from './modules/storage/journalStore.js';
import { CloudinaryUploader } from './modules/storage/cloudinaryUploader.js';
import { CloudJournal } from './modules/storage/cloudJournal.js';
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
const tabPersonal = document.getElementById('tab-journal-personal');
const tabCommunity = document.getElementById('tab-journal-community');
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
const btnDetailAuthor = document.getElementById('btn-detail-author');
const detailAuthorName = document.getElementById('detail-author-name');
const btnCloudSync = document.getElementById('btn-cloud-sync');
const syncIcon = document.getElementById('sync-icon');
const syncStatus = document.getElementById('sync-status');
const btnPublishFeed = document.getElementById('btn-publish-feed');
const publishIcon = document.getElementById('publish-icon');
const publishText = document.getElementById('publish-text');
const btnDeleteEntry = document.getElementById('btn-delete-entry');

// DOM Elements - Folio Modal
const folioModal = document.getElementById('folio-modal');
const btnCloseFolio = document.getElementById('btn-close-folio');
const folioAuthorHandle = document.getElementById('folio-author-handle');
const folioObservationCount = document.getElementById('folio-observation-count');
const folioGrid = document.getElementById('folio-grid');

// DOM Elements - Auth
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

const camera = new CameraEngine(videoElement);

let currentRatioKey = DEFAULT_ASPECT_RATIO;
let activeFilterId = DEFAULT_FILTER_ID;
let activeFrameId = DEFAULT_FRAME_ID;
let selectedCaptureCategory = DEFAULT_CATEGORY_ID;
let currentPhotoBlob = null;
let currentPhotoUrl = null;
let toastTimeout = null;

// Journal, Feed, Folio & Auth State
let currentStreamMode = 'personal';
let activeGalleryCategory = 'all';
let allObservations = [];
let communityFeedItems = [];
let activeInspectionRecord = null;
let createdGalleryUrls = [];
let createdFolioUrls = [];
let authMode = 'login';
let currentUser = null;

function showToast(message, duration = 2200) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ---------------- CAMERA LOGIC ----------------

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

// ---------------- DUAL-STREAM JOURNAL & COMMUNITY FEED ----------------

function cleanupGalleryUrls() {
  createdGalleryUrls.forEach((url) => URL.revokeObjectURL(url));
  createdGalleryUrls = [];
}

function cleanupFolioUrls() {
  createdFolioUrls.forEach((url) => URL.revokeObjectURL(url));
  createdFolioUrls = [];
}

function renderJournalCategories() {
  journalCategories.innerHTML = '';

  const allPill = document.createElement('button');
  allPill.className = `cat-pill ${activeGalleryCategory === 'all' ? 'active' : ''}`;
  allPill.textContent = 'All Moments';
  allPill.addEventListener('click', () => {
    activeGalleryCategory = 'all';
    renderJournalCategories();
    renderStreamGrid();
  });
  journalCategories.appendChild(allPill);

  NATURE_CATEGORIES.forEach((cat) => {
    const pill = document.createElement('button');
    pill.className = `cat-pill ${activeGalleryCategory === cat.id ? 'active' : ''}`;
    pill.textContent = `${cat.icon} ${cat.label}`;
    pill.addEventListener('click', () => {
      activeGalleryCategory = cat.id;
      renderJournalCategories();
      renderStreamGrid();
    });
    journalCategories.appendChild(pill);
  });
}

function renderStreamGrid() {
  cleanupGalleryUrls();
  observationsGrid.innerHTML = '';

  const activeSource = currentStreamMode === 'personal' ? allObservations : communityFeedItems;

  const filtered = activeGalleryCategory === 'all'
    ? activeSource
    : activeSource.filter((obs) => obs.category === activeGalleryCategory);

  if (filtered.length === 0) {
    emptyJournalMsg.classList.remove('hidden');
    emptyJournalMsg.querySelector('p').innerHTML = currentStreamMode === 'personal'
      ? 'Your journal is quiet.<br />Step outside and observe something living.'
      : 'The community field is quiet.<br />Be the first to share an observation.';
    return;
  }

  emptyJournalMsg.classList.add('hidden');

  filtered.forEach((obs) => {
    const card = document.createElement('article');
    card.className = 'obs-card';

    let displayUrl = '';
    if (obs.photoBlob) {
      displayUrl = URL.createObjectURL(obs.photoBlob);
      createdGalleryUrls.push(displayUrl);
    } else if (obs.cloudUrl) {
      displayUrl = CloudinaryUploader.getOptimizedUrl(obs.cloudUrl, 320);
    }

    const timestampVal = obs.publishedAt ? obs.capturedAt : obs.timestamp;
    const formattedTime = new Date(timestampVal).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const categoryConfig = NATURE_CATEGORIES.find((c) => c.id === obs.category);
    const catIcon = categoryConfig ? categoryConfig.icon : '🌿';

    card.innerHTML = `
      <div class="obs-thumbnail-wrap">
        <img src="${displayUrl}" alt="Nature observation" loading="lazy" />
      </div>
      <div class="obs-meta">
        ${currentStreamMode === 'community' && obs.authorName ? `<span class="obs-meta-author" data-author-id="${obs.authorId}" data-author-name="${obs.authorName}">@${obs.authorName}</span>` : `<span class="obs-meta-time">${formattedTime}</span>`}
        <span class="obs-meta-category">${catIcon}</span>
      </div>
    `;

    // Direct tap on author handle in card
    const authorTag = card.querySelector('.obs-meta-author');
    if (authorTag) {
      authorTag.addEventListener('click', (e) => {
        e.stopPropagation();
        openObserverFolio(obs.authorId, obs.authorName);
      });
    }

    card.addEventListener('click', () => {
      history.pushState({ modal: 'detail' }, '');
      openDetailModal(obs, displayUrl);
    });
    observationsGrid.appendChild(card);
  });
}

async function setStreamMode(mode) {
  currentStreamMode = mode;
  tabPersonal.classList.toggle('active', mode === 'personal');
  tabCommunity.classList.toggle('active', mode === 'community');

  if (mode === 'community') {
    showToast('Consulting the field stream...');
    try {
      communityFeedItems = await CloudJournal.getPublicFeed();
    } catch (err) {
      showToast('Could not reach community feed');
    }
  }

  renderStreamGrid();
}

tabPersonal.addEventListener('click', () => setStreamMode('personal'));
tabCommunity.addEventListener('click', () => setStreamMode('community'));

async function openJournalUI() {
  try {
    allObservations = await JournalStore.getAllObservations();
    renderJournalCategories();
    renderStreamGrid();
    journalView.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to open journal:', err);
  }
}

function closeJournalUI() {
  journalView.classList.add('hidden');
  cleanupGalleryUrls();
}

function openDetailModal(record, displayUrl) {
  activeInspectionRecord = record;
  detailImage.src = record.cloudUrl || displayUrl;

  const timestampVal = record.capturedAt || record.timestamp;
  detailDate.textContent = new Date(timestampVal).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const category = NATURE_CATEGORIES.find((c) => c.id === record.category);
  detailCategoryLabel.textContent = `${category ? category.icon : '🌿'} ${category ? category.label : 'Observation'}`;
  detailSpecs.textContent = `${record.aspectRatio || '4:3'} • ${record.filter || 'natural'} • ${record.frame || 'raw'}`;

  // Interactive author button in detail view
  if (record.authorName && record.authorId) {
    detailAuthorName.textContent = `@${record.authorName}`;
    btnDetailAuthor.classList.remove('hidden');
    btnDetailAuthor.onclick = () => openObserverFolio(record.authorId, record.authorName);
  } else {
    btnDetailAuthor.classList.add('hidden');
  }

  if (record.caption && record.caption.trim().length > 0) {
    detailCaption.textContent = `“${record.caption}”`;
    detailCaption.classList.remove('hidden');
  } else {
    detailCaption.classList.add('hidden');
  }

  const isOwner = currentUser && (!record.authorId || record.authorId === currentUser.uid);

  if (isOwner) {
    btnDeleteEntry.classList.remove('hidden');
    btnCloudSync.classList.remove('hidden');

    if (record.syncedToFirestore && record.cloudUrl) {
      btnCloudSync.classList.add('synced');
      syncIcon.textContent = '✓';
      syncStatus.textContent = 'Synced to Cloud';
      btnCloudSync.disabled = true;

      btnPublishFeed.classList.remove('hidden');
      if (record.isPublic) {
        btnPublishFeed.classList.add('published');
        publishIcon.textContent = '🔒';
        publishText.textContent = 'Make Private';
      } else {
        btnPublishFeed.classList.remove('published');
        publishIcon.textContent = '🌍';
        publishText.textContent = 'Share to Field';
      }
    } else {
      btnCloudSync.classList.remove('synced');
      syncIcon.textContent = '☁️';
      syncStatus.textContent = record.cloudUrl ? 'Sync to Database' : 'Backup to Cloud';
      btnCloudSync.disabled = false;
      btnPublishFeed.classList.add('hidden');
    }
  } else {
    btnDeleteEntry.classList.add('hidden');
    btnCloudSync.classList.add('hidden');
    btnPublishFeed.classList.add('hidden');
  }

  detailModal.classList.remove('hidden');
}

function closeDetailModalUI() {
  detailModal.classList.add('hidden');
  activeInspectionRecord = null;
  detailImage.src = '';
}

// ---------------- NATURALIST FOLIO LOGIC ----------------

async function openObserverFolio(authorId, authorName) {
  history.pushState({ modal: 'folio' }, '');
  folioAuthorHandle.textContent = `@${authorName}`;
  folioObservationCount.textContent = 'Retrieving field notes...';
  folioGrid.innerHTML = '';
  cleanupFolioUrls();

  folioModal.classList.remove('hidden');

  try {
    const items = await CloudJournal.getObserverPublicFolio(authorId);
    folioObservationCount.textContent = `Field Notes: ${items.length} ${items.length === 1 ? 'moment' : 'moments'}`;

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'obs-card';

      const thumbUrl = CloudinaryUploader.getOptimizedUrl(item.cloudUrl, 320);
      const categoryConfig = NATURE_CATEGORIES.find((c) => c.id === item.category);
      const catIcon = categoryConfig ? categoryConfig.icon : '🌿';

      card.innerHTML = `
        <div class="obs-thumbnail-wrap">
          <img src="${thumbUrl}" alt="Nature observation" loading="lazy" />
        </div>
        <div class="obs-meta">
          <span class="obs-meta-time">${new Date(item.capturedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span class="obs-meta-category">${catIcon}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        history.pushState({ modal: 'detail' }, '');
        openDetailModal(item, thumbUrl);
      });

      folioGrid.appendChild(card);
    });
  } catch (err) {
    folioObservationCount.textContent = 'Could not load folio.';
    showToast('Failed to load observer notes');
  }
}

function closeFolioModalUI() {
  folioModal.classList.add('hidden');
  cleanupFolioUrls();
}

// ---------------- COMMUNITY PUBLISHING ----------------

btnPublishFeed.addEventListener('click', async () => {
  if (!activeInspectionRecord || !currentUser) return;

  btnPublishFeed.disabled = true;
  const targetPublicState = !activeInspectionRecord.isPublic;

  try {
    await CloudJournal.setPublicStatus(
      currentUser.uid,
      currentUser.email,
      activeInspectionRecord,
      targetPublicState
    );

    activeInspectionRecord.isPublic = targetPublicState;
    btnPublishFeed.classList.toggle('published', targetPublicState);
    publishIcon.textContent = targetPublicState ? '🔒' : '🌍';
    publishText.textContent = targetPublicState ? 'Make Private' : 'Share to Field';

    showToast(targetPublicState ? 'Published to The Wild!' : 'Retracted from public field');
  } catch (err) {
    showToast(`Publish error: ${err.message}`);
  } finally {
    btnPublishFeed.disabled = false;
  }
});

// ---------------- AUTH & SYNC ----------------

async function syncCloudObservationsToLocal(userId) {
  try {
    const cloudRecords = await CloudJournal.fetchUserObservations(userId);
    if (cloudRecords.length > 0) {
      await JournalStore.mergeCloudRecords(cloudRecords);
      allObservations = await JournalStore.getAllObservations();
      if (!journalView.classList.contains('hidden') && currentStreamMode === 'personal') {
        renderStreamGrid();
      }
      showToast(`Restored ${cloudRecords.length} moments from cloud`);
    }
  } catch (err) {
    console.warn('Could not sync cloud observations down:', err);
  }
}

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

    syncCloudObservationsToLocal(user.uid);
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

// ---------------- ANDROID BACK ROUTER ----------------

window.addEventListener('popstate', () => {
  // Check topmost modal in stack
  if (!folioModal.classList.contains('hidden')) {
    closeFolioModalUI();
    return;
  }
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

btnCloseDetail.addEventListener('click', () => history.back());
btnCloseJournal.addEventListener('click', () => history.back());
btnCloseFolio.addEventListener('click', () => history.back());
btnRetake.addEventListener('click', () => history.back());
btnCloseAuth.addEventListener('click', () => history.back());
btnAuthStatus.addEventListener('click', openAuthModal);

btnToggleAuthMode.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

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
    history.back();
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

btnOpenJournal.addEventListener('click', () => {
  history.pushState({ modal: 'journal' }, '');
  openJournalUI();
});

btnCloudSync.addEventListener('click', async () => {
  if (!activeInspectionRecord) return;

  const user = AuthManager.getCurrentUser();
  if (!user) {
    showToast('Please sign in first');
    openAuthModal();
    return;
  }

  btnCloudSync.disabled = true;

  try {
    let cloudUrl = activeInspectionRecord.cloudUrl;
    let publicId = activeInspectionRecord.publicId;

    if (!cloudUrl && activeInspectionRecord.photoBlob) {
      syncIcon.textContent = '⏳';
      syncStatus.textContent = 'Uploading image...';

      const uploadResult = await CloudinaryUploader.uploadPhoto(activeInspectionRecord.photoBlob, [
        'nature-journal',
        activeInspectionRecord.category || 'general'
      ]);
      cloudUrl = uploadResult.cloudUrl;
      publicId = uploadResult.publicId;

      await JournalStore.updateObservationCloudData(activeInspectionRecord.id, uploadResult);
      activeInspectionRecord.cloudUrl = cloudUrl;
      activeInspectionRecord.publicId = publicId;
    }

    syncIcon.textContent = '📡';
    syncStatus.textContent = 'Syncing...';

    await CloudJournal.syncObservation(user.uid, activeInspectionRecord);

    activeInspectionRecord.syncedToFirestore = true;
    btnCloudSync.classList.add('synced');
    syncIcon.textContent = '✓';
    syncStatus.textContent = 'Synced to Cloud';
    btnPublishFeed.classList.remove('hidden');
    showToast('Observation written to Firestore!');
  } catch (err) {
    console.error('Sync failed:', err);
    btnCloudSync.disabled = false;
    syncIcon.textContent = '⚠️';
    syncStatus.textContent = 'Sync Failed';
    showToast(`Error: ${err.message || 'Database write rejected'}`);
  }
});

btnDeleteEntry.addEventListener('click', async () => {
  if (!activeInspectionRecord) return;

  try {
    const user = AuthManager.getCurrentUser();
    if (user && activeInspectionRecord.syncedToFirestore) {
      await CloudJournal.deleteFromCloud(user.uid, activeInspectionRecord.id);
    }

    await JournalStore.deleteObservation(activeInspectionRecord.id);
    history.back();
    showToast('Observation deleted');
    allObservations = await JournalStore.getAllObservations();
    renderStreamGrid();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('Failed to delete');
  }
});

// ---------------- INITIALIZATION & HARDWARE ----------------

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

    const totalEntries = await JournalStore.getCount();
    if (totalEntries > 0) {
      showToast(`${totalEntries} observations in journal`);
    }
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

btnCapture.addEventListener('click', () => {
  try {
    const rawCanvas = camera.captureFrameCanvas();
    const framedCanvas = FrameRenderer.applyFrame(rawCanvas, activeFrameId);

    framedCanvas.toBlob((blob) => {
      currentPhotoBlob = blob;
      currentPhotoUrl = URL.createObjectURL(blob);
      previewImage.src = currentPhotoUrl;

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
    history.back();
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
    showToast('Storage error');
  } finally {
    btnSave.disabled = false;
  }
});

btnRetry.addEventListener('click', initCamera);

AuthManager.onAuthStateChange((user) => {
  updateAuthUI(user);
});

document.addEventListener('DOMContentLoaded', initCamera);

// ---------------- SERVICE WORKER ----------------

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

window.addEventListener('offline', () => {
  showToast('Offline — Field Mode active', 3000);
});

window.addEventListener('online', () => {
  showToast('Connection restored', 2500);
});
