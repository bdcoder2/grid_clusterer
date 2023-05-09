// Source: D:\vscode\grid_clusterer\v161\js\ex0\tester.js
class tester {
    /*
    ---------------------------------------------------------------------
    Constructor
     
    PARAMETERS:
     
       Name: mvp_id
       Desc: The DOM element id used as the map viewport
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    constructor(mvp_id) {
        let map_center;
        let map_opts;
        let clusterer_opts;
        // Initialize ...
        this.clusterer = null;
        this.data_points = null;
        // Create a small number of data points ...
        this.data_points_create(200);
        // Try to initialize Google maps ...
        map_center = new google.maps.LatLng(37.330241, -121.925211);
        map_opts = {
            center: map_center,
            clickableIcons: false,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            panControl: false,
            zoom: 11
        };
        try {
            this.map = new google.maps.Map(document.getElementById(mvp_id), map_opts);
        }
        catch (ex) {
            alert('* Unable to create map: ' + ex.toString());
            this.map = null;
        }
        // If unable to create map object, we are doomed, exit ...
        if (!this.map) {
            return;
        }
        // Set clusterer options and create clusterer ...
        clusterer_opts = {
            cluster_marker_click_handler: this.cluster_marker_click_handler.bind(this),
            grid_point_marker_click_handler: this.grid_marker_click_handler.bind(this),
            tile_borders_visible: true
        };
        this.clusterer = new grid_clusterer(this.map, this.data_points, clusterer_opts);
        // Set the clusterer to auto redraw on these map events ...
        this.clusterer.auto_redraw_event_add('dragend');
        this.clusterer.auto_redraw_event_add('zoom_changed');
        // Redraw tiles once all the tiles are loaded ...
        google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => { this.clusterer.redraw(); });
        // Add map click handler ...
        google.maps.event.addListener(this.map, 'click', this.map_click_handler.bind(this));
    }
    /*
    ---------------------------------------------------------------------
    Show the given bounds on the map.
     
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
                    fillColor: "#FFFFFF",
                    fillOpacity: 0,
                    map: this.map,
                    strokeColor: "#0000FF",
                    strokeOpacity: 1,
                    strokeWeight: 2,
                    visible: true,
                };
                this.bounds_rect = new google.maps.Rectangle(opts);
                // Listen for clicks on rectangle and process same as map clicks ...
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
        let s;
        // Show tile bounds ...
        this.bounds_show(evt.tile.bounds);
        // Show info about the tile that contained the cluster marker ...
        s = '<b>Cluster marker clicked</b>, at latitude, longitude: ' + evt.event.latLng.toString() + '<ul>';
        s += '<li>Tile index: ' + evt.tile.idx + '</li>';
        s += '<li>Total data keys: ' + evt.tile.data_keys.length;
        s += '<li>Data keys: ' + evt.tile.data_keys.join(', ') + '</li>';
        s += '</ul>';
        $('#log').html(s);
        // Fit the data bounds of the tile ...
        this.map.fitBounds(evt.tile.data_bounds);
    }
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
    Create random number of data points.
     
    PARAMETERS:
     
       Name: data_points_count
       Desc: The number of data points to create.
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    data_points_create(data_points_count) {
        const k_lat_min = 37.2428323;
        const k_lon_min = -122.118501;
        const k_lat_max = 37.417548;
        const k_lon_max = -121.731920;
        let i;
        let lat;
        let lat_span;
        let lon;
        let lon_span;
        this.data_points = new Array(data_points_count);
        lat_span = k_lat_max - k_lat_min;
        lon_span = k_lon_max - k_lon_min;
        for (i = 0; i < data_points_count; i++) {
            lat = k_lat_min + (Math.random() * lat_span);
            lon = k_lon_min + (Math.random() * lon_span);
            this.data_points[i] = { key: i, lat: lat, lon: lon };
        }
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
        // Show grid point bounds ...
        this.bounds_show(evt.grid_point.bounds);
        // Show info about the grid point ...
        s = '<b>Grid point marker clicked</b>, at latitude, longitude: ' + evt.event.latLng.toString() + '<ul>';
        s += '<li>Tile index: ' + evt.grid_point.tile.idx + '</li>';
        s += '<li>Grid point index: ' + evt.grid_point.idx + '</li>';
        s += '<li>Data points: ' + evt.grid_point.data_keys.length;
        s += '<li>Data point keys: ' + evt.grid_point.data_keys.join(', ') + '</li>';
        s += '</ul>';
        $('#log').html(s);
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
        let s;
        let bounds;
        let grid_pt;
        let tile;
        s = '<b>Map clicked</b>, at latitude, longitude: ' + evt.latLng.toString() + '<ul>';
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
}
