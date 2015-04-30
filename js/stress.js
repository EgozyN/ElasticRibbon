$("#stress-test").click(function(e) {
    $("#stress-modal").modal('toggle');
});


$(".add-stress-var").on("click", function () {
    var rowHtml = "";
    rowHtml+="<tr><td><input class=\"form-control stress-variable-name\" type=\"text\" value=\"__TERM__\"></td>";
    rowHtml+="<td><input class=\"form-control stress-variable-value\" type=\"text\"/></td>";
    rowHtml+="<td><button class=\"btn btn-danger stress-remove-var\">-</button></td></tr>";
    $("#stress-variables tbody").append(rowHtml);
});

$("#stress-variables").on("click", ".stress-remove-var", function () {
    $(this).closest("tr").remove();
});

$("#stress-submit").click(function () {
    var count = Number($("#stress-count").val());
    var timeTaken = [];
    asyncLoop(count, function(loop) {
            submitQuery(editors[activeEditor], randomizeBetweenVariables, function(results, body){
            timeTaken.push(results.took);
                loop.next();
            })},
        function(){
            timeTaken.sort(function(a,b) {
                return a - b;
            });
            var resultsTable = $("#stress-results tbody");
            var html="";
            for (var i=10;i<=100;i+=10){
                html+="<tr><td>" + i + "%</td><td>" + calcPercentile(i,timeTaken) + "ms</td></tr>";
            }
            resultsTable.html(html);
        }
    );
});

function calcPercentile(percentile, arr){
    var index = Math.round(percentile/100*arr.length);
    return arr[index-1];
}

function randomizeBetweenVariables(rows){
    var variableNames = $.map($(".stress-variable-name"),function(v){
        return $(v).val();
    });
    var variableValues = $.map($(".stress-variable-value"),function(v){
        return $(v).val();
    });
    rows.forEach(function (row, rowIndex){
        variableNames.forEach(function(name, variableIndex){
            var terms = variableValues[variableIndex].split(",");
            var randomizedTerm = terms[Math.floor(Math.random()*terms.length)];
            rows[rowIndex] =  row.split(name).join(randomizedTerm);
        });
    });
    return rows;
}

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }
            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}
