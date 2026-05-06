/* ================================================================
 * SITE CONTENT — edit this file to update your portfolio text.
 * No other files need to be touched for content changes.
 * ================================================================ */
const SITE = {

  name: "Vegar Efteland",   // shown in the nav on the home page


  /* ── Projects ───────────────────────────────────────────────────
   * title:       displayed on the card and project page
   * folder:      image subfolder → images/projects/01/
   * cover:       thumbnail shown on the home grid
   * color:       background colour while the cover loads
   * layout:      "grid" for 2-column, omit for full-width stack
   * description: text on the project page — use \n\n for a new paragraph
   * year:        optional — shown as a pill next to "Description"
   *              (e.g. "2024", "2022–2026", "Ongoing"). Omit to hide.
   * ────────────────────────────────────────────────────────────── */
  projects: [
    {
      title: "F1 – Team Merch",
      folder: "01",
      cover: "images/projects/01/cover.webp",
      color: "#C8B8A2",
      year: "2025–2026",
      description:
        "Ongoing personal project.\n\n" +
        "Designing retro inspired formula 1 merch for every team on the grid.",
    },
    {
      title: "F1 – Track Merch",
      folder: "02",
      cover: "images/projects/02/cover.webp",
      color: "#1C1C1E",
      year: "2024-2026",
      description:
        "Ongoing personal project.\n\n" +
        "Designing merch for every track on the calendar.",
    },
    {
      title: "Poster Design",
      folder: "03",
      cover: "images/projects/03/cover.webp",
      color: "#E8E0D5",
      layout: "grid",
      year: "2023–2026",
      description:
        "Selected poster design projects.\n\n" +
        "School assignments and concept design work.",
    },
    {
      title: "3D Modeling",
      folder: "04",
      cover: "images/projects/04/cover.webp",
      color: "#3D4A5C",
      year: "2026",
      description:
        "Modular Desk Interface concept. Inspired by the design language of Braun and Teenage Engineering. " +
        "Built around physical buttons and knobs, materials include sandblasted steel with a matte finish.\n\n" +
        "Modeled and rendered in Blender.",
    },
    {
      title: "Motion Graphics",
      folder: "05",
      cover: "images/projects/05/cover.webp",
      color: "#D4C5B0",
      year: "2026",
      description:
        "Promotional showcase video highlighting motion and design work.\n\n" +
        "Created in After Effects and Premiere Pro.",
    },
    {
      title: "Personal Branding",
      folder: "06",
      cover: "images/projects/06/cover.webp",
      color: "#F0EBE3",
      year: "2025",
      description:
        "Personal branding project.",
    },
  ],


  /* ── Archive ────────────────────────────────────────────────────
   * archiveIntro: text shown above the archive grid.
   * Archive images are loaded automatically from images/archive/
   * by numbering them 01, 02, 03 … (webp / jpg / jpeg / png / gif).
   * ────────────────────────────────────────────────────────────── */
  archiveIntro: "A mix of smaller projects, experiments and ideas.",

  archive: [],

};
