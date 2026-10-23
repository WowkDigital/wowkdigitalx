# WOWK DIGITAL X

English dark-mode landing page built with HTML, JavaScript and Tailwind CSS.

## Hosting

Upload the files in this repository's root (except README.md and .gitignore) to the domain's `public_html` directory. Keep existing subdirectories intact.

The canonical URL is https://wowkdigitalx.pl and the social preview is `/og-image.png`.

The contact form opens a draft in the visitor's email application; it does not send messages through a server.

Tailwind CSS and fonts load from external providers. The brand explorer supports pointer interaction, touch controls, keyboard operation and reduced motion preferences.

Scroll ruler: scroll-ruler.config.js controls the rail, section labels, mobile visibility and optional scroll smoothing. The default keeps native scrolling and supports keyboard navigation and reduced motion.

Interactive Lab: Game of Life uses toroidal boundaries and starts with a glider. 1D Automata supports rules 0–255 and wrapping neighbours. Canvas drawing supports touch and keyboard; simulation work stops offscreen. Run core checks with: node --test automata.test.cjs.
