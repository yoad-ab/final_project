import type { Monaco } from '@monaco-editor/react'

// Dark palette (deep navy/purple with green accents)
const D = {
  bgSurface:  '#1c1c28',
  bgPanel:    '#15151f',
  bgBar:      '#111119',
  bgHover:    '#22223a',
  border:     '#272738',
  accent:     '#7c6af7',
  accentSoft: '#a78bfa',   // lighter purple — keywords
  text:       '#e2e2f0',
  text2:      '#8080a0',
  text3:      '#50506a',
  green:      '#34d399',
  greenSoft:  '#6ee7b7',   // strings
  amber:      '#f59e0b',
  amberSoft:  '#fbbf24',   // numbers / constants
  blue:       '#60a5fa',   // functions
  red:        '#ef4444',
} as const

// Light palette — matches tweakcn oklch variables in index.css
const L = {
  bgSurface:  '#f8f9fb',   // ≈ oklch(0.9824 0.0013 286) background
  bgPanel:    '#f2f3f5',   // ≈ oklch(0.9620 0.003 286)
  bgBar:      '#f8f9fb',
  bgHover:    '#e5eaf0',
  border:     '#d8d8d8',   // ≈ oklch(0.8699 0 0)
  accent:     '#35a85a',   // ≈ oklch(0.6487 0.1538 150.3) — green primary
  accentSoft: '#7c3aed',   // purple — keywords
  text:       '#1e1e2e',
  text2:      '#717171',   // ≈ oklch(0.5382 0 0) muted-foreground
  text3:      '#a4a4a4',   // ≈ oklch(0.72 0 0)
  green:      '#059669',   // emerald-600 — types / classes
  greenSoft:  '#16a34a',   // green-600 — strings
  amber:      '#d97706',   // amber-600 — numbers / constants
  amberSoft:  '#b45309',
  blue:       '#2563eb',   // blue-600 — functions
  red:        '#dc2626',
} as const

// Monaco rules use hex WITHOUT '#'
const r = (hex: string) => hex.replace('#', '')

function rules(C: typeof D | typeof L) {
  return [
    // Default text
    { token: '',                          foreground: r(C.text),       background: r(C.bgSurface) },

    // Comments
    { token: 'comment',                   foreground: r(C.text3),      fontStyle: 'italic' },
    { token: 'comment.doc',               foreground: r(C.text2),      fontStyle: 'italic' },

    // Keywords — purple
    { token: 'keyword',                   foreground: r(C.accentSoft) },
    { token: 'keyword.control',           foreground: r(C.accentSoft) },
    { token: 'keyword.control.import',    foreground: r(C.accentSoft) },
    { token: 'keyword.flow',              foreground: r(C.accentSoft) },
    { token: 'keyword.operator',          foreground: r(C.text2) },
    { token: 'storage',                   foreground: r(C.accentSoft) },
    { token: 'storage.type',              foreground: r(C.accentSoft) },
    { token: 'storage.type.function',     foreground: r(C.accentSoft) },
    { token: 'storage.type.class',        foreground: r(C.accentSoft) },

    // Strings — green
    { token: 'string',                    foreground: r(C.greenSoft) },
    { token: 'string.escape',             foreground: r(C.green) },
    { token: 'string.invalid',            foreground: r(C.red) },
    { token: 'string.other',              foreground: r(C.greenSoft) },

    // Numbers / constants — amber
    { token: 'number',                    foreground: r(C.amberSoft) },
    { token: 'number.float',              foreground: r(C.amberSoft) },
    { token: 'number.hex',                foreground: r(C.amberSoft) },
    { token: 'constant',                  foreground: r(C.amberSoft) },
    { token: 'constant.numeric',          foreground: r(C.amberSoft) },
    { token: 'constant.language',         foreground: r(C.amberSoft) }, // True/False/None

    // Functions — blue
    { token: 'entity.name.function',      foreground: r(C.blue) },
    { token: 'support.function',          foreground: r(C.blue) },
    { token: 'support.function.builtin',  foreground: r(C.blue) },

    // Types / classes — green
    { token: 'entity.name.type',          foreground: r(C.green) },
    { token: 'entity.name.class',         foreground: r(C.green) },
    { token: 'support.type',              foreground: r(C.green) },
    { token: 'support.class',             foreground: r(C.green) },

    // Variables / parameters
    { token: 'variable',                  foreground: r(C.text) },
    { token: 'variable.parameter',        foreground: r(C.accentSoft) },
    { token: 'variable.other',            foreground: r(C.text) },
    { token: 'variable.language',         foreground: r(C.accentSoft) }, // self, cls

    // Decorators — amber
    { token: 'meta.decorator',            foreground: r(C.amber) },
    { token: 'entity.name.function.decorator', foreground: r(C.amber) },

    // Operators / delimiters — muted
    { token: 'operator',                  foreground: r(C.text2) },
    { token: 'delimiter',                 foreground: r(C.text2) },
    { token: 'delimiter.bracket',         foreground: r(C.text2) },
    { token: 'delimiter.square',          foreground: r(C.text2) },
    { token: 'delimiter.parenthesis',     foreground: r(C.text2) },

    // Tags
    { token: 'tag',                       foreground: r(C.accentSoft) },
    { token: 'tag.id',                    foreground: r(C.green) },
    { token: 'tag.class',                 foreground: r(C.green) },
    { token: 'attribute.name',            foreground: r(C.blue) },
    { token: 'attribute.value',           foreground: r(C.greenSoft) },

    // Markdown
    { token: 'emphasis',                  fontStyle: 'italic' },
    { token: 'strong',                    fontStyle: 'bold' },

    // Errors
    { token: 'invalid',                   foreground: r(C.red) },
  ]
}

