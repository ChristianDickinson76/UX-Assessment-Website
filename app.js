const API_BASE_URL = window.BOOKING_API_BASE_URL || "http://127.0.0.1:3000/api";
const TOKEN_KEY = "leedsAuthToken";
const ACCESSIBILITY_KEY = "leedsAccessibilitySettings";
const PROFILE_KEY = "leedsUserProfile";

let currentShowFilters = {
  category: "all",
  date: ""
};

let bookingDraft = null;

let favouriteShowCodes = new Set();

const defaultAccessibilitySettings = {
  darkMode: false,
  highContrast: false,
  largeText: false
};

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setAuthSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("leedsCurrentUser", JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("leedsCurrentUser");
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("leedsCurrentUser") || "null");
}

function getAccessibilitySettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACCESSIBILITY_KEY) || "null");
    return {
      ...defaultAccessibilitySettings,
      ...(stored || {})
    };
  } catch (_error) {
    return { ...defaultAccessibilitySettings };
  }
}

function setAccessibilitySettings(settings) {
  localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings));
}

function applyAccessibilitySettings(settings = getAccessibilitySettings()) {
  document.body.classList.toggle("theme-dark", Boolean(settings.darkMode));
  document.body.classList.toggle("theme-monochrome", Boolean(settings.highContrast));
  document.body.classList.toggle("theme-large-text", Boolean(settings.largeText));
}

function isSignedIn() {
  return Boolean(getAuthToken() && getCurrentUser());
}

async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T20:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatCurrency(value) {
  return `£${Number(value).toFixed(0)}`;
}

function getBookingDraft() {
  if (bookingDraft) {
    return bookingDraft;
  }

  try {
    bookingDraft = JSON.parse(sessionStorage.getItem("leedsBookingDraft") || "null");
  } catch (_error) {
    bookingDraft = null;
  }

  return bookingDraft;
}

function setBookingDraft(draft) {
  bookingDraft = draft;
  sessionStorage.setItem("leedsBookingDraft", JSON.stringify(draft));
}

function clearBookingDraft() {
  bookingDraft = null;
  sessionStorage.removeItem("leedsBookingDraft");
}

