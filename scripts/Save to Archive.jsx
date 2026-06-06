/*
 * Save to Archive — Photoshop Script
 *
 * Exports the active document as a web-optimized file
 * to images/archive/ with the next available number.
 *
 * Install: Place in Photoshop's Scripts folder, or run via
 *          File → Scripts → Browse…
 *
 * Photoshop Scripts folder:
 *   Mac:  /Applications/Adobe Photoshop 2025/Presets/Scripts/
 *   Win:  C:\Program Files\Adobe\Adobe Photoshop 2025\Presets\Scripts\
 */

(function () {
  // ── CONFIG ──────────────────────────────────────────────
  var ARCHIVE_FOLDER = "~/Desktop/vegarem.no/images/archive";
  var QUALITY = 85;          // webp quality (1–100)
  var MAX_WIDTH = 2000;      // resize if wider than this (0 = no resize)
  // ────────────────────────────────────────────────────────

  if (!app.documents.length) {
    alert("No document open.");
    return;
  }

  var folder = new Folder(ARCHIVE_FOLDER);
  if (!folder.exists) {
    alert("Archive folder not found:\n" + folder.fsName);
    return;
  }

  // Find the next available number
  var files = folder.getFiles(/^\d+\./);
  var maxNum = 0;
  for (var i = 0; i < files.length; i++) {
    var name = decodeURI(files[i].name);
    var match = name.match(/^(\d+)\./);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  var nextNum = maxNum + 1;
  var paddedNum = (nextNum < 10 ? "0" : "") + nextNum;

  // Determine format — prefer webp, fall back to png for Photoshop versions without webp
  var useWebP = true;
  var ext = ".webp";
  var outputFile = new File(folder.fsName + "/" + paddedNum + ext);

  // Work on a flattened copy so we don't modify the original
  var doc = app.activeDocument;
  var dupe = doc.duplicate("_archive_export", true);

  try {
    // Flatten
    dupe.flatten();

    // Resize if needed
    if (MAX_WIDTH > 0 && dupe.width.as("px") > MAX_WIDTH) {
      dupe.resizeImage(
        new UnitValue(MAX_WIDTH, "px"),
        undefined,
        undefined,
        ResampleMethod.BICUBICSHARPER
      );
    }

    // Convert to 8-bit RGB if needed
    if (dupe.mode !== DocumentMode.RGB) dupe.changeMode(ChangeMode.RGB);
    if (dupe.bitsPerChannel !== BitsPerChannelType.EIGHT)
      dupe.bitsPerChannel = BitsPerChannelType.EIGHT;

    // Try webp export via Export As (Photoshop 2022+)
    // Fall back to PNG Save for Web if webp isn't available
    try {
      // Use ExportOptionsSaveForWeb for maximum compatibility
      var opts = new ExportOptionsSaveForWeb();
      opts.format = SaveDocumentType.PNG;
      opts.PNG8 = false;
      opts.quality = QUALITY;
      opts.interlaced = false;

      // First try webp via Generator / quick export
      // Photoshop CC 2022+ supports webp natively
      var webpDesc = new ActionDescriptor();
      var saveDesc = new ActionDescriptor();

      saveDesc.putEnumerated(
        stringIDToTypeID("format"),
        stringIDToTypeID("format"),
        stringIDToTypeID("WebPFormat")
      );
      saveDesc.putInteger(stringIDToTypeID("quality"), QUALITY);
      saveDesc.putPath(stringIDToTypeID("in"), outputFile);

      webpDesc.putObject(
        stringIDToTypeID("using"),
        stringIDToTypeID("SaveForWeb"),
        saveDesc
      );

      // Try the modern export approach
      try {
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("In  "), outputFile);

        var formatDesc = new ActionDescriptor();
        formatDesc.putInteger(stringIDToTypeID("quality"), QUALITY);

        desc.putObject(
          stringIDToTypeID("As  "),
          stringIDToTypeID("WebPFormat"),
          formatDesc
        );

        desc.putBoolean(stringIDToTypeID("LowerCase"), true);
        executeAction(stringIDToTypeID("save"), desc, DialogModes.NO);
      } catch (e1) {
        // WebP not available — fall back to PNG
        useWebP = false;
        ext = ".png";
        outputFile = new File(folder.fsName + "/" + paddedNum + ext);

        var pngOpts = new PNGSaveOptions();
        pngOpts.compression = 6;
        pngOpts.interlaced = false;
        dupe.saveAs(outputFile, pngOpts, true, Extension.LOWERCASE);
      }
    } catch (e2) {
      // Last resort — save as JPEG
      useWebP = false;
      ext = ".jpg";
      outputFile = new File(folder.fsName + "/" + paddedNum + ext);

      var jpgOpts = new JPEGSaveOptions();
      jpgOpts.quality = Math.round(QUALITY / 8.33); // convert 0-100 to 0-12
      jpgOpts.embedColorProfile = true;
      dupe.saveAs(outputFile, jpgOpts, true, Extension.LOWERCASE);
    }

    alert(
      "Saved to archive!\n\n" +
      "File: " + paddedNum + ext + "\n" +
      "Size: " + (MAX_WIDTH > 0 && doc.width.as("px") > MAX_WIDTH
        ? MAX_WIDTH + "px wide (resized)"
        : Math.round(doc.width.as("px")) + "px wide") + "\n" +
      "Quality: " + QUALITY
    );

  } catch (err) {
    alert("Export failed:\n" + err.message);
  } finally {
    dupe.close(SaveOptions.DONOTSAVECHANGES);
  }
})();
