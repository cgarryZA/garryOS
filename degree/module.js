/* ====================== LOAD MODULE ====================== */

const params = new URLSearchParams(window.location.search);
const moduleId = params.get("moduleId");

const state = JSON.parse(localStorage.getItem("degreeTrackerState"));
if (!state) throw new Error("No saved state");

let currentModule = null;

for (const d of state.degrees) {
  const m = d.modules.find(x => x.id === moduleId);
  if (m) currentModule = m;
}

if (!currentModule) {
  alert("Module not found");
  window.location.href = "degree.html";
}

/* ====================== ELEMENTS ====================== */

const titleEl = document.getElementById("module-title");
const lecturesDiv = document.getElementById("lectures");
const formativesDiv = document.getElementById("formatives");
const summativesDiv = document.getElementById("summatives");

const backBtn = document.getElementById("back-btn");
const addLectureBtn = document.getElementById("add-lecture-btn");
const addFormativeBtn = document.getElementById("add-formative-btn");
const addSummativeBtn = document.getElementById("add-summative-btn");

/* ====================== MODAL ====================== */

const modalBackdrop = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
const modalForm = document.getElementById("modal-form");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");

let modalSubmitHandler = null;

modalCancel.onclick = closeModal;

modalConfirm.onclick = () => {
  if (typeof modalSubmitHandler !== "function") return;
  const data = Object.fromEntries(new FormData(modalForm));
  modalSubmitHandler(data);
  closeModal();
};

function openModal(title, fields, onSubmit) {
  modalTitle.textContent = title;
  modalForm.innerHTML = "";
  modalSubmitHandler = onSubmit;

  fields.forEach(f => {
    const input = document.createElement("input");
    input.type = f.type;
    input.name = f.name;
    input.placeholder = f.label;
    input.required = f.required !== false;
    if (f.value !== undefined) input.value = f.value;
    if (f.min !== undefined) input.min = f.min;
    modalForm.appendChild(input);
  });

  modalBackdrop.hidden = false;
}

function closeModal() {
  modalBackdrop.hidden = true;
  modalForm.innerHTML = "";
  modalSubmitHandler = null;
}

/* ====================== UTILITIES ====================== */

function save() {
  localStorage.setItem("degreeTrackerState", JSON.stringify(state));
}

function weekdayFromDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "long" });
}

function removeById(arr, id) {
  const i = arr.findIndex(x => x.id === id);
  if (i !== -1) arr.splice(i, 1);
}

/* ====================== RENDER HELPERS ====================== */

function entryRow(textContent, onEdit, onDelete) {
  const row = document.createElement("div");
  row.className = "entry-row";

  const text = document.createElement("div");
  text.className = "entry-text";
  text.textContent = textContent;

  const actions = document.createElement("div");
  actions.className = "entry-actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.onclick = onEdit;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "danger-btn";
  deleteBtn.onclick = onDelete;

  actions.append(editBtn, deleteBtn);
  row.append(text, actions);
  return row;
}

/* ====================== RENDER ====================== */

titleEl.textContent = currentModule.title;

/* ----- Lectures ----- */

function renderLectures() {
  lecturesDiv.innerHTML = "";
  currentModule.lectures.forEach(l => {
    lecturesDiv.appendChild(
      entryRow(
        `${l.title} — ${l.day} ${l.startTime}-${l.endTime} (${l.occurrences} lectures)`,
        () => openEditLectureModal(l.id),
        () => {
          removeById(currentModule.lectures, l.id);
          save();
          renderLectures();
          console.table(currentModule.lectures);
        }
      )
    );
  });
}

/* ----- Formatives ----- */

function renderFormatives() {
  formativesDiv.innerHTML = "";
  currentModule.formatives.forEach(f => {
    formativesDiv.appendChild(
      entryRow(
        `${f.title} (due ${f.dueDate} ${f.dueTime})`,
        () => openEditFormativeModal(f.id),
        () => {
          removeById(currentModule.formatives, f.id);
          save();
          renderFormatives();
          console.table(currentModule.formatives);
        }
      )
    );
  });
}

/* ----- Summatives ----- */

