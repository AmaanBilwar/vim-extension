import './style.css';

type Mode = 'normal' | 'insert' | 'hint' | 'find';

type HintItem = {
  label: string;
  element: HTMLElement;
  badge: HTMLDivElement;
};

const HINT_CHARS = 'ASDFGHJKLQWERTYUIOPZXCVBNM';
const ROOT_ID = '__vim_ext_root';

let mode: Mode = 'normal';
let pendingG = false;
let pendingGTimer: number | null = null;

let hintInput = '';
let hintItems: HintItem[] = [];

document.getElementById(ROOT_ID)?.remove();

const root = document.createElement('div');
root.id = ROOT_ID;
document.documentElement.appendChild(root);

const modeBadge = document.createElement('div');
modeBadge.className = 'vim-ext-mode-badge';
root.appendChild(modeBadge);

const hintLayer = document.createElement('div');
hintLayer.className = 'vim-ext-hint-layer';
root.appendChild(hintLayer);

const findBar = document.createElement('div');
findBar.className = 'vim-ext-find-bar';

const findLabel = document.createElement('span');
findLabel.className = 'vim-ext-find-label';
findLabel.textContent = 'Find';

const findInput = document.createElement('input');
findInput.className = 'vim-ext-find-input';
findInput.type = 'text';
findInput.placeholder = 'Type to search page text';

findBar.append(findLabel, findInput);
root.appendChild(findBar);

let lastFindQuery = '';

const isInFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

const updateUIVisibility = (): void => {
  const fullscreen = isInFullscreen();
  root.style.display = fullscreen ? 'none' : 'block';
};

const onFullscreenChange = (): void => {
  updateUIVisibility();
};

document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);
document.addEventListener('mozfullscreenchange', onFullscreenChange);
document.addEventListener('MSFullscreenChange', onFullscreenChange);

updateUIVisibility();

const getEffectiveMode = (eventTarget?: EventTarget | null): Mode => {
  if (mode === 'find') return 'find';
  if (mode === 'hint') return 'hint';
  if (isEditable(eventTarget)) return 'insert';
  if (isEditable(document.activeElement)) return 'insert';
  return 'normal';
};

const setMode = (nextMode: Mode): void => {
  mode = nextMode;
  renderModeBadge();
};

const renderModeBadge = (eventTarget?: EventTarget | null): void => {
  const effectiveMode = getEffectiveMode(eventTarget);
  modeBadge.textContent = effectiveMode.toUpperCase();
  modeBadge.classList.toggle('is-find', effectiveMode === 'find');
  modeBadge.classList.toggle('is-hint', effectiveMode === 'hint');
  modeBadge.classList.toggle('is-insert', effectiveMode === 'insert');
};

const isEditable = (target: EventTarget | null | undefined): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;

  const input = target as HTMLInputElement;
  const nonTextTypes = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
  ]);

  return !nonTextTypes.has(input.type);
};

const scrollByViewport = (fraction: number): void => {
  const amount = Math.round(window.innerHeight * fraction);
  window.scrollBy({ top: amount, left: 0, behavior: 'auto' });
};

const resetPendingG = (): void => {
  pendingG = false;
  if (pendingGTimer !== null) {
    window.clearTimeout(pendingGTimer);
    pendingGTimer = null;
  }
};

const queueG = (): void => {
  resetPendingG();
  pendingG = true;
  pendingGTimer = window.setTimeout(() => {
    pendingG = false;
    pendingGTimer = null;
  }, 700);
};

const isVisibleTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return false;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
  if (rect.right < 0 || rect.left > window.innerWidth) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (style.pointerEvents === 'none') return false;

  return true;
};

const collectTargets = (): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[tabindex]:not([tabindex="-1"])',
    '[onclick]',
  ].join(',');

  const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const deduped = new Set<HTMLElement>(all);

  return Array.from(deduped).filter((element) => {
    if (element.closest(`#${ROOT_ID}`)) return false;
    if ((element as HTMLButtonElement).disabled) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    return isVisibleTarget(element);
  });
};

const labelForIndex = (index: number): string => {
  const base = HINT_CHARS.length;
  let n = index;
  let label = '';

  do {
    label = HINT_CHARS[n % base] + label;
    n = Math.floor(n / base) - 1;
  } while (n >= 0);

  return label;
};

const clearHints = (): void => {
  hintInput = '';
  hintItems = [];
  hintLayer.replaceChildren();
  hintLayer.classList.remove('is-active');
};

const activateElement = (element: HTMLElement): void => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    element.isContentEditable
  ) {
    element.focus();
    return;
  }

  element.click();
};

const exitHintMode = (): void => {
  clearHints();
  setMode('normal');
};

const runFind = (forward: boolean): boolean => {
  const query = findInput.value.trim();
  if (!query) return false;

  lastFindQuery = query;
  const found = window.find(query, false, !forward, true, false, false, false);
  findBar.classList.toggle('is-no-match', !found);

  return found;
};

const runLastFind = (forward: boolean): boolean => {
  const query = lastFindQuery.trim();
  if (!query) return false;

  const found = window.find(query, false, !forward, true, false, false, false);
  findBar.classList.toggle('is-no-match', !found);
  return found;
};

const openFindBar = (): void => {
  if (mode === 'hint') {
    exitHintMode();
  }

  findBar.classList.remove('is-no-match');
  findBar.classList.add('is-active');
  setMode('find');
  findInput.value = lastFindQuery;
  findInput.focus();
  findInput.select();
};

const closeFindBar = (): void => {
  findBar.classList.remove('is-active', 'is-no-match');
  if (document.activeElement === findInput) {
    findInput.blur();
  }
  setMode('normal');
};

