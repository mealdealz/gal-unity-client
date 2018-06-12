import React from 'react';
import Map from './Map';

class Deals extends React.Component {
    render() {

        console.table(this.props.details);

        return(
            <div className="deal-card">
                <div>
                    <p>Restaurant: {this.props.details.restaurant}</p>
                    <p>Deals: {this.props.details.specials}</p>
                    <p>Phone: {this.props.details.phone}</p>
                    <p>Website: {this.props.details.site}</p>
                    <p>Days Open: {this.props.details.day}</p>
                    <p>Hours: {this.props.details.time}</p>
                </div>
                <div className="map-holder">
                    <Map className="map" />
                    <div>
                        <button>Delete</button>
                        <button>Submit</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default Deals;
