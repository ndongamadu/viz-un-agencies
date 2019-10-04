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
	g,
	allLocsData = [],
	agencyFilter = "UNOCHA";

// colors
var regionalOfficeColor = '#CD3A1F',
	countryOfficeColor = '#144372',
	antennaColor = '#7FB92F',
	otherColor = '#0077be';

//draw adm0 map
function generateMaps (adm0, adm1, locData) {

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
	g.selectAll('path')
		.data(adm0.features).enter()
		.append('path')
		.attr('d', d3.geo.path().projection(mapprojection));

	// var g2 = mapsvg.append('g').attr('id', 'adm1');
	// var adm1 = g.selectAll('path')
	// 			 .data(adm1.features).enter()
	// 			 .append('path')
	// 			 .attr('d', d3.geo.path().projection(mapprojection));

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
} // end generateMaps

function showAgencylocation () {
	var locs = allLocsData.filter(function(d){ return d.office === agencyFilter; });
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

$('.btn').on('click', function(event){
	agencyFilter = $(this).attr('id');
	updateMap();
});

// adm0 data
var adm0DataCall = $.ajax({
	type: 'GET',
	url: 'data/adm0.json',
	dataType: 'json',
});
var adm1DataCall = $.ajax({
	type: 'GET',
	url: 'data/adm1.json',
	dataType: 'json',
});

//UN location data
var unLocationsCall = $.ajax({
	type: 'GET',
	url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1u93XjPflZf0RsS-apesqfsQky5ffXxJZehcwyhhRMfg%2Fedit%3Fusp%3Dsharing&force=on',
	dataType: 'json',
});

$.when(adm0DataCall, adm1DataCall, unLocationsCall).then(function(adm0Args, adm1Args, unLocationsArgs){
	var adm0 = topojson.feature(adm0Args[0],adm0Args[0].objects.wcaadm0);
	var adm1 = topojson.feature(adm1Args[0],adm1Args[0].objects.wcaadm1);
	var locData = hxlProxyToJSON(unLocationsArgs[0]);
	for (var i = 0; i < locData.length; i++) {
		allLocsData.push({geo: [locData[i]['#geo+lon'],locData[i]['#geo+lat']],country:locData[i]['#country+name'],adm2: locData[i]['#adm2+name'],office:locData[i]['#indicator+agency'], officeType:locData[i]['#indicator+category']});
	}
	generateMaps(adm0, adm1, locData);
	showAgencylocation(locData);

});