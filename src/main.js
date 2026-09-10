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

// DOM Elements - Camera Viewfinder & HUD
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

// DOM Elements - Journal & Inspector Modal
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

// DOM Elements - Resonance / Dewdrop
const btnResonate = document.getElementById('btn-resonate');
const resonanceIcon = document.getElementById('resonance-icon');
const resonanceLabel = document.getElementById('resonance-label');

// DOM Elements - Naturalist Folio Modal
const folioModal = document.getElementById('folio-modal');
const btnCloseFolio = document.getElementById('btn-close-folio');
const folioAuthorHandle = document.getElementById('folio-author-handle');
const folioObservationCount = document.getElementById('folio-observation-count');
const folioGrid = document.getElementById('folio-grid');

// DOM Elements - Authentication Modal
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

const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');


// App State
const camera = new CameraEngine(videoElement);
let currentRatioKey = DEFAULT_ASPECT_RATIO;
let activeFilterId = DEFAULT_FILTER_ID;
let activeFrameId = DEFAULT_FRAME_ID;
let selectedCaptureCategory = DEFAULT_CATEGORY_ID;
let currentPhotoBlob = null;
let currentPhotoUrl = null;
let toastTimeout = null;

let currentStreamMode = 'personal';
let activeGalleryCategory = 'all';
let allObservations = [];
let communityFeedItems = [];
let activeInspectionRecord = null;
let createdGalleryUrls = [];
let createdFolioUrls = [];
let authMode = 'login';
let currentUser = null;

// ---------------- TOAST NOTIFICATION ----------------

