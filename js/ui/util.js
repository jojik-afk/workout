export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Czech plural: 1 cvik, 2–4 cviky, 5+ cviků.
export const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
