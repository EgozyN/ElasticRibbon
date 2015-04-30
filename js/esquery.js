//explanation :  http://stackoverflow.com/questions/25660053/dont-understand-value-in-elasticsearch-explain-result
//show in lucene format and consider maybe having a popup representation
// per editor remote send
// stress testing
var client;
var editors = [];
var numOfEditors = 3;
var activeEditor = 0;
var Range = ace.require("ace/range").Range;
var globalSettings = {};
var json_query="JSON",yaml_query="YAML";
$(document).ready(function () {
    for (var i = 0; i < numOfEditors; i++) {
        editors[i] = ace.edit("editor" + i);
        editors[i].session.setTabSize(4);
        editors[i].commentedLines = [];
        editors[i].checkpoints = [];
        editors[i].index = i;
        editors[i].setTheme("ace/theme/clouds");
        setEditorMode(editors[i]);
        editors[i].commands.addCommands([
            { // bind control+/ to comment/uncomment all selected lines
                name: 'comment',
                bindKey: {win: 'Ctrl-/'},
                exec: function (editor) {
                    commentRange(editor);
                },
                readOnly: true // false if this command should not apply in readOnly mode
            },
            { // bind control+enter to submit query
                name: 'submit',
                bindKey: {win: 'Ctrl-Enter'},
                exec: function (editor) {
                    submitQuery(editor);
                },
                readOnly: true // false if this command should not apply in readOnly mode
            }
        ]);
        editors[i].on('change', function(change, editor){
            setEditorMode(editor);
        });
    }
    $("#query-type").html(editors[activeEditor].mode);
    $("#options-panel").modal('toggle');
});

$("#tabs a").click(function (e) {
    e.preventDefault();
    activeEditor = $(this).attr('data-editor');
    $("#query-type").html(editors[activeEditor].mode);
    $("#query-time").html("");
    $(this).tab('show');
    displayCheckPoints(editors[activeEditor]);

});

$("#show-options").click(function(e) {
    $("#options-panel").modal('toggle');
});

$("#options-panel").on('hide.bs.modal',function(e){
    setGlobalSettings();
});

$("#submit").click(function () {
    submitQuery(editors[activeEditor], replaceAllVariables, parseResults);
});

$(".add-var").on("click", function () {
    var rowHtml = "";
    rowHtml+="<tr><td><input class=\"form-control variable-name\" type=\"text\" value=\"__TERM__\"></td>";
    rowHtml+="<td><input class=\"form-control variable-value\" type=\"text\"/></td>";
    rowHtml+="<td><button class=\"btn btn-danger remove-var\">-</button></td></tr>";
    $("#variables tbody").append(rowHtml);
});

$("#variables").on("click", ".remove-var", function () {
    $(this).closest("tr").remove();
});

$(".save-checkpoint").on("click",function (){
    saveCheckPoint(editors[activeEditor]);
});

function setGlobalSettings(){
    setFontSize($("#font-size").val());
    setClient();
    globalSettings = {
        explain: $('#explanation').prop('checked'),
        index: $("#index").val(),
        type: $("#type").val(),
        from: $("#from").val(),
        size: $("#size").val(),
        _source: $("#_source").val().replace(/\s+/g, "")
    }
}

function setClient(){
    client = new $.es.Client({
        host: $("#es-address").val()
    });
}

function setFontSize(size){
    for (var i = 0; i < numOfEditors; i++) {
        editors[i].setFontSize(size);
    }
}

function resizeAce() {
    var h = window.innerHeight;
    if (h > 360) {
        $('.editor').css('height', (h-50).toString() + 'px');
    }
}

$(window).on('resize', function () {
    resizeAce();
});
resizeAce();