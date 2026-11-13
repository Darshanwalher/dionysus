/**
 * Monaco themes that match the Dionysus palette.
 * Place at: src/components/code/monacoThemes.js
 */
export const MONACO_LIGHT = "dionysus-light";
export const MONACO_DARK = "dionysus-dark";

export function defineDionysusThemes(monaco) {
  // Read-only snippets don't need type-checking. Turning diagnostics off stops the
  // JS/TS/JSON language workers from doing heavy work for every block on the page.
  const off = { noSemanticValidation: true, noSyntaxValidation: true, noSuggestionDiagnostics: true };
  monaco.languages.typescript?.javascriptDefaults.setDiagnosticsOptions(off);
  monaco.languages.typescript?.typescriptDefaults.setDiagnosticsOptions(off);
  monaco.languages.json?.jsonDefaults.setDiagnosticsOptions({ validate: false });

  monaco.editor.defineTheme(MONACO_LIGHT, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7F8C89", fontStyle: "italic" },
      { token: "keyword", foreground: "17645F", fontStyle: "bold" },
      { token: "string", foreground: "D9461F" },
      { token: "number", foreground: "B7791F" },
      { token: "regexp", foreground: "B7791F" },
      { token: "type", foreground: "1F8A5B" },
      { token: "type.identifier", foreground: "1F8A5B" },
      { token: "tag", foreground: "17645F" },
      { token: "attribute.name", foreground: "B7791F" },
      { token: "attribute.value", foreground: "D9461F" },
      { token: "delimiter", foreground: "5B6B68" },
      { token: "operator", foreground: "5B6B68" },
    ],
    colors: {
      "editor.background": "#FFFDFA",
      "editor.foreground": "#10211F",
      "editorLineNumber.foreground": "#B5BDB9",
      "editorLineNumber.activeForeground": "#5B6B68",
      "editor.lineHighlightBackground": "#00000000",
      "editor.selectionBackground": "#17645F33",
      "editorCursor.foreground": "#FF6845",
      "editorIndentGuide.background1": "#DDD5C9",
      "scrollbarSlider.background": "#10211F22",
      "scrollbarSlider.hoverBackground": "#10211F44",
    },
  });

  monaco.editor.defineTheme(MONACO_DARK, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7C8685", fontStyle: "italic" },
      { token: "keyword", foreground: "A8C9C8", fontStyle: "bold" },
      { token: "string", foreground: "FF9A4D" },
      { token: "number", foreground: "F45B0B" },
      { token: "regexp", foreground: "F45B0B" },
      { token: "type", foreground: "3DDC97" },
      { token: "type.identifier", foreground: "3DDC97" },
      { token: "tag", foreground: "A8C9C8" },
      { token: "attribute.name", foreground: "FF9A4D" },
      { token: "attribute.value", foreground: "FF9A4D" },
      { token: "delimiter", foreground: "A9B3B2" },
      { token: "operator", foreground: "A9B3B2" },
    ],
    colors: {
      "editor.background": "#0E100F",
      "editor.foreground": "#FFFFFF",
      "editorLineNumber.foreground": "#4A524F",
      "editorLineNumber.activeForeground": "#A9B3B2",
      "editor.lineHighlightBackground": "#00000000",
      "editor.selectionBackground": "#A8C9C833",
      "editorCursor.foreground": "#F45B0B",
      "editorIndentGuide.background1": "#1F2423",
      "scrollbarSlider.background": "#FFFFFF22",
      "scrollbarSlider.hoverBackground": "#FFFFFF44",
    },
  });
}