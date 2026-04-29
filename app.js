const STORAGE_KEY = "nexalearn_v4";
const SUPABASE_URL = "https://eitnvvzsaipuvtbrauuu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_U3rgdE6ISG0xmDsgeCRM3Q_PPdAaW6r";

const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const defaultState = {
  role: "guest",
  displayName: "",
  promoRate: 0,
  rates: { "30": 130, "45": 190, "60": 250 },
  packageDeals: [
    { name: "Starter 4x30", price: 520 },
    { name: "Core 4x45", price: 760 },
    { name: "Boost 8x45", price: 1440 },
  ],
  blockedDates: [],
  cart: [],
  products: [],
  purchases: [],
  bookings: [],
  newsletter: [],
  nextSlots: ["08:00", "09:00", "10:00", "11:00", "14:30", "15:30", "16:30"],
  user: null,
};

let state = loadState();

function el(id) { return document.getElementById(id); }
function money(v) { return `R${Math.round(Number(v || 0))}`; }
function currentDateKey() { return new Date().toISOString().slice(0, 10); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch (_e) {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    role: state.role,
    displayName: state.displayName,
    promoRate: state.promoRate,
    rates: state.rates,
    packageDeals: state.packageDeals,
    blockedDates: state.blockedDates,
    cart: state.cart,
    newsletter: state.newsletter,
  }));
}

function roleAllowedViews(role) {
  if (role === "admin") return ["home", "shop", "tutoring", "bookings", "account", "admin", "extras", "contact"];
  if (role === "customer") return ["home", "shop", "tutoring", "bookings", "account", "extras", "contact"];
  return ["home", "shop", "tutoring", "bookings", "extras", "contact"];
}

function setView(viewId) {
  if (!roleAllowedViews(state.role).includes(viewId)) return alert("This section is restricted for your current role.");
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll("#navTabs button").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewId));
}

function renderRole() {
  const userTag = state.user ? ` | ${state.user.email}` : "";
  el("roleBadge").textContent = `${state.role.toUpperCase()}${userTag}`;
  document.querySelectorAll("#navTabs button").forEach((btn) => {
    const allowed = roleAllowedViews(state.role).includes(btn.dataset.view);
    btn.disabled = !allowed;
    btn.style.opacity = allowed ? "1" : ".45";
  });
}

function productCategories() { return ["All", ...new Set(state.products.map((p) => p.category))]; }
function productLevels() { return ["All", ...new Set(state.products.map((p) => p.level))]; }

function renderFilters() {
  el("categoryFilter").innerHTML = productCategories().map((c) => `<option>${c}</option>`).join("");
  el("levelFilter").innerHTML = productLevels().map((l) => `<option>${l}</option>`).join("");
}

