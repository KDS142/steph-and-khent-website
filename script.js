const updateLog = document.getElementById("updateLog");

/* --------------------------------------------------
   HERO REVEAL
-------------------------------------------------- */

document.querySelector(".hero")?.classList.add("reveal");

/* --------------------------------------------------
   FETCH RECENT UPDATES
-------------------------------------------------- */

async function fetchUpdates() {
  if (!updateLog) return;

  try {
    const response = await fetch("/api/updates");

    if (!response.ok) {
      throw new Error(`Updates failed with status ${response.status}`);
    }

    const updates = await response.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      updateLog.innerHTML = `
        <article class="log-entry">
          <div class="log-meta">
            <span class="log-date">
              No updates
            </span>
          </div>

          <h3>
            No recent announcements
          </h3>

          <p>
            There are no published updates
            at the moment.
          </p>
        </article>
      `;

      return;
    }

    updateLog.innerHTML = "";

    updates.forEach((update) => {
      const entry = document.createElement("article");

      entry.className = "log-entry";

      const meta = document.createElement("div");

      meta.className = "log-meta";

      const date = document.createElement("span");

      date.className = "log-date";

      date.textContent = update.created_at
        ? new Date(update.created_at).toLocaleDateString()
        : "No date";

      meta.appendChild(date);

      if (update.is_new) {
        const badge = document.createElement("span");

        badge.className = "badge-new";

        badge.textContent = "NEW";

        meta.appendChild(badge);
      }

      const title = document.createElement("h3");

      title.textContent = update.title ?? "Untitled update";

      const content = document.createElement("p");

      content.textContent = update.content ?? "";

      entry.append(meta, title, content);

      updateLog.appendChild(entry);
    });
  } catch (error) {
    console.error("Failed to load updates:", error);

    updateLog.innerHTML = `
      <article class="log-entry">
        <div class="log-meta">
          <span class="log-date">
            Unavailable
          </span>
        </div>

        <h3>
          Updates could not be loaded
        </h3>

        <p>
          Please refresh the page and try again.
        </p>
      </article>
    `;
  }
}

/* --------------------------------------------------
   CUT-OFF COUNTDOWN
   Wednesday at 7:00 PM
-------------------------------------------------- */

const clock = document.querySelector(".ticker-countdown");

function tick() {
  if (!clock) return;

  const now = new Date();

  const target = new Date(now);

  target.setHours(19, 0, 0, 0);

  let days = (3 - now.getDay() + 7) % 7;

  // If it is already Wednesday after 7:00 PM,
  // move the countdown to next Wednesday.
  if (days === 0 && now >= target) {
    days = 7;
  }

  target.setDate(target.getDate() + days);

  const diff = Math.max(0, target - now);

  const hours = Math.floor(diff / 3.6e6);

  const minutes = Math.floor((diff % 3.6e6) / 6e4);

  const seconds = Math.floor((diff % 6e4) / 1000);

  clock.textContent =
    `CUT-OFF IN ${hours}h ` +
    `${String(minutes).padStart(2, "0")}m ` +
    `${String(seconds).padStart(2, "0")}s`;
}

/* --------------------------------------------------
   THEME TOGGLE
-------------------------------------------------- */
const themeToggle = document.getElementById("themeToggle");

// Initial load
if (localStorage.getItem("theme") === "light") {
  document.documentElement.setAttribute("data-theme", "light");
  if (themeToggle) themeToggle.checked = true;
} else {
  if (themeToggle) themeToggle.checked = false;
}

// Listen for checkbox toggle
themeToggle?.addEventListener("change", (e) => {
  if (e.target.checked) {
    // Switch to Light
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  } else {
    // Switch to Dark
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  }
});

/* --------------------------------------------------
   INITIALIZE
-------------------------------------------------- */

fetchUpdates();

tick();

window.setInterval(tick, 1000);
