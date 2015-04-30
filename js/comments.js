function commentRange(editor) {
    var begin, end, range;
    range = getCommentRange(editor);
    begin = range.start.row < range.end.row ? range.start.row : range.end.row;
    end = range.start.row < range.end.row ? range.end.row : range.start.row;
    var fold = editor.session.getFoldsInRange(new Range(begin, 0, begin + 1, 0)); //see notes in end fold
    if (fold.length == 1) {
        begin = fold[0].start.row;
    }
    fold = editors[activeEditor].session.getFoldsInRange(new Range(end, 0, end + 1, 0)); // can only have 1 fold between 2 following rows
    if (fold.length == 1) { //maybe >0?
        end = fold[0].end.row;
    }
    var toComment = false;
    for (var i = begin; i <= end; i++) {
        var index = getRowIndex(editor.commentedLines, i);
        if (index == -1) {
            toComment = true;
            break;
        }
    }
    for (i = begin; i <= end; i++) {
        commentRow(editor, i, toComment);
    }
}

function commentRow(editor, row, toComment) {
    var index = getRowIndex(editor.commentedLines, row);
    if (index != -1) {   // already commented, remove comment if necessary
        if (toComment == false) {
            editor.session.removeMarker(editor.commentedLines[index].marker);
            $("#editor" + editor.index + " .ace_line").eq(row).removeClass("comment-text");
            editor.commentedLines.splice(index, 1);
        }
    } else {    // not commented, add comment
        var marker = editor.session.addMarker(new Range(row, 0, row + 1, 0), "comment", "comment");
        $("#editor" + editor.index + " .ace_line").eq(row).addClass("comment-text");
        editor.commentedLines.push({row: row, marker: marker});
    }
}

/*
 Returns the range to be commented.
 */
function getCommentRange(editor) {
    if (editor.getSelectionRange().startRow == editor.getSelectionRange().endRow) { // Enter here if the user marked just one line
        var cursor = editor.getCursorPosition();                                   // and look to comment the whole block
        var line = editor.session.getLine(cursor.row);
        var trimmedLine = line.trim();
        var firstChar = trimmedLine[0];
        var lastChar = trimmedLine.charAt(trimmedLine.length - 1);
        if (editor.mode == "JSON" && (firstChar == '{' || firstChar == '}')) {         // handle JSON block commenting
            var otherBracket = editor.session.findMatchingBracket(cursor);
            return new Range(cursor.row, cursor.column, otherBracket.row, otherBracket.column);
        } else if (editor.mode == "YAML" && lastChar == ':') {                          //handle YAML block commenting
            var firstCharIndex = line.indexOf(firstChar);
            for (var row = cursor.row; row < editor.session.getLength(); row++) {
                line = editor.session.getLine(row);
                trimmedLine = line.trim();
                if (line.indexOf(trimmedLine[0]) < firstCharIndex ||
                    (line.indexOf(trimmedLine[0]) == firstCharIndex && editor.session.getTokenAt(row, firstCharIndex) == ":")) {
                    return new Range(cursor.row, cursor.column, row - 1, cursor.column);
                }
            }
            return new Range(cursor.row, cursor.column, editor.session.getLength(), cursor.column);
        }
    }
    return editor.getSelectionRange();
}