function showToast(message, duration = 2200) {
  if (toastTimeout) clearTimeout(toastTimeout);
  if (toastMsg) toastMsg.textContent = message;
  if (toast) {
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

// ---------------- CAMERA ENGINE & FILTERS ----------------

function renderFilterCarousel() {
  if (!filterCarousel) return;

  filterCarousel.innerHTML = '';

  NATURE_FILTERS.forEach((profile) => {
    const pill = document.createElement('button');

    pill.className = `filter-pill ${
      profile.id === activeFilterId ? 'active' : ''
    }`;

    pill.textContent = profile.label;
    pill.dataset.filterId = profile.id;

    pill.addEventListener('click', () => {
      applyFilter(profile.id);
    });

    filterCarousel.appendChild(pill);
  });
}

function applyFilter(filterId) {
  const profile =
    NATURE_FILTERS.find((f) => f.id === filterId) ||
    NATURE_FILTERS[0];

  activeFilterId = profile.id;

  if (videoElement) {
    videoElement.style.filter = profile.filter;
  }

  camera.setFilter(profile.filter);

  if (filterCarousel) {
    const pills =
      filterCarousel.querySelectorAll('.filter-pill');

    pills.forEach((p) => {
      p.classList.toggle(
        'active',
        p.dataset.filterId === activeFilterId
      );
    });
  }
}

function applyAspectRatio(key) {
  const config = ASPECT_RATIOS[key];

  if (!config || !viewfinderFrame) return;

  Object.values(ASPECT_RATIOS).forEach((ratio) => {
    viewfinderFrame.classList.remove(ratio.cssClass);
  });

  viewfinderFrame.classList.add(config.cssClass);

  if (btnAspect) {
    btnAspect.textContent = config.label;
  }

  camera.setAspectRatio(config);
  currentRatioKey = key;
}

function cycleAspectRatio() {
  const keys = Object.keys(ASPECT_RATIOS);

  const nextIndex =
    (keys.indexOf(currentRatioKey) + 1) %
    keys.length;

  applyAspectRatio(keys[nextIndex]);
}

function applyFrame(frameKey) {
  const config =
    NATURE_FRAMES[frameKey] ||
    NATURE_FRAMES.none;

  if (!viewfinderFrame) return;

  Object.values(NATURE_FRAMES).forEach((f) => {
    viewfinderFrame.classList.remove(f.cssClass);
  });

  viewfinderFrame.classList.add(config.cssClass);

  if (btnFrame) {
    btnFrame.textContent = config.label;
  }

  activeFrameId = config.id;
}

function cycleFrame() {
  const keys = Object.keys(NATURE_FRAMES);

  const nextIndex =
    (keys.indexOf(activeFrameId) + 1) %
    keys.length;

  applyFrame(keys[nextIndex]);
}

function updatePreviewMirror() {
  if (!videoElement) return;

  if (camera.facingMode === 'user') {
    videoElement.classList.add('mirror-preview');
  } else {
    videoElement.classList.remove('mirror-preview');
  }
}

function renderReviewCategories() {
  if (!reviewCategories) return;

  reviewCategories.innerHTML = '';

  NATURE_CATEGORIES.forEach((cat) => {
    const chip = document.createElement('button');

    chip.className = `category-chip ${
      cat.id === selectedCaptureCategory
        ? 'active'
        : ''
    }`;

    chip.textContent = `${cat.icon} ${cat.label}`;
    chip.dataset.categoryId = cat.id;

    chip.addEventListener('click', () => {
      selectedCaptureCategory = cat.id;

      reviewCategories
        .querySelectorAll('.category-chip')
        .forEach((c) => {
          c.classList.toggle(
            'active',
            c.dataset.categoryId ===
              selectedCaptureCategory
          );
        });
    });

    reviewCategories.appendChild(chip);
  });
}

function setViewMode(mode) {
  if (mode === 'live') {
    previewImage?.classList.add('hidden');
    videoElement?.classList.remove('hidden');
    captureBar?.classList.remove('hidden');
    filterCarousel?.classList.remove('hidden');
    cameraHud?.classList.remove('hidden');
    reviewPanel?.classList.add('hidden');

    if (inputCaption) {
      inputCaption.value = '';
    }

    if (currentPhotoUrl) {
      URL.revokeObjectURL(currentPhotoUrl);
      currentPhotoUrl = null;
      currentPhotoBlob = null;
    }

  } else if (mode === 'review') {
    videoElement?.classList.add('hidden');
    previewImage?.classList.remove('hidden');
    captureBar?.classList.add('hidden');
    filterCarousel?.classList.add('hidden');
    cameraHud?.classList.add('hidden');
    reviewPanel?.classList.remove('hidden');

    renderReviewCategories();
  }
}

// ---------------- MEMORY MANAGEMENT ----------------

function cleanupGalleryUrls() {
  createdGalleryUrls.forEach((url) => {
    URL.revokeObjectURL(url);
  });

  createdGalleryUrls = [];
}

function cleanupFolioUrls() {
  createdFolioUrls.forEach((url) => {
    URL.revokeObjectURL(url);
  });

  createdFolioUrls = [];
}

// ---------------- DUAL-STREAM JOURNAL & THE WILD ----------------

function renderJournalCategories() {
  if (!journalCategories) return;

  journalCategories.innerHTML = '';

  const allPill =
    document.createElement('button');

  allPill.className = `cat-pill ${
    activeGalleryCategory === 'all'
      ? 'active'
      : ''
  }`;

  allPill.textContent = 'All Moments';

  allPill.addEventListener('click', () => {
    activeGalleryCategory = 'all';
    renderJournalCategories();
    renderStreamGrid();
  });

  journalCategories.appendChild(allPill);

  NATURE_CATEGORIES.forEach((cat) => {
    const pill =
      document.createElement('button');

    pill.className = `cat-pill ${
      activeGalleryCategory === cat.id
        ? 'active'
        : ''
    }`;

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

  if (!observationsGrid) return;

  observationsGrid.innerHTML = '';

  const activeSource =
    currentStreamMode === 'personal'
      ? allObservations
      : communityFeedItems;

  const filtered =
    activeGalleryCategory === 'all'
      ? activeSource
      : activeSource.filter(
          (obs) =>
            obs.category ===
            activeGalleryCategory
        );

  if (filtered.length === 0) {
    if (emptyJournalMsg) {
      emptyJournalMsg.classList.remove('hidden');

      const paragraph =
        emptyJournalMsg.querySelector('p');

      if (paragraph) {
        paragraph.innerHTML =
          currentStreamMode === 'personal'
            ? 'Your journal is quiet.<br />Step outside and observe something living.'
            : 'The community field is quiet.<br />Be the first to share an observation.';
      }
    }

    return;
  }

  emptyJournalMsg?.classList.add('hidden');

  filtered.forEach((obs) => {
    const card =
      document.createElement('article');

    card.className = 'obs-card';

    let displayUrl = '';

    if (obs.photoBlob) {
      displayUrl =
        URL.createObjectURL(obs.photoBlob);

      createdGalleryUrls.push(displayUrl);

    } else if (obs.cloudUrl) {
      displayUrl =
        CloudinaryUploader.getOptimizedUrl(
          obs.cloudUrl,
          320
        );
    }

    const timestampVal =
      obs.capturedAt ||
      obs.timestamp ||
      Date.now();

    const formattedTime =
      new Date(
        timestampVal
      ).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

    const categoryConfig =
      NATURE_CATEGORIES.find(
        (c) => c.id === obs.category
      );

    const catIcon =
      categoryConfig
        ? categoryConfig.icon
        : '🌿';

    card.innerHTML = `
      <div class="obs-thumbnail-wrap">
        <img
          src="${displayUrl}"
          alt="Nature observation"
          loading="lazy"
        />
      </div>

      <div class="obs-meta">
        ${
          currentStreamMode === 'community' &&
          obs.authorName
            ? `<span class="obs-meta-author">@${obs.authorName}</span>`
            : `<span class="obs-meta-time">${formattedTime}</span>`
        }

        <span class="obs-meta-category">
          ${catIcon}
        </span>
      </div>
    `;

    const authorTag =
      card.querySelector(
        '.obs-meta-author'
      );

    if (authorTag && obs.authorId) {
      authorTag.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();

          openObserverFolio(
            obs.authorId,
            obs.authorName
          );
        }
      );
    }

    card.addEventListener('click', () => {
      history.pushState(
        { modal: 'detail' },
        ''
      );

      openDetailModal(
        obs,
        displayUrl
      );
    });

    observationsGrid.appendChild(card);
  });
}

async function setStreamMode(mode) {
  currentStreamMode = mode;

  tabPersonal?.classList.toggle(
    'active',
    mode === 'personal'
  );

  tabCommunity?.classList.toggle(
    'active',
    mode === 'community'
  );

  if (mode === 'community') {
    showToast(
      'Consulting the field stream...'
    );

    try {
      communityFeedItems =
        await CloudJournal.getPublicFeed();
    } catch (err) {
      showToast(
        'Could not reach community feed'
      );
    }
  }

  renderStreamGrid();
}

tabPersonal?.addEventListener(
  'click',
  () => setStreamMode('personal')
);

tabCommunity?.addEventListener(
  'click',
  () => setStreamMode('community')
);

async function openJournalUI() {
  try {
    allObservations =
      await JournalStore.getAllObservations();

    renderJournalCategories();
    renderStreamGrid();

    journalView?.classList.remove(
      'hidden'
    );

  } catch (err) {
    console.error(
      'Failed to open journal:',
      err
    );
  }
}

function closeJournalUI() {
  journalView?.classList.add('hidden');
  cleanupGalleryUrls();
}

// ---------------- DETAIL INSPECTION MODAL ----------------

function openDetailModal(
  record,
  displayUrl
) {
  activeInspectionRecord = record;

  if (detailImage) {
    detailImage.src =
      record.cloudUrl ||
      displayUrl;
  }

  const timestampVal =
    record.capturedAt ||
    record.timestamp ||
    Date.now();

  if (detailDate) {
    detailDate.textContent =
      new Date(
        timestampVal
      ).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
  }

  const category =
    NATURE_CATEGORIES.find(
      (c) => c.id === record.category
    );

  if (detailCategoryLabel) {
    detailCategoryLabel.textContent =
      `${category ? category.icon : '🌿'} ${
        category
          ? category.label
          : 'Observation'
      }`;
  }

  if (detailSpecs) {
    detailSpecs.textContent =
      `${record.aspectRatio || '4:3'} • ${
        record.filter || 'natural'
      } • ${record.frame || 'raw'}`;
  }

  // Interactive author pill
  if (
    record.authorName &&
    record.authorId &&
    btnDetailAuthor &&
    detailAuthorName
  ) {
    detailAuthorName.textContent =
      `@${record.authorName}`;

    btnDetailAuthor.classList.remove(
      'hidden'
    );

    btnDetailAuthor.onclick = () =>
      openObserverFolio(
        record.authorId,
        record.authorName
      );

  } else {
    btnDetailAuthor?.classList.add(
      'hidden'
    );
  }

  if (detailCaption) {
    if (
      record.caption &&
      record.caption.trim().length > 0
    ) {
      detailCaption.textContent =
        `“${record.caption}”`;

      detailCaption.classList.remove(
        'hidden'
      );

    } else {
      detailCaption.classList.add(
        'hidden'
      );
    }
  }

  const isOwner =
    currentUser &&
    (
      !record.authorId ||
      record.authorId === currentUser.uid
    );

  const isAlreadySynced =
    Boolean(
      record.syncedToFirestore ||
      record.cloudUrl
    );

  // Set isPublic explicitly on activeInspectionRecord
  const isAlreadyPublic =
    Boolean(
      record.isPublic ||
      record.publishedAt
    );

  activeInspectionRecord.isPublic =
    isAlreadyPublic;

  // Resonance is available on public observations when signed in
  if (
    isAlreadyPublic &&
    currentUser
  ) {
    btnResonate?.classList.remove(
      'hidden'
    );

    const hasResonated =
      Array.isArray(
        record.resonances
      ) &&
      record.resonances.includes(
        currentUser.uid
      );

    btnResonate?.classList.toggle(
      'resonated',
      hasResonated
    );

    if (resonanceIcon) {
      resonanceIcon.textContent =
        hasResonated
          ? '✨'
          : '💧';
    }

    if (resonanceLabel) {
      resonanceLabel.textContent =
        hasResonated
          ? 'Resonated'
          : 'Resonate';
    }

  } else {
    btnResonate?.classList.add(
      'hidden'
    );
  }

  if (isOwner) {
    btnDeleteEntry?.classList.remove(
      'hidden'
    );

    btnCloudSync?.classList.remove(
      'hidden'
    );

    if (
      isAlreadySynced &&
      record.cloudUrl
    ) {
      btnCloudSync?.classList.add(
        'synced'
      );

      if (syncIcon) {
        syncIcon.textContent = '✓';
      }

      if (syncStatus) {
        syncStatus.textContent =
          'Synced to Cloud';
      }

      if (btnCloudSync) {
        btnCloudSync.disabled = true;
      }

      btnPublishFeed?.classList.remove(
        'hidden'
      );

      if (isAlreadyPublic) {
        btnPublishFeed?.classList.add(
          'published'
        );

        if (publishIcon) {
          publishIcon.textContent = '🔒';
        }

        if (publishText) {
          publishText.textContent =
            'Make Private';
        }

      } else {
        btnPublishFeed?.classList.remove(
          'published'
        );

        if (publishIcon) {
          publishIcon.textContent = '🌍';
        }

        if (publishText) {
          publishText.textContent =
            'Share to Field';
        }
      }

    } else {
      btnCloudSync?.classList.remove(
        'synced'
      );

      if (syncIcon) {
        syncIcon.textContent = '☁️';
      }

      if (syncStatus) {
        syncStatus.textContent =
          'Backup to Cloud';
      }

      if (btnCloudSync) {
        btnCloudSync.disabled = false;
      }

      btnPublishFeed?.classList.add(
        'hidden'
      );
    }

  } else {
    btnDeleteEntry?.classList.add(
      'hidden'
    );

    btnCloudSync?.classList.add(
      'hidden'
    );

    btnPublishFeed?.classList.add(
      'hidden'
    );
  }

  detailModal?.classList.remove(
    'hidden'
  );
}

function closeDetailModalUI() {
  detailModal?.classList.add(
    'hidden'
  );

  activeInspectionRecord = null;

  // Reset resonance UI for the next observation
  btnResonate?.classList.add(
    'hidden'
  );

  btnResonate?.classList.remove(
    'resonated'
  );

  if (resonanceIcon) {
    resonanceIcon.textContent = '💧';
  }

  if (resonanceLabel) {
    resonanceLabel.textContent =
      'Resonate';
  }

  if (detailImage) {
    detailImage.src = '';
  }
}

// ---------------- OBSERVER FOLIO ----------------

async function openObserverFolio(
  authorId,
  authorName
) {
  history.pushState(
    { modal: 'folio' },
    ''
  );

  if (folioAuthorHandle) {
    folioAuthorHandle.textContent =
      `@${authorName}`;
  }

  if (folioObservationCount) {
    folioObservationCount.textContent =
      'Retrieving field notes...';
  }

  if (folioGrid) {
    folioGrid.innerHTML = '';
  }

  cleanupFolioUrls();

  folioModal?.classList.remove(
    'hidden'
  );

  try {
    const items =
      await CloudJournal
        .getObserverPublicFolio(
          authorId
        );

    if (folioObservationCount) {
      folioObservationCount.textContent =
        `Field Notes: ${items.length} ${
          items.length === 1
            ? 'moment'
            : 'moments'
        }`;
    }

    if (folioGrid) {
      items.forEach((item) => {
        const card =
          document.createElement(
            'article'
          );

        card.className = 'obs-card';

        const thumbUrl =
          CloudinaryUploader
            .getOptimizedUrl(
              item.cloudUrl,
              320
            );

        const categoryConfig =
          NATURE_CATEGORIES.find(
            (c) =>
              c.id === item.category
          );

        const catIcon =
          categoryConfig
            ? categoryConfig.icon
            : '🌿';

        const itemTime =
          item.capturedAt ||
          item.timestamp ||
          Date.now();

        card.innerHTML = `
          <div class="obs-thumbnail-wrap">
            <img
              src="${thumbUrl}"
              alt="Nature observation"
              loading="lazy"
            />
          </div>

          <div class="obs-meta">
            <span class="obs-meta-time">
              ${new Date(
                itemTime
              ).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric'
                }
              )}
            </span>

            <span class="obs-meta-category">
              ${catIcon}
            </span>
          </div>
        `;

        card.addEventListener(
          'click',
          () => {
            history.pushState(
              { modal: 'detail' },
              ''
            );

            openDetailModal(
              item,
              thumbUrl
            );
          }
        );

        folioGrid.appendChild(card);
      });
    }

  } catch (err) {
    if (folioObservationCount) {
      folioObservationCount.textContent =
        'Could not load folio.';
    }

    showToast(
      'Failed to load observer notes'
    );
  }
}

function closeFolioModalUI() {
  folioModal?.classList.add(
    'hidden'
  );

  cleanupFolioUrls();
}

// ---------------- COMMUNITY PUBLISHING ----------------

btnPublishFeed?.addEventListener(
  'click',
  async () => {
    if (
      !activeInspectionRecord ||
      !currentUser
    ) {
      return;
    }

    btnPublishFeed.disabled = true;

    // Determine current state accurately
    const isCurrentlyPublic =
      Boolean(
        activeInspectionRecord.isPublic ||
        activeInspectionRecord.publishedAt
      );

    const targetPublicState =
      !isCurrentlyPublic;

    try {
      // 1. Sync to Cloud Firestore
      // Creates or deletes from public_observations
      await CloudJournal.setPublicStatus(
        currentUser.uid,
        currentUser.email,
        activeInspectionRecord,
        targetPublicState
      );

      // 2. Persist to local IndexedDB
      await JournalStore.updateObservationPublicStatus(
        activeInspectionRecord.id,
        targetPublicState
      );

      // 3. Update active memory references
      activeInspectionRecord.isPublic =
        targetPublicState;

      if (!targetPublicState) {
        delete activeInspectionRecord.publishedAt;

        // Remove from The Wild list in memory immediately
        communityFeedItems =
          communityFeedItems.filter(
            (item) =>
              item.id !==
              activeInspectionRecord.id
          );
      }

      const localMatch =
        allObservations.find(
          (o) =>
            o.id ===
            activeInspectionRecord.id
        );

      if (localMatch) {
        localMatch.isPublic =
          targetPublicState;
      }

      // 4. Update button UI
      btnPublishFeed.classList.toggle(
        'published',
        targetPublicState
      );

      if (publishIcon) {
        publishIcon.textContent =
          targetPublicState
            ? '🔒'
            : '🌍';
      }

      if (publishText) {
        publishText.textContent =
          targetPublicState
            ? 'Make Private'
            : 'Share to Field';
      }

      showToast(
        targetPublicState
          ? 'Published to The Wild!'
          : 'Retracted from public field'
      );

      // Refresh grid if currently viewing community feed
      if (
        currentStreamMode ===
          'community' &&
        !targetPublicState
      ) {
        renderStreamGrid();
      }

    } catch (err) {
      console.error(
        'Publish error:',
        err
      );

      showToast(
        `Publish error: ${err.message}`
      );

    } finally {
      btnPublishFeed.disabled = false;
    }
  }
);

// ---------------- AUTHENTICATION & RECONCILIATION ----------------

async function syncCloudObservationsToLocal(
  userId
) {
  try {
    const cloudRecords =
      await CloudJournal
        .fetchUserObservations(
          userId
        );

    if (cloudRecords.length > 0) {
      await JournalStore.mergeCloudRecords(
        cloudRecords
      );

      allObservations =
        await JournalStore
          .getAllObservations();

      if (
        journalView &&
        !journalView.classList.contains(
          'hidden'
        ) &&
        currentStreamMode ===
          'personal'
      ) {
        renderStreamGrid();
      }

      showToast(
        `Restored ${cloudRecords.length} moments from cloud`
      );
    }

  } catch (err) {
    console.warn(
      'Could not sync cloud observations down:',
      err
    );
  }
}

function updateAuthUI(user) {
  currentUser = user;

  if (user) {
    if (authStatusIcon) {
      authStatusIcon.textContent = '🌿';
    }

    if (authStatusText) {
      authStatusText.textContent =
        user.email.split('@')[0];
    }

    if (profileEmail) {
      profileEmail.textContent =
        user.email;
    }

    authForm?.classList.add(
      'hidden'
    );

    authProfileView?.classList.remove(
      'hidden'
    );

    if (authTitle) {
      authTitle.textContent =
        'Observer Profile';
    }

    if (authSubtitle) {
      authSubtitle.textContent =
        'Account active & verified';
    }

    syncCloudObservationsToLocal(
      user.uid
    );

  } else {
    if (authStatusIcon) {
      authStatusIcon.textContent = '👤';
    }

    if (authStatusText) {
      authStatusText.textContent =
        'Sign In';
    }

    authForm?.classList.remove(
      'hidden'
    );

    authProfileView?.classList.add(
      'hidden'
    );

    setAuthMode('login');
  }
}

function setAuthMode(mode) {
  authMode = mode;

  if (mode === 'register') {
    if (authTitle) {
      authTitle.textContent =
        'Create Observer ID';
    }

    if (authSubtitle) {
      authSubtitle.textContent =
        'Join the quiet nature observation network';
    }

    if (btnAuthSubmit) {
      btnAuthSubmit.textContent =
        'Create Account';
    }

    if (authTogglePrompt) {
      authTogglePrompt.textContent =
        'Already have an ID?';
    }

    if (btnToggleAuthMode) {
      btnToggleAuthMode.textContent =
        'Sign In';
    }

  } else {
    if (authTitle) {
      authTitle.textContent =
        'Observer Identity';
    }

    if (authSubtitle) {
      authSubtitle.textContent =
        'Sign in to sync observations to the cloud';
    }

    if (btnAuthSubmit) {
      btnAuthSubmit.textContent =
        'Sign In';
    }

    if (authTogglePrompt) {
      authTogglePrompt.textContent =
        "Don't have an account?";
    }

    if (btnToggleAuthMode) {
      btnToggleAuthMode.textContent =
        'Register';
    }
  }
}

function openAuthModal() {
  history.pushState(
    { modal: 'auth' },
    ''
  );

  authModal?.classList.remove(
    'hidden'
  );
}

function closeAuthModalUI() {
  authModal?.classList.add(
    'hidden'
  );

  if (authEmail) {
    authEmail.value = '';
  }

  if (authPassword) {
    authPassword.value = '';
  }
}

// ---------------- ANDROID HARDWARE BACK ROUTER ----------------

window.addEventListener(
  'popstate',
  () => {
    if (
      folioModal &&
      !folioModal.classList.contains(
        'hidden'
      )
    ) {
      closeFolioModalUI();
      return;
    }

    if (
      authModal &&
      !authModal.classList.contains(
        'hidden'
      )
    ) {
      closeAuthModalUI();
      return;
    }

    if (
      detailModal &&
      !detailModal.classList.contains(
        'hidden'
      )
    ) {
      closeDetailModalUI();
      return;
    }

    if (
      journalView &&
      !journalView.classList.contains(
        'hidden'
      )
    ) {
      closeJournalUI();
      return;
    }

    if (
      reviewPanel &&
      !reviewPanel.classList.contains(
        'hidden'
      )
    ) {
      setViewMode('live');
      return;
    }
  }
);

btnCloseDetail?.addEventListener(
  'click',
  () => history.back()
);

btnCloseJournal?.addEventListener(
  'click',
  () => history.back()
);

btnCloseFolio?.addEventListener(
  'click',
  () => history.back()
);

btnRetake?.addEventListener(
  'click',
  () => history.back()
);

btnCloseAuth?.addEventListener(
  'click',
  () => history.back()
);

btnAuthStatus?.addEventListener(
  'click',
  openAuthModal
);

btnToggleAuthMode?.addEventListener(
  'click',
  () => {
    setAuthMode(
      authMode === 'login'
        ? 'register'
        : 'login'
    );
  }
);

authForm?.addEventListener(
  'submit',
  async (e) => {
    e.preventDefault();

    const email =
      authEmail?.value.trim();

    const password =
      authPassword?.value;

    if (!email || !password) {
      return;
    }

    btnAuthSubmit.disabled = true;
    btnAuthSubmit.textContent =
      'Processing...';

    try {
      if (
        authMode ===
        'register'
      ) {
        await AuthManager.register(
          email,
          password
        );

        showToast(
          'Observer account created!'
        );

      } else {
        await AuthManager.login(
          email,
          password
        );

        showToast(
          'Welcome back, observer'
        );
      }

      history.back();

    } catch (err) {
      console.error(
        'Auth error:',
        err
      );

      showToast(
        err.message.replace(
          'Firebase: ',
          ''
        )
      );

    } finally {
      btnAuthSubmit.disabled =
        false;

      btnAuthSubmit.textContent =
        authMode === 'register'
          ? 'Create Account'
          : 'Sign In';
    }
  }
);

btnLogout?.addEventListener(
  'click',
  async () => {
    try {
      await AuthManager.logout();

      history.back();

      showToast(
        'Signed out'
      );

    } catch (err) {
      showToast(
        'Failed to sign out'
      );
    }
  }
);

btnOpenJournal?.addEventListener(
  'click',
  () => {
    history.pushState(
      { modal: 'journal' },
      ''
    );

    openJournalUI();
  }
);

// ---------------- RESONANCE / DEWDROP ----------------

btnResonate?.addEventListener(
  'click',
  async () => {
    if (
      !activeInspectionRecord ||
      !currentUser
    ) {
      return;
    }

    btnResonate.disabled = true;

    const currentList =
      activeInspectionRecord.resonances ||
      [];

    const alreadyResonated =
      currentList.includes(
        currentUser.uid
      );

    try {
      const nextState =
        await CloudJournal.toggleResonance(
          activeInspectionRecord.id,
          currentUser.uid,
          alreadyResonated
        );

      // Optimistic memory update
      if (nextState) {
        activeInspectionRecord.resonances = [
          ...currentList,
          currentUser.uid
        ];

      } else {
        activeInspectionRecord.resonances =
          currentList.filter(
            (id) =>
              id !==
              currentUser.uid
          );
      }

      btnResonate.classList.toggle(
        'resonated',
        nextState
      );

      if (resonanceIcon) {
        resonanceIcon.textContent =
          nextState
            ? '✨'
            : '💧';
      }

      if (resonanceLabel) {
        resonanceLabel.textContent =
          nextState
            ? 'Resonated'
            : 'Resonate';
      }

      showToast(
        nextState
          ? 'Left a dewdrop in the field'
          : 'Retracted resonance'
      );

    } catch (err) {
      console.error(
        'Resonance error:',
        err
      );

      showToast(
        'Could not resonate'
      );

    } finally {
      btnResonate.disabled =
        false;
    }
  }
);

// ---------------- DUAL CLOUD SYNC ----------------

btnCloudSync?.addEventListener(
  'click',
  async () => {
    if (!activeInspectionRecord) {
      return;
    }

    const user =
      AuthManager.getCurrentUser();

    if (!user) {
      showToast(
        'Please sign in first'
      );

      openAuthModal();
      return;
    }

    btnCloudSync.disabled =
      true;

    try {
      let cloudUrl =
        activeInspectionRecord.cloudUrl;

      let publicId =
        activeInspectionRecord.publicId;

      if (
        !cloudUrl &&
        activeInspectionRecord.photoBlob
      ) {
        if (syncIcon) {
          syncIcon.textContent =
            '⏳';
        }

        if (syncStatus) {
          syncStatus.textContent =
            'Uploading image...';
        }

        const uploadResult =
          await CloudinaryUploader
            .uploadPhoto(
              activeInspectionRecord.photoBlob,
              [
                'nature-journal',
                activeInspectionRecord.category ||
                  'general'
              ]
            );

        cloudUrl =
          uploadResult.cloudUrl;

        publicId =
          uploadResult.publicId;

        await JournalStore
          .updateObservationCloudData(
            activeInspectionRecord.id,
            uploadResult
          );

        activeInspectionRecord.cloudUrl =
          cloudUrl;

        activeInspectionRecord.publicId =
          publicId;
      }

      if (syncIcon) {
        syncIcon.textContent =
          '📡';
      }

      if (syncStatus) {
        syncStatus.textContent =
          'Syncing...';
      }

      // Safely assign capture time to prevent Firestore undefined error
      activeInspectionRecord.capturedAt =
        activeInspectionRecord.capturedAt ||
        activeInspectionRecord.timestamp ||
        Date.now();

      await CloudJournal.syncObservation(
        user.uid,
        activeInspectionRecord
      );

      activeInspectionRecord.syncedToFirestore =
        true;

      btnCloudSync.classList.add(
        'synced'
      );

      if (syncIcon) {
        syncIcon.textContent =
          '✓';
      }

      if (syncStatus) {
        syncStatus.textContent =
          'Synced to Cloud';
      }

      btnPublishFeed?.classList.remove(
        'hidden'
      );

      showToast(
        'Observation written to Firestore!'
      );

    } catch (err) {
      console.error(
        'Sync failed:',
        err
      );

      btnCloudSync.disabled =
        false;

      if (syncIcon) {
        syncIcon.textContent =
          '⚠️';
      }

      if (syncStatus) {
        syncStatus.textContent =
          'Sync Failed';
      }

      showToast(
        `Error: ${
          err.message ||
          'Database write rejected'
        }`
      );
    }
  }
);

// ---------------- OBSERVATION DELETION ----------------

btnDeleteEntry?.addEventListener(
  'click',
  async () => {
    if (!activeInspectionRecord) {
      return;
    }

    btnDeleteEntry.disabled =
      true;

    try {
      const user =
        AuthManager.getCurrentUser();

      const isCloudRecord =
        Boolean(
          activeInspectionRecord.syncedToFirestore ||
          activeInspectionRecord.cloudUrl ||
          (
            activeInspectionRecord.authorId &&
            user &&
            activeInspectionRecord.authorId ===
              user.uid
          )
        );

      if (
        user &&
        isCloudRecord
      ) {
        await CloudJournal
          .deleteFromCloud(
            user.uid,
            activeInspectionRecord.id
          );
      }

      await JournalStore
        .deleteObservation(
          activeInspectionRecord.id
        );

      allObservations =
        allObservations.filter(
          (o) =>
            o.id !==
            activeInspectionRecord.id
        );

      communityFeedItems =
        communityFeedItems.filter(
          (o) =>
            o.id !==
            activeInspectionRecord.id
        );

      history.back();

      showToast(
        'Observation deleted'
      );

      renderStreamGrid();

    } catch (err) {
      console.error(
        'Delete failed:',
        err
      );

      showToast(
        `Delete failed: ${
          err.message || 'Error'
        }`
      );

    } finally {
      btnDeleteEntry.disabled =
        false;
    }
  }
);

// ---------------- INITIALIZATION & HARDWARE ----------------

async function initCamera() {
  errorScreen?.classList.add(
    'hidden'
  );

  try {
    renderFilterCarousel();

    applyFilter(
      DEFAULT_FILTER_ID
    );

    applyAspectRatio(
      DEFAULT_ASPECT_RATIO
    );

    applyFrame(
      DEFAULT_FRAME_ID
    );

    await camera.start();

    updatePreviewMirror();

    setViewMode('live');

    const totalEntries =
      await JournalStore.getCount();

    if (totalEntries > 0) {
      showToast(
        `${totalEntries} observations in journal`
      );
    }

  } catch (err) {
    showError(err);
  }
}

function showError(err) {
  errorScreen?.classList.remove(
    'hidden'
  );

  if (!errorMessage) {
    return;
  }

  if (
    err.name ===
      'NotAllowedError' ||
    err.name ===
      'PermissionDeniedError'
  ) {
    errorMessage.textContent =
      'Camera permission denied. Allow access in Chrome site settings.';

  } else if (
    err.name ===
    'NotFoundError'
  ) {
    errorMessage.textContent =
      'No camera sensor was detected on this device.';

  } else {
    errorMessage.textContent =
      `Camera error: ${
        err.message ||
        'Unable to open camera.'
      }`;
  }
}

// ---------------- CAPTURE & SAVE PIPELINE ----------------

btnCapture?.addEventListener(
  'click',
  () => {
    try {
      const rawCanvas =
        camera.captureFrameCanvas();

      const framedCanvas =
        FrameRenderer.applyFrame(
          rawCanvas,
          activeFrameId
        );

      framedCanvas.toBlob(
        (blob) => {
          currentPhotoBlob =
            blob;

          currentPhotoUrl =
            URL.createObjectURL(
              blob
            );

          if (previewImage) {
            previewImage.src =
              currentPhotoUrl;
          }

          history.pushState(
            { view: 'review' },
            ''
          );

          setViewMode(
            'review'
          );
        },
        'image/jpeg',
        0.92
      );

    } catch (err) {
      console.error(
        'Capture pipeline failed:',
        err
      );
    }
  }
);

btnAspect?.addEventListener(
  'click',
  cycleAspectRatio
);

btnFrame?.addEventListener(
  'click',
  cycleFrame
);

btnFlip?.addEventListener(
  'click',
  async () => {
    btnFlip.disabled = true;

    try {
      await camera.flipCamera();

      updatePreviewMirror();

    } catch (err) {
      console.error(
        'Failed to flip camera:',
        err
      );

      showToast(
        `Lens error: ${
          err.name ||
          'Sensor busy'
        }`,
        3500
      );

    } finally {
      btnFlip.disabled =
        false;
    }
  }
);

btnGridToggle?.addEventListener(
  'click',
  () => {
    if (!cameraGrid) return;

    const isHidden =
      cameraGrid.classList.toggle(
        'hidden'
      );

    btnGridToggle?.classList.toggle(
      'active',
      !isHidden
    );
  }
);

btnSave?.addEventListener(
  'click',
  async () => {
    if (!currentPhotoBlob) {
      return;
    }

    btnSave.disabled = true;

    try {
      const captionNote =
        inputCaption
          ? inputCaption.value.trim()
          : '';

      await JournalStore.saveObservation(
        {
          photoBlob:
            currentPhotoBlob,

          category:
            selectedCaptureCategory,

          caption:
            captionNote,

          filter:
            activeFilterId,

          aspectRatio:
            currentRatioKey,

          frame:
            activeFrameId,

          timestamp:
            Date.now()
        }
      );

      const categoryObj =
        NATURE_CATEGORIES.find(
          (c) =>
            c.id ===
            selectedCaptureCategory
        );

      showToast(
        `${
          categoryObj
            ? categoryObj.icon
            : '🌱'
        } Saved to Journal`
      );

      history.back();

    } catch (err) {
      console.error(
        'Failed to save to IndexedDB:',
        err
      );

      showToast(
        'Storage error'
      );

    } finally {
      btnSave.disabled =
        false;
    }
  }
);

btnRetry?.addEventListener(
  'click',
  initCamera
);

AuthManager.onAuthStateChange(
  (user) => {
    updateAuthUI(user);
  }
);

// Bulletproof boot: handles both fresh load and cached Service Worker state
if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    initCamera
  );
} else {
  initCamera();
}