function buildShowQueryString() {
  const params = new URLSearchParams();

  if (currentShowFilters.category && currentShowFilters.category !== "all") {
    params.set("category", currentShowFilters.category);
  }

  if (currentShowFilters.date) {
    params.set("date", currentShowFilters.date);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function updateFilterSummary() {
  const summary = document.querySelector("#filterSummary");
  if (!summary) return;

  const parts = [];
  if (currentShowFilters.category && currentShowFilters.category !== "all") {
    parts.push(currentShowFilters.category);
  } else {
    parts.push("all categories");
  }

  if (currentShowFilters.date) {
    parts.push(`on ${formatDate(currentShowFilters.date)}`);
  }

  summary.textContent = `Showing ${parts.join(" ")}.`;
}

async function loadFavouriteShowCodes() {
  if (!isSignedIn()) {
    favouriteShowCodes = new Set();
    return favouriteShowCodes;
  }

  try {
    const result = await apiRequest("/users/me/favourites");
    favouriteShowCodes = new Set(result.favoriteShowCodes || []);
  } catch (error) {
    favouriteShowCodes = new Set();
  }

  return favouriteShowCodes;
}

async function toggleFavouriteShow(showId) {
  if (!isSignedIn()) {
    window.location.href = `signin.html?redirect=${encodeURIComponent("index.html")}`;
    return;
  }

  const result = await apiRequest(`/users/me/favourites/${encodeURIComponent(showId)}`, {
    method: "POST"
  });
  favouriteShowCodes = new Set(result.favoriteShowCodes || []);
}

function renderShowCard(show, index) {
  const favouriteLabel = favouriteShowCodes.has(show.id) ? "Starred" : "Star";
  const favouriteClass = favouriteShowCodes.has(show.id) ? "btn-favourite is-active" : "btn-favourite";
  const favouriteTitle = favouriteShowCodes.has(show.id) ? "Remove from favourites" : "Add to favourites";

  return `
    <article class="card h-100" style="animation-delay:${index * 60}ms" data-category="${show.genre}">

      <h3>${show.artist}</h3>
      <img src="https://picsum.photos/200/50?random=${show.id}" alt="Concert Image" class="img-fluid">
      <p class="venue">${show.venue}</p>
      <div class="meta">
        <span class="badge">${formatDate(show.date)}</span>
        <span class="badge">${show.category}</span>
        <span class="badge">${formatCurrency(show.price)}</span>
      </div>
      <div class="card-actions">
        <button
          class="btn ${favouriteClass} btn-inline"
          type="button"
          data-favourite-id="${show.id}"
          aria-pressed="${favouriteShowCodes.has(show.id) ? "true" : "false"}"
          title="${favouriteTitle}"
        >
          ${favouriteLabel}
        </button>
        <a class="btn btn-primary btn-inline" href="booking.html?show=${show.id}">Book now</a>
      </div>
    </article>
  `;
}

async function renderShows() {
  const host = document.querySelector("#showsGrid");
  if (!host) return;

  host.innerHTML = `<p class="help">Loading concerts...</p>`;

  try {
    await loadFavouriteShowCodes();
    const shows = await apiRequest(`/shows${buildShowQueryString()}`);

    if (!shows.length) {
      host.innerHTML = '<p class="empty-state">No concerts match the current filters.</p>';
      return;
    }

    host.innerHTML = shows.map((show, index) => renderShowCard(show, index)).join("");
  } catch (error) {
    host.innerHTML = `<p class="help">${error.message}</p>`;
  }

  updateFilterSummary();
}

function initAuthStatus() {
  const authStatus = document.getElementById("authStatus");
  const navSignIn = document.getElementById("navSignIn");
  const navSignUp = document.getElementById("navSignUp");
  const navProfile = document.getElementById("navProfile");
  const navSignOut = document.getElementById("navSignOut");

  if (!authStatus) return;

  if (isSignedIn()) {
    const user = getCurrentUser();
    authStatus.textContent = `Signed in as ${user?.name || user?.email || "user"}`;

    navSignIn?.classList.add("hidden");
    navSignUp?.classList.add("hidden");
    navProfile?.classList.remove("hidden");
    navSignOut?.classList.remove("hidden");

    navSignOut?.addEventListener("click", () => {
      clearAuthSession();
      window.location.href = "index.html";
    });
  } else {
    navSignIn?.classList.remove("hidden");
    navSignUp?.classList.remove("hidden");
    navProfile?.classList.add("hidden");
    navSignOut?.classList.add("hidden");
  }
}

function initAccessibilityPage() {
  const form = document.querySelector("#accessibilityForm");
  if (!form) return;

  const darkModeInput = form.querySelector("#prefDarkMode");
  const highContrastInput = form.querySelector("#prefHighContrast");
  const largeTextInput = form.querySelector("#prefLargeText");

  const settings = getAccessibilitySettings();
  darkModeInput.checked = settings.darkMode;
  highContrastInput.checked = settings.highContrast;
  largeTextInput.checked = settings.largeText;

  const saveSettings = () => {
    const nextSettings = {
      darkMode: darkModeInput.checked,
      highContrast: highContrastInput.checked,
      largeText: largeTextInput.checked
    };

    setAccessibilitySettings(nextSettings);
    applyAccessibilitySettings(nextSettings);
  };

  [darkModeInput, highContrastInput, largeTextInput].forEach((input) => {
    input.addEventListener("change", () => {
      saveSettings();
    });
  });
}

function initHomePage() {
  const filterForm = document.querySelector("#filterForm");
  const clearFiltersButton = document.querySelector("#clearFilters");
  const categoryFilter = document.querySelector("#categoryFilter");
  const dateFilter = document.querySelector("#dateFilter");
  const host = document.querySelector("#showsGrid");

  if (!host) return;

  const pageParams = new URLSearchParams(window.location.search);
  currentShowFilters = {
    category: pageParams.get("category") || "all",
    date: pageParams.get("date") || ""
  };

  if (categoryFilter) {
    categoryFilter.value = currentShowFilters.category;
  }

  if (dateFilter) {
    dateFilter.value = currentShowFilters.date;
  }

  updateFilterSummary();

  if (filterForm) {
    filterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      currentShowFilters = {
        category: categoryFilter?.value || "all",
        date: dateFilter?.value || ""
      };
      renderShows();
    });
  }

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", () => {
      currentShowFilters = {
        category: "all",
        date: ""
      };

      if (categoryFilter) {
        categoryFilter.value = "all";
      }

      if (dateFilter) {
        dateFilter.value = "";
      }

      renderShows();
    });
  }

  host.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-favourite-id]");
    if (!button) return;

    const showId = button.getAttribute("data-favourite-id");
    if (!showId) return;

    button.disabled = true;
    try {
      await toggleFavouriteShow(showId);
      await renderShows();
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
    }
  });

  renderShows();
}

