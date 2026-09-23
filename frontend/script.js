// ── CONFIGURATION & API DATA PIPELINES ─────────────────────────────
const POSTS_API = "/api/posts";
const QUOTE_API = "/api/quote";
const CONTACT_API = "/api/contact";

const SYSTEM_ADMIN_PIN = "1234";
const AVAILABLE_EMOJIS = ["☕", "📓", "🌿", "🌸", "✨", "🪴", "🍵", "📷", "🌙", "🎨", "🌊", "🧁"];

let activeFilterCategory = "all";
let chosenFormEmoji = "☕";
let draftQuoteText = "";

let loadedInMemoryPosts = [];
let loadedInMemoryLikes = {};

// INITIALIZE USER LIKES STORAGE SNAPSHOT REGISTRY ON BOOT
try {
  const userLikesSnapshot = localStorage.getItem("ans_likes_v3");
  if (userLikesSnapshot) {
    loadedInMemoryLikes = JSON.parse(userLikesSnapshot);
  }
} catch (error) {
  console.error("Local user authorization parsing error state:", error);
  loadedInMemoryLikes = {};
}

// PULL RECORDS FROM SERVER ON APP BOOT
async function synchronizeFromDatabase() {
  try {
    const response = await fetch(POSTS_API);
    if (!response.ok) throw new Error("Could not parse file from storage pipe.");
    loadedInMemoryPosts = await response.json();
  } catch (error) {
    console.error("Database connection failure context:", error);
    triggerSystemToastFeedback("⚠️ Could not connect to JSON database.");
  }
  renderHomePageFeatured();
}

// UPDATE PHYSICAL DATABASE THROUGH API PIPE
async function flushMutationsToDatabaseFile() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loadedInMemoryPosts)
    });
    if (!response.ok) throw new Error("Server write request rejected.");
  } catch (error) {
    console.error("Write execution error tracing down to file system:", error);
    triggerSystemToastFeedback("❌ Failed saving changes to JSON database.");
  }
}

