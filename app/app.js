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
	original: null,
	A: math.zeros(10, 10)._data,
	B: math.zeros(10, 10)._data,
	history: {prev: [], next: [] }
};
var database = firebase.database();

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
	initSavedMatrices();
}

function initSavedMatrices() {
	var ref = database.ref('saved');
	ref.on('value', listSavedMatrices, function (err) { console.log(err) });
}

function listSavedMatrices(data) {
	$("#matrix-list").empty()
	$.each(data.val(), function (i, v) {
		let clone = $("#item-template>div").clone();
		let name = v.name || "לא נבחר שם";
		let base = v.base || "Real"
		$(".item-name", clone).text(name);
		$(".item-dim", clone).text("dim: " + v.dim);
		$(".item-base", clone).text("base: " +base);
		$(".item-load",clone).data("settings", v);
		$(".item-delete",clone).data("key", i);
		$("#matrix-list").append(clone);
	});
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
		turnEmptyInputToZero();
		copyOriginalToCurrent();
		$("#current-transition-matrix>div>.card-body").slideToggle(500);
		generateNodesFromTransitionMatrix();
		generateEdgesFromTransitionMatrix();
		settings.history = {prev: [], next: [] }
		settings.original = math.clone(settings.transition);
		settings.current = 0;
		if (!show_directed) {
			cy.$(".directed").hide();
		}
		if (!show_undirected) {
			cy.$(".undirected").hide();
		}
		cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: adjustView });
		$(".edges-btns").fadeIn();
	});

	$("#load-matrix-btn").click(function (e) {
		$("#load-matrix-modal").modal();
		e.preventDefault();
	});


	$(".calc-btn").click(function (e) {
		settings.A = inputToMatrix($("#matrix-table-a"));
		settings.B = inputToMatrix($("#matrix-table-b"));
		settings.transition = math.TransitionMatrix(settings.A, settings.B, settings.base);
		matrixToInput(settings.transition, $("#matrix-table-original"));
	});

	$(document).on('click', '.save-matrix-confirm', saveMatrixSettings);
	$(".save-btn").popover({
		html: true,
		container: 'body',
		content: '<div class="input-group"><span class="input-group-btn"><button class="btn btn-dark save-matrix-confirm"><i class="fa fa-save"></i></button></span><input class="form-control" placeholder="Give this matrix a name..."></div>'
	});
	$(document).on('click', '.item-delete', deleteMatrixSettings);
	$(document).on('click', '.item-load', loadMatrixSettings);
	$("#next-btn").click(goNext);
	$("#prev-btn").click(goPrev);
}


function loadMatrixSettings(e) {
	var opts = $(this).data("settings");
	$("#select-dim").val(opts.dim).change();
	$("#select-field").val(opts.base).change();
	settings.transition = math.clone(opts.transition)
	matrixToInput(settings.transition,$("#matrix-table-original"))
}
function deleteMatrixSettings(e) {
	console.log($(this).data('key'));
	var key = $(this).data('key');
	database.ref("saved").child(key).remove();
}

function saveMatrixSettings(e) {
	var name = $(this).parent().parent().find('input').val();
	if (!name) {
		alert("Please fill in a name for the matrix");
		return false;
	}
	var ref = database.ref("saved")
	ref.push({
		name: name,
		dim: settings.dim,
		base: settings.base,
		transition: settings.transition
	});
	$(".save-btn").popover("hide");
	alert("Matrix successfully saved");
	e.preventDefault();
}

function adjustView() {
	cy.resize().animate({ fit: cy.elements });
}

function updateMethodTitle() {
	$("#method-title").text($("[name='input-methods']:checked").data("name"));
}

/* matrices and input */
function copyOriginalToCurrent() {
	settings.transition = inputToMatrix($("#matrix-table-original"));
	matrixToInput(settings.transition, $("#matrix-table-transition"));
	matrixToInput(math.Inv(settings.transition, settings.base), $("#matrix-table-transition-inverse"));
}

