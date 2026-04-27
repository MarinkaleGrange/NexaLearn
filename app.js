const STORAGE_KEY = "nexaLearnAppStateV2";
const grades = ["R", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const packageCatalog = {
  starter: { label: "Starter Plan", price: 520, lessons: 4, minutes: 30 },
  core: { label: "Core Plan", price: 760, lessons: 4, minutes: 45 },
  boost: { label: "Boost Plan", price: 1440, lessons: 8, minutes: 45 },
};

const roleAccess = {
  guest: ["landing", "marketplace", "tutoring", "enrollment", "saturday", "customResource", "bookingSuccess"],
  parent: ["landing", "marketplace", "tutoring", "enrollment", "saturday", "customResource", "customer", "bookingSuccess"],
  student: ["landing", "studentPortal", "bookingSuccess"],
  admin: ["landing", "admin", "bookingSuccess"],
};

const resources = [
  { id: 1, title: "Phonics Builder Pack", grade: "R", subject: "Literacy", language: "English", price: 95 },
  { id: 2, title: "Afrikaans Begrip Oefene", grade: "4", subject: "Afrikaans", language: "Afrikaans", price: 120 },
  { id: 3, title: "Reading Fluency Cards", grade: "2", subject: "Literacy", language: "English", price: 110 },
  { id: 4, title: "CAPS Maths Drill Set", grade: "6", subject: "Mathematics", language: "English", price: 145 },
  { id: 5, title: "Taal Remediering Bundle", grade: "7", subject: "Afrikaans", language: "Afrikaans", price: 150 },
  { id: 6, title: "Study Skills Planner", grade: "9", subject: "Study Skills", language: "English", price: 80 },
];

const translations = {
  en: {
    tagline: "Professional, educational and neuro-inclusive tutoring",
    nav_landing: "Landing",
    nav_marketplace: "Marketplace",
    nav_tutoring: "Tutoring Dashboard",
    nav_enrollment: "Enrollment",
    nav_saturday: "Saturday Request",
    nav_custom_resource: "Custom Resource",
    nav_customer: "Customer Account",
    nav_student: "Student Portal",
    nav_admin: "Admin Panel",
    nav_success: "Booking Success",
    who_we_are: "Who We Are",
    hero_title: "Future-forward tutoring for every kind of learner.",
    mission_statement: "NexaLearn delivers customized, inclusive, and engaging learning experiences that meet each student where they are academically, emotionally, and neurologically.",
    chip_neuro: "Neurodiversity-Informed Methods",
    what_we_offer: "What We Offer",
    offer_1: "Personalized lesson plans by pace, strengths, and goals",
    offer_2: "Reading, literacy, remediation, homework and study support",
    offer_3: "Interactive digital delivery with structured progress updates",
    offer_4: "Support for ADHD, dyslexia, autism and multilingual learners",
    market_title: "Marketplace",
    view_cart: "View Cart",
    tutoring_title: "Tutoring Dashboard",
    slots_note: "Mon-Thu: 08:00-13:00, 14:30-18:00 | Fri: 08:00-16:00 | Saturday by request",
  },
  af: {
    tagline: "Professionele, opvoedkundige en neuro-inklusiewe tutorkunde",
    nav_landing: "Tuisblad",
    nav_marketplace: "Markplein",
    nav_tutoring: "Tutor Paneel",
    nav_enrollment: "Inskrywing",
    nav_saturday: "Saterdag Versoek",
    nav_custom_resource: "Pasgemaakte Hulpbron",
    nav_customer: "Klient Rekening",
    nav_student: "Student Portaal",
    nav_admin: "Admin Paneel",
    nav_success: "Bespreking Sukses",
    who_we_are: "Wie Ons Is",
    hero_title: "Toekomstige tutorondersteuning vir elke tipe leerder.",
    mission_statement: "NexaLearn lewer pasgemaakte, inklusiewe en boeiende leerervarings wat elke student akademies, emosioneel en neurologies ontmoet waar hulle is.",
    chip_neuro: "Neurodiversiteit-ingeligte metodes",
    what_we_offer: "Wat Ons Bied",
    offer_1: "Persoonlike lesplanne volgens tempo, sterkpunte en doelwitte",
    offer_2: "Lees, geletterdheid, remediering, huiswerk en studiehulp",
    offer_3: "Interaktiewe digitale lesse met gestruktureerde vorderingsverslae",
    offer_4: "Ondersteuning vir ADHD, disleksie, outisme en meertalige leerders",
    market_title: "Markplein",
    view_cart: "Bekyk Mandjie",
    tutoring_title: "Tutor Paneel",
    slots_note: "Ma-Do: 08:00-13:00, 14:30-18:00 | Vry: 08:00-16:00 | Saterdag op versoek",
  },
};

const defaultState = {
  language: "en",
  role: "guest",
  userName: "",
  cart: [],
  purchases: [],
  sessions: [],
  saturdayRequests: [],
  consentLogs: [],
  package: null,
  invoices: [
    { id: "INV-101", parent: "Parent A", amount: 760, daysOverdue: 3 },
    { id: "INV-102", parent: "Parent B", amount: 520, daysOverdue: 1 },
  ],
};

let state = loadState();

function el(id) {
  return document.getElementById(id);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (_err) {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function populateSelect(selectId, values, withAll = false) {
  const select = el(selectId);
  if (!select) return;
  const options = withAll ? ["All", ...values] : values;
  select.innerHTML = options.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function isViewAllowed(viewId) {
  const allowed = roleAccess[state.role] || roleAccess.guest;
  return allowed.includes(viewId);
}

function showView(viewId) {
  if (!isViewAllowed(viewId)) {
    alert("Access restricted for your current role.");
    return;
  }
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === viewId);
  });
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });
}

