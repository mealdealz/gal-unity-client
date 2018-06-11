import React from 'react';
import Map from './Map';

class Deals extends React.Component {
    render() {

        console.table(this.props.details);

        return(
            <div className="deal-card">
                <div>
                    <p>Deal Name</p>
                    <p>{this.props.details.restaurant}</p>
                    <p>{this.props.details.phone}</p>
                    <p>{this.props.details.site}</p>
                    <p>{this.props.details.day}</p>
                    <p>{this.props.details.time}</p>
                    <p>Email</p>
                </div>
                <div className="map-holder">
                    <p>HOLDER FOR MAP</p>
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