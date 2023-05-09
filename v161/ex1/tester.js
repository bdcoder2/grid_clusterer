// Source: D:\vscode\grid_clusterer\v161\js\ex1\tester.js
/*
=====================================================================

Example that illustrates the performance differences between creating
data points and Google map markers.

=====================================================================
*/
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
        this.k_data_points_default = 5000;
        this.k_data_points_min = 1;
        this.k_data_points_max = 6000000;
        this.k_submit_btn_id = '#btn1';
        this.k_fld_data_point_count_id = '#fld_dpc';
        let map_center;
        let map_opts;
        // Initialize ...
        this.data_points = null;
        map_center = new google.maps.LatLng(43.308773, -20.660497);
        map_opts = {
            center: map_center,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            zoom: 3
        };
        try {
            this.map = new google.maps.Map(document.getElementById(mvp_id), map_opts);
        }
        catch (ex) {
            alert('* Unable to create map: ' + ex.toString());
            this.map = null;
        }
        google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
            this.test_compare();
        });
    }
    /*
    ---------------------------------------------------------------------
    Create a specific number of random data points within a given
    LatLngBounds.
  
    PARAMETERS:
     
       Name: map_bounds
       Desc: A google.maps.LatLngBounds object in which data points
             (latitude and longitude) values will be created.
 
       Name: count
       Desc: The number of data points to create.
     
    RETURNS:
     
       The elapsed time (in ms).
 
    ---------------------------------------------------------------------
    */
    data_points_create(map_bounds, count) {
        const k_lat_min = -85.051128;
        const k_lat_max = 85.051128;
        const k_lon_min = -180;
        const k_lon_max = 180;
        let i;
        let lat;
        let lon;
        let lat_min;
        let lat_span;
        let lon_min;
        let lon_span;
        let t0;
        let t1;
        // Get lat/lon ranges ...
        lat_min = map_bounds.getSouthWest().lat();
        lat_span = map_bounds.getNorthEast().lat() - lat_min;
        lon_min = map_bounds.getSouthWest().lng();
        lon_span = map_bounds.getNorthEast().lng() - lon_min;
        // Loop to create data points ...
        t0 = performance.now();
        this.data_points = new Array();
        for (i = 0; i < count; i++) {
            lat = lat_min + (Math.random() * lat_span);
            lat = Math.min(Math.max(lat, k_lat_min), k_lat_max);
            lon = lon_min + (Math.random() * lon_span);
            lon = Math.min(Math.max(lon, k_lon_min), k_lon_max);
            this.data_points.push({ key: i, lat: lat, lon: lon });
        }
        // Return elapsed time ...
        t1 = performance.now();
        return (t1 - t0);
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
    Create a specific number Google map markers from the data points
    array.
  
    PARAMETERS:
     
       None
     
    RETURNS:
     
       The elapsed time (in ms).
 
    ---------------------------------------------------------------------
    */
    google_map_markers_create() {
        let i;
        let t0;
        let t1;
        let data_pt;
        let m;
        let markers;
        t0 = 0;
        t1 = 0;
        if (this.data_points) {
            // Loop to create Google map markers ..
            t0 = performance.now();
            markers = new Array();
            for (i = 0; i < this.data_points.length; i++) {
                data_pt = this.data_points[i];
                m = new google.maps.Marker({ map: null, position: new google.maps.LatLng(data_pt.lat, data_pt.lon) });
                markers.push(m);
            }
            t1 = performance.now();
            // Delete the markers as we only wanted to see how long it takes ...
            markers.length = 0;
            markers = null;
        }
        // Return elapsed time ...
        return (t1 - t0);
    }
    /*
    ---------------------------------------------------------------------
    Test to compare the time required to create a data points array vs an
    array of Google map markers.
     
    PARAMETERS:
     
       Name: map_bounds
       Desc: .
     
    RETURNS:
     
       false, to prevent event propagation.
 
    ---------------------------------------------------------------------
    */
    test_compare() {
        let data_points_count;
        let elapsed_ms_to_create_data_points;
        let elapsed_ms_to_create_map_markers;
        let n;
        let p;
        let time_diff;
        let s;
        let map_bounds;
        // Get current bounds, if none, exit ...
        map_bounds = this.map.getBounds();
        if (!map_bounds) {
            $('#ts4').html('<b>* Map bounds not initialized yet, try again.</b>');
            return;
        }
        // Get the number of points to create ...
        data_points_count = this.form_field_number_get(this.k_fld_data_point_count_id, this.k_data_points_default);
        if (data_points_count < this.k_data_points_min) {
            data_points_count = this.k_data_points_min;
        }
        else {
            if (data_points_count > this.k_data_points_max) {
                data_points_count = this.k_data_points_max;
            }
        }
        $(this.k_fld_data_point_count_id).val(data_points_count);
        // Delete any previous data points ...
        if (this.data_points) {
            this.data_points.length = 0;
            this.data_points = null;
        }
        // Show number of data points in DOM ...
        $('#ts0').html(data_points_count.toString());
        // Create the requested number of data points and show elapsed time ...
        elapsed_ms_to_create_data_points = this.data_points_create(map_bounds, data_points_count);
        $('#ts1').html(elapsed_ms_to_create_data_points.toString() + " ms");
        // Create the same number of Google map markers and show elapsed time ...
        elapsed_ms_to_create_map_markers = this.google_map_markers_create();
        $('#ts2').html(elapsed_ms_to_create_map_markers.toString() + " ms");
        // Calculate time difference and show time difference ...
        time_diff = elapsed_ms_to_create_data_points - elapsed_ms_to_create_map_markers;
        $('#ts3').html(time_diff.toString() + " ms");
        s = '<b>No significant difference in creation times.</b>';
        if ((elapsed_ms_to_create_data_points > 0) && (elapsed_ms_to_create_map_markers > 0)) {
            /*
            Calculate how many times data point creation is faster or slower than marker
            creation; rounded to 2 digits ...
            */
            n = Math.round((elapsed_ms_to_create_map_markers / elapsed_ms_to_create_data_points) * 100) / 100;
            /*
            Calculate percentage change from creating map markers (v1) to creating data points (v2) ...
            %age change = ( ( v2 - v1 ) / v1 ) * 100
            https://www.calculatorsoup.com/calculators/algebra/percent-change-calculator.php
            */
            p = ((elapsed_ms_to_create_data_points - elapsed_ms_to_create_map_markers) / elapsed_ms_to_create_map_markers) * 100;
            p = Math.round(p * 100) / 100;
            if (p < 0) {
                p = Math.abs(p);
                s = '<span style="color:#008000"><b>Data point creation is ' + n + ' times faster</b></span>; a ' + p + '% decrease in time compared to creating Google map markers.';
            }
            else {
                s = '<span style="color:#FF0000"><b>Data point creation is ' + n + ' times slower</b></span>; a ' + p + '% increase in time compared to creating Google map markers';
            }
        }
        $('#ts4').html(s);
    }
    /*
    ---------------------------------------------------------------------
    Check if we have a map bounds and validate the number of data points
    to create.
     
    PARAMETERS:
     
       Name: evt
       Desc: a {SubmitEvent} object.
     
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
            this.test_compare();
            $(this.k_submit_btn_id).html(btn_text);
            $(this.k_submit_btn_id).prop('disabled', false);
        }, 0);
        // To prevent propagation ...
        return false;
    }
}