function renderProducts() {
  const category = el("categoryFilter").value || "All";
  const level = el("levelFilter").value || "All";
  const search = (el("productSearch").value || "").trim().toLowerCase();
  const list = state.products.filter((p) => {
    const c = category === "All" || p.category === category;
    const l = level === "All" || p.level === level;
    const s = p.title.toLowerCase().includes(search);
    return c && l && s;
  });
  el("productGrid").innerHTML = list.map((p) => `
    <article class="product">
      <img src="${p.thumb || "https://via.placeholder.com/800x500?text=NexaLearn+Resource"}" alt="${p.title}">
      <div class="body">
        <h3>${p.title}</h3>
        <div class="meta"><span>${p.category}</span><span>${p.level}</span></div>
        <p class="total">${money(p.price)}</p>
        <div class="row">
          <a class="btn ghost" href="${p.sampleUrl || "#"}" target="_blank" rel="noopener">Preview</a>
          <button class="btn primary" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join("") || "<p>No products found.</p>";
}

function renderCart() {
  el("cartItems").innerHTML = state.cart.length
    ? state.cart.map((i, idx) => `<li>${i.title} - ${money(i.price)} <button class="btn ghost" data-remove="${idx}">Remove</button></li>`).join("")
    : "<li>Cart is empty.</li>";
  el("cartTotal").textContent = money(state.cart.reduce((s, i) => s + i.price, 0));
}

function renderRates() {
  el("tutoringRates").innerHTML = Object.entries(state.rates).map(([m, r]) => `<li>${m} min: ${money(r)}</li>`).join("");
  el("packageDeals").innerHTML = state.packageDeals.map((d) => `<li>${d.name}: ${money(d.price)}</li>`).join("");
}

function availableSlotsForDate(dateKey) {
  if (!dateKey) return [];
  if (state.blockedDates.includes(dateKey)) return [];
  const day = new Date(`${dateKey}T12:00:00`).getDay();
  if (day === 0 || day === 6) return [];
  const already = state.bookings.filter((b) => b.date === dateKey).map((b) => b.slot);
  return state.nextSlots.filter((s) => !already.includes(s));
}

function renderBookingSlots() {
  const dateKey = el("bookingDate").value;
  const slots = availableSlotsForDate(dateKey);
  el("bookingSlot").innerHTML = slots.length ? slots.map((s) => `<option>${s}</option>`).join("") : "<option>No slots available</option>";
  const blocked = state.blockedDates.includes(dateKey);
  el("slotPreview").textContent = dateKey ? `${dateKey}: ${blocked ? "Blocked by admin" : `${slots.length} slot(s) available`}` : "Pick a date to see availability.";
}

function bookingAmount() {
  const duration = el("duration").value;
  const base = Number(state.rates[duration] || 0);
  return Math.max(0, base - (base * Number(state.promoRate || 0) / 100));
}

function renderBookingAmount() {
  el("bookingTotal").textContent = `Booking total: ${money(bookingAmount())}`;
}

function renderAccount() {
  el("purchaseList").innerHTML = state.purchases.length
    ? state.purchases.map((p) => `<li>${p.date} - ${p.title} - ${money(p.amount)}</li>`).join("")
    : "<li>No purchases yet.</li>";
  el("downloadList").innerHTML = state.purchases.length
    ? state.purchases.map((p) => `<li><a href="${p.downloadUrl || "#"}" target="_blank" rel="noopener">${p.title}</a></li>`).join("")
    : "<li>No downloads yet.</li>";
  el("bookingList").innerHTML = state.bookings.length
    ? state.bookings.map((b) => `<li>${b.date} ${b.slot} - ${b.student} (${b.type}, ${b.duration} min)</li>`).join("")
    : "<li>No bookings yet.</li>";
}

function renderAdminProducts() {
  el("adminProductList").innerHTML = state.products.map((p) => `
    <li>${p.title} - ${money(p.price)}
      <button class="btn ghost" data-edit="${p.id}">Edit Price</button>
      <button class="btn ghost" data-del="${p.id}">Delete</button>
    </li>`).join("");
}

function renderBlockedDates() {
  el("blockedDates").innerHTML = state.blockedDates.length
    ? state.blockedDates.map((d, i) => `<li>${d} <button class="btn ghost" data-unblock="${i}">Unblock</button></li>`).join("")
    : "<li>No blocked dates.</li>";
}

function renderStats() {
  const sales = state.purchases.reduce((sum, p) => sum + p.amount, 0);
  el("salesTotal").textContent = money(sales);
  el("ordersCount").textContent = String(state.purchases.length);
  el("bookingsCount").textContent = String(state.bookings.length);
}

async function ensureProfile(roleChoice, nameChoice) {
  if (!supabaseClient || !state.user) return;
  const chosenRole = roleChoice === "admin" ? "admin" : "parent";
  await supabaseClient.from("profiles").upsert({
    id: state.user.id,
    role: chosenRole,
    full_name: nameChoice || null,
  });
}

async function fetchProfileRole() {
  if (!supabaseClient || !state.user) return "guest";
  const { data } = await supabaseClient.from("profiles").select("role,full_name").eq("id", state.user.id).maybeSingle();
  if (!data) return "customer";
  state.displayName = data.full_name || state.displayName;
  return data.role === "admin" ? "admin" : "customer";
}

async function syncProductsFromSupabase() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from("marketplace_resources")
    .select("id,title,grade_level,subject,price_zar,file_path")
    .order("title");
  if (error || !data) return;
  state.products = data.map((row) => ({
    id: String(row.id),
    title: row.title,
    category: row.subject || "General",
    level: row.grade_level || "Mixed",
    price: Number(row.price_zar || 0),
    thumb: "",
    sampleUrl: row.file_path || "#",
    downloadUrl: row.file_path || "#",
  }));
}