const handleFindKey = (event: KeyboardEvent): boolean => {
  if (event.key === 'Escape') {
    closeFindBar();
    return true;
  }

  if (event.key === 'Enter') {
    runFind(!event.shiftKey);
    return true;
  }

  if (event.key === 'Backspace') {
    findInput.value = findInput.value.slice(0, -1);
    if (findInput.value.trim().length === 0) {
      findBar.classList.remove('is-no-match');
      return true;
    }
    runFind(true);
    return true;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  if (event.key.length === 1) {
    findInput.value += event.key;
    runFind(true);
    return true;
  }

  return false;
};

const updateHintMatches = (): void => {
  const upperInput = hintInput.toUpperCase();
  let matches = 0;
  let lastMatch: HintItem | null = null;

  for (const item of hintItems) {
    const isMatch = item.label.startsWith(upperInput);
    item.badge.classList.toggle('is-match', isMatch);
    item.badge.classList.toggle('is-dim', !isMatch);
    item.badge.classList.toggle('is-exact', isMatch && item.label === upperInput);
    if (isMatch) {
      matches += 1;
      lastMatch = item;
    }
  }

  if (matches === 1 && lastMatch) {
    activateElement(lastMatch.element);
    exitHintMode();
    return;
  }

};

const enterHintMode = (): void => {
  clearHints();
  const targets = collectTargets();

  if (targets.length === 0) {
    setMode('normal');
    return;
  }

  hintItems = targets.map((element, index) => {
    const label = labelForIndex(index);
    const rect = element.getBoundingClientRect();

    const badge = document.createElement('div');
    badge.className = 'vim-ext-hint-badge is-match';
    badge.textContent = label;
    badge.style.left = `${Math.max(0, rect.left)}px`;
    badge.style.top = `${Math.max(0, rect.top)}px`;

    hintLayer.appendChild(badge);

    return { label, element, badge };
  });

  hintLayer.classList.add('is-active');
  setMode('hint');
};

const handleHintKey = (event: KeyboardEvent): boolean => {
  if (event.key === 'Escape') {
    exitHintMode();
    return true;
  }

  if (event.key === 'Enter') {
    if (hintInput.length === 0) {
      return true;
    }

    const upperInput = hintInput.toUpperCase();
    const exactMatch = hintItems.find((item) => item.label === upperInput);
    if (exactMatch) {
      activateElement(exactMatch.element);
      exitHintMode();
      return true;
    }

    const matches = hintItems.filter((item) => item.label.startsWith(upperInput));
    if (matches.length === 1) {
      activateElement(matches[0].element);
      exitHintMode();
      return true;
    }

    return true;
  }

  if (event.key === 'Backspace') {
    hintInput = hintInput.slice(0, -1);
    updateHintMatches();
    return true;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
    hintInput += event.key.toUpperCase();
    updateHintMatches();
    return true;
  }

  return false;
};

const handleNormalKey = (event: KeyboardEvent): boolean => {
  if (event.metaKey || event.altKey) return false;

  if (event.key === 'Escape') {
    if (document.activeElement instanceof HTMLElement && isEditable(document.activeElement)) {
      document.activeElement.blur();
      renderModeBadge();
      return true;
    }
    return false;
  }

  if (event.ctrlKey) {
    const key = event.key.toLowerCase();
    if (key === 'd') {
      scrollByViewport(0.5);
      resetPendingG();
      return true;
    }
    if (key === 'u') {
      scrollByViewport(-0.5);
      resetPendingG();
      return true;
    }
    return false;
  }

  switch (event.key) {
    case 'j':
      window.scrollBy({ top: 80, left: 0, behavior: 'auto' });
      resetPendingG();
      return true;
    case 'k':
      window.scrollBy({ top: -80, left: 0, behavior: 'auto' });
      resetPendingG();
      return true;
    case 'h':
      window.scrollBy({ top: 0, left: -80, behavior: 'auto' });
      resetPendingG();
      return true;
    case 'l':
      window.scrollBy({ top: 0, left: 80, behavior: 'auto' });
      resetPendingG();
      return true;
    case 'd':
      scrollByViewport(0.5);
      resetPendingG();
      return true;
    case 'u':
      scrollByViewport(-0.5);
      resetPendingG();
      return true;
    case 'g':
      if (pendingG) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        resetPendingG();
        return true;
      }
      queueG();
      return true;
    case 'G':
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
      resetPendingG();
      return true;
    case 'f':
      resetPendingG();
      enterHintMode();
      return true;
    case '/':
      resetPendingG();
      openFindBar();
      return true;
    case 'n':
      resetPendingG();
      return runLastFind(true);
    case 'N':
      resetPendingG();
      return runLastFind(false);
    default:
      resetPendingG();
      return false;
  }
};

const onKeyDown = (event: KeyboardEvent): void => {
  const effectiveMode = getEffectiveMode(event.target);
  const handled =
    effectiveMode === 'hint'
      ? handleHintKey(event)
      : effectiveMode === 'find'
        ? handleFindKey(event)
        : effectiveMode === 'normal'
          ? handleNormalKey(event)
          : false;

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }

  renderModeBadge(event.target);
};

document.addEventListener('keydown', onKeyDown, true);
const onFocusIn = (event: FocusEvent): void => {
  renderModeBadge(event.target);
};

const onFocusOut = (event: FocusEvent): void => {
  renderModeBadge(event.target);
};

const onFindInputInput = (): void => {
  findBar.classList.remove('is-no-match');
  runFind(true);
};

document.addEventListener('focusin', onFocusIn, true);
document.addEventListener('focusout', onFocusOut, true);
findInput.addEventListener('input', onFindInputInput);
window.addEventListener('blur', () => {
  if (mode === 'hint') {
    exitHintMode();
  }
  if (mode === 'find') {
    closeFindBar();
  }
});

renderModeBadge();
