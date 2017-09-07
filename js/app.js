
var cy;
var nodes;
var settings = { dim: 10 };
var initPage = function () {

    cy = cytoscape({
        container: document.getElementById('cy'),
        userZoomingEnabled: false,
        zoomingEnabled: false,
        userPanningEnabled: false,

        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)'
                }
            },
            {
                selector: 'edge.directed',
                style: {
                    'line-color': 'data(color)',
                    'curve-style': 'bezier',
                    'target-arrow-color': 'data(color)',
                    'target-arrow-shape': 'triangle'
                }
            },
            {
                selector: 'edge.undirected',
                style: {
                    'line-color': 'data(color)',
                    'curve-style': 'bezier',
                    'source-arrow-shape': 'triangle',
                    'source-arrow-color': 'data(color)',
                    'target-arrow-color': 'data(color)',
                    'target-arrow-shape': 'triangle'
                }
            },
            {
                selector: 'edge.hidden',
                style: {
                    'visibility': 'hidden'
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
        cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: function () { cy.center(); } }).run();
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

    $("#select-edges-to-show input").change(function (e) {
        var option = parseInt($(this).data('edges-to-show'));
        switch (option) {
            case 2:
                cy.$('edge[group!="both"]').addClass("hidden");
                cy.$('edge[group="both"]').removeClass('hidden');
                break;
            case -1:
                cy.$('edge[group!="from a"]').addClass("hidden");
                cy.$('edge[group="from a"]').removeClass('hidden');
                break;
            case 1:
                cy.$('edge[group!="from b"]').addClass("hidden");
                cy.$('edge[group="from b"]').removeClass('hidden');
                break;
            default:
                break;
        }
    });

    cy.on('tap', 'edge.undirected', function (event) {
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
        cy.add(GenerateEdgesForMatrices(settings.A, settings.B));
    }
    function GenerateEdgesForMatrices(mat_a, mat_b, pref_a = 'a', pref_b = 'b') {
        var edges = [];
        for (var i = 0; i < mat_a.length; i++) {
            for (var j = 0; j < mat_b.length; j++) {
                switch (SwapRowsAndCheckIfBasis(mat_a, mat_b, i, j)) {
                    case 2:
                        edges.push(createEdge('e'+i+j, 'a_' + i, 'b_' + j, '#000','both', 'undirected'));
                        break;
                    case -1:
                        edges.push(createEdge('e-' + 'a_' + i + '-' + 'b_' + j, 'a_' + i, 'b_' + j, '#EDA1ED','from a','directed hidden'));
                        break;
                    case 1:
                        edges.push(createEdge('e-' + 'b_' + j + '-' + 'a_' + i, 'b_' + j, 'a_' + i, '#86B342','from b', 'directed hidden'));
                        break;
                    default:
                        continue;
                }
            }
        }
        return edges;
    }

    function createEdge(id, source, target, color,group, type) {
        return {
            group: 'edges',
            data: {
                id: id,
                source: source,
                target: target,
                color: color,
                group: group
            },
            classes: type
        }
    }

    function GenerateNodesForMatrix(matrix, prefix, parent = undefined) {
        var nodes = [];
        for (var i in matrix) {
            var index = parseInt(i);
            var node = {
                data: {
                    id: prefix + '_' + i,
                    parent: parent,
                    label: prefix + i,
                    extra: { row: i, pos: { row: index + 1, col: prefix == 'a' ? 1 : 2 } },
                    group: prefix
                },
                grabbable: false
            }
            nodes.push(node);
        }
        return nodes;
    }

    function SwapRowsAndCheckIfBasis(lhs, rhs, source, target) {
        var temp;
        temp = lhs[source];
        lhs[source] = rhs[target];
        rhs[target] = temp;
        lhs_is_basis = math.det(lhs) != 0;
        rhs_is_basis = math.det(rhs) != 0;
        temp = lhs[source];
        lhs[source] = rhs[target];
        rhs[target] = temp;
        if (lhs_is_basis && rhs_is_basis != 0) {
            return 2;//both stay basis
        }
        if (lhs_is_basis && !rhs_is_basis) {
            return -1;//lhs stays basis
        }
        if (!lhs_is_basis && rhs_is_basis) {
            return 1;//rhs stays basis
        }
        return 0;
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