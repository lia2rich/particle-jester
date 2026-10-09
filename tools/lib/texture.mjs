import { PNG } from 'pngjs';
import { hash } from './io.mjs';
export function inspectPng(bytes) {
  const png = PNG.sync.read(bytes, { checkCRC: true });
  const histogram = new Array(256).fill(0), colors = new Set();
  let minX = png.width, minY = png.height, maxX = -1, maxY = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4, alpha = png.data[i + 3];
    histogram[alpha]++;
    if (alpha) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); colors.add(png.data.subarray(i, i+4).toString('hex')); }
  }
  const pixels = png.width * png.height;
  return { width: png.width, height: png.height, sha256: hash(bytes), alpha: { transparent: histogram[0], opaque: histogram[255], partial: pixels - histogram[0] - histogram[255], coverage: 1 - histogram[0] / pixels, histogram }, visibleBounds: maxX < 0 ? null : [minX, minY, maxX, maxY], uniqueVisibleColors: colors.size };
}
export function uvMetadata(billboard, png) {
  const uv = billboard?.uv || {}, flip = uv.flipbook;
  const width = uv.texture_width ?? 1, height = uv.texture_height ?? 1;
  const base = flip?.base_UV || uv.uv || [0, 0];
  const size = flip?.size_UV || uv.uv_size || [1, 1];
  const step = flip?.step_UV || [0, 0], maxFrame = flip?.max_frame ?? 1;
  // Pinned vanilla basic_smoke uses 8 for eight cells. Wintersky also wraps at
  // current_frame >= max_frame. The older tutorial's last-index wording differs.
  const last = typeof maxFrame === 'number' ? (flip ? maxFrame - 1 : 0) : maxFrame;
  const numeric = [width, height, ...base, ...size, ...step, last].every(x => typeof x === 'number' && Number.isFinite(x));
  const issues = [], frames = [];
  if (!numeric) issues.push({ code: 'DYNAMIC_UV', severity: 'warning', message: 'Expression-driven UV bounds require parameter values and runtime inspection' });
  else {
    if (width <= 0 || height <= 0 || !Number.isInteger(last) || last < 0 || last > 4096 || size.some(x => x <= 0)) issues.push({ code: 'UV_INVALID', severity: 'error', message: 'Invalid UV dimensions, extent or last frame' });
    else for (let frame = 0; frame <= last; frame++) {
      const rectangle = [base[0] + frame * step[0], base[1] + frame * step[1], ...size];
      if (rectangle[0] < 0 || rectangle[1] < 0 || rectangle[0] + size[0] > width || rectangle[1] + size[1] > height) issues.push({ code: 'UV_OUT_OF_BOUNDS', severity: 'error', message: `Frame ${frame} leaves declared UV space`, frame });
      const pixels = png ? [rectangle[0] / width * png.width, rectangle[1] / height * png.height, size[0] / width * png.width, size[1] / height * png.height] : null;
      if (pixels?.some(x => !Number.isInteger(x))) issues.push({ code: 'UV_SUBPIXEL', severity: 'warning', message: `Frame ${frame} maps to fractional pixels` });
      frames.push({ frame, uv: rectangle, pixels });
    }
  }
  // PNG dimensions need not equal declared UV dimensions: UV units may be scaled.
  return { kind: flip ? 'flipbook' : 'static', declaredDimensions: [width, height], frameCount: numeric ? last + 1 : null, maxFrame, lastFrame: last, frameConvention: 'max_frame is frame count; documented disagreement in references/official/compatibility.md', fps: flip?.frames_per_second ?? 0, stretchToLifetime: flip?.stretch_to_lifetime ?? false, loop: flip?.loop ?? false, frames, issues };
}
