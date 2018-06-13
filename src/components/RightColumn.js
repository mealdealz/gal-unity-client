import React from 'react';
import Days from './Days';
import Specials from './Specials';

class RightColumn extends React.Component {
    render() {

        console.table(this.props.details.deals);

        return(
            <div>
                {Object.keys(this.props).map(key => <Days
                    key={key}
                    details={this.props[key]}
                />)}
                {Object.keys(this.props.details.deals).map(key => <Specials
                    key={key}
                    details={this.props.details.deals[key]}
                />)}
            </div>
        );
    }
}

export default RightColumn;