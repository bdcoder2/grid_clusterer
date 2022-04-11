// Source: D:\vscode\grid_clusterer\js\ex3\tester.js
/*
=====================================================================

Example that illustrates how the "cluster_marker_click_checks" flag
works.

=====================================================================
*/
class tester {
    /*
    ---------------------------------------------------------------------
    Constructor
     
    ARGUMENTS:
     
       Name: mvp_id
       Desc: The DOM element id used as the map viewport
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    constructor(mvp_id) {
        /*
        ---------------------------------------------------------------------
        Cluster marker click handler
         
        ARGUMENTS:
         
           Name: evt
           Desc: a cluster_marker_click_event object
         
        RETURNS:
         
           None
     
        ---------------------------------------------------------------------
        */
        this.cluster_marker_click_handler = (evt) => {
            // Try to fit on data bounds ...
            this.map.fitBounds(evt.tile.data_bounds);
            // Show data point markers if cluster marker click checks are NOT enabled ...
            if (!this.cluster_marker_click_checks_enabled) {
                this.data_markers_visible(true);
            }
        };
        let map_opts;
        let clusterer_opts;
        // Initialize ...
        this.clusterer = null;
        this.data_points = null;
        this.cluster_marker_click_checks_enabled = false;
        // Create data points ...
        this.data_bounds = this.data_points_create();
        // Try to initialize Google map ...
        map_opts = {
            center: this.data_bounds.getCenter(),
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
        this.map.fitBounds(this.data_bounds);
        // Create data markers ...
        this.data_markers_create();
        // Create clusterer and load data ...
        clusterer_opts = {
            cluster_marker_click_check: false,
            cluster_marker_click_handler: this.cluster_marker_click_handler,
            tile_borders_visible: true
        };
        this.clusterer = new grid_clusterer(this.map, this.data_points, clusterer_opts);
        // Set the clusterer to auto redraw on these map events ...
        this.clusterer.auto_redraw_event_add('dragend');
        this.clusterer.auto_redraw_event_add('zoom_changed');
        // Redraw once the map becomes idle ...
        google.maps.event.addListenerOnce(this.map, 'idle', () => {
            this.clusterer.redraw();
        });
        // Check for radio button changes and update clusterer config ...
        $('input[type=radio][name=fld_cluster_marker_click_checks]').on('change', () => {
            // Hide markers and fit to data bounds ...
            this.data_markers_visible(false);
            this.map.fitBounds(this.data_bounds);
            // Update clusterer configuration ...
            let rb_val = $('input[name="fld_cluster_marker_click_checks"]:checked').val();
            if (rb_val == 1) {
                this.cluster_marker_click_checks_enabled = true;
            }
            else {
                this.cluster_marker_click_checks_enabled = false;
            }
            this.clusterer.configure({ cluster_marker_click_check: this.cluster_marker_click_checks_enabled });
        });
    }
    /*
    ---------------------------------------------------------------------
    Create data points for input to the clusterer
     
    ARGUMENTS:
     
       None
     
    RETURNS:
     
       A google.maps.LatLngBounds object
 
    ---------------------------------------------------------------------
    */
    data_points_create() {
        this.data_points = new Array(21);
        this.data_points[0] = { key: 0, lat: 38.628515, lon: -121.798992 };
        this.data_points[1] = { key: 1, lat: 38.704728, lon: -122.598213 };
        this.data_points[2] = { key: 2, lat: 37.556793, lon: -121.569048 };
        this.data_points[3] = { key: 3, lat: 36.931121, lon: -122.299295 };
        this.data_points[4] = { key: 4, lat: 38.789752, lon: -122.717580 };
        this.data_points[5] = { key: 5, lat: 38.780367, lon: -122.199307 };
        this.data_points[6] = { key: 6, lat: 36.768930, lon: -123.671676 };
        this.data_points[7] = { key: 7, lat: 36.860713, lon: -123.259901 };
        this.data_points[8] = { key: 8, lat: 37.885836, lon: -121.3927619 };
        this.data_points[9] = { key: 9, lat: 37.049628, lon: -123.465704 };
        this.data_points[10] = { key: 10, lat: 36.892659, lon: -123.610182 };
        this.data_points[11] = { key: 11, lat: 37.092194, lon: -121.623403 };
        this.data_points[12] = { key: 12, lat: 38.799409, lon: -121.875253 };
        this.data_points[13] = { key: 13, lat: 38.386813, lon: -123.424744 };
        this.data_points[14] = { key: 14, lat: 37.480265, lon: -121.164574 };
        this.data_points[15] = { key: 15, lat: 37.143913, lon: -121.583930 };
        this.data_points[16] = { key: 16, lat: 36.785584, lon: -122.933178 };
        this.data_points[17] = { key: 17, lat: 38.657391, lon: -121.239045 };
        this.data_points[18] = { key: 18, lat: 37.588143, lon: -123.548677 };
        this.data_points[19] = { key: 19, lat: 38.536273, lon: -122.871833 };
        this.data_points[20] = { key: 20, lat: 38.723359, lon: -122.220645 };
        let i;
        let data_bounds = new google.maps.LatLngBounds();
        for (i = 0; i < this.data_points.length; i++) {
            data_bounds.extend(new google.maps.LatLng(this.data_points[i].lat, this.data_points[i].lon));
        }
        return data_bounds;
    }
    /*
    ---------------------------------------------------------------------
    Create google map markers for all data points
     
    ARGUMENTS:
     
       None
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    data_markers_create() {
        let i;
        let latlon;
        let marker;
        this.data_markers = new Array();
        for (i = 0; i < this.data_points.length; i++) {
            latlon = new google.maps.LatLng(this.data_points[i].lat, this.data_points[i].lon);
            marker = new google.maps.Marker({ map: this.map, position: latlon, label: this.data_points[i].key.toString(), visible: false });
            this.data_markers.push(marker);
        }
    }
    /*
    ---------------------------------------------------------------------
    Set the visibility of all data point markers
     
    ARGUMENTS:
     
       Name: is_visible
       Desc: Flag used to to set the visibility of data point markers.
             When true, markers will be visible.
             When false, markers will not be visibile.
     
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    data_markers_visible(is_visible) {
        let i;
        let marker;
        for (i = 0; i < this.data_markers.length; i++) {
            marker = this.data_markers[i];
            marker.setVisible(is_visible);
        }
    }
}