function renderSummatives() {
  summativesDiv.innerHTML = "";
  currentModule.summatives.forEach(s => {
    summativesDiv.appendChild(
      entryRow(
        `${s.title} (${s.weight}%)`,
        () => openEditSummativeModal(s.id),
        () => {
          removeById(currentModule.summatives, s.id);
          save();
          renderSummatives();
          console.table(currentModule.summatives);
        }
      )
    );
  });
}

/* ====================== LECTURE MODALS ====================== */

function openAddLectureModal() {
  openModal("Add Lecture", [
    { name: "title", label: "Lecture title", type: "text" },
    { name: "startDate", label: "Start date", type: "date" },
    { name: "startTime", label: "Start time", type: "time" },
    { name: "endTime", label: "End time", type: "time" },
    { name: "occurrences", label: "Number of lectures", type: "number", min: 1, value: 1 }
  ], data => {
    currentModule.lectures.push({
      id: crypto.randomUUID(),
      title: data.title,
      startDate: data.startDate,
      day: weekdayFromDate(data.startDate),
      startTime: data.startTime,
      endTime: data.endTime,
      occurrences: Number(data.occurrences) || 1
    });
    save();
    renderLectures();
    console.table(currentModule.lectures);
  });
}

function openEditLectureModal(id) {
  const l = currentModule.lectures.find(x => x.id === id);
  if (!l) return;

  openModal("Edit Lecture", [
    { name: "title", type: "text", value: l.title },
    { name: "startDate", type: "date", value: l.startDate },
    { name: "startTime", type: "time", value: l.startTime },
    { name: "endTime", type: "time", value: l.endTime },
    { name: "occurrences", type: "number", min: 1, value: l.occurrences }
  ], data => {
    Object.assign(l, {
      title: data.title,
      startDate: data.startDate,
      day: weekdayFromDate(data.startDate),
      startTime: data.startTime,
      endTime: data.endTime,
      occurrences: Number(data.occurrences) || 1
    });
    save();
    renderLectures();
    console.table(currentModule.lectures);
  });
}

/* ====================== FORMATIVE MODALS ====================== */

function openEditFormativeModal(id) {
  const f = currentModule.formatives.find(x => x.id === id);
  if (!f) return;

  openModal("Edit Formative", [
    { name: "title", type: "text", value: f.title },
    { name: "dueDate", type: "date", value: f.dueDate },
    { name: "dueTime", type: "time", value: f.dueTime }
  ], data => {
    Object.assign(f, data);
    save();
    renderFormatives();
    console.table(currentModule.formatives);
  });
}

/* ====================== SUMMATIVE MODALS ====================== */

function openEditSummativeModal(id) {
  const s = currentModule.summatives.find(x => x.id === id);
  if (!s) return;

  openModal("Edit Summative", [
    { name: "title", type: "text", value: s.title },
    { name: "weight", type: "number", value: s.weight }
  ], data => {
    s.title = data.title;
    s.weight = Number(data.weight);
    save();
    renderSummatives();
    console.table(currentModule.summatives);
  });
}

/* ====================== ADD BUTTONS ====================== */

addLectureBtn.onclick = openAddLectureModal;

addFormativeBtn.onclick = () => {
  openModal("Add Formative", [
    { name: "title", type: "text" },
    { name: "dueDate", type: "date" },
    { name: "dueTime", type: "time" }
  ], data => {
    currentModule.formatives.push({ id: crypto.randomUUID(), ...data });
    save();
    renderFormatives();
    console.table(currentModule.formatives);
  });
};

addSummativeBtn.onclick = () => {
  openModal("Add Summative", [
    { name: "title", type: "text" },
    { name: "weight", type: "number" }
  ], data => {
    currentModule.summatives.push({
      id: crypto.randomUUID(),
      title: data.title,
      weight: Number(data.weight)
    });
    save();
    renderSummatives();
    console.table(currentModule.summatives);
  });
};

/* ====================== NAV ====================== */

backBtn.onclick = () => window.location.href = "degree.html";

/* ====================== INIT ====================== */

renderLectures();
renderFormatives();
renderSummatives();
