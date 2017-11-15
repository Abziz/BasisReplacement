var cy;
var nodes;
var selected;
var gen = 0;
var settings = { dim: 10 };


function initPage() {
    $('[data-toggle="tooltip"]').tooltip();
    initButtons();
    updateMethodTitle();
    createMatrixTables();
    cy = cytoscape({
        container: document.getElementById('cy'),
        userZoomingEnabled: true,
        zoomingEnabled: true,
        userPanningEnabled: false,
        elements: [ // list of graph elements to start with
            
        ],
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                }
            },
            {
                selector: 'node.groupA',
                style: {
                    'text-valign': 'center',
                    'color': 'white',
                    'text-outline-width': 2,
                    'background-color': 'blue',
                    'text-outline-color': 'blue'
                }
            },
            {
                selector: 'node.groupB',
                style: {
                    'text-valign': 'center',
                    'color': 'white',
                    'text-outline-width': 2,
                    'background-color': 'red',
                    'text-outline-color': 'red'

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
                selector: 'edge.changed',
                style: {
                    'line-style': 'dashed'
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
    initCytoscapeEvents();
}


function initButtons() {

    $("#menu-btn").click(function (e) {
        $("#wrapper").toggleClass("toggled");
        setTimeout(adjustView, 500);
    });

    $("#home-btn").click(function (e) {
        adjustView();
    });

    $("input:radio[name='input-methods']").change(function (e) {
        updateMethodTitle();
        var selected = $(this).attr('id');
        if (selected == 'i_m_1') { // Transition matrix 
            $("#matrix-a-group").fadeOut(500);
            $("#matrix-b-group").fadeOut(500);
            $("#transition-matrix-btn-group button.t-mat-only").prop('disabled', false);
            $("#transition-matrix-btn-group .calc-btn").fadeOut(250);
        }
        else if (selected == 'i_m_2') { // two matrices
            $("#transition-matrix-btn-group button.t-mat-only").prop('disabled', true);
            $("#transition-matrix-btn-group .calc-btn").fadeIn(250);
            $("#matrix-a-group").fadeIn(500);
            $("#matrix-b-group").fadeIn(500);
        }
    });

    $(".matrix-btn").click(function (e) {
        $(this).parent().next().slideToggle(500);
    });

    $("#select-dim").change(function (e) {
        UpdateMatrixDimension($(this).val());
    })

    /** if transition matrix doesnt have to be a regular
    $(".random-btn").click(function (e) {
        if (!$(this).parent().next().is(":visible")) {
            $(this).parent().next().slideToggle(500);
        }
        matrixToInput(generateRandomBinaryMatrix(), $(this).parent().next().find("table"));
    });
    */
    
    $(".random-basis-btn ,.random-btn").click(function (e) { 
        if (!$(this).parent().next().is(":visible")) {
            $(this).parent().next().slideToggle(500);
        }
        matrixToInput(generateRandomBasis(), $(this).parent().next().find("table"));
    });

    $(".clear-btn").click(function (e) {
        $(this).parent().next().find("table input").val("");
    });

    $("#load-btn").click(function (e) {
        generateNodesFromTransitionMatrix();
        generateEdgesFromTransitionMatrix();
        cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: adjustView });
    });

    $(".calc-btn").click(function (e) {
        settings.A = inputToMatrix($("#matrix-table-a"));
        settings.B = inputToMatrix($("#matrix-table-b"));
        settings.transition = calculateTransitionMatrix(settings.A,settings.B);
        matrixToInput(settings.transition, $("#matrix-table-transition"));
    });

}

function adjustView() {
    cy.resize().animate({ fit: cy.elements });
}

function updateMethodTitle() {
    $("#method-title").text($("[name='input-methods']:checked").data("name"));
}

/* matrices and input */
function createMatrixTables() {
    $("[id^=matrix-table] tbody").each(function (i, table) {
        for (var i = 0; i < settings.dim; i++) {
            let tr = $("<tr/>");
            for (var j = 0; j < settings.dim; j++) {
                tr.append($("<td/>").append($("<input/>").addClass("mat-input").addClass("dim-visible")));
            }
            $(table).append(tr);
        }
    });

}

function generateRandomBasis() {
    var count = 0;
    var matrix;
    do {
        matrix = generateRandomBinaryMatrix();
        count++;
    }
    while (math.det(matrix) == 0);
    return matrix;
}

function generateRandomBinaryMatrix() {
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
    var input = $("tbody input.dim-visible", elem);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            $(input.get(i * n + j)).val(matrix[i][j]);
        }
    }
}

