const peso = (n) => "₱" + Number(n).toLocaleString("en-PH");

const form = document.getElementById("pasabayForm");
const nameInput = document.getElementById("name");
const service = document.getElementById("service");
const qty = document.getElementById("qty");
const estimate = document.querySelector(".estimate strong");

const updateLog = document.getElementById("updateLog");
const ticketList = document.getElementById("ticketList");
const receipt = document.getElementById("receipt");

const receiptService = document.querySelector('[data-receipt="service"]');

const receiptQuantity = document.querySelector('[data-receipt="quantity"]');

const receiptTotal = document.querySelector('[data-receipt="total"]');

/* --------------------------------------------------
   HERO REVEAL
-------------------------------------------------- */

document.querySelector(".hero")?.classList.add("reveal");

/* --------------------------------------------------
   FIELD VALUE SYNC
-------------------------------------------------- */

const syncField = (el) => {
  el.closest(".field")?.classList.toggle("has-value", Boolean(el.value));
};

document.querySelectorAll(".field input, .field select").forEach((el) => {
  syncField(el);

  el.addEventListener("input", () => {
    syncField(el);
  });

  el.addEventListener("change", () => {
    syncField(el);
  });
});

/* --------------------------------------------------
   QUANTITY STEPPER
-------------------------------------------------- */

document.querySelectorAll(".stepper-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const current = Math.max(1, Number.parseInt(qty?.value, 10) || 1);

    const step = Number(btn.dataset.step) || 0;

    const next = Math.max(1, current + step);

    if (qty) {
      qty.value = String(next);

      qty.dispatchEvent(
        new Event("input", {
          bubbles: true,
        }),
      );
    }
  });
});

/* --------------------------------------------------
   LIVE ESTIMATE
-------------------------------------------------- */

function getEstimate() {
  const quantity = Math.max(1, Number.parseInt(qty?.value, 10) || 1);

  const selectedService = service?.value ?? "standard";

  if (selectedService === "bluebook") {
    const total = quantity >= 5 ? quantity * 13 : quantity * 15;

    return {
      total,
      display: peso(total),
    };
  }

  if (selectedService === "special") {
    return {
      total: 100,
      display: peso(100),
    };
  }

  if (selectedService === "non-dost") {
    return {
      total: null,
      display:
        "<span style='font-size:0.9rem;letter-spacing:0;'>Varies (Awaiting Review)</span>",
    };
  }

  return {
    total: 35,
    display: peso(35),
  };
}

function quote() {
  const { display } = getEstimate();

  if (estimate) {
    estimate.innerHTML = display;
  }
}

service?.addEventListener("change", quote);

qty?.addEventListener("input", quote);

quote();

/* --------------------------------------------------
   TOASTS
-------------------------------------------------- */

function toast(message, isError = false) {
  const stack = document.querySelector(".toast-stack");

  if (!stack) return;

  const el = document.createElement("div");

  el.className = `toast${isError ? " toast-error" : ""}`;

  el.setAttribute("role", "status");

  el.textContent = message;

  stack.appendChild(el);

  window.setTimeout(() => {
    el.remove();
  }, 4200);
}

/* --------------------------------------------------
   SERVICE LABELS
-------------------------------------------------- */

const serviceLabels = {
  standard: "Standard Delivery",
  bluebook: "Blue Book",
  special: "Special Delivery",
  "non-dost": "Non-DOST Delivery or Pick-up",
};

/* --------------------------------------------------
   RECEIPT
-------------------------------------------------- */

function renderReceipt() {
  if (!receipt) return;

  const { total } = getEstimate();

  const quantity = Math.max(1, Number.parseInt(qty.value, 10) || 1);

  if (receiptService) {
    receiptService.textContent =
      serviceLabels[service.value] ?? "Unknown service";
  }

  if (receiptQuantity) {
    receiptQuantity.textContent = String(quantity);
  }

  if (receiptTotal) {
    receiptTotal.textContent = total === null ? "Varies" : peso(total);
  }

  receipt.hidden = false;
}

/* --------------------------------------------------
   TRACKING TICKET
-------------------------------------------------- */

function renderTicket() {
  if (!ticketList) return;

  const selectedService = serviceLabels[service.value] ?? "Service";

  const quantity = Math.max(1, Number.parseInt(qty.value, 10) || 1);

  const { total } = getEstimate();

  const totalText = total === null ? "REVIEW" : peso(total);

  ticketList.innerHTML = `
    <article class="ticket">
      <div>
        <div class="ticket-id">
          PASABAY · REQUEST LOGGED
        </div>

        <div class="ticket-meta">
          ${selectedService} · Qty ${quantity}
        </div>
      </div>

      <div class="ticket-total">
        ${totalText}
      </div>

      <span class="status-pill">
        Submitted
      </span>
    </article>
  `;
}

/* --------------------------------------------------
   FORM SUBMISSION
-------------------------------------------------- */

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const studentName = nameInput?.value.trim() ?? "";

  const serviceType = service?.value ?? "standard";

  const quantity = Math.max(1, Number.parseInt(qty?.value, 10) || 1);

  if (!studentName) {
    nameInput?.focus();

    toast("Please enter your full name.", true);

    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');

  submitButton?.setAttribute("aria-busy", "true");

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch("/api/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentName,
        serviceType,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    toast("Request logged. Check your GCash for payment details.");

    renderReceipt();
    renderTicket();

    form.reset();

    if (qty) {
      qty.value = "1";
    }

    document.querySelectorAll(".field").forEach((field) => {
      field.classList.remove("has-value");
    });

    quote();
  } catch (error) {
    console.error("Error submitting form:", error);

    toast("Failed to submit the request. Please try again.", true);
  } finally {
    submitButton?.removeAttribute("aria-busy");

    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});

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
   INITIALIZE
-------------------------------------------------- */

fetchUpdates();

tick();

window.setInterval(tick, 1000);