async function getOrCreateStudent(studentName) {
  if (!supabaseClient || !state.user) throw new Error("Login required.");
  const trimmed = studentName.trim();
  const { data: existing } = await supabaseClient
    .from("students")
    .select("id,student_name")
    .eq("parent_user_id", state.user.id)
    .ilike("student_name", trimmed)
    .limit(1);
  if (existing && existing.length) return existing[0].id;
  const { data: created, error } = await supabaseClient
    .from("students")
    .insert({
      parent_user_id: state.user.id,
      student_name: trimmed,
      grade_level: "Not set",
      subjects: "General",
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

async function insertConsent(contextLabel) {
  if (!supabaseClient || !state.user) return;
  await supabaseClient.from("consent_logs").insert({
    user_id: state.user.id,
    context: contextLabel,
    terms_version: "v1",
  });
}

async function createOrderFromCart() {
  if (!supabaseClient || !state.user) throw new Error("Login required.");
  const total = state.cart.reduce((s, i) => s + i.price, 0);
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      parent_user_id: state.user.id,
      total_zar: total,
      payment_method: "SnapScan",
      payment_reference: "[StudentName_Month]",
      status: "paid",
    })
    .select("id")
    .single();
  if (orderError) throw orderError;

  const items = state.cart.map((item) => ({
    order_id: order.id,
    resource_id: item.id,
    price_zar: item.price,
  }));
  const { error: itemError } = await supabaseClient.from("order_items").insert(items);
  if (itemError) throw itemError;
}

async function createBooking(booking) {
  if (!supabaseClient || !state.user) throw new Error("Login required.");
  const studentId = await getOrCreateStudent(booking.student);
  const { error } = await supabaseClient.from("tutoring_bookings").insert({
    student_id: studentId,
    session_date: booking.date,
    session_time: booking.slot,
    service_type: booking.service,
    delivery_mode: booking.type,
    session_language: "English",
    group_size: 1,
    neuro_addon: false,
    amount_zar: booking.amount,
  });
  if (error) throw error;
}

async function insertOrUpdateProduct(product, existingId = null) {
  if (!supabaseClient) throw new Error("Supabase unavailable.");
  if (existingId) {
    const { error } = await supabaseClient
      .from("marketplace_resources")
      .update({
        title: product.title,
        grade_level: product.level,
        subject: product.category,
        price_zar: product.price,
      })
      .eq("id", existingId);
    if (error) throw error;
    return;
  }
  const { error } = await supabaseClient.from("marketplace_resources").insert({
    title: product.title,
    grade_level: product.level,
    subject: product.category,
    language: "English",
    price_zar: product.price,
    file_path: product.downloadUrl || null,
  });
  if (error) throw error;
}

async function deleteProductRemote(id) {
  if (!supabaseClient) return;
  await supabaseClient.from("marketplace_resources").delete().eq("id", id);
}

async function refreshAccountFromSupabase() {
  if (!supabaseClient || !state.user) return;

  const { data: orders } = await supabaseClient
    .from("orders")
    .select("id,total_zar,created_at,status");
  const { data: items } = await supabaseClient
    .from("order_items")
    .select("order_id,price_zar,resource_id,marketplace_resources(title,file_path)");
  const orderMap = new Map((orders || []).map((o) => [o.id, o]));
  state.purchases = (items || []).map((it) => {
    const ord = orderMap.get(it.order_id);
    return {
      date: ord?.created_at?.slice(0, 10) || currentDateKey(),
      title: it.marketplace_resources?.title || "Resource",
      amount: Number(it.price_zar || 0),
      downloadUrl: it.marketplace_resources?.file_path || "#",
    };
  });

  const { data: students } = await supabaseClient.from("students").select("id");
  const studentIds = (students || []).map((s) => s.id);
  if (studentIds.length) {
    const { data: bookings } = await supabaseClient
      .from("tutoring_bookings")
      .select("session_date,session_time,service_type,delivery_mode,amount_zar,students(student_name)")
      .in("student_id", studentIds);
    state.bookings = (bookings || []).map((b) => ({
      date: b.session_date,
      slot: b.session_time,
      student: b.students?.student_name || "Student",
      type: b.delivery_mode,
      duration: "45",
      service: b.service_type,
      amount: Number(b.amount_zar || 0),
    }));
  } else {
    state.bookings = [];
  }
}

function wireEvents() {
  el("navTabs").addEventListener("click", (e) => {
    if (e.target.matches("[data-view]")) setView(e.target.dataset.view);
  });

  el("loginBtn").addEventListener("click", async () => {
    state.role = el("roleSelect").value;
    state.displayName = el("displayName").value.trim();
    saveState();
    if (state.user) {
      try {
        await ensureProfile(state.role, state.displayName);
        state.role = await fetchProfileRole();
      } catch (_e) {}
    } else {
      state.role = state.role === "admin" ? "admin" : "customer";
    }
    renderRole();
    if (state.role !== "admin" && document.querySelector("#admin.view.active")) setView("home");
  });

  el("categoryFilter").addEventListener("change", renderProducts);
  el("levelFilter").addEventListener("change", renderProducts);
  el("productSearch").addEventListener("input", renderProducts);

  el("productGrid").addEventListener("click", (e) => {
    const id = e.target.getAttribute("data-add");
    if (!id) return;
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    state.cart.push(product);
    saveState();
    renderCart();
  });

  el("openCartBtn").addEventListener("click", () => el("cartDrawer").classList.add("open"));
  el("closeCartBtn").addEventListener("click", () => el("cartDrawer").classList.remove("open"));

  el("cartItems").addEventListener("click", (e) => {
    const idx = e.target.getAttribute("data-remove");
    if (idx === null) return;
    state.cart.splice(Number(idx), 1);
    saveState();
    renderCart();
  });

  el("checkoutBtn").addEventListener("click", async () => {
    if (!el("termsCart").checked) return alert("Please agree to Terms.");
    if (!el("paidCart").checked) return alert("Payment required to confirm purchase.");
    if (!state.cart.length) return alert("Cart is empty.");
    if (!state.user) return alert("Please sign in first (Supabase auth) before checkout.");

    try {
      await createOrderFromCart();
      await insertConsent("Marketplace checkout");
      await refreshAccountFromSupabase();
      state.cart = [];
      saveState();
      renderCart();
      renderAccount();
      renderStats();
      el("cartDrawer").classList.remove("open");
      alert("Checkout complete. Downloads are now available in My Account.");
    } catch (err) {
      alert(`Checkout failed: ${err.message || "Unknown error"}`);
    }
  });

  el("bookingDate").addEventListener("change", renderBookingSlots);
  el("duration").addEventListener("change", renderBookingAmount);

  el("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = el("bookingDate").value;
    const slot = el("bookingSlot").value;
    if (!date || !slot || slot === "No slots available") return alert("Please select an available slot.");
    if (!el("termsBooking").checked) return alert("Please agree to Terms.");
    if (!el("paidBooking").checked) return alert("Payment required to confirm booking.");
    if (!state.user) return alert("Please sign in first (Supabase auth) before booking.");

    const booking = {
      student: el("studentName").value.trim(),
      date,
      slot,
      type: el("sessionType").value,
      duration: el("duration").value,
      service: el("serviceName").value,
      amount: bookingAmount(),
    };
    try {
      await createBooking(booking);
      await insertConsent("Tutoring checkout");
      await refreshAccountFromSupabase();
      renderBookingSlots();
      renderAccount();
      renderStats();
      e.target.reset();
      renderBookingAmount();
      alert("Booking confirmed. Confirmation email queued.");
    } catch (err) {
      alert(`Booking failed: ${err.message || "Unknown error"}`);
    }
  });

  el("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.role !== "admin") return alert("Admin only.");
    const product = {
      title: el("pTitle").value.trim(),
      category: el("pCategory").value.trim(),
      level: el("pLevel").value.trim(),
      price: Number(el("pPrice").value),
      thumb: el("pThumb").value.trim(),
      sampleUrl: el("pSample").value.trim() || "#",
      downloadUrl: el("pDownload").value.trim() || "#",
    };
    try {
      await insertOrUpdateProduct(product, null);
      await syncProductsFromSupabase();
      saveState();
      renderFilters();
      renderProducts();
      renderAdminProducts();
      e.target.reset();
    } catch (err) {
      alert(`Could not save product. ${err.message || ""}`);
    }
  });

  el("adminProductList").addEventListener("click", async (e) => {
    const editId = e.target.getAttribute("data-edit");
    const delId = e.target.getAttribute("data-del");
    if (editId) {
      const p = state.products.find((x) => x.id === editId);
      if (!p) return;
      const next = prompt(`New price for ${p.title}`, String(p.price));
      if (!next) return;
      p.price = Number(next);
      try { await insertOrUpdateProduct(p, editId); } catch (err) { alert(`Price update failed: ${err.message || ""}`); }
    }
    if (delId) {
      state.products = state.products.filter((x) => x.id !== delId);
      try { await deleteProductRemote(delId); } catch (_e) {}
    }
    await syncProductsFromSupabase();
    saveState();
    renderFilters();
    renderProducts();
    renderAdminProducts();
  });

  el("pricingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.role !== "admin") return alert("Admin only.");
    state.rates["30"] = Number(el("rate30").value || state.rates["30"]);
    state.rates["45"] = Number(el("rate45").value || state.rates["45"]);
    state.rates["60"] = Number(el("rate60").value || state.rates["60"]);
    state.promoRate = Number(el("promoRate").value || 0);
    saveState();
    renderRates();
    renderBookingAmount();
    alert("Pricing updated.");
  });

  el("blockDateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.role !== "admin") return alert("Admin only.");
    const date = el("blockDate").value;
    if (!date) return;
    if (!state.blockedDates.includes(date)) state.blockedDates.push(date);
    saveState();
    renderBlockedDates();
    renderBookingSlots();
    e.target.reset();
  });

  el("blockedDates").addEventListener("click", (e) => {
    const idx = e.target.getAttribute("data-unblock");
    if (idx === null) return;
    state.blockedDates.splice(Number(idx), 1);
    saveState();
    renderBlockedDates();
    renderBookingSlots();
  });

  el("newsletterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = el("newsletterEmail").value.trim();
    if (!email) return;
    state.newsletter.push({ email, date: new Date().toISOString() });
    saveState();
    alert("Newsletter signup complete.");
    e.target.reset();
  });

  el("contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thank you. Your inquiry has been received.");
    e.target.reset();
  });
}