function renderNavAccess() {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    const allowed = isViewAllowed(btn.dataset.view);
    btn.disabled = !allowed;
    btn.style.opacity = allowed ? "1" : "0.45";
    btn.style.cursor = allowed ? "pointer" : "not-allowed";
  });
  el("activeRoleBadge").textContent = `${state.role.toUpperCase()}${state.userName ? `: ${state.userName}` : ""}`;
}

function renderTranslations() {
  const dict = translations[state.language];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (dict[key]) node.textContent = dict[key];
  });
  el("langToggle").textContent = state.language === "en" ? "Afrikaans" : "English";
}

function getBookingBaseRate(groupSize) {
  if (groupSize === "2") return 130;
  if (groupSize === "3") return 100;
  return 190;
}

function getActivePackage() {
  if (!state.package) return null;
  if (new Date(state.package.expiresOn) < new Date()) return null;
  if (state.package.remainingLessons <= 0) return null;
  return state.package;
}

function calculateBookingPrice() {
  const groupSize = el("groupSize").value;
  const hasNeuro = el("neuroProgram").checked;
  const firstEnrollment = el("firstEnrollmentFee").checked;
  const firstBooking = el("isFirstBooking").checked;
  const packageUseMode = el("packageUseMode").value;
  const usingPackage = packageUseMode === "use_existing" && !!getActivePackage();

  let total = usingPackage ? 0 : getBookingBaseRate(groupSize);
  if (hasNeuro) total += 50;
  if (firstEnrollment) total += 150;
  if (firstBooking && !usingPackage) total *= 0.5;

  el("bookingPrice").textContent = `Calculated total: R${Math.round(total)}${usingPackage ? " (Package lesson used)" : ""}`;
  return Math.round(total);
}

function getTimeSlotsForDate(inputDate) {
  if (!inputDate) return ["Select a date first"];
  const date = new Date(`${inputDate}T12:00:00`);
  const day = date.getDay();
  if (day === 6) return ["Saturday manual request only"];
  if (day === 0) return ["No Sunday slots"];
  if (day >= 1 && day <= 4) return ["08:00", "09:00", "10:00", "11:00", "12:00", "14:30", "15:30", "16:30", "17:30"];
  return ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
}

function renderTimeSlots() {
  const bookingDate = el("bookingDate").value;
  const slots = getTimeSlotsForDate(bookingDate);
  el("bookingTime").innerHTML = slots.map((slot) => `<option>${slot}</option>`).join("");
}

function renderResources() {
  const grade = el("filterGrade").value;
  const subject = el("filterSubject").value;
  const language = el("filterLanguage").value;
  const search = el("searchResource").value.trim().toLowerCase();
  const filtered = resources.filter((item) => {
    const gradeMatch = grade === "All" || item.grade === grade;
    const subjectMatch = subject === "All" || item.subject === subject;
    const languageMatch = language === "All" || item.language === language;
    const searchMatch = item.title.toLowerCase().includes(search);
    return gradeMatch && subjectMatch && languageMatch && searchMatch;
  });
  el("resourceGrid").innerHTML = filtered.map((item) => `
    <article class="resource-card">
      <h3>${item.title}</h3>
      <div class="resource-meta">
        <span class="meta-pill">Grade ${item.grade}</span>
        <span class="meta-pill">${item.subject}</span>
        <span class="meta-pill">${item.language}</span>
      </div>
      <p><strong>R${item.price}</strong></p>
      <button class="primary-btn" data-add-resource="${item.id}">Add to Cart</button>
    </article>
  `).join("");
}

function renderCart() {
  const cartItems = el("cartItems");
  if (state.cart.length === 0) {
    cartItems.innerHTML = "<li>No items in cart.</li>";
  } else {
    cartItems.innerHTML = state.cart.map((item, idx) => `
      <li>
        ${item.title} - R${item.price}
        <button class="ghost-btn" data-remove-cart="${idx}">Remove</button>
      </li>
    `).join("");
  }
  const total = state.cart.reduce((sum, item) => sum + item.price, 0);
  el("cartTotal").textContent = `R${total}`;
}

