const { app, core, constants } = require("photoshop");
const { storage } = require("uxp");
const fs = storage.localFileSystem;

const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const qualityInput = document.getElementById("quality");
const maxWidthInput = document.getElementById("maxWidth");

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (type || "");
}

function getNextNumber(entries) {
  let max = 0;
  for (const entry of entries) {
    const match = entry.name.match(/^(\d+)\./);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  const next = max + 1;
  return next < 10 ? "0" + next : String(next);
}

let archiveFolder = null;
const TOKEN_KEY = "archiveFolderToken";

async function ensureArchiveFolder() {
  if (archiveFolder) return archiveFolder;

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      archiveFolder = await fs.getEntryForPersistentToken(token);
      if (archiveFolder) return archiveFolder;
    }
  } catch (e) { /* token expired or invalid */ }

  archiveFolder = await fs.getFolder({ initialDomain: storage.domains.userDesktop });
  if (archiveFolder) {
    const token = await fs.createPersistentToken(archiveFolder);
    localStorage.setItem(TOKEN_KEY, token);
  }
  return archiveFolder;
}

async function saveToArchive() {
  const doc = app.activeDocument;
  if (!doc) {
    setStatus("No document open.", "error");
    return;
  }

  saveBtn.disabled = true;
  setStatus("Preparing...");

  try {
    const folder = await ensureArchiveFolder();
    if (!folder) {
      setStatus("No folder selected.", "error");
      saveBtn.disabled = false;
      return;
    }

    const entries = await folder.getEntries();
    const paddedNum = getNextNumber(entries);
    const quality = parseInt(qualityInput.value, 10);
    const maxWidth = parseInt(maxWidthInput.value, 10);
    const fileName = paddedNum + ".webp";

    setStatus("Exporting " + fileName + "...");

    await core.executeAsModal(async (context) => {
      const dupDoc = await doc.duplicate();

      try {
        // Only flatten if there's a background layer (solid bg)
        // Otherwise keep transparency
        if (dupDoc.backgroundLayer) {
          dupDoc.flatten();
        } else if (dupDoc.layers.length > 1) {
          const batchMerge = require("photoshop").action.batchPlay;
          await batchMerge([
            { _obj: "stampVisible" }
          ], { modalBehavior: "execute" });
          while (dupDoc.layers.length > 1) {
            dupDoc.layers[dupDoc.layers.length - 1].delete();
          }
        }
        // Single layer, no background = already good, keep as is

        if (maxWidth > 0 && dupDoc.width > maxWidth) {
          await dupDoc.resizeImage(maxWidth, undefined, undefined, constants.ResampleMethod.BICUBICSHARPER);
        }

        const batchPlay = require("photoshop").action.batchPlay;
        const file = await folder.createFile(fileName, { overwrite: true });
        const token = await fs.createSessionToken(file);

        await batchPlay([
          {
            _obj: "save",
            as: {
              _obj: "WebPFormat",
              quality: quality
            },
            in: {
              _path: token,
              _kind: "local"
            },
            lowerCase: true,
            _options: { dialogOptions: "dontDisplay" }
          }
        ], { modalBehavior: "execute" });

        await dupDoc.close(constants.SaveOptions.DONOTSAVECHANGES);

      } catch (innerErr) {
        try { await dupDoc.close(constants.SaveOptions.DONOTSAVECHANGES); } catch (e) {}
        throw innerErr;
      }
    }, { commandName: "Save to Archive" });

    setStatus("Saved " + fileName + " (" + Math.round(doc.width) + "×" + Math.round(doc.height) + ")", "success");

  } catch (err) {
    setStatus("Error: " + err.message, "error");
  }

  saveBtn.disabled = false;
}

saveBtn.addEventListener("click", saveToArchive);