function createMatrixTables() {
	$("[id^=matrix-table] tbody").each(function (i, table) {
		for (var i = 0; i < settings.dim; i++) {
			let tr = $("<tr/>");
			for (var j = 0; j < settings.dim; j++) {
				tr.append($("<td/>").append($("<input/>").attr("placeholder", "0").addClass("mat-input").addClass("dim-visible")));
			}
			$(table).append(tr);
		}
	});
	$("#matrix-table-transition input").attr("disabled", true);
	$("#matrix-table-transition-inverse input").attr("disabled", true);

}

function turnEmptyInputToZero() {
	$(".mat-input").each(function () {
		if (!$(this).val()) {
			$(this).val("0");
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
				label: 'a' + (i + 1),
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
				label: 'b' + (i + 1),
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
	console.log("saddsa", settings.transition);

	var B = math.Inv(A, settings.base); // the inverse transition

	var basis_a = cy.$("#basis_a").children().sort(function (a, b) { return a.data().extra.pos.row - b.data().extra.pos.row });
	var basis_b = cy.$("#basis_b").children().sort(function (a, b) { return a.data().extra.pos.row - b.data().extra.pos.row });
	// var edges = math.dotMultiply(A, B);
	var source, target, classes, group;
	for (var i = 0; i < settings.dim; i++) {
		for (var j = 0; j < settings.dim; j++) {
			if ((A[i][j] != 0) && (B[j][i] != 0)) {
				source = basis_a[i];
				target = basis_b[j];
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
				source = basis_a[i];
				target = basis_b[j];
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
	var a = edge.source().id();
	var b = edge.target().id();
	if (settings.current < settings.length - 1) {
		settings.history = settings.history.slice(0, settings.current + 1);
	}
	swapNodes(a, b)
	settings.history.next = [];
	settings.history.prev.push({ a: a, b: b });
	enableNextPrev();
}

function swapNodes(a, b) {
	let node_a = cy.$('#' + a);
	let node_b = cy.$('#' + b);
	let source_org_position = node_a.data().extra.pos;
	let target_org_position = node_b.data().extra.pos;
	console.log(source_org_position);
	console.log(target_org_position);
	let source_org_parent = node_a.parent().id();
	let target_org_parent = node_b.parent().id();
	console.log(source_org_parent);
	console.log(target_org_parent);
	node_a.data().extra.pos = target_org_position;
	node_b.data().extra.pos = source_org_position;
	node_a.move({ parent: target_org_parent });
	node_b.move({ parent: source_org_parent });
	let i = source_org_position.row;
	let j = target_org_position.row;
	swapRows(settings.A, settings.B, i, j);
	settings.transition = updateTransitionMatrix(i, j);
	generateEdgesFromTransitionMatrix();
	if (!show_directed) {
		cy.$(".directed").hide();
	}
	if (!show_undirected) {
		cy.$(".undirected").hide();
	}
	cy.edges('#' + a + "_b_" + b).addClass("changed");
	cy.edges('#' + b + "_b_" + a).addClass("changed");
	cy.layout({ name: 'grid', position: bipartite, rows: settings.dim, cols: 2, fit: true, ready: function () { } });
	updateTransitionAndInverseInputs();
}

function updateTransitionAndInverseInputs() {
	matrixToInput(settings.transition, $("#matrix-table-transition"));
	matrixToInput(math.Inv(settings.transition, settings.base), $("#matrix-table-transition-inverse"));
}

function goPrev() {
	if (settings.history.prev.length) {
		var move = settings.history.prev.pop();
		settings.history.next.push(move);
		swapNodes(move.b, move.a);
		enableNextPrev();
	}
}

function goNext() {
	if (settings.history.next.length) {
		var move = settings.history.next.pop();
		settings.history.prev.push(move);
		swapNodes(move.a, move.b);
		enableNextPrev();
	}
}

function enableNextPrev() {
	$("#prev-btn").attr("disabled",settings.history.prev.length == 0);
	$("#next-btn").attr("disabled",settings.history.next.length == 0);
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
					T[k][m] = -(B[k][i] / B[j][i]);
				}
				else if (k == j && m != i) {
					T[k][m] = B[j][m] / B[j][i];
				}
				else if (k == j && m == i) {
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



