// Apply the saved preference before rendering to avoid a theme flash.
try {
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.dataset.theme = savedTheme;
  }
} catch {
  // The CSS system preference also works when browser storage is unavailable.
}
