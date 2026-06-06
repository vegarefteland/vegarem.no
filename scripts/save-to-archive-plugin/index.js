const { app, core, constants } = require("photoshop");
const { storage } = require("uxp");
const fs = storage.localFileSystem;

// Archive folder path relative to home
const ARCHIVE_PATH = "Desktop/vegarem.no/images/archive";

const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const qualityInput = document.getElementById("quality");
const maxWidthInput = document.getElementById("maxWidth");
const formatSelect = document.getElementById("format");

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (type || "");
}

async function getArchiveFolder() {
  // Get the user's home folder via a persistent token or known path
  try {
    const homeFolder = await fs.getFolder();
    // Navigate to archive — user will pick it once, then it's remembered
    return homeFolder;
  } catch (e) {
    return null;
  }
}

// Find next available number from file list
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

// Store the folder token so user only picks once
let archiveFolder = null;
const TOKEN_KEY = "archiveFolderToken";

async function ensureArchiveFolder() {
  // Try to get from stored token
  if (archiveFolder) return archiveFolder;

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      archiveFolder = await fs.getEntryForPersistentToken(token);
      if (archiveFolder) return archiveFolder;
    }
  } catch (e) { /* token expired or invalid */ }

  // Ask user to pick the archive folder
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
    // Get or pick the archive folder
    const folder = await ensureArchiveFolder();
    if (!folder) {
      setStatus("No folder selected.", "error");
      saveBtn.disabled = false;
      return;
    }

    // Read folder contents to find next number
    const entries = await folder.getEntries();
    const paddedNum = getNextNumber(entries);
    const format = formatSelect.value;
    const quality = parseInt(qualityInput.value, 10);
    const maxWidth = parseInt(maxWidthInput.value, 10);
    const ext = format === "jpg" ? ".jpg" : format === "png" ? ".png" : ".webp";
    const fileName = paddedNum + ext;

    setStatus("Exporting " + fileName + "...");

    // Duplicate, flatten, resize, export
    await core.executeAsModal(async (context) => {
      const dupDoc = await doc.duplicate();

      try {
        // Flatten
        await dupDoc.flatten();

        // Resize if needed
        if (maxWidth > 0 && dupDoc.width > maxWidth) {
          await dupDoc.resizeImage(maxWidth, undefined, undefined, constants.ResampleMethod.BICUBICSHARPER);
        }

        // Create the output file
        const file = await folder.createFile(fileName, { overwrite: true });

        // Save based on format
        if (format === "webp") {
          // Use batchPlay for webp export
          const batchPlay = require("photoshop").action.batchPlay;
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

        } else if (format === "png") {
          await dupDoc.saveAs.png(file, {
            compression: 6,
            interlaced: false
          });
        } else {
          await dupDoc.saveAs.jpg(file, {
            quality: Math.round(quality / 8.33)
          });
        }

        // Close the duplicate
        await dupDoc.close(constants.SaveOptions.DONOTSAVECHANGES);

      } catch (innerErr) {
        try { await dupDoc.close(constants.SaveOptions.DONOTSAVECHANGES); } catch (e) {}
        throw innerErr;
      }
    }, { commandName: "Save to Archive" });

    setStatus("Saved " + fileName, "success");

  } catch (err) {
    setStatus("Error: " + err.message, "error");
  }

  saveBtn.disabled = false;
}

saveBtn.addEventListener("click", saveToArchive);