function colors(C: typeof D | typeof L) {
  return {
    // ── Core editor ─────────────────────────────────────────────────────
    'editor.background':                      C.bgSurface,
    'editor.foreground':                      C.text,
    'editorLineNumber.foreground':            C.text3,
    'editorLineNumber.activeForeground':      C.text2,
    'editorGutter.background':                C.bgSurface,
    'editorCursor.foreground':                C.accent,
    'editorCursor.background':                C.bgSurface,

    // ── Line / selection highlighting ────────────────────────────────────
    'editor.lineHighlightBackground':         C.bgHover,
    'editor.lineHighlightBorder':             '#00000000',
    'editor.selectionBackground':             `${C.accent}50`,
    'editor.inactiveSelectionBackground':     `${C.accent}28`,
    'editor.selectionHighlightBackground':    `${C.accent}28`,
    'editor.wordHighlightBackground':         `${C.accent}25`,
    'editor.wordHighlightStrongBackground':   `${C.accent}35`,

    // ── Find ─────────────────────────────────────────────────────────────
    'editor.findMatchBackground':             `${C.amber}55`,
    'editor.findMatchHighlightBackground':    `${C.amber}28`,
    'editor.findMatchBorder':                 C.amber,

    // ── Bracket matching ─────────────────────────────────────────────────
    'editorBracketMatch.background':          `${C.accent}30`,
    'editorBracketMatch.border':              C.accent,

    // ── Indent guides ─────────────────────────────────────────────────────
    'editorIndentGuide.background1':          `${C.border}80`,
    'editorIndentGuide.activeBackground1':    C.text3,

    // ── Whitespace ───────────────────────────────────────────────────────
    'editorWhitespace.foreground':            `${C.text3}50`,

    // ── Scrollbar ────────────────────────────────────────────────────────
    'scrollbar.shadow':                       '#00000000',
    'scrollbarSlider.background':             `${C.border}90`,
    'scrollbarSlider.hoverBackground':        C.text3,
    'scrollbarSlider.activeBackground':       `${C.accent}80`,

    // ── Widgets (autocomplete, hover docs) ───────────────────────────────
    'editorWidget.background':                C.bgPanel,
    'editorWidget.border':                    C.border,
    'editorWidget.foreground':                C.text,
    'editorSuggestWidget.background':         C.bgPanel,
    'editorSuggestWidget.border':             C.border,
    'editorSuggestWidget.foreground':         C.text,
    'editorSuggestWidget.selectedBackground': C.bgHover,
    'editorSuggestWidget.selectedForeground': C.text,
    'editorSuggestWidget.highlightForeground':      C.accent,
    'editorSuggestWidget.focusHighlightForeground': C.accentSoft,
    'editorHoverWidget.background':           C.bgPanel,
    'editorHoverWidget.border':               C.border,
    'editorHoverWidget.foreground':           C.text,

    // ── Error / warning squiggles ─────────────────────────────────────────
    'editorError.foreground':                 C.red,
    'editorWarning.foreground':               C.amber,
    'editorInfo.foreground':                  C.blue,

    // ── Overview ruler ───────────────────────────────────────────────────
    'editorOverviewRuler.border':             '#00000000',
    'editorOverviewRuler.errorForeground':    C.red,
    'editorOverviewRuler.warningForeground':  C.amber,
    'editorOverviewRuler.findMatchForeground':C.amber,

    // ── Code lens ────────────────────────────────────────────────────────
    'editorCodeLens.foreground':              C.text3,

    // ── Input boxes (within editor panels) ───────────────────────────────
    'input.background':                       C.bgHover,
    'input.foreground':                       C.text,
    'input.border':                           C.border,
    'input.placeholderForeground':            C.text3,
    'inputOption.activeBackground':           `${C.accent}40`,
    'inputOption.activeForeground':           C.accentSoft,
    'inputOption.activeBorder':               C.accent,

    // ── Dropdown ─────────────────────────────────────────────────────────
    'dropdown.background':                    C.bgPanel,
    'dropdown.foreground':                    C.text,
    'dropdown.border':                        C.border,

    // ── List ─────────────────────────────────────────────────────────────
    'list.hoverBackground':                   C.bgHover,
    'list.activeSelectionBackground':         C.bgHover,
    'list.activeSelectionForeground':         C.text,
    'list.highlightForeground':               C.accent,
  }
}

let registered = false

export function ensureMonacoTheme(monaco: Monaco) {
  if (registered) return
  registered = true

  monaco.editor.defineTheme('pinpoint-dark', {
    base: 'vs-dark',
    inherit: false,
    rules: rules(D),
    colors: colors(D),
  })

  monaco.editor.defineTheme('pinpoint-light', {
    base: 'vs',
    inherit: false,
    rules: rules(L),
    colors: colors(L),
  })
}
