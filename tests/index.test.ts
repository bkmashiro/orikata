import { describe, expect, it } from 'vitest';
import { createFold3D } from '../src/index';

describe('createFold3D scaffold', () => {
  it('attaches fold metadata and cleans up', () => {
    const element = document.createElement('div');
    const fold = createFold3D(element, { angle: 15, perspective: 700 });

    expect(element.dataset.fold3d).toBe('attached');
    expect(element.style.getPropertyValue('--fold3d-angle')).toBe('15deg');
    expect(element.style.getPropertyValue('--fold3d-perspective')).toBe('700px');

    fold.setAngle(-30);
    expect(element.style.getPropertyValue('--fold3d-angle')).toBe('-30deg');

    fold.destroy();
    expect(element.dataset.fold3d).toBeUndefined();
    expect(element.style.getPropertyValue('--fold3d-angle')).toBe('');
  });
});
