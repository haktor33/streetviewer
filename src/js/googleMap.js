let map, infowindow;
let markers = [];

const iconBase = "https://developers.google.com/maps/documentation/javascript/examples/full/images/";
const icons = {
    parking: {
        icon: iconBase + "parking_lot_maps.png",
    },
    library: {
        icon: iconBase + "library_maps.png",
    },
    info: {
        icon: iconBase + "info-i_maps.png",
    },
};
var index;

export const setLocation = (newLat, newLng) => {
    deleteMarkers();
    if (!map) {
        map = window['maps'].map;
        infowindow = window['maps'].map;
    }
    map.setCenter({
        lat: newLat,
        lng: newLng
    });
}

export const deleteMarkers = () => {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

export const addMarkers = (locations) => {
    deleteMarkers();
    if (!locations) { locations = [] };
    var center = locations.find(f => f[0] === 'Merkez');
    if (center) {
        setLocation(center[1], center[2]);
    }
    for (index = 0; index < locations.length; index++) {
        const loc = locations[index];
        addMarker(loc, index);
    }
}

export const addMarker = (loc, i) => {
    if (!i) { i = ++index };
    if (!map) {
        map = window['maps'].map;
        infowindow = window['maps'].map;
    }

    var marker = new google.maps.Marker({
        title: loc[0],
        position: new google.maps.LatLng(loc[1], loc[2]),
        map: map,
        icon: icons[loc[3] || 'library'].icon,
    });
    markers.push(marker);

    google.maps.event.addListener(marker, 'click', (function (marker, i) {
        return function () {
            infowindow.setContent(locations[i][0]);
            infowindow.open(map, marker);
        }
    })(marker, i));
}