// ---------------- SERVICE WORKER ----------------

/*if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('🌿 Nature Camera Service Worker active:', reg.scope);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
}*/

window.addEventListener(
  'offline',
  () => {
    showToast(
      'Offline — Field Mode active',
      3000
    );
  }
);

window.addEventListener(
  'online',
  () => {
    showToast(
      'Connection restored',
      2500
    );
  }
);


// ---------------- ATMOSPHERIC NATURE THEMES ----------------

const THEMES = [
  { id: 'dark', icon: '🌲', label: 'Obsidian Forest' },
  { id: 'light', icon: '📜', label: 'Botanical Paper' },
  { id: 'sunset', icon: '🌅', label: 'Golden Sunset' },
  { id: 'cloudy', icon: '☁️', label: 'Alpine Mist' },
  { id: 'dusk', icon: '🌌', label: 'Twilight Canopy' }
];

let currentThemeIndex = 0;

function applyTheme(themeId, notify = true) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  currentThemeIndex = THEMES.indexOf(theme);
  localStorage.setItem('nature_theme', theme.id);

  if (themeIcon) themeIcon.textContent = theme.icon;
  if (notify) showToast(`${theme.icon} ${theme.label}`);
}

function cycleTheme() {
  const nextIndex = (currentThemeIndex + 1) % THEMES.length;
  applyTheme(THEMES[nextIndex].id, true);
}

btnThemeToggle?.addEventListener('click', cycleTheme);

// Load persisted theme on boot
const savedTheme = localStorage.getItem('nature_theme') || 'dark';
applyTheme(savedTheme, false);
