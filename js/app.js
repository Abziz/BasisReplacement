
var cy;
var nodes;
var settings = { dim: 10 };
var initPage = function () {
    cy = cytoscape({
        container: document.getElementById('cy'),
        userZoomingEnabled: false,
        userPanningEnabled: true
    });
    cy.add({
        group: 'nodes',
        data: {
            id: 'n1'
        },
        locked: true
    })

    $("#random-basis-btn").click(function (e) {
        generateRandomBasis();
    });
    $("#btn-settings").click(function () {
        var setting = $("#settings");
        if (setting.is(":visible")) {
            setting.animate({ top: "100%" }, 400, function () {
                setting.toggle();
            });
        } else {
            setting.toggle();
            setting.animate({ top: "60%" }, 400);
        }
    });

    $("#dimmension").ionRangeSlider({
        type: "single",
        prefix: "dimmension: ",
        force_edges: true,
        min: 2,
        max: 10,
        from: 10,
        step: 1,
        grid: true,
        grid_num: 8,
        onFinish: UpdateMatrixInput
    });

    $("#reset-zoom").click(function () {
        cy.center();
    });

    $(".matrix input").bind('paste', null, smartpaste);

    cy.on('tap', 'edge', function (event) {
        
        var edge = event.target;
        alert('swap ' + edge.source().id() + ' with ' + edge.target().id());
    });

    function csvToTable(e, elem) {


    }

    function generateRandomBasis() {
        var count = 0;
        var matrix;
        do {
            matrix = randomBinaryMatrix();
            count++;
        }
        while (math.det(matrix) == 0);
        matrixToInput(matrix);
        settings.matrix = matrix;
        console.log(count);
    }
    function randomBinaryMatrix() {
        var matrix = [];
        for (var i = 0; i < settings.dim; i++) {
            matrix[i] = [];
            for (var j = 0; j < settings.dim; j++) {
                matrix[i][j] = Math.round(Math.random());
            }
        }
        return matrix;
    }

    function matrixToInput(matrix) {
        var n = settings.dim;
        var out = $(".matrix tbody input:visible");
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                $(out.get(i * n + j)).val(matrix[i][j]);
            }
        }
        
    }

    function UpdateMatrixInput(data) {
        newDim = data.input.val();
        if (newDim == settings.dim) {
            return;
        }
        settings.dim = newDim;
        table = $(".matrix")[0];
        for (var i = 0, row; row = table.rows[i]; i++) {
            for (var j = 0, col; col = row.cells[j]; j++) {
                if (i < newDim && j < newDim) {
                    $(col).show();
                } else {
                    $(col).hide();
                    $(":first", col).val("")
                }
            }
        }

    }

    function smartpaste(e) {
        e.preventDefault();
        var pasted = e.originalEvent.clipboardData.getData('Text').replace(/\D/g, "").split("");
        for (var i = 0, elem = $(this); i < pasted.length && i < settings.dim*settings.dim; i++){
            elem.val(pasted[i]);
            next = elem.parent().next(":visible").find(":first-child");
            if (next[0] == undefined) {
                next = elem.parent().parent().next(":visible").find(':first-child').find(':first-child');
                if (next[0] == undefined || !next.is(':visible')) {
                    break;
                }
            }
            console.log(next);
            elem = next;
        }
        e.prevent
    }
}