// ── NAVIGATION MANAGEMENT ───────────────────────────────────────────
function navigateTo(targetPageName) {
  document.querySelectorAll(".page-view").forEach((v) => v.classList.remove("active"));
  const viewElement = document.getElementById(`page-${targetPageName}`);
  if (viewElement) viewElement.classList.add("active");

  document.querySelectorAll(".nav-links .nav-item").forEach((l) => l.classList.remove("active"));
  const navLink = document.getElementById(`nav-${targetPageName}`);
  if (navLink) navLink.classList.add("active");

  if (targetPageName === "home") renderHomePageFeatured();
  if (targetPageName === "blogs") renderArchiveListingView();
  if (targetPageName === "author") evaluateAuthorViewState();

  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.navigateTo = navigateTo;

// ── UI INJECT TEMPLATE COMPONENT ──────────────────────────────────
function buildPostCardElementMarkup(post, currentOriginView) {
  const isLikedByUser = !!loadedInMemoryLikes[post.id];
  return `
    <div class="blog-hover-card" onclick="launchSinglePostView(${post.id})">
      <div class="card-graphics-header">${post.emoji || "🌿"}</div>
      <div class="card-main-body">
        <span class="pill-tag">${post.tag}</span>
        <h3>${post.title}</h3>
        <p class="card-excerpt-text">${post.excerpt}</p>
        <div class="card-meta-row">
          <span class="card-date-lbl">${post.date}</span>
          <button class="card-like-interaction ${isLikedByUser ? "active-state" : ""}" onclick="processLikeAction(event, ${post.id}, '${currentOriginView}')">
            <span>${isLikedByUser ? "❤️" : "🤍"}</span> ${post.likes}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── VIEWS DYNAMIC RENDERING ────────────────────────────────────────
function renderHomePageFeatured() {
  const targetGrid = document.getElementById("featuredGrid");
  if (!targetGrid) return;

  const visibleFeatured = loadedInMemoryPosts.filter((p) => !p.isArchived).slice(0, 3);
  if (visibleFeatured.length === 0) {
    targetGrid.innerHTML = `<div class="empty-state-card" style="grid-column:1/-1; padding: 2rem; text-align: center; color: var(--warm-gray);"><span>✨ No active logs recorded in database.</span></div>`;
    return;
  }
  targetGrid.innerHTML = visibleFeatured.map((post) => buildPostCardElementMarkup(post, 'home')).join("");
}

// RENDER ARCHIVE LISTINGS
function renderArchiveListingView() {
  const stripElement = document.getElementById("blogCategoryStrip");
  const uniqueTags = ["all", ...new Set(loadedInMemoryPosts.map((p) => p.tag).filter(Boolean))];

  if (stripElement) {
    stripElement.innerHTML = uniqueTags.map((tag) => `
      <button class="category-filter-pill ${tag === activeFilterCategory ? "active" : ""}" onclick="switchCategoryFilter('${tag}')">
        ${tag}
      </button>
    `).join("");
  }
  executeMainBlogGridRender();
}

function switchCategoryFilter(targetTag) {
  activeFilterCategory = targetTag;
  renderArchiveListingView();
}
window.switchCategoryFilter = switchCategoryFilter;

function handleSearch() { executeMainBlogGridRender(); }
window.handleSearch = handleSearch;

function executeMainBlogGridRender() {
  const gridContainer = document.getElementById("mainBlogGrid");
  const emptyStateNotice = document.getElementById("blogsEmptyState");
  const searchString = document.getElementById("blogSearchInput")?.value.toLowerCase() || "";

  if (!gridContainer) return;

  const renderingSet = loadedInMemoryPosts.filter((post) => {
    if (post.isArchived) return false;
    const matchesCategory = activeFilterCategory === "all" || post.tag === activeFilterCategory;
    const matchesSearch = !searchString || post.title.toLowerCase().includes(searchString) || post.tag.toLowerCase().includes(searchString);
    return matchesCategory && matchesSearch;
  });

  if (renderingSet.length === 0) {
    gridContainer.innerHTML = "";
    if (emptyStateNotice) emptyStateNotice.style.display = "block";
    return;
  }

  if (emptyStateNotice) emptyStateNotice.style.display = "none";
  gridContainer.innerHTML = renderingSet.map((post) => buildPostCardElementMarkup(post, 'blogs')).join("");
}

// PERSISTENT MUTATION LIKE PROTECTION SYSTEM
async function processLikeAction(eventInstance, targetPostId, conceptualOriginView) {
  eventInstance.stopPropagation();
  const targetDataNode = loadedInMemoryPosts.find((p) => p.id === targetPostId);
  if (!targetDataNode) return;

  if (loadedInMemoryLikes[targetPostId]) {
    targetDataNode.likes = Math.max(0, targetDataNode.likes - 1);
    delete loadedInMemoryLikes[targetPostId];
  } else {
    targetDataNode.likes++;
    loadedInMemoryLikes[targetPostId] = true;
  }

  localStorage.setItem("ans_likes_v3", JSON.stringify(loadedInMemoryLikes));
  await flushMutationsToDatabaseFile();

  if (conceptualOriginView === "home") renderHomePageFeatured();
  if (conceptualOriginView === "blogs") executeMainBlogGridRender();
  if (conceptualOriginView === "single") displaySinglePostLayout(targetPostId);
}
window.processLikeAction = processLikeAction;

function launchSinglePostView(postId) {
  navigateTo("post-view");
  displaySinglePostLayout(postId);
}
window.launchSinglePostView = launchSinglePostView;

function displaySinglePostLayout(postId) {
  const targetElement = document.getElementById("activePostTarget");
  if (!targetElement) return;

  const targetDataNode = loadedInMemoryPosts.find((p) => p.id === postId);
  if (!targetDataNode) {
    targetElement.innerHTML = `<p>Blog entry execution failed or was completely purged.</p>`;
    return;
  }

  const userHasLiked = !!loadedInMemoryLikes[postId];
  targetElement.innerHTML = `
    <span class="pill-tag">${targetDataNode.tag}</span>
    <h1 class="rendered-article-title">${targetDataNode.title}</h1>
    <div class="rendered-article-body">
      ${transformTextToBasicMarkdownHTML(targetDataNode.content)}
    </div>
    <div class="article-action-footer-row" style="margin-top:2.5rem; border-top:1px solid var(--border); padding-top:1.5rem;">
      <button class="action-submit-btn ${userHasLiked ? "active-state" : ""}" style="width:auto; background:${userHasLiked ? 'var(--lavender-mid)':'var(--text)'}" onclick="processLikeAction(event, ${targetDataNode.id}, 'single')">
        <span>${userHasLiked ? "❤️ Liked" : "🤍 Like note"}</span> (${targetDataNode.likes})
      </button>
    </div>
  `;
}

function transformTextToBasicMarkdownHTML(text) {
  if (!text) return "";
  return text.split("\n").map((row) => {
    const clean = row.trim();
    if (clean.startsWith("## ")) return `<h2>${clean.slice(3)}</h2>`;
    if (clean.startsWith("> ")) return `<blockquote>${clean.slice(2)}</blockquote>`;
    if (!clean) return "";
    return `<p>${row}</p>`;
  }).join("");
}

// ── CONTACT SUBMISSION PIPELINE ────────────────────────────────────
function processContactSubmission() {
  const nameText = document.getElementById("contactName")?.value.trim();
  const emailText = document.getElementById("contactEmail")?.value.trim();
  const bodyText = document.getElementById("contactMessage")?.value.trim();

  if (!bodyText) {
    triggerSystemToastFeedback("Please write a message before dispatching.");
    return;
  }

  // DISPATCH BACKEND STREAM LOG
  fetch("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nameText, email: emailText, message: bodyText })
  })
  .then(() => {
    const noticeNode = document.getElementById("contactSuccessFeedback");
    if (noticeNode) {
      noticeNode.style.display = "block";
      setTimeout(() => { noticeNode.style.display = "none"; }, 5000);
    }
    document.getElementById("contactName").value = "";
    document.getElementById("contactEmail").value = "";
    document.getElementById("contactMessage").value = "";
    triggerSystemToastFeedback("Message logged successfully!");
  })
  .catch(() => {
    triggerSystemToastFeedback("Form dispatched locally (Server communication skipped).");
  });
}
window.processContactSubmission = processContactSubmission;

// ── ADMINISTRATIVE LOGIC CONTROL ───────────────────────────────────
function evaluateAuthorViewState() {
  document.getElementById("authorGateContainer").style.display = "block";
  document.getElementById("authorDashboardContainer").style.display = "none";
  ["tokenDigit1", "tokenDigit2", "tokenDigit3", "tokenDigit4"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  document.getElementById("tokenErrorOutput").style.display = "none";
}

function shiftTokenFocus(el, targetId) {
  if (el.value && targetId) document.getElementById(targetId)?.focus();
}
window.shiftTokenFocus = shiftTokenFocus;

function verifyAuthorIdentity() {
  const val = ["tokenDigit1", "tokenDigit2", "tokenDigit3", "tokenDigit4"].map((id) => document.getElementById(id)?.value || "").join("");
  if (val === SYSTEM_ADMIN_PIN) {
    document.getElementById("authorGateContainer").style.display = "none";
    document.getElementById("authorDashboardContainer").style.display = "block";
    initializeDashboardSubsystemViews();
  } else {
    document.getElementById("tokenErrorOutput").style.display = "block";
    ["tokenDigit1", "tokenDigit2", "tokenDigit3", "tokenDigit4"].forEach((id) => { const i = document.getElementById(id); if (i) i.value = ""; });
    document.getElementById("tokenDigit1")?.focus();
  }
}
window.verifyAuthorIdentity = verifyAuthorIdentity;

function terminateAuthorSession() {
  evaluateAuthorViewState();
  navigateTo("home");
  triggerSystemToastFeedback("Workspace environment locked.");
}
window.terminateAuthorSession = terminateAuthorSession;

function initializeDashboardSubsystemViews() {
  const container = document.getElementById("formEmojiGrid");
  if (container) {
    container.innerHTML = AVAILABLE_EMOJIS.map((emo) => `
      <button class="emoji-node ${emo === chosenFormEmoji ? "selected" : ""}" type="button" onclick="modifyActiveFormEmoji('${emo}')">
        ${emo}
      </button>
    `).join("");
  }
  generateDashboardInventoryMetrics();
}

// MODIFY FORM VALUE INDICATORS
function modifyActiveFormEmoji(sym) {
  chosenFormEmoji = sym;
  document.querySelectorAll(".emoji-node").forEach((n) => n.classList.toggle("selected", n.textContent.trim() === sym));
}
window.modifyActiveFormEmoji = modifyActiveFormEmoji;

function generateDashboardInventoryMetrics() {
  const frameTarget = document.getElementById("dashboardInventoryTarget");
  if (!frameTarget) return;

  if (loadedInMemoryPosts.length === 0) {
    frameTarget.innerHTML = `<p style="font-size:0.82rem;color:var(--text-light); padding:1rem;">Empty storage context registries.</p>`;
    return;
  }

  frameTarget.innerHTML = loadedInMemoryPosts.map((post) => `
    <div class="inventory-row-item">
      <div class="inventory-info-meta">
        <div class="title-line">${post.emoji} ${post.title}</div>
        <div class="sub-line">${post.tag} • Likes: ${post.likes} ${post.isArchived ? "(ARCHIVED)" : ""}</div>
      </div>
      <div class="inventory-actions-cluster">
        <button class="inventory-ctrl-btn btn-archive ${post.isArchived ? "active" : ""}" onclick="toggleArchiveStatus(${post.id})">
          ${post.isArchived ? "Unarchive" : "Archive"}
        </button>
        <button class="inventory-ctrl-btn btn-delete" onclick="executePostRemoval(${post.id})">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

async function commitNewPostToSystem() {
  const titleEl = document.getElementById('postTitleField');
  const tagEl = document.getElementById('postCategoryField');
  const contentEl = document.getElementById('postBodyContentField');

  const fTitle = titleEl?.value.trim();
  const fTag = tagEl?.value.trim() || 'musings';
  const fContent = contentEl?.value.trim();

  if (!fTitle || !fContent) {
    triggerSystemToastFeedback('Please input necessary Title and Content sections.');
    return;
  }

  const firstLine = String(fContent.split('\n') || '');
  const derivedExcerpt = firstLine.replace(/^[>#\s]+/, '').slice(0, 110) + '...';

  const newPost = {
    id: Date.now(),
    title: fTitle.toLowerCase(),
    tag: fTag.toLowerCase(),
    emoji: chosenFormEmoji,
    isArchived: false,
    excerpt: derivedExcerpt,
    content: fContent,
    likes: 0,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  };

  loadedInMemoryPosts.unshift(newPost);
  await flushMutationsToDatabaseFile();

  titleEl.value = '';
  if (tagEl) tagEl.value = '';
  contentEl.value = '';
  chosenFormEmoji = '☕';

  initializeDashboardSubsystemViews();
  triggerSystemToastFeedback('Post uploaded into JSON database! 💾');
}
window.commitNewPostToSystem = commitNewPostToSystem;

async function toggleArchiveStatus(postId) {
  const post = loadedInMemoryPosts.find((p) => p.id === postId);
  if (!post) return;

  post.isArchived = !post.isArchived;
  await flushMutationsToDatabaseFile();
  generateDashboardInventoryMetrics();
  triggerSystemToastFeedback("Archive status adjusted smoothly.");
}
window.toggleArchiveStatus = toggleArchiveStatus;

async function executePostRemoval(postId) {
  if (!confirm("Are you sure you want to permanently delete this post? This action is absolute.")) return;

  loadedInMemoryPosts = loadedInMemoryPosts.filter((p) => p.id !== postId);
  await flushMutationsToDatabaseFile();
  
  generateDashboardInventoryMetrics();
  triggerSystemToastFeedback("Post completely expunged from storage.");
}
window.executePostRemoval = executePostRemoval;

function triggerSystemToastFeedback(msg) {
  const toast = document.getElementById("systemToastNotification");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("reveal");
  setTimeout(() => { toast.classList.remove("reveal"); }, 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  synchronizeFromJSONDatabase();
});
