import React from 'react';
import mapboxgl from 'mapbox-gl';

class Map extends React.Component {

    componentDidMount() {
        mapboxgl.accessToken = 'pk.eyJ1IjoiZWpsODUiLCJhIjoiY2ppMjRncWlzMDd0ZTNrbGc3M211amtqZyJ9.CBzEkAx9My7dS5jkzN2VMA';
        this.map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9'
        });
    }

    componentWillUnmount() {
        this.map.remove();
    }

    render() {
        const style = {
            container: 'map-holder',
                width: '10vw',
                height: '20vh'
        };

        return (
            <div style={style} ref={el => this.mapContainer = el} />
        )
    }
}

export default Map;
