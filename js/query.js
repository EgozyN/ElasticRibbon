function submitQuery(editor, variableFunction, callback) {
    var body = editor.session.getDocument().getAllLines();
    body = $.grep(body, function (str, row) { //ignore all commented lines
        return (getRowIndex(editor.commentedLines, row) == -1);
    });
    body = variableFunction(body);
    if (editor.mode == json_query) {
        body = body.join("");
        body = body.replace(/\s+/g, "");
        body = body.replace(/,]/g, "]"); // makes it easier to submit with commented subqueries.
        body = body.replace(/,}/g, "}");
        body = JSON.parse(body);
    } else if (editor.mode == yaml_query) {
        body = body.join("\n");
        body = jsyaml.safeLoad(body);
    }
    console.log(body);
    client.search(
        {
            body: {query: body},
            explain: globalSettings.explain,
            index: globalSettings.index,
            type: globalSettings.type,
            from: globalSettings.from,
            size: globalSettings.size,
            _source: globalSettings._source
        },
        function (error, response, status) {
            if (error) {
                console.log(error);
            } else {
                callback(response, body);
            }
        }
    );
}

function parseResults(result, body) {
    var time = $("#query-time");
    displayTimeInJquery(time, result.took);
    var resultsHeader = $("#results thead")
    var headerHtml = "";
    headerHtml += "<tr><th>Score</th>";
    var headers = globalSettings._source.split(",");
    headers.forEach(function (src) {
        headerHtml += "<th>" + src + "</th>";
    });
    headerHtml += "</tr>";
    resultsHeader.html(headerHtml);
    var resultsTable = $("#results tbody");
    resultsTable.html("");
    result.hits.hits.forEach(function (hit, index) {
        var rowHtml = "";
        rowHtml += "<tr><td class=\"score-link\">" + hit._score.toString() + "</td>";
        for (var key in hit._source) {
            if (hit._source.hasOwnProperty(key)) {
                var res;
                if (hit._source[key] == null || typeof(hit._source[key]) != "string") {
                    res = "";
                } else {
                    res = hit._source[key].length > 80 ? hit._source[key].substring(0, 80) : hit._source[key];
                }
                rowHtml += "<td>" + res + "</td>";
            }
        }
        rowHtml += "</tr>";
        resultsTable.append(rowHtml);
    });
    $("#results").off("click").on("click", ".score-link", function () {
        var row = $(this).parent('tr').index();
        var text = "<pre><code>" + jsyaml.safeDump(result.hits.hits[row]._explanation) + "</code></pre>";
        var query = "<pre><code>" + jsyaml.safeDump(body) + "</code></pre>";
        $("#explain-text").html(text);
        $("#explain-query").html(query);
        $("#explain-modal").modal('toggle');
    });
}

/* ######################## utils ################### */
function getRowIndex(arr, row) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].row == row) {
            return i;
        }
    }
    return -1;
}

function replaceAllVariables(rows) {
    var variableNames = $.map($(".variable-name"), function (v) {
        return $(v).val();
    });
    var variableValues = $.map($(".variable-value"), function (v) {
        return $(v).val();
    });
    rows.forEach(function (row, rowIndex) {
        variableNames.forEach(function (name, variableIndex) {
            if (variableValues[variableIndex] == "RAND_TIME") {
                rows[rowIndex] = rows[rowIndex].split(name).join(randomDate(new Date($("#rand-start").val()), new Date($("#rand-end").val())).toISOString());
            } else {
                rows[rowIndex] = rows[rowIndex].split(name).join(variableValues[variableIndex]);
            }
        });
    });
    return rows;
}

function displayTimeInJquery(jquery, time) {
    jquery.removeClass("text-success").removeClass("text-warning").removeClass("text-danger").addClass("font-bold").html("" + time + "ms");
    if (time < 150) {
        jquery.addClass("text-success");
    } else if (time < 300) {
        jquery.addClass("text-warning");
    } else {
        jquery.addClass("text-danger");
    }
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}