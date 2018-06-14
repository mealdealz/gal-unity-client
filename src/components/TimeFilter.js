import React from 'react';
import TimeFilterButton from './TimeFilterButton';
import { Card } from 'semantic-ui-react';

class TimeFilter extends React.Component {



    render() {
      return (
          <div className="appBackgroundColor">
          <Card.Group className="styledCards" itemsPerRow='3' centered={true}>
            <TimeFilterButton className="Lunch" src="images/barbecue-bbq-delicious-3690.jpg" filterTime={this.props.filterTime}/>
            <TimeFilterButton className="Happy Hour" src="images/barbecue-bbq-delicious-3690.jpg" filterTime={this.props.filterTime}/>
            <TimeFilterButton className="Dinner" src="images/barbecue-bbq-delicious-3690.jpg" filterTime={this.props.filterTime}/>
          </Card.Group>
          </div>

        )
    }
}

export default TimeFilter;