function UpdateMatrixDimension(n) {
    newDim = parseInt(n);
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
                    $(":first", col).addClass("dim-visible").val("");
                } else {
                    $(col).hide();
                    $(":first", col).removeClass("dim-visible").val("")
                }
            }
        }
    });
}

function inputToMatrix(elem) {
    var n = settings.dim;
    var input = $("tbody input.dim-visible", elem);
    console.log(input);
    var matrix = [];
    for (var i = 0; i < n; i++) {
        matrix[i] = [];
        for (var j = 0; j < n; j++) {
            matrix[i][j] = parseInt($(input.get(i * n + j)).val());
        }
    }
    return matrix;
}

function calculateTransitionMatrix(A, B, base = 2) {
    return math.mod(math.multiply(galoisInverse(A), B), base)
}

function galoisInverse(A) {
    return math.mod(math.round(math.multiply(math.det(A), math.inv(A))), 2);
}
function swapRows(source, dest, s_pos, d_pos) {
    console.log(source);
    console.log(dest);
    console.log(s_pos);
    console.log(d_pos);
    var temp = source[s_pos];
    source[s_pos] = dest[d_pos]
    dest[d_pos] = temp;
}


/* cytoscape related */

function initCytoscapeEvents() {
    cy.on('tap', 'edge.undirected', undirectedEdgeClick);
}


function generateNodesFromTransitionMatrix() {
    var mat = settings.transition = inputToMatrix($("#matrix-table-transition"));
    cy.elements().remove();
    cy.add({ data: { id: 'basis_a', label: 'A' }, selectable: false, grabbable: false });
    cy.add({ data: { id: 'basis_b', label: 'B' }, selectable: false, grabbable: false });
    for (var i in mat) {
        
        var node_for_a = {
            data: {
                id: 'a' + '_' + i,
                parent: 'basis_a',
                label: 'a' + i,
                extra: { pos: { row: parseInt(i), col: 1 } },
                group: 'b'
            },
            grabbable: false,
            classes: 'groupA'
        };
        var node_for_b = {
            data: {
                id: 'b' + '_' + i,
                parent: 'basis_b',
                label: 'b' + i,
                extra: { pos: { row: parseInt(i), col: 2 } },
                group: 'b'
            },
            grabbable: false,
            classes: 'groupB'
        };
        cy.add(node_for_a);
        cy.add(node_for_b);
    }
}

function generateEdgesFromTransitionMatrix() {
    cy.edges().remove();
    var A = settings.transition;
    var B = math.transpose(galoisInverse(A)); // the inverse transposed
    var edges = math.dotMultiply(A, B);
    for (var i = 0; i < settings.dim; i++) {
        for (var j = 0; j < settings.dim; j++) {
            if (edges[i][j] == 1) {
                var edge = {
                    group: 'edges',
                    data: {
                        id: 'left_' + i + '_right_' + j,
                        source: 'a_' + i,
                        target: 'b_' + j,
                        color: 'black',
                        group: 'both'
                    },
                    classes: 'undirected'
                }
                cy.add(edge);
            }
        }
    }
}

function bipartite(node) {
    return node.data('extra').pos;
}

/* event handlers */
function undirectedEdgeClick(event) {
    aaa = event.cyTarget;
    console.log(event);
    var edge = event.cyTarget;
    var source_org_position = edge.source().data().extra.pos;
    var target_org_position = edge.target().data().extra.pos;
    var source_org_parent = edge.source().parent().id();
    var target_org_parent = edge.target().parent().id();
    edge.source().data().extra.pos = target_org_position;
    edge.target().data().extra.pos = source_org_position;
    edge.source().move({ parent: target_org_parent });
    edge.target().move({ parent: source_org_parent });

    var i = source_org_position.row;
    var j = target_org_position.row;
    console.log(i);
    console.log(j);
    updateTransitionMatrix(i,j);
    cy.edges('#left_' + j + '_right_' + i).addClass("changed");
    cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: function () { } });
}


function updateTransitionMatrix(i, j){
    var B = settings.transition;
    var T = [];
    for (var k = 0; k < settings.dim; k++) {
        T[k] = [];
        for (var m = 0; m < settings.dim; m++) {
            if (i != k && j != m) {
              T[k][m] = math.mod(B[k][m] + B[k][i] * B[j][m],2);
            }
            else {
                T[k][m] = B[k][m];
            }
        }
    }
    settings.transition = T;
    generateEdgesFromTransitionMatrix();
    
}


