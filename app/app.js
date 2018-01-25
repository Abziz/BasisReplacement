var cy;
var nodes;
var selected;
var gen = 0;
var show_directed = false;
var show_undirected = true;
var settings = {
    dim: 10,
    base: 0,
    transition: math.zeros(10, 10)._data,
    A: math.zeros(10, 10)._data,
    B: math.zeros(10,10)._data
};

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

    $("#edges-undirected-btn").click(function (e) {
        cy.$(".directed").hide();
        show_directed = false;
        cy.$(".undirected").show();
        show_undirected = true;
	});

    $("#edges-directed-btn").click(function (e) {
        cy.$(".directed").show();
        show_directed = true;
        cy.$(".undirected").hide();
        show_undirected = false;
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

	$("#select-field").change(function (e) {
		settings.base = parseInt($(this).val());
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
		settings.transition = math.RandomBasis(settings.dim, settings.base);
		matrixToInput(settings.transition, $(this).parent().next().find("table"));
    });

    $(".clear-btn").click(function (e) {
        $(this).parent().next().find("table input").val("");
    });

    $("#load-btn").click(function (e) {
        generateNodesFromTransitionMatrix();
        generateEdgesFromTransitionMatrix();
        if (!show_directed) {
            cy.$(".directed").hide();
        }
        if (!show_undirected) {
            cy.$(".undirected").hide();
        }
        cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: adjustView });
        $(".edges-btns").fadeIn();
    });

    $(".calc-btn").click(function (e) {
        settings.A = inputToMatrix($("#matrix-table-a"));
        settings.B = inputToMatrix($("#matrix-table-b"));
        settings.transition = math.TransitionMatrix(settings.A, settings.B, settings.base);
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
    var matrix = [];
    for (var i = 0; i < n; i++) {
        matrix[i] = [];
		for (var j = 0; j < n; j++) {
			if (settings.base == 2) {
				matrix[i][j] = parseInt($(input.get(i * n + j)).val());
			} else {
				matrix[i][j] = parseFloat($(input.get(i * n + j)).val());
			}
        }
    }
    return matrix;
}


function swapRows(source, dest, s_pos, d_pos) {
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

    for (var i = 0; i < settings.dim; i++) {

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
    var A = settings.transition
    if (math.Det(A, settings.base) == 0) {
        alert("det = 0");
        return -1;
    }
    console.log("saddsa",settings.transition);

    var B = math.transpose(math.Inv(A, settings.base)); // the inverse transposed

    var basis_a = cy.$("#basis_a").children().sort(function (a, b) { return a.data().extra.pos.row - b.data().extra.pos.row });
    var basis_b = cy.$("#basis_b").children().sort(function (a, b) { return a.data().extra.pos.row - b.data().extra.pos.row });
   // var edges = math.dotMultiply(A, B);
    var source, target, classes, group;
    for (var i = 0; i < settings.dim; i++) {
        for (var j = 0; j < settings.dim; j++) {
            if (A[i][j] == 0 && B[i][j] == 0) {
                continue; //no edge
            }
            source = basis_a[i];
            target = basis_b[j];
            if ( (A[i][j] != 0) && (B[i][j] != 0)) {
                classes = "undirected";
                group = 'both';
				color = 'black';
				cy.add({
					group: 'edges',
					data: {
						id: source.id() + "_b_" + target.id(),
						color: color,
						source: source.id(),
						target: target.id(),
						group: group
					},
					classes: classes
				});
			}

            if (A[i][j] != 0) {
                group: 'ltr';
                classes = "directed";
				color = 'green';
				cy.add({
					group: 'edges',
					data: {
						id: source.id() + "_g_" + target.id(),
						color: color,
						source: source.id(),
						target: target.id(),
						group: group
					},
					classes: classes
				});
            }
            if (B[i][j] != 0) {
                group: 'rtl';
                classes = "directed";
                color = 'orange';
                source = basis_b[i];
				target = basis_a[j];
				cy.add({
					group: 'edges',
					data: {
						id: source.id() + "_o_" + target.id(),
						color: color,
						source: source.id(),
						target: target.id(),
						group: group
					},
					classes: classes
				});
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
    swapRows(settings.A, settings.B, i, j);
    settings.transition = updateTransitionMatrix(i, j);
    generateEdgesFromTransitionMatrix();

    //matrixToInput(settings.A, $("#matrix-table-a"));
    //matrixToInput(settings.B, $("#matrix-table-b"));
    //matrixToInput(settings.transition, $("#matrix-table-transition"));
 
    cy.edges('#' + edge.source().id() + "__" + edge.target().id()).addClass("changed");
    cy.edges('#' + edge.target().id() + "__" + edge.source().id()).addClass("changed");
    if (!show_directed) {
        cy.$(".directed").hide();
    }
    if (!show_undirected) {
        cy.$(".undirected").hide();
    }
    cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: function () { } });
}


function updateTransitionMatrix(i, j) {
    var B = math.transpose(settings.transition);
    
    console.log(B);
    var T = [];
    for (var k = 0; k < settings.dim; k++) {
        T[k] = [];
        for (var m = 0; m < settings.dim; m++) {
			if (settings.base == 2) {
				if (j != k && i != m) {
					T[k][m] = math.mod(B[k][m] + (B[k][i] * B[j][m]), settings.base);
				}
				else {
					T[k][m] = B[k][m];
				}
			} else {
				if (k != j && m != i) {
					T[k][m] = B[k][m] - (B[k][i] * B[j][m] / B[j][i]); 
				}
				else if (k != j && m == i) {
					T[k][m] = -(B[k][i]/B[j][i]); 
				}
				else if (k == j && m != i) {
					T[k][m] = B[j][m] / B[j][i];
				}
				else if( k==j && m == i) {
					T[k][m] = 1 / B[j][i];
				}
			}

        }
    }
    
    T = math.transpose(T);
    return T;
}



function mat2str(mat) {
    var str = "";
    $(mat).each(function (i, row) {
        $(row).each(function (j, elem) {
            str += elem + "\t";
        });
        str += "\n";
    });
    return str;
}




function swapToHaveLeadingOne(A, I, index) {
    if (A[index][index] == 1) {
        return;
    }
    for (var i = index + 1; i < settings.dim; i++) {
        if (A[i][index] == 1) {
            A.swap(index, i);
            I.swap(index, i);
            return;
        }
    }
}

Array.prototype.swap = function (i, j) {
    var temp = this[i];
    this[i] = this[j];
    this[j] = temp;
    return this;
}



