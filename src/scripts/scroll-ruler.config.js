// Native page scrolling, with a compact rail below the sticky header.
const rulerMobile = window.matchMedia('(max-width: 640px)');
window.SCROLL_RULER_CONFIG = {
  enabled: true,
  showSections: true,
  width: 60,
  topOffset: rulerMobile.matches ? 96 : 114,
  sectionFontSize: 22,
  hoverDelay: 150,
  zoomDamping: 10,
  smoothScroll: false,
  smoothLinks: true,
  mobile: {
    enabled: true,
    breakpoint: 640,
    width: 28,
    showSectionName: true,
    interactive: false,
  },
};
rulerMobile.addEventListener('change', event => {
  document.querySelector('scroll-ruler')?.configure({topOffset: event.matches ? 96 : 114});
});
