// Source: D:\vscode\grid_clusterer\js\ex2\tester.js
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
        this.k_tiles_redraw_start_event = 'tiles_redraw_start';
        this.k_tiles_redraw_end_event = 'tiles_redraw_end';
        this.k_data_points_default = 1000;
        this.k_data_points_min = 1;
        this.k_data_points_max = 6000000;
        this.k_submit_btn_id = '#btn1';
        // Used to track tiles redraw time ...
        this.tiles_redraw_time = 0;
        let map_center;
        let map_opts;
        // Initialize ...
        this.tiles_redraw_start_listener = null;
        this.tiles_redraw_end_listener = null;
        this.clusterer = null;
        this.data_points = null;
        // Create an info window ...
        this.info_window = new google.maps.InfoWindow();
        // Try to initialize Google maps ...
        map_center = new google.maps.LatLng(center_lat, center_lon);
        map_opts = {
            center: map_center,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            zoom: 8
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
        /*
        Show zoom level and add a listener to show the current
        zoom level when it changes ...
        */
        this.map_zoom_level_show(this.map.getZoom());
        google.maps.event.addListener(this.map, 'zoom_changed', () => {
            this.info_window_close();
            this.map_zoom_level_show(this.map.getZoom());
        });
        // Test once all tiles are loaded ...
        google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
            this.test_clusterer();
        });
        // Grid point marker click event handler ...
        google.maps.event.addListener(this.map, 'grid_point_click', (evt) => {
            this.grid_point_marker_click_handler(evt);
        });
    }
    /*
    ---------------------------------------------------------------------
    Get a string from an <input type="text" or <select> form field ...
     
    PARAMETERS:
     
       Name: fld_id
       Desc: The ID of the DOM / form field.
 
       Name: default_val
       Desc: The default value to be used if the field is not found.
     
    RETURNS:
     
       A string that is the field value (or selected value).
 
    ---------------------------------------------------------------------
    */
    form_field_string_get(fld_id, default_val) {
        let s = default_val;
        let fld = $(fld_id);
        if (fld) {
            s = fld.val().toString();
            if (s.length == 0) {
                s = default_val;
                fld.val(s);
            }
        }
        return s;
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
    Called when we need to handle a click event on a grid point marker ...
    ---------------------------------------------------------------------
    */
    grid_point_marker_click_handler(evt) {
        // Update the number of data points in the title ...
        let s;
        s = '<b>Grid point</b><ul>';
        s += '<li>Index: ' + evt.grid_point.idx + '</li>';
        s += '<li>Bounds:' + evt.grid_point.bounds.toString() + '</li>';
        s += '<li>Data key count: ' + evt.grid_point.data_keys.length + '</li>';
        s += '</ul>';
        s += '<b>Tile</b><ul>';
        s += '<li>Index: ' + evt.grid_point.tile.idx + '</li>';
        s += '<li>Coordinates: ' + evt.grid_point.tile.coord.toString() + '</li>';
        s += '<li>Tile bounds: ' + evt.grid_point.tile.bounds.toString() + '</li>';
        s += '<li>Data bounds: ' + evt.grid_point.tile.data_bounds.toString() + '</li>';
        s += '<li>Grid points: ' + evt.grid_point.tile.grid_points.size + '</li>';
        s += '<li>Data key count: ' + evt.grid_point.tile.data_keys.length + '</li>';
        s += '</ul>';
        this.info_window_open(evt.grid_point.bounds.getCenter(), s);
    }
    /*
    ---------------------------------------------------------------------
    Load clusterer options from form fields (DOM elements)
     
    PARAMETERS:
     
       None
     
    RETURNS:
     
       A object that contains clusterer options
 
    ---------------------------------------------------------------------
    */
    grid_clusterer_options_get() {
        const k_cluster_size_default = 20;
        const k_cluster_zoom_default = 14;
        const k_grid_cols_default = 4;
        const k_grid_rows_default = 4;
        const k_tile_border_color_default = '#808080';
        const k_tile_border_style_default = 'solid';
        const k_tile_border_width_default = '1px';
        const k_tile_height_default = 256;
        const k_tile_width_default = 256;
        let cluster_marker_click_check;
        let tile_borders_visible;
        let cluster_size_min;
        let cluster_zoom_max;
        let grid_cols;
        let grid_rows;
        let tile_height;
        let tile_width;
        let tile_border_color;
        let tile_border_style;
        let tile_border_width;
        let grd_opts;
        // Get tile height and width ...
        tile_height = this.form_field_number_get('#fld_tile_height', k_tile_height_default);
        tile_width = this.form_field_number_get('#fld_tile_width', k_tile_width_default);
        // Get cluster marker click check setting ...
        cluster_marker_click_check = $('#fld_cluster_marker_click_check').is(':checked');
        // Get tile borders visible setting ...
        tile_borders_visible = $('#fld_tile_borders_visible').is(':checked');
        // Get number of grid rows and columns ...
        grid_rows = this.form_field_number_get('#fld_grid_rows', k_grid_rows_default);
        grid_cols = this.form_field_number_get('#fld_grid_cols', k_grid_cols_default);
        // Get cluster size minimum ...
        cluster_size_min = this.form_field_number_get('#fld_cluster_size_min', k_cluster_size_default);
        // Get cluster zoom maximum ...
        cluster_zoom_max = this.form_field_number_get('#fld_cluster_zoom_max', k_cluster_zoom_default);
        // Get tile border color, style and width ...
        tile_border_color = this.form_field_string_get('#fld_tile_border_color', k_tile_border_color_default);
        tile_border_style = this.form_field_string_get('#fld_tile_border_style', k_tile_border_style_default);
        tile_border_width = this.form_field_string_get('#fld_tile_border_width', k_tile_border_width_default);
        // Build and return grid cluster options ...
        grd_opts = {
            cluster_marker_click_check: cluster_marker_click_check,
            tiles_redraw_start_event_name: this.k_tiles_redraw_start_event,
            tiles_redraw_end_event_name: this.k_tiles_redraw_end_event,
            cluster_size_min: cluster_size_min,
            cluster_zoom_max: cluster_zoom_max,
            grid_point_cols: grid_cols,
            grid_point_rows: grid_rows,
            grid_point_marker_click_event_name: 'grid_point_click',
            grid_point_marker_click_handler: null,
            tile_borders_visible: tile_borders_visible,
            tile_border_color: tile_border_color,
            tile_border_style: tile_border_style,
            tile_border_width: tile_border_width,
            tile_size: new google.maps.Size(tile_width, tile_height)
        };
        return grd_opts;
    }
    /*
    ---------------------------------------------------------------------
    Shows the time required to redraw tiles in a DOM element
     
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    tiles_redraw_time_show() {
        $('#ts5').html(this.tiles_redraw_time + ' ms');
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
        let data_points_count;
        let t0;
        let opts;
        // Get the number of points to create ...
        data_points_count = this.form_field_number_get('#fld_dpc', this.k_data_points_default);
        if (data_points_count < this.k_data_points_min) {
            data_points_count = this.k_data_points_min;
        }
        else {
            if (data_points_count > this.k_data_points_max) {
                data_points_count = this.k_data_points_max;
            }
        }
        // Update form field ...
        $('#fld_dpc').val(data_points_count.toString());
        // Create data points ...
        this.data_points_create(data_points_count);
        if (this.data_points) {
            // Delete previous clusterer (if any) ...
            if (this.clusterer) {
                this.clusterer.clear();
                this.clusterer = null;
            }
            // Pickup configuration options from the form ...
            opts = this.grid_clusterer_options_get();
            // Create new cluster object and load data ...
            t0 = performance.now();
            this.clusterer = new grid_clusterer(this.map, this.data_points, opts);
            t0 = performance.now() - t0;
            $('#ts2').html(t0 + ' ms');
            /*
            Create an event listener to initialize the time that
            tiles redraw starts ...
            */
            if (this.tiles_redraw_start_listener) {
                this.tiles_redraw_start_listener.remove();
            }
            this.tiles_redraw_start_listener = google.maps.event.addListener(this.map, this.k_tiles_redraw_start_event, () => {
                this.tiles_redraw_time = performance.now();
            });
            /*
            Create an event listener to calculate the time it took
            for tiles to redraw ...
            */
            if (this.tiles_redraw_end_listener) {
                this.tiles_redraw_end_listener.remove();
            }
            this.tiles_redraw_end_listener = google.maps.event.addListener(this.map, this.k_tiles_redraw_end_event, () => {
                this.tiles_redraw_time = performance.now() - this.tiles_redraw_time;
                this.tiles_redraw_time_show();
            });
            // Set the clusterer to auto redraw on these map events ...
            this.clusterer.auto_redraw_event_add('dragend');
            this.clusterer.auto_redraw_event_add('zoom_changed');
            // Redraw tiles ...
            this.clusterer.redraw();
        }
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
        let btn_text;
        // Prevent default form action ...
        evt.preventDefault();
        // Disable submit button ...
        btn_text = $(this.k_submit_btn_id).text();
        $(this.k_submit_btn_id).html('Working...');
        $(this.k_submit_btn_id).prop('disabled', true);
        /*
        We use setTimeout so the submit button text can be updated
        and disabled while we build the data points ...
        */
        setTimeout(() => {
            // Close any previously opened info window ...
            this.info_window_close();
            this.test_clusterer();
            $(this.k_submit_btn_id).html(btn_text);
            $(this.k_submit_btn_id).prop('disabled', false);
        }, 0);
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
        let opts;
        // Prevent default behavior ..
        evt.preventDefault();
        // Close any previously open info window ...
        this.info_window_close();
        // Init ...
        this.tiles_redraw_time = 0;
        this.tiles_redraw_time_show();
        if (!this.clusterer) {
            $('#ts0').html('<b><span style="color:#FF0000">No data points exist</span>. Click the &quot;Create New Data Points&quot; button first</b>');
            return;
        }
        // Pickup configuration options from the form and update clusterer ...
        opts = this.grid_clusterer_options_get();
        this.clusterer.configure(opts);
        // Update form fields ...
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
        $('#mzl').html(zoom_level.toString());
    }
    /*
    ---------------------------------------------------------------------
    Create a given number of data points within the map bounds.
     
    PARAMETERS:
     
       Name: count
       Desc: The number of data points to create.
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    data_points_create(count) {
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
        let t0;
        let map_bounds;
        // Get current bounds, if none, exit ...
        map_bounds = this.map.getBounds();
        if (!map_bounds) {
            $('#ts0').html('<b>Map bounds is not initialized yet, try again</b>');
            return;
        }
        // Range check ...
        if (count < this.k_data_points_min) {
            count = this.k_data_points_min;
        }
        else {
            if (count > this.k_data_points_max) {
                count = this.k_data_points_max;
            }
        }
        // Show number of data points in DOM ...
        $('#ts0').html(count.toString());
        // Delete any previous data points ...
        if (this.data_points) {
            this.data_points.length = 0;
            this.data_points = null;
        }
        // Create a new array of data points ...
        t0 = performance.now();
        this.data_points = new Array(count);
        lat_min = map_bounds.getSouthWest().lat();
        lat_span = map_bounds.getNorthEast().lat() - lat_min;
        lon_min = map_bounds.getSouthWest().lng();
        lon_span = map_bounds.getNorthEast().lng() - lon_min;
        for (i = 0; i < count; i++) {
            lat = lat_min + (Math.random() * lat_span);
            lat = Math.min(Math.max(lat, k_lat_min), k_lat_max);
            lon = lon_min + (Math.random() * lon_span);
            lon = Math.min(Math.max(lon, k_lon_min), k_lon_max);
            this.data_points[i] = { key: i, lat: lat, lon: lon };
        }
        t0 = performance.now() - t0;
        // Show how long it took to create data points ...
        $('#ts1').html(t0 + " ms");
    }
}
