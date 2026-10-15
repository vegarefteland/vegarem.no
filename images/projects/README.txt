PROJECT FOLDERS
===============

One numbered folder per project (01, 02 …). The number is the folder that
content.js points to with `folder:` — the order on the site comes from
content.js, so keep the two in step.

Inside a project folder
-----------------------

  cover.webp / cover.mp4   the card on the home grid

  Then the project page, top to bottom, in numbered slots 01, 02, 03 …

  01.webp / 01.mp4         one full-width image or silent looping clip
  01_player.mp4            a video WITH sound and player controls
  01_player_poster.webp    (optional) still shown before that video plays
  01/                      a row: 01/01.webp, 01/02.webp … side by side,
                           all scaled to the same height
  01A/, 01B/ …             a flush group — a seamless block with no gaps;
                           numbered the same way inside, rows allowed
  01_book/                 a page-turning book: 01_book/01.webp, 02.webp …

  Numbering must be continuous: the first missing number ends the page.

  _originals/              your full-size masters. Ignored by git and never
                           shown on the site.

Formats: webp (preferred), jpg, png, gif · video: mp4

After adding or changing files
------------------------------

Nothing to do — committing runs the hook that rebuilds images/manifest.json
(the list of every file and its size).
To see changes locally before committing:

  node scripts/build-manifest.js