function initSignUpPage() {
  const form = document.querySelector("#signupForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    try {
      const result = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setAuthSession(result.token, result.user);
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

function initSignInPage() {
  const form = document.querySelector("#signinForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "index.html";

    try {
      const result = await apiRequest("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setAuthSession(result.token, result.user);
      window.location.href = redirect;
    } catch (error) {
      alert(error.message);
    }
  });
}

async function initBookingPage() {
  const bookingForm = document.querySelector("#bookingForm");
  if (!bookingForm) return;

  const token = getAuthToken();
  const currentUser = getCurrentUser();
  if (!token || !currentUser) {
    const returnTo = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
    window.location.href = `signin.html?redirect=${returnTo}`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const showId = params.get("show");
  const details = document.querySelector("#bookingDetails");
  let show;

  try {
    show = await apiRequest(`/shows/${showId}`);
    details.innerHTML = `
      <div class="notice">
        <strong>${show.artist}</strong><br>
        ${show.venue}<br>
        ${formatDate(show.date)}<br>
        ${show.category}<br>
        £${show.price} per ticket
      </div>
    `;
  } catch (error) {
    details.innerHTML = `<p class="help">${error.message}</p>`;
    bookingForm.classList.add("hidden");
    return;
  }

  const ticketCount = bookingForm.querySelector("#ticketCount");
  const total = bookingForm.querySelector("#bookingTotal");
  const summary = bookingForm.querySelector("#bookingSummary");

  const recalculateTotal = () => {
    const amount = Number(ticketCount.value) * show.price;
    total.textContent = `Total: £${amount}`;
  };

  recalculateTotal();
  ticketCount.addEventListener("change", recalculateTotal);

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const count = Number(ticketCount.value);
    setBookingDraft({ showId: show.id, ticketCount: count });
    window.location.href = "payment.html";
  });
}

async function initPaymentPage() {
  const paymentForm = document.querySelector("#paymentForm");
  if (!paymentForm) return;

  const token = getAuthToken();
  const currentUser = getCurrentUser();
  if (!token || !currentUser) {
    window.location.href = `signin.html?redirect=${encodeURIComponent("booking.html")}`;
    return;
  }

  const draft = getBookingDraft();
  const details = document.querySelector("#paymentDetails");
  const total = document.querySelector("#paymentTotal");
  const nameInput = paymentForm.querySelector("#paymentName");

  if (!draft?.showId || !draft?.ticketCount) {
    details.innerHTML = `<p class="help">Your booking details are missing. Please return to the concerts page and try again.</p>`;
    paymentForm.classList.add("hidden");
    return;
  }

  let show;
  try {
    show = await apiRequest(`/shows/${draft.showId}`);
  } catch (error) {
    details.innerHTML = `<p class="help">${error.message}</p>`;
    paymentForm.classList.add("hidden");
    return;
  }

  details.innerHTML = `
    <div class="notice">
      <strong>${show.artist}</strong><br>
      ${show.venue}<br>
      ${formatDate(show.date)}<br>
      ${draft.ticketCount} ticket${draft.ticketCount > 1 ? "s" : ""}<br>
      ${formatCurrency(show.price * draft.ticketCount)} total
    </div>
  `;

  total.textContent = `Total to pay: ${formatCurrency(show.price * draft.ticketCount)}`;
  if (nameInput && currentUser?.name) {
    nameInput.value = currentUser.name;
  }

  paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameOnCard = paymentForm.elements.namedItem("nameOnCard")?.value.trim() || "";
    const cardNumber = paymentForm.elements.namedItem("cardNumber")?.value.replace(/\s+/g, "") || "";
    const expiry = paymentForm.elements.namedItem("expiry")?.value.trim() || "";
    const cvv = paymentForm.elements.namedItem("cvv")?.value.trim() || "";
    const summary = document.querySelector("#paymentSummary");

    if (!nameOnCard || !cardNumber || !expiry || !cvv) {
      summary.innerHTML = `<p class="help">Please complete the mock payment form.</p>`;
      return;
    }

    try {
      const booking = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          showId: draft.showId,
          ticketCount: draft.ticketCount
        })
      });

      clearBookingDraft();
      window.location.href = `tickets.html?booked=${encodeURIComponent(booking.bookingId)}`;
    } catch (error) {
      summary.innerHTML = `<p class="help">${error.message}</p>`;
    }
  });
}

