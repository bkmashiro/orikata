export type FoldAxis = 'x' | 'y';

export interface Fold3DOptions {
  /** Number of panels/slices used to approximate the fold. */
  segments?: number;
  /** Primary fold axis. */
  axis?: FoldAxis;
  /** Fold angle in degrees. */
  angle?: number;
  /** CSS perspective length, e.g. 900 or '900px'. */
  perspective?: number | string;
  /** Whether the original element should be visually hidden while the fold layer exists. */
  hideOriginal?: boolean;
}

export interface Fold3DNormalizedOptions {
  segments: number;
  axis: FoldAxis;
  angle: number;
  perspective: string;
  hideOriginal: boolean;
}

export interface Fold3DInstance {
  readonly element: HTMLElement;
  readonly options: Fold3DNormalizedOptions;
  setAngle(angle: number): void;
  destroy(): void;
}

const DEFAULT_OPTIONS: Fold3DNormalizedOptions = {
  segments: 6,
  axis: 'y',
  angle: 0,
  perspective: '900px',
  hideOriginal: false
};

function normalizeOptions(options: Fold3DOptions = {}): Fold3DNormalizedOptions {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const segments = typeof merged.segments === 'number' ? merged.segments : DEFAULT_OPTIONS.segments;
  const perspective = typeof merged.perspective === 'number' ? `${merged.perspective}px` : merged.perspective;

  return {
    segments: Math.max(1, Math.floor(segments)),
    axis: merged.axis,
    angle: merged.angle,
    perspective,
    hideOriginal: merged.hideOriginal
  };
}

/**
 * Temporary scaffold API. The real folding renderer will be filled in once the implementation plan lands.
 */
export function createFold3D(element: HTMLElement, options: Fold3DOptions = {}): Fold3DInstance {
  const normalized = normalizeOptions(options);
  const previousVisibility = element.style.visibility;

  element.dataset.fold3d = 'attached';
  element.style.setProperty('--fold3d-angle', `${normalized.angle}deg`);
  element.style.setProperty('--fold3d-perspective', normalized.perspective);
  if (normalized.hideOriginal) element.style.visibility = 'hidden';

  return {
    element,
    options: normalized,
    setAngle(angle: number) {
      element.style.setProperty('--fold3d-angle', `${angle}deg`);
    },
    destroy() {
      delete element.dataset.fold3d;
      element.style.removeProperty('--fold3d-angle');
      element.style.removeProperty('--fold3d-perspective');
      element.style.visibility = previousVisibility;
    }
  };
}

export { normalizeOptions };
