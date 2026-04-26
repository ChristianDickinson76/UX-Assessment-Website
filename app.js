const shows = [
  {
    id: "show-001",
    artist: "The 1975 Tribute Night",
    venue: "O2 Academy Leeds",
    date: "2026-05-12",
    genre: "Indie Pop",
    price: 38
  },
  {
    id: "show-002",
    artist: "Northern Soul Revival",
    venue: "Leeds Beckett Students' Union",
    date: "2026-05-18",
    genre: "Soul",
    price: 24
  },
  {
    id: "show-003",
    artist: "Warehouse Techno Sessions",
    venue: "Project House",
    date: "2026-05-24",
    genre: "Electronic",
    price: 31
  },
  {
    id: "show-004",
    artist: "Leeds Strings Live",
    venue: "Leeds Grand Theatre",
    date: "2026-05-30",
    genre: "Orchestral",
    price: 45
  },
  {
    id: "show-005",
    artist: "West Yorkshire Rock Festival",
    venue: "Millennium Square",
    date: "2026-06-07",
    genre: "Rock",
    price: 29
  },
  {
    id: "show-006",
    artist: "Acoustic Evenings: City Voices",
    venue: "Belgrave Music Hall",
    date: "2026-06-14",
    genre: "Acoustic",
    price: 20
  }
];

function getUsers() {
  return JSON.parse(localStorage.getItem("leedsUsers") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("leedsUsers", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("leedsCurrentUser") || "null");
}

function setCurrentUser(user) {
  localStorage.setItem("leedsCurrentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("leedsCurrentUser");
}

function formatDate(isoDate) {
  return new Date(isoDate + "T20:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getShowById(id) {
  return shows.find((show) => show.id === id);
}

function initAuthStatus() {
  const label = document.querySelector("#authStatus");
  const user = getCurrentUser();
  const signInLink = document.querySelector("#navSignIn");
  const signUpLink = document.querySelector("#navSignUp");
  const signOutButton = document.querySelector("#navSignOut");

  if (!label || !signInLink || !signUpLink || !signOutButton) return;

  if (user) {
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
    clearCurrentUser();
    window.location.href = "index.html";
  });
}

function renderShows() {
  const host = document.querySelector("#showsGrid");
  if (!host) return;

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
}

function initSignUpPage() {
  const form = document.querySelector("#signupForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    const users = getUsers();
    const exists = users.some((user) => user.email === email);

    if (exists) {
      alert("An account already exists with this email.");
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    setCurrentUser({ name, email });

    window.location.href = "index.html";
  });
}

function initSignInPage() {
  const form = document.querySelector("#signinForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "index.html";

    const users = getUsers();
    const match = users.find((user) => user.email === email && user.password === password);

    if (!match) {
      alert("Incorrect email or password.");
      return;
    }

    setCurrentUser({ name: match.name, email: match.email });
    window.location.href = redirect;
  });
}

function initBookingPage() {
  const bookingForm = document.querySelector("#bookingForm");
  if (!bookingForm) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    const returnTo = encodeURIComponent(window.location.pathname.split("/").pop() + window.location.search);
    window.location.href = `signin.html?redirect=${returnTo}`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const showId = params.get("show");
  const show = getShowById(showId);

  if (!show) {
    const details = document.querySelector("#bookingDetails");
    details.innerHTML = "<p class=\"help\">Concert not found. Please return to the Leeds concerts list.</p>";
    bookingForm.classList.add("hidden");
    return;
  }

  const details = document.querySelector("#bookingDetails");
  details.innerHTML = `
    <div class="notice">
      <strong>${show.artist}</strong><br>
      ${show.venue}<br>
      ${formatDate(show.date)}<br>
      £${show.price} per ticket
    </div>
  `;

  const ticketCount = bookingForm.querySelector("#ticketCount");
  const total = bookingForm.querySelector("#bookingTotal");
  const summary = bookingForm.querySelector("#bookingSummary");

  const recalculateTotal = () => {
    const amount = Number(ticketCount.value) * show.price;
    total.textContent = `Total: £${amount}`;
  };

  recalculateTotal();
  ticketCount.addEventListener("change", recalculateTotal);

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const count = Number(ticketCount.value);
    summary.innerHTML = `
      <p class="success">
        Booking confirmed for ${count} ticket${count > 1 ? "s" : ""} to ${show.artist}.<br>
        Confirmation sent to ${currentUser.email}.
      </p>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuthStatus();
  renderShows();
  initSignUpPage();
  initSignInPage();
  initBookingPage();
});
