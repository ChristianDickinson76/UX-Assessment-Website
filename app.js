const API_BASE_URL = window.BOOKING_API_BASE_URL || "http://localhost:3000/api";
const TOKEN_KEY = "leedsAuthToken";

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
  return new Date(isoDate + "T20:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function initAuthStatus() {
  const label = document.querySelector("#authStatus");
  const user = getCurrentUser();
  const signInLink = document.querySelector("#navSignIn");
  const signUpLink = document.querySelector("#navSignUp");
  const signOutButton = document.querySelector("#navSignOut");

  if (!label || !signInLink || !signUpLink || !signOutButton) return;

  if (user && getAuthToken()) {
    label.textContent = `Signed in as ${user.name}`;
    signInLink.classList.add("hidden");
    signUpLink.classList.add("hidden");
    signOutButton.classList.remove("hidden");
  } else {
    label.textContent = "Not signed in";
    signInLink.classList.remove("hidden");
    signUpLink.classList.remove("hidden");
    signOutButton.classList.add("hidden");
  }

  signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "index.html";
  });
}

async function renderShows() {
  const host = document.querySelector("#showsGrid");
  if (!host) return;

  try {
    const shows = await apiRequest("/shows");
    host.innerHTML = shows
      .map(
        (show, index) => `
        <article class="card h-100" style="animation-delay:${index * 60}ms">
          <h3>${show.artist}</h3>
          <p class="venue">${show.venue}</p>
          <div class="meta">
            <span class="badge">${formatDate(show.date)}</span>
            <span class="badge">${show.genre}</span>
            <span class="badge">£${show.price}</span>
          </div>
          <a class="btn btn-primary" href="booking.html?show=${show.id}">Book now</a>
        </article>
      `
      )
      .join("");
  } catch (error) {
    host.innerHTML = `<p class="help">${error.message}</p>`;
  }
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

    try {
      const booking = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          showId: show.id,
          ticketCount: count
        })
      });

      summary.innerHTML = `
        <p class="success">
          Booking confirmed for ${booking.ticketCount} ticket${booking.ticketCount > 1 ? "s" : ""} to ${booking.show.artist}.<br>
          Confirmation sent to ${currentUser.email}. Total paid: £${booking.totalPrice}.
        </p>
      `;
    } catch (error) {
      summary.innerHTML = `<p class="help">${error.message}</p>`;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthStatus();
  renderShows();
  initSignUpPage();
  initSignInPage();
  initBookingPage();
});
