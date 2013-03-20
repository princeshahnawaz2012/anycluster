/* SETTINGS */


/* set your markerimages depending on size here */
markerImages = {
	
	5:'/static/anycluster/images/5.png',
	10:'/static/anycluster/images/10.png',
	50:'/static/anycluster/images/50.png',
	100:'/static/anycluster/images/100.png',
	1000:'/static/anycluster/images/1000.png',
	10000:'/static/anycluster/images/10000.png'
	
};


//dragend zoom_changed will fire new clustering

var Gmap = function (id, callback) {

	var clusterer = this;
	
	var initialize = function(){
		var mapOptions = {
		  zoom: 2,
		  scrollwheel: false,
		  center: new google.maps.LatLng(30, 0),
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	
		clusterer.gmap = new google.maps.Map(document.getElementById(id),
		    mapOptions);
		
		google.maps.event.addListener(clusterer.gmap, 'idle', function() {
			 callback();
		});
      
	}
	
	initialize();
	
	//zoom in on big clusters
	this.markerClickFunction = function(marker) {
		
		clusterer.removeMarkerCells();
		var zoom = clusterer.gmap.getZoom();
		zoom = zoom + 3;
		clusterer.gmap.setCenter(marker.position, zoom);
		clusterer.gmap.setZoom(zoom);
		
	};
	
	//on small markers or on final zoom, this function is launched, may set from outside for easier use
	this.markerFinalClickFunction = function(marker) {
		alert('final click, override or change Gmap.markerFinalClickFunction for custom behaviour');
	};
	
	
	
	// filters, the are being set from outside
	this.filters = false;	
	
	
	this.gridCells = []
	
	
	this.removeMarkerCells = function(){
		for (var i=0; i<clusterer.gridCells.length; i+=1){
			clusterer.gridCells[i].setMap(null);
		}
	}
	
	
	this.gridCluster = function(gridsize, clustercallback){
		//gridsize is optional, default is 128
		// if you want to use the map tile size use 256
		var gridsize = (typeof gridsize === "undefined") ? 256 : gridsize;
		
		//read the current zoom level
		var zoom = clusterer.gmap.getZoom();
		
		//read viewport in top left bottom right
		var viewport = clusterer.gmap.getBounds();
		
		var viewport_json = {'left':viewport.getSouthWest().lng(), 'top':viewport.getNorthEast().lat(), 'right':viewport.getNorthEast().lng(), 'bottom':viewport.getSouthWest().lat()};
		
		//if filters are given, add them to POST
		if (clusterer.filters != false){
		
			for (var key in clusterer.filters) {
				viewport_json[ key ] = clusterer.filters[key];
			}
			
		};
		
		$.ajax({
			url: '/anycluster/getgrid/' + zoom + '/' + gridsize + '/',
			type: 'POST',
			data: viewport_json,
			dataType: 'json',
			success: function(cells){
				
				clusterer.removeMarkerCells();
			
				if (cells.length > 0) {
					
				
					for (var i=0; i<cells.length; i+=1) {
					
					    var points = cells[i]['cell'];
					    
					    var count = cells[i]['count'];
					    
					    
					    
					    var topright = new google.maps.LatLng(points[0].y, points[0].x);
					    var bottomleft = new google.maps.LatLng(points[2].y, points[2].x);
					    
					    //calc the center (latA+latB)/2  (lonA+lonB) /2
					    var center = new google.maps.LatLng( cells[i]['center'].y , cells[i]['center'].x);
					    
					    /* //if you want to draw using bounds
					    var latLngBounds = new google.maps.LatLngBounds(
						  bottomleft,
						  topright
						);
					    */
					    
					    if (count > 0) {
					    	var labelText = count;
					    	
					    	var boxText = document.createElement("div");
						    boxText.id = i;
						    boxText.position = center;
						    boxText.style.cssText = "border: none;background: none;";
						    boxText.innerHTML = count;
						    boxText.count = count;
						    
						//set opacity according to count
						var opacity;
						
						if (count <= 5 ){
							opacity = 0.2;
						}
						
						else if (count < 10) {
							opacity = 0.4;
						}
						
						else if (count < 100 ) {
							opacity = 0.6;
						}
						
						else if (count < 1000 ) {
							opacity = 0.8;
						}
						
						else {
							opacity = 1.0;
						};

						var myOptions = {
							 content: boxText
							,boxStyle: {
							   border: "1px solid red"
							  ,background: "rgba(200, 54, 54," + opacity + ")"
							  ,textAlign: "center"
							  ,fontSize: "12pt"
							  ,fontWeight: "bold"
							  ,width: "" + gridsize +'px'
							  ,height: "" + gridsize +'px'
							  ,lineHeight: "" + gridsize +'px'
							 }
							,disableAutoPan: true
							,pixelOffset: new google.maps.Size(-gridsize, 0)
							,position: topright
							,closeBoxURL: ""
							,isHidden: false
							,pane: "floatPane"
							,enableEventPropagation: true
						};

						var gridLabel = new InfoBox(myOptions);
						gridLabel.open(clusterer.gmap);
						
						if (zoom >= 19 || count <= 3) {
						
							google.maps.event.addDomListener(gridLabel.content_,'click', function() {
							      clusterer.markerFinalClickFunction(this);
							    }
							);
						
				
						}
						
						else {
							google.maps.event.addDomListener(gridLabel.content_, 'click', function() {
								clusterer.markerClickFunction(this);
							});
						}
						
						clusterer.gridCells.push(gridLabel); 
						
						if (typeof clustercallback !== "undefined") {
							clustercallback();
						}
						
						
						
					    }
						
					     
					    
				    	}
				
				
			    	}
			},
			error: function(e){
				if (typeof clustercallback !== "undefined") {
					clustercallback();
				}
			}
		});
		
		
	};
	
	
	this.pinCluster = function(gridsize, clustercallback){
	
		var clusterMethod = this;
	
		var gridsize = (typeof gridsize === "undefined") ? 512 : gridsize;
		var zoom = clusterer.gmap.getZoom();
		var viewport = clusterer.gmap.getBounds();
		var viewport_json = {'left':viewport.getSouthWest().lng(), 'top':viewport.getNorthEast().lat(), 
				    'right':viewport.getNorthEast().lng(), 'bottom':viewport.getSouthWest().lat()};
				    
		//if filters are given, add them to POST
		if (clusterer.filters != false){
		
			for (var key in clusterer.filters) {
				viewport_json[ key ] = clusterer.filters[key];
			}
			
		};
		
		
		$.ajax({
			url: '/anycluster/getpins/' + zoom + '/' + gridsize + '/',
			type: 'POST',
			data: viewport_json,
			dataType: 'json',
			success: function(pins){
			
				clusterer.removeMarkerCells();
			
				if (pins.length > 0){
			
			
					for(i=0; i<pins.length; i++) {

						var center = new google.maps.LatLng(pins[i]['y'], pins[i]['x']);
				
						var count = pins[i]['count'];
						
						var icon, anchor;
						
						
						if (count <= 5 ){
							icon = new google.maps.MarkerImage(markerImages[5],
							    // second line defines the dimensions of the image
							    new google.maps.Size(30, 30),
							    // third line defines the origin of the custom icon
							    new google.maps.Point(0,0),
							    // and the last line defines the offset for the image
							    new google.maps.Point(15, 15)
							);
							anchor = new google.maps.Point(4,9);
						}
						
						else if (count < 10) {
							icon = new google.maps.MarkerImage(markerImages[10],
							    new google.maps.Size(30, 30),
							    new google.maps.Point(0,0),
							    new google.maps.Point(15, 15)
							);
							anchor = new google.maps.Point(4,9);
						
						}
						
						else if (count < 100 ) {
							icon = new google.maps.MarkerImage(markerImages[100],
							    new google.maps.Size(40, 40),
							    new google.maps.Point(0,0),
							    new google.maps.Point(20, 20)
							);
							anchor = new google.maps.Point(8,9);
						}
						
						else if (count < 1000 ) {
							icon = new google.maps.MarkerImage(markerImages[1000],
							    new google.maps.Size(50, 50),
							    new google.maps.Point(0,0),
							    new google.maps.Point(25, 25)
							);
							anchor = new google.maps.Point(12,9);
						}
						
						else {
							icon = new google.maps.MarkerImage(markerImages[10000],
							    new google.maps.Size(60, 60),
							    new google.maps.Point(0,0),
							    new google.maps.Point(30, 30)
							);
							anchor = new google.maps.Point(16,9);
						};
						
						
						var marker = new MarkerWithLabel({
						       position: center,
						       map: clusterer.gmap,
						       draggable: false,
						       labelContent: count,
						       icon: icon,
						       labelAnchor: anchor,
						       labelClass: "clusterlabels", // the CSS class for the label
						       labelInBackground: false,
						       count: count
						});
						
						/*
							depending on count and zoom level, the listeners differ
						*/
						if (zoom >= 19 || count <= 3) {
							google.maps.event.addListener(marker, 'click', function() {
								clusterer.markerFinalClickFunction(this);
							});
						}
						
						else {
							google.maps.event.addListener(marker, 'click', function() {
								clusterer.markerClickFunction(this);
							});
						}
						
						clusterer.gridCells.push(marker); 
						
						if (typeof clustercallback !== "undefined") {
							clustercallback();
						}
					
					};
				}
				else {
					
					if (typeof clustercallback !== "undefined") {
						clustercallback();
					}
					
				}
				
			},
			error: function(){
				if (typeof clustercallback !== "undefined") {
							clustercallback();
				}
			}
		});
		
	};
	    
}