function renderLatePayments() {
  el("latePayments").innerHTML = state.invoices.map((invoice) => {
    const lateFee = invoice.daysOverdue > 2 ? 50 : 0;
    const status = lateFee ? `Late fee applied (R${lateFee})` : "Within grace period";
    return `<li>${invoice.id} - ${invoice.parent} - ${invoice.daysOverdue} days overdue - ${status}</li>`;
  }).join("");
}

function renderSaturdayRequestsAdmin() {
  const list = el("saturdayRequests");
  if (state.saturdayRequests.length === 0) {
    list.innerHTML = "<li>No pending Saturday requests.</li>";
    return;
  }
  list.innerHTML = state.saturdayRequests.map((req, index) => `
    <li>
      <strong>${req.student}</strong> - ${req.dateTime} - ${req.status}
      <div class="action-row">
        <button class="ghost-btn" data-approve-request="${index}">Approve</button>
        <button class="ghost-btn" data-reject-request="${index}">Reject</button>
      </div>
    </li>
  `).join("");
}

function renderAccountData() {
  el("purchaseHistory").innerHTML = state.purchases.length
    ? state.purchases.map((purchase) => `<li>${purchase}</li>`).join("")
    : "<li>No purchases yet.</li>";

  el("downloadedResources").innerHTML = state.purchases.length
    ? state.purchases.map((purchase) => `<li>${purchase} (PDF download)</li>`).join("")
    : "<li>No downloads yet.</li>";

  el("upcomingSessions").innerHTML = state.sessions.length
    ? state.sessions.map((session) => `<li>${session}</li>`).join("")
    : "<li>No sessions booked yet.</li>";

  const revenue = state.purchases.reduce((sum, item) => {
    const value = Number(item.match(/R(\d+)/)?.[1] || 0);
    return sum + value;
  }, 0);
  el("txnCount").textContent = String(state.purchases.length);
  el("totalRevenue").textContent = `R${revenue}`;
  el("consentCount").textContent = String(state.consentLogs.length);

  const activePackage = getActivePackage();
  if (activePackage) {
    el("currentPackage").textContent = activePackage.packageLabel;
    el("remainingLessons").textContent = String(activePackage.remainingLessons);
    el("portalLessons").textContent = String(activePackage.remainingLessons);
    el("packageExpiry").textContent = activePackage.expiresOn;
  } else if (state.package) {
    el("currentPackage").textContent = `${state.package.packageLabel} (Expired/Used)`;
    el("remainingLessons").textContent = String(state.package.remainingLessons);
    el("portalLessons").textContent = String(state.package.remainingLessons);
    el("packageExpiry").textContent = state.package.expiresOn;
  } else {
    el("currentPackage").textContent = "None";
    el("remainingLessons").textContent = "0";
    el("portalLessons").textContent = "0";
    el("packageExpiry").textContent = "Not purchased";
  }

  renderSaturdayRequestsAdmin();
  renderLatePayments();
}

function logConsent(contextLabel) {
  state.consentLogs.push({
    context: contextLabel,
    role: state.role,
    userName: state.userName || "Anonymous",
    timestamp: new Date().toISOString(),
  });
}

function purchasePackage(packageKey) {
  const packageInfo = packageCatalog[packageKey];
  if (!packageInfo) return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 42);
  state.package = {
    packageKey,
    packageLabel: packageInfo.label,
    remainingLessons: packageInfo.lessons,
    expiresOn: expires.toISOString().slice(0, 10),
  };
  state.purchases.push(`${packageInfo.label} - R${packageInfo.price}`);
  saveState();
  renderAccountData();
  alert(`${packageInfo.label} purchased successfully.`);
}

