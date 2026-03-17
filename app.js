const storageKey = "script-squad-data-v1";
const titleInput = document.querySelector("#script-title");
const notesInput = document.querySelector("#script-notes");
const scenesList = document.querySelector("#scenes-list");
const sceneTemplate = document.querySelector("#scene-template");
const lineTemplate = document.querySelector("#line-template");
const preview = document.querySelector("#script-preview");
const autosaveStatus = document.querySelector("#autosave-status");

const state = {
  title: "",
  notes: "",
  scenes: [],
};

function newScene() {
  return { heading: "", direction: "", lines: [{ character: "", text: "" }] };
}

function render() {
  titleInput.value = state.title;
  notesInput.value = state.notes;
  scenesList.innerHTML = "";

  state.scenes.forEach((scene, sceneIndex) => {
    const sceneNode = sceneTemplate.content.firstElementChild.cloneNode(true);
    const headingInput = sceneNode.querySelector(".scene-heading");
    const directionInput = sceneNode.querySelector(".scene-direction");
    const linesContainer = sceneNode.querySelector(".lines");

    headingInput.value = scene.heading;
    directionInput.value = scene.direction;

    headingInput.addEventListener("input", (event) => {
      scene.heading = event.target.value;
      update();
    });

    directionInput.addEventListener("input", (event) => {
      scene.direction = event.target.value;
      update();
    });

    sceneNode.querySelector(".delete-scene").addEventListener("click", () => {
      state.scenes.splice(sceneIndex, 1);
      if (state.scenes.length === 0) {
        state.scenes.push(newScene());
      }
      update();
    });

    scene.lines.forEach((line, lineIndex) => {
      const lineNode = lineTemplate.content.firstElementChild.cloneNode(true);
      const charInput = lineNode.querySelector(".line-character");
      const textInput = lineNode.querySelector(".line-text");

      charInput.value = line.character;
      textInput.value = line.text;

      charInput.addEventListener("input", (event) => {
        line.character = event.target.value.toUpperCase();
        update();
      });

      textInput.addEventListener("input", (event) => {
        line.text = event.target.value;
        update();
      });

      lineNode.querySelector(".delete-line").addEventListener("click", () => {
        scene.lines.splice(lineIndex, 1);
        if (scene.lines.length === 0) {
          scene.lines.push({ character: "", text: "" });
        }
        update();
      });

      linesContainer.append(lineNode);
    });

    sceneNode.querySelector(".add-line").addEventListener("click", () => {
      scene.lines.push({ character: "", text: "" });
      update();
    });

    scenesList.append(sceneNode);
  });

  preview.textContent = generateScriptText();
}

function generateScriptText() {
  const chunks = [];
  chunks.push((state.title || "UNTITLED SCRIPT").toUpperCase());
  if (state.notes.trim()) {
    chunks.push(`\nNOTES:\n${state.notes.trim()}`);
  }

  state.scenes.forEach((scene, index) => {
    chunks.push(`\n\nSCENE ${index + 1}: ${scene.heading || "(No heading yet)"}`);
    if (scene.direction.trim()) {
      chunks.push(`\n${scene.direction.trim()}`);
    }

    scene.lines.forEach((line) => {
      if (line.character.trim() || line.text.trim()) {
        chunks.push(`\n\n${line.character || "CHARACTER"}\n${line.text}`);
      }
    });
  });

  return chunks.join("");
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  autosaveStatus.textContent = `Autosaved ${new Date().toLocaleTimeString()}`;
}

function update() {
  render();
  save();
}

function init() {
  const fromStorage = localStorage.getItem(storageKey);
  if (fromStorage) {
    try {
      const loaded = JSON.parse(fromStorage);
      state.title = loaded.title || "";
      state.notes = loaded.notes || "";
      state.scenes = Array.isArray(loaded.scenes) && loaded.scenes.length ? loaded.scenes : [newScene()];
    } catch {
      state.scenes = [newScene()];
    }
  } else {
    state.scenes = [newScene()];
  }

  titleInput.addEventListener("input", (event) => {
    state.title = event.target.value;
    update();
  });

  notesInput.addEventListener("input", (event) => {
    state.notes = event.target.value;
    update();
  });

  document.querySelector("#add-scene").addEventListener("click", () => {
    state.scenes.push(newScene());
    update();
  });

  document.querySelector("#export-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(state.title || "script").replace(/\s+/g, "-").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.querySelector("#import-json").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const loaded = JSON.parse(text);
    state.title = loaded.title || "";
    state.notes = loaded.notes || "";
    state.scenes = Array.isArray(loaded.scenes) && loaded.scenes.length ? loaded.scenes : [newScene()];
    update();
    event.target.value = "";
  });

  document.querySelector("#copy-text").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(generateScriptText());
      autosaveStatus.textContent = "Copied script to clipboard";
    } catch {
      autosaveStatus.textContent = "Clipboard blocked in this browser";
    }
  });

  update();
}

init();
