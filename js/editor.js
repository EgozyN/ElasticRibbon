
function saveCheckPoint(editor){
    editor.checkpoints.push({
        text: editor.getValue(),
        time: $("#query-time").html().replace("ms",""),
        commentedLines: editor.commentedLines.slice()
    });
    displayCheckPoints(editor);
}

function removeCheckPoint(editor, index){
    editor.checkpoints.splice(index, 1);
    displayCheckPoints(editor);
}

function loadCheckPoint(editor, index){
    editor.setValue(editor.checkpoints[index].text);
    editor.commentedLines.forEach(function(line){
        editor.session.removeMarker(line.marker);
    });
    editor.commentedLines = editor.checkpoints[index].commentedLines.slice();
    editor.commentedLines.forEach(function(line){
        line.marker = editor.session.addMarker(new Range(line.row, 0, line.row + 1, 0), "comment", "comment");
    });
    editor.clearSelection();
}

function displayCheckPoints(editor){
    var table = $("#checkpoints tbody");
    //table.html("");
    var html = "";
    editor.checkpoints.forEach(function (checkpoint){
        html += "<tr><td><span></span></td>";
        html += "<td class=\"load-checkpoint\"><button class=\"btn btn-success btn-sm\">Load</button></td>";
        html += "<td class=\"remove-checkpoint\"><button class=\"btn btn-danger btn-sm\">Remove</button></tr>";
    });
    table.html(html);
    $('#checkpoints td:first-child span').each(function(index) {
        displayTimeInJquery($(this),editor.checkpoints[index].time);
    });

    table.off("click").on("click", ".load-checkpoint", function() {
        var row = $(this).parent('tr').index();
        loadCheckPoint(editor,row);
    }).on("click", ".remove-checkpoint", function() {
        var row = $(this).parent('tr').index();
        removeCheckPoint(editor,row);
    });
}

function setEditorMode(editor){
    var mode = getQueryLanguage(editor);
    if (editor.mode != mode){
        editor.mode = mode;
        editor.commentedLines.forEach(function(marker){
            editor.session.removeMarker(marker.marker);
        });
        editor.commentedLines = [];
        var aceMode;
        if (mode==json_query){
            aceMode = ace.require("ace/mode/json").Mode;
        }else {
            aceMode = ace.require("ace/mode/yaml").Mode;
        }
        editor.session.setMode(new aceMode());
        $("#query-type").html(editor.mode);
    }
}

function getQueryLanguage(editor){
    var firstChar = editor.getValue().trim()[0];
    if (firstChar=='{'){
        return json_query;
    }
    return yaml_query;
}

