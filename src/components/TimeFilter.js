import React from 'react';
import { Card, Icon, Image } from 'semantic-ui-react'

class TimeFilter extends React.Component {

    filterTime = () => {
        console.log("Button works");
    };

    render() {
      return (
          <div className="appBackgroundColor">
          <Card.Group className="styledCards" itemsPerRow='3' centered={true}>
          <Card>
            <Image src="images/barbecue-bbq-delicious-3690.jpg" />
            <Card.Content >
              <Card.Header textAlign='center'>Happy Hour</Card.Header>
            </Card.Content>
          </Card>
          <Card>
            <Image src="images/barbecue-bbq-delicious-3690.jpg" />
            <Card.Content >
              <Card.Header textAlign='center'>Lunch </Card.Header>
            </Card.Content>
          </Card>
          <Card>
            <Image src="images/barbecue-bbq-delicious-3690.jpg" />
            <Card.Content >
              <Card.Header textAlign='center'>Dinner</Card.Header>
            </Card.Content>
          </Card>
          </Card.Group>
          </div>

        )
    }
}

export default TimeFilter;
