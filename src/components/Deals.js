import React from 'react';
import Map from './Map';

class Deals extends React.Component {
    render() {
        return(
            <div>
                <div>
                    <p>Deal Name</p>
                    <p>Restaurant</p>
                    <p>Phone</p>
                    <p>Web</p>
                    <p>Email</p>
                </div>
                <div>
                    <p>HOLDER FOR MAP</p>
                    <Map />
                    <img />
                </div>
                <div>
                    <button>Delete</button>
                    <button>Submit</button>
                </div>
            </div>
        )
    }
}

export default Deals;