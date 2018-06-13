import React from 'react';

class Specials extends React.Component {
    render() {
        return(
            <p>{this.props.details.name} - ${this.props.details.cost}</p>
        );
    }
}

export default Specials;