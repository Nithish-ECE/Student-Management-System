// ---------------------------------------------------------------------------
// Student Management System - Frontend logic
// Talks to the Django REST Framework API defined in backend/students/.
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:8000/api/students/";
document.getElementById("api-base-display").textContent = API_BASE;

const form = document.getElementById("student-form");
const idField = document.getElementById("student-id");
const nameField = document.getElementById("name");
const emailField = document.getElementById("email");
const ageField = document.getElementById("age");
const courseField = document.getElementById("course");
const phoneField = document.getElementById("phone");

const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

const tableBody = document.getElementById("student-table-body");
const emptyMessage = document.getElementById("empty-message");
const statusMessage = document.getElementById("status-message");

const searchInput = document.getElementById("search-input");
const courseFilter = document.getElementById("course-filter");

let debounceTimer = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showStatus(message, type = "success") {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`;
  statusMessage.classList.remove("hidden");
  setTimeout(() => statusMessage.classList.add("hidden"), 3500);
}

function clearFieldErrors() {
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
}

function applyFieldErrors(errors) {
  clearFieldErrors();
  Object.entries(errors).forEach(([field, messages]) => {
    const el = document.getElementById(`err-${field}`);
    if (el) el.textContent = Array.isArray(messages) ? messages[0] : String(messages);
  });
}

function resetForm() {
  form.reset();
  idField.value = "";
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelBtn.classList.add("hidden");
  clearFieldErrors();
}

function buildListUrl() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (courseFilter.value) params.set("course", courseFilter.value);
  const qs = params.toString();
  return qs ? `${API_BASE}?${qs}` : API_BASE;
}

// ---------------------------------------------------------------------------
// READ - fetch and render the student list
// ---------------------------------------------------------------------------

async function fetchStudents() {
  try {
    const res = await fetch(buildListUrl());
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    renderStudents(data.results ?? data); // supports paginated or plain list
  } catch (err) {
    showStatus(`Could not load students. Is the backend running at ${API_BASE}? (${err.message})`, "error");
    renderStudents([]);
  }
}

function renderStudents(students) {
  tableBody.innerHTML = "";

  if (!students.length) {
    emptyMessage.classList.remove("hidden");
    return;
  }
  emptyMessage.classList.add("hidden");

  for (const s of students) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${s.age}</td>
      <td>${escapeHtml(s.course)}</td>
      <td>${escapeHtml(s.phone || "-")}</td>
      <td class="actions-cell">
        <button class="btn-edit" data-id="${s.id}">Edit</button>
        <button class="btn-delete" data-id="${s.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// CLIENT-SIDE VALIDATION (server also validates - SOP section 9)
// ---------------------------------------------------------------------------

function validateForm() {
  const errors = {};

  if (!nameField.value.trim()) errors.name = "Name is required.";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailField.value.trim()) errors.email = "Email is required.";
  else if (!emailPattern.test(emailField.value.trim())) errors.email = "Enter a valid email address.";

  const age = Number(ageField.value);
  if (!ageField.value) errors.age = "Age is required.";
  else if (age < 15 || age > 100) errors.age = "Age must be between 15 and 100.";

  if (!courseField.value) errors.course = "Please select a course.";

  const phone = phoneField.value.trim();
  if (phone && !/^\+?\d{7,15}$/.test(phone)) errors.phone = "Phone must be 7-15 digits, optional leading +.";

  return errors;
}

// ---------------------------------------------------------------------------
// CREATE / UPDATE
// ---------------------------------------------------------------------------

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const clientErrors = validateForm();
  if (Object.keys(clientErrors).length) {
    applyFieldErrors(clientErrors);
    return;
  }
  clearFieldErrors();

  const payload = {
    name: nameField.value.trim(),
    email: emailField.value.trim(),
    age: Number(ageField.value),
    course: courseField.value,
    phone: phoneField.value.trim(),
  };

  const editingId = idField.value;
  const url = editingId ? `${API_BASE}${editingId}/` : API_BASE;
  const method = editingId ? "PATCH" : "POST";

  submitBtn.disabled = true;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 400) {
      const errors = await res.json();
      applyFieldErrors(errors);
      showStatus("Please fix the highlighted fields.", "error");
      return;
    }
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    showStatus(editingId ? "Student updated successfully." : "Student added successfully.", "success");
    resetForm();
    fetchStudents();
  } catch (err) {
    showStatus(`Request failed: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// EDIT (populate form) / DELETE (with confirmation)
// ---------------------------------------------------------------------------

tableBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("btn-edit")) {
    try {
      const res = await fetch(`${API_BASE}${id}/`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const s = await res.json();

      idField.value = s.id;
      nameField.value = s.name;
      emailField.value = s.email;
      ageField.value = s.age;
      courseField.value = s.course;
      phoneField.value = s.phone || "";

      formTitle.textContent = `Edit Student #${s.id}`;
      submitBtn.textContent = "Save Changes";
      cancelBtn.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      showStatus(`Could not load student: ${err.message}`, "error");
    }
  }

  if (e.target.classList.contains("btn-delete")) {
    if (!confirm("Delete this student record? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      showStatus("Student deleted.", "success");
      fetchStudents();
    } catch (err) {
      showStatus(`Delete failed: ${err.message}`, "error");
    }
  }
});

cancelBtn.addEventListener("click", resetForm);

// ---------------------------------------------------------------------------
// SEARCH / FILTER (debounced)
// ---------------------------------------------------------------------------

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchStudents, 300);
});
courseFilter.addEventListener("change", fetchStudents);

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

fetchStudents();
