var cy;
var nodes;
var settings = {};
$(function () {
    $("#btn-settings").click(function () {
        var setting = $("#settings");
        if (setting.is(":visible")) {
            setting.animate({top:"100%"},400,function(){
                setting.toggle();
            });
        } else {
            setting.toggle();
            setting.animate({top:"60%"},400);
        }
    });
    $("#reset-zoom").click(function () {
        cy.center();
        cy.zoom(1);
    });
    $("#dim").change(function () {
        num = $(this).val();
        console.log(num)
        if (num < 2) {
            $(this).val(2);
            num = 2;
        } else if (num > 10) {
            $(this).val(10);
            num = 10;
        }
        settings.dim = num;
        UpdateMatrixInput();
    });
    cy = cytoscape({
        container: $('#cy'),
        elements: {
            nodes: [
              { data: { id: 'a1' } },
              { data: { id: 'b1' } },
              { data: { id: 'a2'} },              
              { data: { id: 'b2'} }
            ],
            edges: [
              { data: { source: 'a1', target: 'b1' } },
              { data: { source: 'a1', target: 'b2' } },
              { data: { source: 'a2', target: 'b1' } },
              { data: { source: 'b1', target: 'a2' } },
              { data: { source: 'b2', target: 'a1' } },
            ]
        },
        style:cytoscape.stylesheet()
            .selector('node')
              .css({
                  'content': 'data(id)',
                  'text-valign': 'center',
                  'color': 'white',
                  'text-outline-width': 2,
                  'background-color': '#999',
                  'text-outline-color': '#999',
                  'width': '40px',
                  'height':'40px'
              })
            .selector('edge')
              .css({
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#ccc',
                'line-color': '#ccc',
                'border-style': 'solid',
                'border-color': '#ff0000',
                'width': 2
              })
            .selector(':selected')
              .css({
                'background-color': 'black',
                'line-color': 'black',
                'target-arrow-color': 'black',
                'source-arrow-color': 'black'
              })
            .selector('.faded')
              .css({
                'opacity': 0.25,
                'text-opacity': 0
              }),
        layout: {
            name: 'grid',
            fit: true, // whether to fit to viewport
            padding: 100, // fit padding
            rows:2,
            cols:2,
            boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
            animate: false, // whether to transition the node positions
            animationDuration: 500, // duration of animation in ms if enabled
            animationEasing: undefined, // easing of animation if enabled
            ready: undefined, // callback on layoutready
            stop: undefined // callback on layoutstop
        },
        pan: { x: 0, y: 0 },
        directed: true,
        zoomingEnabled:true
    });
    cy.on('tap', 'edge', function (event) {
        var edge = event.target;
        
        alert('swap ' + edge.source().id() + ' with ' + edge.target().id());
    });
    function csvToTable(e, elem) {
       

    }
    function UpdateMatrixInput() {
        $(".matrix").each(function () {
            $(this).empty();
            if ($("tr", this).length != settings.dim) {
                for (var i = 0; i < settings.dim; i++) {
                    let tr = $('<tr/>');
                    for (var j = 0; j < settings.dim; j++) {
                        let input = $('<input/>').attr("type", "text").css({minWidth: '10%',maxWidth: '10%',}).attr("maxlength","1");
                        input.bind('paste', null, function (e) {
                            var elem = input;
                            
                            var pasted = e.originalEvent.clipboardData.getData('Text');
                            var rows = pasted.split('\n');
                            
                            for (var i = 0; i < rows.length; i++) {
                                var temp = elem;
                                var columns = rows[i].split(',');
                                console.log(columns);
                                for (var j = 0; j < columns.length; j++) {
                                    if (elem[0] != undefined) {
                                        elem.val(columns[j]);
                                        elem = elem.next();
                                    } else {
                                        elem = temp.closest('tr').next().find(':first-child');
                                        break;
                                    }
                                }
                                if (elem[0] == undefined) {
                                    elem = temp.closest('tr').next().find(':first-child');
                                }
                            }
                        });
                        tr.append(input);
                    }
                    $(this).append(tr);
                }
            }
        });
        
    }
});
