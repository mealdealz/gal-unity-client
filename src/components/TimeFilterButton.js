import React from 'react';
import { Card, Image } from 'semantic-ui-react';

class TimeFilterButton extends React.Component {
    render() {
        return(
            <Card onClick={() => this.props.filterTime(this.props.className)}>
                <Image src={this.props.src} />
                <Card.Content >
                    <Card.Header textAlign='center'>{this.props.className}</Card.Header>
                </Card.Content>
            </Card>
        );
    }
}

export default TimeFilterButton;