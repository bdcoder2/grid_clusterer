// Source: D:\vscode\grid_clusterer\v190\js\ex1\tester.js
/*
=====================================================================

Example that illustrates the performance differences between creating
data_point objects vs Google map markers.

=====================================================================
*/
class tester {
    /*
    ---------------------------------------------------------------------
    Constructor
     
    PARAMETERS:
     
       None
 
    RETURNS:
     
       None
 
    ---------------------------------------------------------------------
    */
    constructor() {
        // Get UI (DOM) objects ...
        this.k_lat_min = -85.051128;
        this.k_lat_max = 85.051128;
        this.k_lon_min = -180;
        this.k_lon_max = 180;
        this.k_data_points_default = 10000;
        this.k_data_points_min = 1;
        this.k_data_points_max = 500000;
        this.k_btn_run_tests_id = "btn_1";
        this.k_div_dp_results_id = "div_dp_results";
        this.k_div_mm_results_id = "div_mm_results";
        this.k_div_compare_results_id = "div_compare_results";
        this.k_fld_data_point_count_id = 'fld_dpc';
        this.btn_run_tests = this.jquery_object_get(this.k_btn_run_tests_id);
        this.div_data_points_results = this.jquery_object_get(this.k_div_dp_results_id);
        this.div_map_markers_results = this.jquery_object_get(this.k_div_mm_results_id);
        this.div_compare_results = this.jquery_object_get(this.k_div_compare_results_id);
        // Create the map bounds that we create points in (nearly the whole earth) ...
        this.map_bounds = new google.maps.LatLngBounds();
        this.map_bounds.extend(new google.maps.LatLng(this.k_lat_min, this.k_lon_min));
        this.map_bounds.extend(new google.maps.LatLng(this.k_lat_max, this.k_lon_max));
        // Run each test ...
        this.run_tests();
    }
    /*
    ---------------------------------------------------------------------
    Return the number of data points to create from a form field
  
    PARAMETERS:
     
       None.
 
    RETURNS:
     
       The number of data points to create.
 
    ---------------------------------------------------------------------
    */
    data_points_count_get() {
        let n;
        // Get the number of points to create ...
        n = this.form_field_number_get(this.k_fld_data_point_count_id, this.k_data_points_default);
        if (n < this.k_data_points_min) {
            n = this.k_data_points_min;
        }
        else {
            if (n > this.k_data_points_max) {
                n = this.k_data_points_max;
            }
        }
        this.form_field_number_set(this.k_fld_data_point_count_id, n);
        return n;
    }
    /*
    ---------------------------------------------------------------------
    Given a DOM element ID, return the JQuery<HTMLElement> for that ID or
    null.
  
    PARAMETERS:
     
       Name: id
       Desc: The id of a DOM element.
 
    RETURNS:
     
       A JQuery<HTMLElement> object or null
 
    ---------------------------------------------------------------------
    */
    jquery_object_get(id) {
        let jqo = $('#' + id);
        if (jqo.length)
            return jqo;
        return null;
    }
    /*
    ---------------------------------------------------------------------
    Create a specific number of random data_point objects within our map
    boundry.
 
    PARAMETERS:
     
       None.
     
    RETURNS:
     
       None.
 
    ---------------------------------------------------------------------
    */
    data_points_create() {
        let data_points_count;
        let i;
        let lat;
        let lon;
        let lat_min;
        let lat_span;
        let lon_min;
        let lon_span;
        let n;
        let t0;
        let t1;
        let td;
        let s;
        let data_points;
        // Init ...
        this.data_points_created = 0;
        this.elapsed_ms_to_create_data_points = 0;
        // Create data points array and get time to do so ...
        data_points_count = this.data_points_count_get();
        t0 = performance.now();
        data_points = new Array(data_points_count);
        t1 = performance.now();
        td = t1 - t0;
        this.elapsed_ms_to_create_data_points = td;
        lat_min = this.map_bounds.getSouthWest().lat();
        lat_span = this.map_bounds.getNorthEast().lat() - lat_min;
        lon_min = this.map_bounds.getSouthWest().lng();
        lon_span = this.map_bounds.getNorthEast().lng() - lon_min;
        t0 = performance.now();
        for (i = 0; i < data_points_count; i++) {
            n = lat_min + (Math.random() * lat_span);
            lat = Math.min(Math.max(n, this.k_lat_min), this.k_lat_max);
            n = lon_min + (Math.random() * lon_span);
            lon = Math.min(Math.max(n, this.k_lon_min), this.k_lon_max);
            data_points[i] = { key: i, lat: lat, lon: lon };
        }
        t1 = performance.now();
        td = t1 - t0;
        this.elapsed_ms_to_create_data_points += td;
        this.data_points_created = data_points_count;
        s = '<ul><li>' + this.data_points_created + ' data_point objects created in ' + this.elapsed_ms_to_create_data_points + ' ms</li></ul>';
        this.div_data_points_results.html(s);
        // Release data points array so garbage collection can occur ...
        data_points.length = 0;
        data_points = null;
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
     
       A number that is the field value (or default value).
 
    ---------------------------------------------------------------------
    */
    form_field_number_get(fld_id, default_val) {
        let n = default_val;
        let fld = $('#' + fld_id);
        if (fld.length) {
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
    Set the number (value) for an <input type="text" or <select> form field ...
     
    PARAMETERS:
     
       Name: fld_id
       Desc: The ID of the DOM / form field.
 
       Name: n
       Desc: The number to be set for the field.
     
    RETURNS:
     
       None.
 
    ---------------------------------------------------------------------
    */
    form_field_number_set(fld_id, n) {
        let fld = $('#' + fld_id);
        if (fld.length) {
            fld.val(n.toString());
        }
    }
    /*
    ---------------------------------------------------------------------
    Create a specific number Google map markers.
  
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None.
 
    ---------------------------------------------------------------------
    */
    google_map_markers_create() {
        let data_points_count;
        let i;
        let lat;
        let lon;
        let lat_min;
        let lat_span;
        let lon_min;
        let lon_span;
        let n;
        let t0;
        let t1;
        let td;
        let btn_text;
        let s;
        let markers;
        // Disable submit button while we are working ...
        btn_text = this.btn_run_tests.text();
        this.btn_run_tests.text('Working...');
        this.btn_run_tests.prop('disabled', true);
        // Get the number of points to create ...
        data_points_count = this.data_points_count_get();
        // Create and populate an array of Google map markers ...
        this.map_markers_created = 0;
        this.elapsed_ms_to_create_map_markers = 0;
        // Create markers array and get time required to do so ...
        t0 = performance.now();
        markers = new Array(data_points_count);
        t1 = performance.now();
        td = t1 - t0;
        this.elapsed_ms_to_create_map_markers = td;
        lat_min = this.map_bounds.getSouthWest().lat();
        lat_span = this.map_bounds.getNorthEast().lat() - lat_min;
        lon_min = this.map_bounds.getSouthWest().lng();
        lon_span = this.map_bounds.getNorthEast().lng() - lon_min;
        i = 0;
        const process_chunk = () => {
            // Process a small chunk (10,000 markers) of the task ...
            t0 = performance.now();
            for (let j = 0; j < 10000 && i < data_points_count; j++, i++) {
                n = lat_min + (Math.random() * lat_span);
                lat = Math.min(Math.max(n, this.k_lat_min), this.k_lat_max);
                n = lon_min + (Math.random() * lon_span);
                lon = Math.min(Math.max(n, this.k_lon_min), this.k_lon_max);
                markers[i] = new google.maps.marker.AdvancedMarkerElement({ map: null, position: new google.maps.LatLng(lat, lon) });
            }
            t1 = performance.now();
            td = t1 - t0;
            this.elapsed_ms_to_create_map_markers += td;
            this.map_markers_created = i;
            // Update UI ...
            s = '<ul><li>' + this.map_markers_created + ' Google map markers created in ' + this.elapsed_ms_to_create_map_markers + ' ms</li></ul>';
            this.div_map_markers_results.html(s);
            // If not done, schedule the next chunk to run after a brief
            // delay allowing the browser to renter UI updates ...
            if (i < data_points_count) {
                setTimeout(process_chunk, 0);
            }
            else {
                // Task completed, release markers array so garbage collection can occur ...
                markers.length = 0;
                markers = null;
                // Re-enable submit button ...
                this.btn_run_tests.text(btn_text);
                this.btn_run_tests.prop('disabled', false);
                this.compare_and_show_results();
            }
        };
        process_chunk();
    }
    /*
    ---------------------------------------------------------------------
    Compare the time of each test and show results in the UI ...
  
    PARAMETERS:
     
       None
     
    RETURNS:
     
       None.
 
    ---------------------------------------------------------------------
    */
    compare_and_show_results() {
        let n;
        let s;
        s = '';
        if (this.data_points_created == this.map_markers_created) {
            // https://math.stackexchange.com/questions/1227389/
            s = '<ul><li><b>No significant difference in times.</b></li></ul>';
            if (this.elapsed_ms_to_create_data_points < this.elapsed_ms_to_create_map_markers) {
                if (this.elapsed_ms_to_create_data_points > 0) {
                    n = Math.round((this.elapsed_ms_to_create_map_markers / this.elapsed_ms_to_create_data_points) * 100) / 100;
                }
                else {
                    n = Math.round(this.elapsed_ms_to_create_map_markers * 100) / 100;
                }
                if (n > 1) {
                    s = '<ul><li><span style="color:#008000"><b>data_point creation is ' + n + ' times faster</b></span> than creating Google map markers.</li></ul>';
                }
            }
            else if (this.elapsed_ms_to_create_data_points > this.elapsed_ms_to_create_map_markers) {
                if (this.elapsed_ms_to_create_map_markers > 0) {
                    n = Math.round((this.elapsed_ms_to_create_data_points / this.elapsed_ms_to_create_map_markers) * 100) / 100;
                }
                else {
                    n = Math.round(this.elapsed_ms_to_create_data_points * 100) / 100;
                }
                if (n > 1) {
                    s = '<ul><li><span style="color:#FF0000"><b>data_point creation is ' + n + ' times slower</b></span> than creating Google map markers.</li></ul>';
                }
            }
        }
        this.div_compare_results.html(s);
    }
    /*
    ---------------------------------------------------------------------
    Run each test and show results.
     
    PARAMETERS:
     
       None.
     
    RETURNS:
     
       None.
 
    ---------------------------------------------------------------------
    */
    run_tests() {
        this.div_compare_results.html('');
        this.data_points_create();
        this.google_map_markers_create();
    }
    /*
    ---------------------------------------------------------------------
    Check which submit button was pressed and perform the associated
    test.
     
    PARAMETERS:
     
       Name: evt
       Desc: a {SubmitEvent} object.
     
    RETURNS:
     
       false, to prevent event propagation.
 
    ---------------------------------------------------------------------
    */
    test_submit(evt) {
        // Prevent default form action ...
        evt.preventDefault();
        this.run_tests();
        // To prevent propagation ...
        return false;
    }
}
