const degreesContainer = document.getElementById("degrees-container");
const addDegreeBtn = document.getElementById("add-degree-btn");

let state = JSON.parse(localStorage.getItem("degreeTrackerState")) ?? {
  version: 1,
  degrees: []
};

function save() {
  localStorage.setItem("degreeTrackerState", JSON.stringify(state));
}

function render() {
  degreesContainer.innerHTML = "";

  state.degrees.forEach(deg => {
    const degEl = document.createElement("div");
    degEl.className = "degree";

    degEl.innerHTML = `
      <h2>${deg.title}</h2>
      <button>Add Module</button>
      <div class="modules"></div>
    `;

    const modulesDiv = degEl.querySelector(".modules");
    const addModuleBtn = degEl.querySelector("button");

    addModuleBtn.onclick = () => {
      const title = prompt("Module title");
      if (!title) return;

      deg.modules.push({
        id: crypto.randomUUID(),
        title,
        lectures: [],
        formatives: [],
        summatives: []
      });

      save();
      render();
    };

    deg.modules.forEach(mod => {
      const m = document.createElement("div");
      m.className = "module-card";
      m.textContent = mod.title;

      m.onclick = () => {
        window.location.href = `module.html?moduleId=${mod.id}`;
      };

      modulesDiv.appendChild(m);
    });

    degreesContainer.appendChild(degEl);
  });
}

addDegreeBtn.onclick = () => {
  const title = prompt("Degree title");
  if (!title) return;

  state.degrees.push({
    id: crypto.randomUUID(),
    title,
    modules: []
  });

  save();
  render();
};

render();
