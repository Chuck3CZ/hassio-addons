const fs = require('fs');

function replaceAllPattern(path, from, to, expectedCount) {
  const src = fs.readFileSync(path, 'utf8');
  const parts = src.split(from);
  const count = parts.length - 1;
  if (count !== expectedCount) {
    throw new Error(`expected ${expectedCount} occurrence(s) of pattern in ${path}, found ${count}: ${from.slice(0, 80)}`);
  }
  fs.writeFileSync(path, parts.join(to), 'utf8');
}

// 1. shared/src/config.ts — add textScale field to the interface + default
replaceAllPattern(
  '/app/shared/src/config.ts',
  '  glyphSizePx: number;\n',
  '  glyphSizePx: number;\n  /** Scales all on-screen label/HUD text sizes, independent of glyph size. */\n  textScale: number;\n',
  1,
);
replaceAllPattern(
  '/app/shared/src/config.ts',
  '  glyphSizePx: 22,\n',
  '  glyphSizePx: 22,\n  textScale: 1,\n',
  1,
);

// 2. web/src/control/Control.tsx — add a "Text size" slider row right after "Glyph size"
replaceAllPattern(
  '/app/web/src/control/Control.tsx',
  '          <Row label="Glyph size">\n' +
    '            <Slider id="glyphSizePx" value={cfg.glyphSizePx} min={6} max={40} step={1} unit="px"\n' +
    '              onChange={(v) => set({ glyphSizePx: v })} />\n' +
    '          </Row>\n',
  '          <Row label="Glyph size">\n' +
    '            <Slider id="glyphSizePx" value={cfg.glyphSizePx} min={6} max={40} step={1} unit="px"\n' +
    '              onChange={(v) => set({ glyphSizePx: v })} />\n' +
    '          </Row>\n' +
    '          <Row label="Text size">\n' +
    '            <Slider id="textScale" value={cfg.textScale} min={0.5} max={3} step={0.05} unit="×"\n' +
    '              onChange={(v) => set({ textScale: v })} />\n' +
    '          </Row>\n',
  1,
);

// 3. web/src/display/renderer.ts — scale every label/HUD font-size by cfg.textScale
const R = '/app/web/src/display/renderer.ts';
replaceAllPattern(R, '`300 9px ${cfg.fonts.mono}`', '`300 ${Math.round(9 * cfg.textScale)}px ${cfg.fonts.mono}`', 1);
replaceAllPattern(R, '`300 12px ${cfg.fonts.label}`', '`300 ${Math.round(12 * cfg.textScale)}px ${cfg.fonts.label}`', 1);
replaceAllPattern(R, '`300 13px ${cfg.fonts.label}`', '`300 ${Math.round(13 * cfg.textScale)}px ${cfg.fonts.label}`', 1);
replaceAllPattern(R, '`300 10px ${cfg.fonts.label}`', '`300 ${Math.round(10 * cfg.textScale)}px ${cfg.fonts.label}`', 2);
replaceAllPattern(R, '`500 14px ${cfg.fonts.label}`', '`500 ${Math.round(14 * cfg.textScale)}px ${cfg.fonts.label}`', 2);
replaceAllPattern(R, '`400 11px ${cfg.fonts.label}`', '`400 ${Math.round(11 * cfg.textScale)}px ${cfg.fonts.label}`', 2);
replaceAllPattern(R, '`300 34px ${cfg.fonts.label}`', '`300 ${Math.round(34 * cfg.textScale)}px ${cfg.fonts.label}`', 1);
replaceAllPattern(R, '`400 15px ${cfg.fonts.label}`', '`400 ${Math.round(15 * cfg.textScale)}px ${cfg.fonts.label}`', 1);
replaceAllPattern(R, 'const lh = 16;', 'const lh = Math.round(16 * cfg.textScale);', 1);

console.log('OK: patched config.ts, Control.tsx, renderer.ts');
