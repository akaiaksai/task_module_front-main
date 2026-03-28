export function createTaskGhostFromElement(sourceEl: HTMLElement) {
  const rect = sourceEl.getBoundingClientRect();
  const clone = sourceEl.cloneNode(true) as HTMLElement;

  clone.style.position = 'fixed';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = '99999';
  clone.style.opacity = '1';
  clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
  clone.style.color = 'white';

  document.body.appendChild(clone);

  (window as ANY).__dragGhost = clone;
  (window as ANY).__ghostOriginal = {
    width: rect.width,
    height: rect.height,
  };
  (window as ANY).__ghostLocked = false;

  return clone;
}
