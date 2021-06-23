function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 20,
        center: new google.maps.LatLng(41.0432437468, 29.006260494),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();

    window['maps'] = { map, infowindow }
}


