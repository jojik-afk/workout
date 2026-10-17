export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// English plural: 1 exercise, 2+ exercises.
export const plural = (n, one, many) => (n === 1 ? one : many);