function setupEvents() {
  el("mainNav").addEventListener("click", (event) => {
    if (event.target.matches("[data-view]")) showView(event.target.dataset.view);
  });

  el("signInBtn").addEventListener("click", () => {
    state.role = el("roleSelect").value;
    state.userName = el("userNameInput").value.trim();
    saveState();
    renderNavAccess();
    showView("landing");
  });

  el("langToggle").addEventListener("click", () => {
    state.language = state.language === "en" ? "af" : "en";
    saveState();
    renderTranslations();
  });

  ["filterGrade", "filterSubject", "filterLanguage", "searchResource"].forEach((id) => {
    el(id).addEventListener("input", renderResources);
  });

  el("resourceGrid").addEventListener("click", (event) => {
    const addId = event.target.getAttribute("data-add-resource");
    if (!addId) return;
    const item = resources.find((entry) => entry.id === Number(addId));
    if (!item) return;
    state.cart.push(item);
    saveState();
    renderCart();
  });

  el("cartItems").addEventListener("click", (event) => {
    const removeIdx = event.target.getAttribute("data-remove-cart");
    if (removeIdx === null) return;
    state.cart.splice(Number(removeIdx), 1);
    saveState();
    renderCart();
  });

  el("openCartBtn").addEventListener("click", () => el("cartDrawer").classList.add("open"));
  el("closeCartBtn").addEventListener("click", () => el("cartDrawer").classList.remove("open"));

  el("checkoutBtn").addEventListener("click", () => {
    if (!el("cartAgreeTerms").checked) {
      alert("You must agree to Terms before checkout.");
      return;
    }
    if (state.cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    logConsent("Marketplace checkout");
    state.cart.forEach((item) => state.purchases.push(`${item.title} - R${item.price}`));
    state.cart = [];
    saveState();
    renderCart();
    renderAccountData();
    alert("Marketplace checkout successful.");
  });

  ["groupSize", "neuroProgram", "firstEnrollmentFee", "isFirstBooking", "packageUseMode"]
    .forEach((id) => el(id).addEventListener("change", calculateBookingPrice));

  el("bookingDate").addEventListener("change", () => {
    renderTimeSlots();
    const date = new Date(`${el("bookingDate").value}T12:00:00`);
    if (date.getDay() === 6) {
      showView("saturday");
      alert("Saturday calendar slots are disabled. Please submit a manual Saturday request.");
    }
  });

  el("buyPackageBtn").addEventListener("click", () => {
    const packageKey = el("packageSelect").value;
    if (!packageKey) {
      alert("Select a package first.");
      return;
    }
    purchasePackage(packageKey);
  });

  el("confirmBookingBtn").addEventListener("click", () => {
    if (!el("bookingAgreeTerms").checked) {
      alert("You must agree to Terms before booking checkout.");
      return;
    }

    const slotText = el("bookingTime").value || "";
    if (slotText.includes("Saturday manual request") || slotText.includes("No Sunday")) {
      alert("Please submit a manual Saturday request.");
      return;
    }

    const packageUseMode = el("packageUseMode").value;
    const activePackage = getActivePackage();
    const usingPackage = packageUseMode === "use_existing";
    if (usingPackage && !activePackage) {
      alert("No valid active package available. Buy a package or switch to no package.");
      return;
    }

    logConsent("Tutoring checkout");
    const total = calculateBookingPrice();
    const student = el("studentName").value.trim() || "Student";
    const detail = `${student} | ${el("bookingDate").value} ${el("bookingTime").value} | ${el("serviceType").value} | Group ${el("groupSize").value} | R${total}`;
    state.sessions.push(detail);
    state.purchases.push(`Tutoring Session - R${total}`);
    if (usingPackage && activePackage) {
      state.package.remainingLessons -= 1;
    }
    el("successDetails").textContent = detail;
    saveState();
    renderAccountData();
    showView("bookingSuccess");
  });

  el("saturdayForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const student = event.target.querySelector("input[type='text']").value.trim() || "Student";
    const dateTime = event.target.querySelector("input[type='datetime-local']").value;
    state.saturdayRequests.push({
      student,
      dateTime,
      status: "Pending",
    });
    saveState();
    renderAccountData();
    alert("Saturday request submitted for admin approval.");
    event.target.reset();
  });

  el("saturdayRequests").addEventListener("click", (event) => {
    const approveIdx = event.target.getAttribute("data-approve-request");
    const rejectIdx = event.target.getAttribute("data-reject-request");
    if (approveIdx !== null) {
      state.saturdayRequests[Number(approveIdx)].status = "Approved";
      saveState();
      renderAccountData();
    }
    if (rejectIdx !== null) {
      state.saturdayRequests[Number(rejectIdx)].status = "Rejected";
      saveState();
      renderAccountData();
    }
  });

  ["enrollmentForm", "resourceRequestForm"].forEach((formId) => {
    el(formId).addEventListener("submit", (event) => {
      event.preventDefault();
      alert("Form submitted for review.");
      event.target.reset();
    });
  });

  el("exportDataBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexalearn-local-export.json";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function init() {
  populateSelect("gradeLevel", grades);
  populateSelect("saturdayGrade", grades);
  populateSelect("resourceGrade", grades);
  populateSelect("filterGrade", grades, true);
  populateSelect("filterSubject", [...new Set(resources.map((r) => r.subject))], true);
  populateSelect("filterLanguage", [...new Set(resources.map((r) => r.language))], true);

  el("roleSelect").value = state.role;
  el("userNameInput").value = state.userName;

  renderTranslations();
  renderNavAccess();
  renderResources();
  renderCart();
  renderTimeSlots();
  calculateBookingPrice();
  renderAccountData();
  setupEvents();
}

init();