async function initTicketsPage() {
  const host = document.querySelector("#ticketsList");
  if (!host) return;

  if (!isSignedIn()) {
    window.location.href = `signin.html?redirect=${encodeURIComponent("tickets.html")}`;
    return;
  }

  host.innerHTML = `<p class="help">Loading your tickets...</p>`;

  try {
    const bookings = await apiRequest("/bookings/me");

    if (!bookings.length) {
      host.innerHTML = `
        <div class="empty-state">
          <p>You have not booked any events yet.</p>
          <a class="btn btn-primary" href="index.html#concertsSection">Browse concerts</a>
        </div>
      `;
      return;
    }

    host.innerHTML = bookings
      .map(
        (booking) => `
          <article class="ticket-card">
            <div class="ticket-top">
              <div>
                <h3>${booking.show.artist}</h3>
                <p class="venue">${booking.show.venue}</p>
              </div>
              <strong>${formatCurrency(booking.totalPrice)}</strong>
            </div>
            <div class="ticket-meta">
              <span class="badge">${formatDate(booking.show.date)}</span>
              <span class="badge">${booking.show.category}</span>
              <span class="badge">${booking.ticketCount} ticket${booking.ticketCount > 1 ? "s" : ""}</span>
            </div>
            <p class="favourite-note">Booked on ${new Date(booking.bookedAt).toLocaleDateString("en-GB")}</p>
            <button class="btn btn-secondary btn-inline" type="button" data-refund-id="${booking.id}">Refund ticket</button>
          </article>
        `
      )
      .join("");

    host.querySelectorAll("[data-refund-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const bookingId = button.getAttribute("data-refund-id");
        if (!bookingId) return;

        button.disabled = true;
        try {
          await apiRequest(`/bookings/${encodeURIComponent(bookingId)}`, {
            method: "DELETE"
          });
          await initTicketsPage();
        } catch (error) {
          alert(error.message);
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    host.innerHTML = `<p class="help">${error.message}</p>`;
  }
}

function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") || { bio: "", picture: null };
  } catch (_error) {
    return { bio: "", picture: null };
  }
}

function setUserProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function initProfilePage() {
  const form = document.getElementById("profileForm");
  const bioInput = document.getElementById("bioInput");
  const profilePicture = document.getElementById("profilePicture");
  const profilePreview = document.getElementById("profilePreview");

  const profile = getUserProfile();
  bioInput.value = profile.bio || "";
  if (profile.picture) {
    profilePreview.src = profile.picture;
  }

  profilePicture.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      profilePreview.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const profile = {
      bio: bioInput.value,
      picture: profilePreview.src
    };
    setUserProfile(profile);
    alert("Profile saved!");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyAccessibilitySettings();
  initAuthStatus();
  initHomePage();
  initSignUpPage();
  initSignInPage();
  initBookingPage();
  initPaymentPage();
  initTicketsPage();
  initAccessibilityPage();
  if (document.getElementById("profileForm")) {
    initProfilePage();
  }
});