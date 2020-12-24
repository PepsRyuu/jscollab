// Based on CodeMirror's source.
// https://github.com/codemirror/CodeMirror/blob/master/src/model/document_data.js
// Required to be able to replay code changes on both server and client.

function linesFor (text, start, end) {
    let result = [];
    for (let i = start; i < end; ++i)
        result.push(text[i]);
    return result;
}

export function performEditorChange (input, change) {
    let lines = input.split('\n');
    let { from, to, text } = change;
    let firstLine = lines[from.line] || '';
    let lastLine = lines[to.line] || '';
    let nlines = to.line - from.line;
    let lastText = text[text.length - 1];

    if (change.full) {
        return text.join('\n');
    }

    if (from.line === to.line) {
        if (text.length === 1) {
            lines[from.line] = firstLine.slice(0, from.ch) + lastText + firstLine.slice(to.ch);
        } else {
            let added = linesFor(text, 1, text.length - 1);
            added.push(lastText + firstLine.slice(to.ch));
            lines[from.line] = firstLine.slice(0, from.ch) + text[0];
            lines = lines.slice(0, from.line + 1).concat(added).concat(lines.slice(from.line + 1));
        }
    } else if (text.length === 1) {
        lines[from.line] = firstLine.slice(0, from.ch) + text[0] + lastLine.slice(to.ch);
        lines.splice(from.line + 1, nlines);
    } else {
        lines[from.line] = firstLine.slice(0, from.ch) + text[0];
        lines[to.line] = lastText + lastLine.slice(to.ch);
        let added = linesFor(text, 1, text.length - 1);
        if (nlines > 1) lines.splice(from.line + 1, nlines - 1);
        lines = lines.slice(0, from.line + 1).concat(added).concat(lines.slice(from.line + 1));
    }

    return lines.join('\n');
}