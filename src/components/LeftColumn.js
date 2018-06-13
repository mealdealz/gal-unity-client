import React from 'react';

class LeftColumn extends React.Component {
    render() {
        return(
            <div>
                <p><strong>Address: </strong>{this.props.details.address}</p>
                <p><strong>Website: </strong>{this.props.details.site}</p>
                <p><strong>Phone: </strong>{this.props.details.phone}</p>
            </div>
        );
    }
}

export default LeftColumn;