async function bootstrapAuth() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  state.user = data.session?.user || null;
  if (state.user) {
    state.role = await fetchProfileRole();
  } else {
    state.role = "guest";
  }
}

function wireAuthEvents() {
  if (!supabaseClient) return;

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    if (state.user) {
      state.role = await fetchProfileRole();
      await refreshAccountFromSupabase();
    } else {
      state.role = "guest";
      state.purchases = [];
      state.bookings = [];
    }
    renderRole();
    renderAccount();
    renderStats();
  });

  el("signUpBtn").addEventListener("click", async () => {
    const email = el("authEmail").value.trim();
    const password = el("authPassword").value;
    if (!email || !password) return alert("Enter email and password.");
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return alert(`Sign up failed: ${error.message}`);
    alert("Sign up successful. Please check your email if confirmation is required.");
  });

  el("signInBtn").addEventListener("click", async () => {
    const email = el("authEmail").value.trim();
    const password = el("authPassword").value;
    if (!email || !password) return alert("Enter email and password.");
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert(`Sign in failed: ${error.message}`);
    alert("Signed in.");
  });

  el("signOutBtn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    alert("Signed out.");
  });
}

async function init() {
  await bootstrapAuth();
  await syncProductsFromSupabase();
  if (state.user) await refreshAccountFromSupabase();

  renderRole();
  renderFilters();
  renderProducts();
  renderCart();
  renderRates();
  renderBookingAmount();
  renderAccount();
  renderAdminProducts();
  renderBlockedDates();
  renderStats();

  el("roleSelect").value = state.role === "admin" ? "admin" : (state.role === "customer" ? "customer" : "guest");
  el("displayName").value = state.displayName;
  el("rate30").value = state.rates["30"];
  el("rate45").value = state.rates["45"];
  el("rate60").value = state.rates["60"];
  el("promoRate").value = state.promoRate;

  wireEvents();
  wireAuthEvents();
}

init();
