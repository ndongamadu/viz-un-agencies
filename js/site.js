function hxlProxyToJSON(input){
    var output = [];
    var keys = [];
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

// global vars 
var mapsvg,
	mapscale,
	mapprojection,
	ndx,
	g,
	allLocsData = [],
	keyFigures,
	overallKeyFig = {},
	agencyFilter = "All agencies";

// colors
var regionalOfficeColor = '#CD3A1F',
	countryOfficeColor = '#144372',
	antennaColor = '#7FB92F',
	otherColor = '#0077be';
var inactiveFillColor = '#F2F2F2';//'#F8F4EC';
var fillColor = '#CCDDEE';//;


function updateKeyFigures (country) {
	var html = "";
	$('#keyfigures').html('');
	var arr;
	if (agencyFilter !== "All agencies") {
		arr = keyFigures.filter(function(d){
			return (d.key[0]===country && d.key[1]===agencyFilter);
		}).sort();
		for (var i = 0; i < arr.length; i++) {
			html +='<div class="keyfig">'+arr[i].value+ '<span> '+arr[i].key[2]+'</span></div>';
		}
	} else {
		arr = keyFigures.filter(function(d){
			return (d.key[0]===country);
		}).sort();
		var cat = [],
			tab = {};
		for (var i = 0; i < arr.length; i++) {
			cat.includes(arr[i].key[2])? '': cat.push(arr[i].key[2]);
		}
		for (var i = 0; i < cat.length; i++) {
			var val = 0;
			for (var k = 0; k < arr.length; k++) {
				arr[k].key[2]===cat[i] ? val += arr[k].value : '';
			}
			tab[cat[i]] = val;
		}
		for (t in tab){
			html +='<div class="keyfig">'+tab[t]+ '<span> '+t+'</span></div>';
		}
	}

    $('#keyfigures').append(html);
}// end showKeyFigures

//draw adm0 map
function generateMaps (adm0, locData) {
	ndx = crossfilter(locData);
	var dimensionAll = ndx.dimension(function(d){
		return d['#indicator+category'];});
	var group = dimensionAll.group().top(Infinity);
	for (var i = 0; i < group.length; i++) {
		overallKeyFig[group[i].key] = group[i].value;
	}
	var dim = ndx.dimension(function(d){
		return [d['#country+name'],d['#indicator+agency'],d['#indicator+category']];
	});
	keyFigures = dim.group().top(Infinity);

	var width = $('#map').width();
	var height = $('#map').height();

	mapsvg = d3.select('#map').append('svg')
				   .attr('width', width)
				   .attr('height', height);
	mapscale = 980;//($('body').width()<768) ? width*1.7 : width*2.7;
	mapprojection = d3.geo.mercator()
						  .center([6.8, 2])
						  .scale(mapscale)
						  .translate([width / 2, height / 1.6]);
	g = mapsvg.append('g').attr('id','adm0');
	var path = g.selectAll('path')
		.data(adm0.features).enter()
		.append('path')
		.attr('d', d3.geo.path().projection(mapprojection))
		.attr('id', function(d){
			var adm0 = (d.properties.admin0Name !='0') ? d.properties.admin0Name : 'uncovered';
			return adm0;
		}).attr('class', function(d){
			var classname = (d.properties.admin0Pcod !=null) ? 'adm0' : 'inactive';
			return classname;
		}).attr('fill', function(d) {
			var clr = (d.properties.admin0Pcod != null) ? fillColor: inactiveFillColor;
      		return clr;
      	}).attr('stroke-width', 1)
      	.attr('stroke','#FFF');
    	// .attr('stroke','#7d868d');

	path.on('mouseover', function(d){
		d.properties.admin0Pcod !==null ? updateKeyFigures(d.properties.admin0Name) : '';
	}).on('mouseout', function(d){
		var html = "";
		for(m in overallKeyFig){
			html +='<div class="keyfig">'+overallKeyFig[m]+ '<span> '+m+'</span></div>'
		}
		$('#keyfigures').html('');
		$('#keyfigures').append(html);
	});

    var legend = d3.select('#maplegend')
    				.append('ul');
    var keys = legend.selectAll('li')
    				.data(["Regional Office", "Country Office", "Antenna"])
    				.enter()
    				.append('li');
    	keys.append('div').append('div')
    		.attr('class', 'marker')
    		.style('height', "15px")
    		.style('width', "15px")
    		.style('background-color', function(d){
    			var bckColor ;
    			d ==="Regional Office" ? bckColor = regionalOfficeColor : 
    			d ==="Country Office" ? bckColor = countryOfficeColor : 
    			d ==="Antenna" ? bckColor = antennaColor : bckColor = otherColor;
    			return bckColor;
    		});

    	keys.append('div')
    		.attr('class', 'key')
    		.html(function(d){ return d;});
    	$('#maplegend').show();

    var zoomIn = d3.select('#map')
    .append('div')
    .attr('class', 'zoomBtn')
    .attr('id','zoom-in')
    .html('+');

	var zoomOut = d3.select('#map')
    .append('div')
    .attr('class', 'zoomBtn')
    .attr('id','zoom-out')
    .html('–');

    var html = "";
    for(m in overallKeyFig){
    	html +='<div class="keyfig">'+overallKeyFig[m]+ '<span> '+m+'</span></div>'
    }
    $('#keyfigures').append(html);
} // end generateMaps

function showAgencylocation () {
	var locs;
	agencyFilter === "All agencies" ? locs = allLocsData : locs = allLocsData.filter(function(d){ return d.office === agencyFilter; });
	var cercle = g.selectAll('circle')
				  .data(locs).enter()
				  .append('circle')
				  .attr('class', 'presence')
				  .attr("cx", function (d) { return mapprojection(d.geo)[0]; })
				  .attr("cy", function (d) { return mapprojection(d.geo)[1]; })
				  .attr('id', function(d){
				  	return d.officeType;
				  })
				  .attr("r", function(d){
				  	var dim = 2;
				  	d.officeType === "Regional Office" ? dim = 10 : 
				  	d.officeType === "Country Office" ? dim = 8 :
				  	d.officeType === "Antenna" ? dim = 6 : dim = 4 ;
				  	return dim+"px";
				  })
		          .attr('fill', function(d){
		          	var fillColor = otherColor;
		          	d.officeType === "Regional Office" ? fillColor = regionalOfficeColor : 
				  	d.officeType === "Country Office" ? fillColor = countryOfficeColor :
				  	d.officeType === "Antenna" ? fillColor = antennaColor : '';

		          	return fillColor;
		          })
		          .attr('fill-opacity', 0.8);

    var maptip = d3.select('#map').append('div').attr('class', 'd3-tip map-tip hidden');
    cercle
        .on('mousemove', function(d,i) {
            var mouse = d3.mouse(mapsvg.node()).map( function(d) { return parseInt(d); } );
            maptip
                .classed('hidden', false)
                .attr('style', 'left:'+(mouse[0]+20)+'px;top:'+(mouse[1]+20)+'px')
                .html(d.office +' ('+d.officeType+'), '+d.adm2+' - '+d.country)
        })
        .on('mouseout',  function(d,i) {
            maptip.classed('hidden', true)
        }); 


}// showAgencylocation

// remove a agency's presence and draw the new one
function updateMap (argument) {
	d3.selectAll('.presence').remove();
	showAgencylocation();
}//end updateMap

$('#dropdown').on('change', function(event){
	agencyFilter = $('#dropdown option:selected').text();

	if (agencyFilter==="All agencies") {
	    var html = "";
	    $('#keyfigures').html('');
	    for(m in overallKeyFig){
	    	html +='<div class="keyfig">'+overallKeyFig[m]+ '<span> '+m+'</span></div>'
	    }
	    $('#keyfigures').append(html);
	} else {
		var html = '';
		var arr = keyFigures.filter(function(d){
			return d.key[1]===agencyFilter;
		}).sort();
		var cat = [],
			tab = {};
		for (var i = 0; i < arr.length; i++) {
			cat.includes(arr[i].key[2]) ? '' : cat.push(arr[i].key[2]);
			// html +='<div class="keyfig">'+arr[i].value+ '<span> '+arr[i].key[2]+'</span></div>';
		}
		for (var i = 0; i < cat.length; i++) {
			var val = 0;
			for (var k = 0; k < arr.length; k++) {
				arr[k].key[2]===cat[i] ? val +=arr[k].value : '';
			}
			tab[cat[i]] = val;
		}
		for(t in tab){
			html +='<div class="keyfig">'+tab[t]+ '<span> '+t+'</span></div>';

		}
		$('#keyfigures').html('');
		$('#keyfigures').append(html);
	}

	updateMap();
});

// adm0 data
var adm0DataCall = $.ajax({
	type: 'GET',
	url: 'data/adm000.json',
	dataType: 'json',
});


//UN location data
var unLocationsCall = $.ajax({
	type: 'GET',
	url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1u93XjPflZf0RsS-apesqfsQky5ffXxJZehcwyhhRMfg%2Fedit%3Fusp%3Dsharing&force=on',
	dataType: 'json',
});

$.when(adm0DataCall, unLocationsCall).then(function(adm0Args, unLocationsArgs){
	var adm0 = topojson.feature(adm0Args[0],adm0Args[0].objects.adm0_complet);
	var locData = hxlProxyToJSON(unLocationsArgs[0]);
	for (var i = 0; i < locData.length; i++) {
		allLocsData.push({geo: [locData[i]['#geo+lon'],locData[i]['#geo+lat']],country:locData[i]['#country+name'],adm2: locData[i]['#indicator+name'],office:locData[i]['#indicator+agency'], officeType:locData[i]['#indicator+category']});
	}
	generateMaps(adm0,locData);
	showAgencylocation(locData);

});