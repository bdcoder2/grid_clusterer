// Source: D:\vscode\grid_clusterer\v190\js\ex0\tester.js
class tester {
    /*
    ---------------------------------------------------------------------
    Constructor
     
    PARAMETERS:
     
       Name: mvp_id
       Desc: The DOM element id used as the map viewport
 
       Name: center_lat
       Desc: The latitude used as the map center point
 
       Name: center_lon
       Desc: The longitude used as the map center point
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    constructor(mvp_id, center_lat, center_lon) {
        this.k_data_points_max = 500;
        this.k_submit_btn_id = '#btn1';
        let map_center;
        let map_opts;
        // Initialize ...
        this.clusterer = null;
        this.data_points = null;
        // Create an info window ...
        this.info_window = new google.maps.InfoWindow();
        // Array to hold data-point markers ...
        this.dp_markers = new Array();
        // Try to initialize Google maps ...
        map_center = new google.maps.LatLng(center_lat, center_lon);
        map_opts = {
            center: map_center,
            clickableIcons: false,
            gestureHandling: 'greedy',
            isFractionalZoomEnabled: true,
            mapId: '99d647e799de5027', // Advanced Markers requires a map ID
            mapTypeControl: false,
            panControl: false,
            zoom: 9
        };
        try {
            this.map = new google.maps.Map(document.getElementById(mvp_id), map_opts);
        }
        catch (ex) {
            // If unable to create map object, we are doomed, exit ...
            alert('* Unable to create map: ' + ex.toString());
            return;
        }
        /*
        Show zoom level and add a listener to show the current
        zoom level when it changes ...
        */
        this.map_zoom_level_show(this.map.getZoom());
        google.maps.event.addListener(this.map, 'zoom_changed', () => {
            this.info_window_close();
            this.map_zoom_level_show(this.map.getZoom());
        });
        // Add map zoom handler ...
        google.maps.event.addListener(this.map, 'zoom_changed', this.map_zoom_level_show.bind(this));
        // Add map click handler ...
        google.maps.event.addListener(this.map, 'click', this.map_click_handler.bind(this));
        // Handler for fractional zoom enable / disable ...
        $('#fld_fractional_zoom_enabled').on('change', () => {
            let frac_zoom_enabled = $('#fld_fractional_zoom_enabled').is(':checked');
            this.map.setOptions({ isFractionalZoomEnabled: frac_zoom_enabled });
        });
        // Test once all tiles are loaded ...
        google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
            this.test_clusterer();
        });
    }
    /*
    ---------------------------------------------------------------------
    Get a number from an <input type="text" or <select> form field ...
     
    PARAMETERS:
     
       Name: fld_id
       Desc: The ID of the DOM / form field.
 
       Name: default_val
       Desc: The default value to be used if the field is not found.
     
    RETURNS:
     
       A number that is the field value (or selected value).
 
    ---------------------------------------------------------------------
    */
    form_field_number_get(fld_id, default_val) {
        let n = default_val;
        let fld = $(fld_id);
        if (fld) {
            n = parseInt(fld.val().toString(), 10);
            if (isNaN(n)) {
                n = default_val;
                fld.val(n.toString());
            }
        }
        return n;
    }
    /*
    ---------------------------------------------------------------------
    Create a new set of data points and instantiate a new clusterer.
     
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    test_clusterer() {
        let clusterer_opts;
        // Create data points ...
        this.data_points_create();
        if (this.data_points) {
            // Delete previous clusterer (if any) ...
            if (this.clusterer) {
                this.clusterer.clear();
                this.clusterer = null;
            }
            // Set clusterer options and create clusterer ...
            clusterer_opts = {
                cluster_marker_click_handler: this.cluster_marker_click_handler.bind(this),
                grid_point_marker_click_handler: this.grid_marker_click_handler.bind(this),
                tile_borders_visible: true
            };
            // Create new cluster object and load data ...
            this.clusterer = new grid_clusterer(this.map, this.data_points, clusterer_opts);
            // Set the clusterer to auto redraw on these map events ...
            this.clusterer.auto_redraw_event_add('idle');
        }
    }
    /*
    ---------------------------------------------------------------------
    Show the a given bounds on the map (for tiles and grid points)
     
    PARAMETERS:
     
       Name: bounds
       Desc: A google.maps.LatLngBounds object
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    bounds_show(bounds) {
        let opts;
        if (bounds) {
            if (this.bounds_rect) {
                this.bounds_rect.setBounds(bounds);
            }
            else {
                opts = {
                    bounds: bounds,
                    clickable: true,
                    fillColor: '#FFFFFF',
                    fillOpacity: 0,
                    map: this.map,
                    strokeColor: '#0000FF',
                    strokeOpacity: 1,
                    strokeWeight: 2,
                    visible: true,
                };
                this.bounds_rect = new google.maps.Rectangle(opts);
                // Listen for clicks on rectangle and process as map clicks ...
                this.bounds_rect.addListener('click', this.map_click_handler.bind(this));
            }
        }
    }
    /*
    ---------------------------------------------------------------------
    Cluster marker click handler.
     
    PARAMETERS:
     
       Name: evt
       Desc: A cluster_marker_click_event object
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    cluster_marker_click_handler(evt) {
        let bounds_fit;
        let s;
        let best_zoom_level;
        let map_zoom_level;
        let z = this.map.getZoom();
        // Clear any previous data point markers ...
        this.data_point_markers_clear();
        // The AdvancedMarkerElement uses LatLngLiteral for position,
        // so create a LatLng object from it ...
        let p = new google.maps.LatLng(evt.tile.marker.position);
        // Build cluster marker (tile) info ...
        // IMPORTANT - do this first before we "zoom in" on the cluster.
        s = '<b>Cluster marker clicked</b>, at lat,lon: ' + p.toString();
        s += '<ul>';
        s += '<li>Zoom level: ' + z.toString() + '</li>';
        s += '<li>Tile index: ' + evt.tile.idx + '</li>';
        s += '<li>Total data keys: ' + evt.tile.data_keys.length + '</li>';
        s += '<li>Data keys: ' + evt.tile.data_keys.join(', ') + '</li>';
        s += '</ul>';
        // Show info about the tile that contained the cluster marker ...
        $('#log').html(s);
        /*
        Check if we can find a zoom level at which the TILE
        bounds will fit in the map container ...
        */
        // Start at tile zoom level...
        bounds_fit = true;
        best_zoom_level = -1;
        map_zoom_level = evt.tile.zoom;
        while (map_zoom_level < 21 && bounds_fit) {
            map_zoom_level++;
            bounds_fit = this.clusterer.bounds_fit_at_zoom(evt.tile.bounds, map_zoom_level);
            if (bounds_fit)
                best_zoom_level = map_zoom_level;
        }
        // If a best zoom level was NOT found, then 
        // fall back by simply increasing the zoom level by one ...
        if (best_zoom_level < 0)
            best_zoom_level = evt.tile.zoom + 1;
        // Set new zoom level and center on tile bounds, show
        // bounds of the tile ...
        this.map.setZoom(best_zoom_level);
        this.map.setCenter(evt.tile.bounds.getCenter());
        this.bounds_show(evt.tile.bounds);
    }
    /*
    ---------------------------------------------------------------------
    Create and return a "data point" marker.
     
    ARGUMENTS:
     
       Name: dp_key
       Desc: A data_point_key
     
    RETURNS:
     
       A google.maps.marker.AdvancedMarkerElement or null if the data
       point key is not valid.
    
    ---------------------------------------------------------------------
    */
    data_point_marker_create(dp_key) {
        let data_key_str;
        let marker_opts;
        let dp_latlon;
        let div;
        // Use the number of data keys as the marker title ...
        dp_latlon = this.clusterer.data_point_latlon(dp_key);
        if (!dp_latlon)
            return null;
        data_key_str = dp_key.toString();
        div = document.createElement('div');
        // Create the 8px blue dot element ...
        div.style.width = '10px';
        div.style.height = '10px';
        div.style.backgroundColor = '#0000ff';
        div.style.borderRadius = '50%';
        div.style.opacity = '1.0';
        // Create and return the AdvancedMarkerElement ...
        marker_opts = {
            content: div,
            map: this.map,
            position: dp_latlon,
            title: 'Data Key: ' + data_key_str,
            gmpClickable: false,
            zIndex: 1000
        };
        return new google.maps.marker.AdvancedMarkerElement(marker_opts);
    }
    /*
    ---------------------------------------------------------------------
    Clear the data point markers array.
     
    ARGUMENTS:
     
       None.
     
    RETURNS:
     
       None.
    
    ---------------------------------------------------------------------
    */
    data_point_markers_clear() {
        let dp_marker;
        // Remove all data point markers ...
        dp_marker = this.dp_markers.pop();
        while (dp_marker) {
            dp_marker.map = null;
            dp_marker = null;
            dp_marker = this.dp_markers.pop();
        }
    }
    /*
    ---------------------------------------------------------------------
    Grid point marker click handler.
     
    PARAMETERS:
     
       Name: evt
       Desc: A grid_point_marker_click_event object
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    grid_marker_click_handler(evt) {
        let s;
        let data_key;
        let i;
        let z = this.map.getZoom();
        let p;
        let dp_marker;
        // The AdvancedMarkerElement uses LatLngLiteral for position,
        // so create a LatLng object from it ...
        p = new google.maps.LatLng(evt.grid_point.marker.position);
        // Show grid point bounds ...
        this.bounds_show(evt.grid_point.bounds);
        // Show info about the grid point ...
        s = '<b>Grid point marker clicked</b>, at lat,lon: ' + p.toString();
        s += '<ul>';
        s += '<li>Zoom level: ' + z.toString() + '</li>';
        s += '<li>Tile index: ' + evt.grid_point.tile.idx + '</li>';
        s += '<li>Grid point index: ' + evt.grid_point.idx + '</li>';
        s += '<li>Data points: ' + evt.grid_point.data_keys.length + ' (blue dots show the data points within this grid point)</li>';
        s += '<li>Data point keys: ' + evt.grid_point.data_keys.join(', ') + '</li>';
        s += '</ul>';
        $('#log').html(s);
        // Clear any previous data point markers ...
        this.data_point_markers_clear();
        // Create and show the actual data points on the map ...
        for (i = 0; i < evt.grid_point.data_keys.length; i++) {
            data_key = evt.grid_point.data_keys[i];
            dp_marker = this.data_point_marker_create(data_key);
            this.dp_markers.push(dp_marker);
        }
    }
    /*
    ---------------------------------------------------------------------
    Map click handler
     
    PARAMETERS:
     
       Name: evt
       Desc: A google.maps.MapMouseEvent object
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    map_click_handler(evt) {
        let grid_point_index;
        let tile_index;
        let z;
        let s;
        let bounds;
        let grid_pt;
        let tile;
        // Clear any previous data point markers ...
        this.data_point_markers_clear();
        z = this.map.getZoom();
        s = '<b>Map clicked</b>, at lat,lon: ' + evt.latLng.toString();
        s += '<ul>';
        s += '<li>Zoom level: ' + z.toString() + '</li>';
        bounds = null;
        tile = null;
        tile_index = this.clusterer.latlon_to_tile_index(evt.latLng);
        if (tile_index >= 0) {
            bounds = this.clusterer.tile_bounds(tile_index);
            s += '<li>Tile index: ' + tile_index + '</li>';
            tile = this.clusterer.tile(tile_index);
            if (tile) {
                // If the tile has a cluster marker, use tile bounds ...
                if (tile.marker) {
                    bounds = tile.bounds;
                    s += '<li>Tile data points: ' + tile.data_keys.length + '</li>';
                }
                else {
                    // If the tile has grid points, use grid point bounds ...
                    if (tile.grid_points.size > 0) {
                        // Find grid point bounds that contains clicked lat/lon ...
                        for (grid_point_index = 0; grid_point_index <= this.clusterer.tile_grid_point_index_max; grid_point_index++) {
                            bounds = this.clusterer.grid_point_bounds(tile_index, grid_point_index);
                            if (bounds) {
                                if (bounds.contains(evt.latLng)) {
                                    s += '<li>Grid point index: ' + grid_point_index + '</li>';
                                    grid_pt = this.clusterer.grid_point(tile_index, grid_point_index);
                                    if (grid_pt) {
                                        s += '<li>Grid point data points: ' + grid_pt.data_keys.length + '</li>';
                                    }
                                    else {
                                        s += '<li>Grid point DOES NOT contain any data points</li>';
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        // Get tile bounds ...
                        bounds = this.clusterer.tile_bounds(tile_index);
                    }
                }
            }
            else {
                s += '<li>Tile DOES NOT contain any data points</li>';
            }
        }
        // If bounds set, show bounds of tile or grid point ...
        if (bounds) {
            this.bounds_show(bounds);
        }
        // Show info ...
        s += '</ul>';
        $('#log').html(s);
    }
    /*
    ---------------------------------------------------------------------
    Creates a set number of random data points, and creates a new
    clusterer object.
     
    PARAMETERS:
     
       Name: evt
       Desc: A SubmitEvent object.
     
    RETURNS:
     
       false, to prevent event propagation.
 
    ---------------------------------------------------------------------
    */
    test_submit(evt) {
        // Prevent default form action ...
        evt.preventDefault();
        this.info_window_close();
        this.test_clusterer();
        // To prevent propagation ...
        return false;
    }
    /*
    ---------------------------------------------------------------------
    Update the clusterer configuration options.
     
    PARAMETERS:
     
       Name: evt
       Desc: an Event object.
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    config_update(evt) {
        const k_grid_cols_default = 2;
        const k_grid_rows_default = 2;
        const k_tile_height_default = 256;
        const k_tile_width_default = 256;
        let grid_cols;
        let grid_rows;
        let tile_height;
        let tile_width;
        let clusterer_opts;
        // Prevent default behavior ..
        evt.preventDefault();
        // Remove bounds rectangle if present ...
        if (this.bounds_rect) {
            this.bounds_rect.setMap(null);
            this.bounds_rect = null;
        }
        // Get tile height and width ...
        tile_height = this.form_field_number_get('#fld_tile_height', k_tile_height_default);
        tile_width = this.form_field_number_get('#fld_tile_width', k_tile_width_default);
        // Get number of grid rows and columns ...
        grid_rows = this.form_field_number_get('#fld_grid_rows', k_grid_rows_default);
        grid_cols = this.form_field_number_get('#fld_grid_cols', k_grid_cols_default);
        // Update clusterer configuration ...
        clusterer_opts = {
            grid_point_cols: grid_cols,
            grid_point_rows: grid_rows,
            tile_size: new google.maps.Size(tile_width, tile_height),
            tile_borders_visible: true
        };
        this.clusterer.configure(clusterer_opts);
        // Update form fields with current values ...
        $('#fld_tile_height').val(this.clusterer.tile_height);
        $('#fld_tile_width').val(this.clusterer.tile_width);
        $('#fld_grid_rows').val(this.clusterer.tile_grid_point_rows);
        $('#fld_grid_cols').val(this.clusterer.tile_grid_point_cols);
        // To prevent event propagation ...
        return false;
    }
    /*
    ---------------------------------------------------------------------
    Close an info window
     
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    info_window_close() {
        if (this.info_window) {
            this.info_window.close();
        }
    }
    /*
    ---------------------------------------------------------------------
    Opens an info window
     
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    info_window_open(position, content) {
        if (this.info_window) {
            this.info_window.setPosition(position);
            this.info_window.setContent(content);
            this.info_window.open(this.map);
        }
    }
    /*
    ---------------------------------------------------------------------
    Show the map zoom level in the DOM.
     
    PARAMETERS:
     
       Name: zoom_level
       Desc: The map zoom level
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    map_zoom_level_show(zoom_level) {
        let z = this.map.getZoom();
        let s = '<b>Map Zoom Level</b>: ' + z.toString();
        $('#mzl').html(s);
    }
    /*
    ---------------------------------------------------------------------
    Create data points within the map bounds.
     
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    data_points_create() {
        const k_lat_min = -85.051128;
        const k_lat_max = 85.051128;
        const k_lon_min = -180;
        const k_lon_max = 180;
        let i;
        let lat;
        let lat_min;
        let lat_span;
        let lon;
        let lon_min;
        let lon_span;
        let map_bounds;
        // Get current bounds, if none, exit ...
        map_bounds = this.map.getBounds();
        if (!map_bounds) {
            return;
        }
        // Show number of data points in DOM ...
        $('#data_points').html(this.k_data_points_max.toString());
        // Delete any previous data points ...
        if (this.data_points) {
            this.data_points.length = 0;
            this.data_points = null;
        }
        // Create a new array of data points ...
        this.data_points = new Array(this.k_data_points_max);
        lat_min = map_bounds.getSouthWest().lat();
        lat_span = map_bounds.getNorthEast().lat() - lat_min;
        lon_min = map_bounds.getSouthWest().lng();
        lon_span = map_bounds.getNorthEast().lng() - lon_min;
        for (i = 0; i < this.k_data_points_max; i++) {
            lat = lat_min + (Math.random() * lat_span);
            lat = Math.min(Math.max(lat, k_lat_min), k_lat_max);
            lon = lon_min + (Math.random() * lon_span);
            lon = Math.min(Math.max(lon, k_lon_min), k_lon_max);
            this.data_points[i] = { key: i, lat: lat, lon: lon };
        }
    }
}
