
var cy;
var nodes;
var settings = { dim: 10 };
var initPage = function () {

    cy = cytoscape({
        container: document.getElementById('cy'),
        userZoomingEnabled: false,
        zoomingEnabled:false,
        userPanningEnabled: false,
        
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)'
                }
            }
        ]
    });
    $("#random-basis-A-btn").click(function (e) {
        matrixToInput(generateRandomBasis(), $("#basisA"));
    });
    $("#random-basis-B-btn").click(function (e) {
        matrixToInput(generateRandomBasis(), $("#basisB"));
    });
    $("#load-graph-btn").click(function (e) {
        cy.$("*").remove();
        GenerateGraphElements();
        cy.layout({ name: 'grid', position: bipartite, rows: settings.dim,cols:2, fit: true }).run();        
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
        onFinish: UpdateMatrixDimension
    });
    $("#reset-zoom").click(function () {
        cy.center();
    });
    $(".matrix input").bind('paste', null, smartpaste);

    cy.on('tap', 'edge', function (event) {
        var edge = event.target;
        alert('swap ' + edge.source().id() + ' with ' + edge.target().id());
    });

    function bipartite(node) {
        extra = node.data('extra');
        return extra.pos;
    }
    function GenerateGraphElements() {
        settings.A = InputTomatrix($("#basisA"));
        settings.B = InputTomatrix($("#basisB"));
        elements = [];
        cy.add({ data: { id: 'basis_a', label: 'A' }, selectable: false, grabbable: false });
        cy.add({ data: { id: 'basis_b', label: 'B' }, selectable: false, grabbable: false });
        cy.add(GenerateNodesForMatrix(settings.A, 'a', 'basis_a'));
        cy.add(GenerateNodesForMatrix(settings.B, 'b', 'basis_b'));
        //cy.add(GenerateEdgesForMatrices(settings.A, settings.B, 'a', 'b'));
    }

    function GenerateNodesForMatrix(matrix, prefix, parent = undefined) {
        var nodes = [];
        for (var i in matrix) {
            var index = parseInt(i);
            var node = {
                data: {
                    id: prefix + '_' + i,
                    parent: parent,
                    label: prefix + (index+1),
                    extra: { row: i, pos: { row: index + 1, col: prefix == 'a' ? 1 : 2 } }
                },
                grabbable: false
            }
            nodes.push(node);
        }
        return nodes;
    }

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
        return matrix;
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

    function matrixToInput(matrix, elem) {
        var n = settings.dim;
        var input = $("tbody input:visible", elem);
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                $(input.get(i * n + j)).val(matrix[i][j]);
            }
        }
    }

    function InputTomatrix(elem) {
        var n = settings.dim;
        var input = $("tbody input:visible", elem);
        var matrix = [];
        for (var i = 0; i < n; i++) {
            matrix[i] = [];
            for (var j = 0; j < n; j++) {
                matrix[i][j] = $(input.get(i * n + j)).val();
            }
        }
        return matrix;
    }

    function UpdateMatrixDimension(data) {
        newDim = parseInt(data.input.val());
        if (newDim == settings.dim) {
            return;
        }
        settings.dim = newDim;
        $(".matrix").each(function (index, elem) {
            var table = this;
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
        });
    }

    function smartpaste(e) {
        e.preventDefault();
        var pasted = e.originalEvent.clipboardData.getData('Text').replace(/\D/g, "").split("");
        for (var i = 0, elem = $(this); i < pasted.length && i < settings.dim * settings.dim; i++) {
            elem.val(pasted[i]);
            next = elem.parent().next(":visible").find(":first-child");
            if (next[0] == undefined) {
                next = elem.parent().parent().next(":visible").find(':first-child').find(':first-child');
                if (next[0] == undefined || !next.is(':visible')) {
                    break;
                }
            }
            elem = next;
        }
        e.prevent
    }
}