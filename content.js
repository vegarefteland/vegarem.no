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
       title: "Knurr Display © Typeface",
      folder: "06",
      cover: "images/projects/06/cover.mp4",
      color: "#E8E0D5",
      wip: false,
      year: "2026",
      description:
        "Knurr Display is a module-based display typeface developed during a visual communication course at the University of Bergen. Every letter is built from a skeleton of connected nodes, giving the family a systematic, constructed logic paired with an organic, hand drawn expression.\n\nThe typeface comes in two versions, Knurr and Knurr Node, each in three styles: Regular, Regular Italic and Regular Italic+. Knurr Node exposes the underlying system by cutting negative holes where each node begins and ends, reading as more mechanical and structural than the softer, closed forms of Knurr Regular. The Italic+ styles push the slant and connections further for a more energetic display setting.\n\n\nSoftware used: Glyphs 4, InDesign & Photoshop",
    },
    {
       title: "Arboretet – Visual Identity",
      folder: "02",
      cover: "images/projects/02/cover.mp4",
      color: "#E8E0D5",
      wip: false,
      year: "2026",
      description:
        "<strong>Student Project in collaboration with:</strong>\n\nDorthea Førland Solem<br>Olga Nørager-Nielsen<br>Sofiia Kundriutskova\n\n\n<strong>Client:</strong><br>Arboretet i Bergen is a botanical garden located at Milde, just south of Bergen, Norway. Spanning over 300 acres, it houses one of the largest collections of trees, shrubs, and plants in Scandinavia.\n\n\n<strong>Concept:</strong><br>Over six weeks, the project moved through market positioning research, analysis of long-term ambitions and values, target audience mapping, concept development, design strategy, and the final visual identity itself.\n\nThe concept explores how one can control the uncontrollable. By this we mean finding systems within chaos and exploring how chaos can be used as an effect to spark curiosity. Controlling the uncontrollable plays on how the plants at \"Arboretet\" are wild, yet do not grow naturally in the area. \"Arboretet\" is a curated, living museum even though it does not appear that way at first glance.",
    },
    {
      title: "Poster Design",
      folder: "03",
      cover: "images/projects/03/cover.webp",
      color: "#E8E0D5",
      wip: false,
      year: "2023–2026",
      description:
        "Selected poster design projects.\n\n" +
        "School assignments and concept design work.",
    },
    {
      title: "Motion Graphics & Animation",
      folder: "05",
      cover: "images/projects/05/cover.mp4",
      color: "#E8E0D5",
      wip: false,
      year: "2025–2026",
      description:
        "Selection of motion and animation projects, made in school and personal work contexts.\n\n\n<strong>(01) Showreel</strong>\n\nPromotional video showcasing motion and design work.\n\nSoftware Used: After Effects, Premiere Pro & Photoshop\n\n\n<strong>(02) Animation Course — Group Project</strong>\n\nSelected scene of my part in a group final assignment.\n\nIn collaboration with <a href='https://swaydesign.no/' target='_blank' rel='noopener'>Jonathan Kindingstad<svg viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><path d='M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/></svg></a> & Elias Olai Skog\n\nSoftware used: After Effects, Premiere Pro, Photoshop & InDesign",
    },
    {
      title: "Modular Desk Interface – 3D Modeling",
      folder: "04",
      cover: "images/projects/04/cover.webp",
      color: "#3D4A5C",
      wip: false,
      year: "2026",
      description:
        "Modular Desk Interface concept. Inspired by the design language of Braun and Teenage Engineering. " +
        "Built around physical buttons and knobs, materials include sandblasted steel with a matte finish.\n\n" +
        "Modeled and rendered in Blender.",
    },
    {
      title: "F1 – Team Merch",
      folder: "01",
      cover: "images/projects/01/cover.webp",
      color: "#C8B8A2",
      wip: false,
      year: "2025–2026",
      description:
        "Ongoing personal project.\n\n" +
        "Designing retro inspired formula 1 merch for every team on the grid.",
    },
  ],


  /* ── Archive ────────────────────────────────────────────────────
   * archiveIntro: text shown above the archive grid.
   * Archive images are loaded automatically from images/archive/
   * by numbering them 01, 02, 03 … (webp / jpg / jpeg / png / gif).
   * ────────────────────────────────────────────────────────────── */
  archiveIntro: "Personal projects, Ideas, Experiments and Concepts",

};
