/** Open a native <select> from a custom control. focus() alone does not. */
export function openNativeSelect(el: HTMLSelectElement | null) {
  if (!el) {
    return;
  }
  el.focus();
  if (typeof el.showPicker !== "function") {
    return;
  }
  try {
    el.showPicker();
  } catch {
    // showPicker can throw if the call is not from a direct user gesture.
  }
}
