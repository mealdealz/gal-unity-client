import React from 'react';
import Map from './Map';

class Deals extends React.Component {
    render() {

        console.table(this.props.details);

        return(
            <div className="deal-card">
                <div>
                    <p>Restaurant: {this.props.details.restaurant}</p>
                    <p>Phone: {this.props.details.phone}</p>
                    <p>Website: {this.props.details.site}</p>
                </div>
                <div className="map-holder">
                    <Map className="map" latlon={this.props.details.location}/>
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
