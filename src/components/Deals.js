import React from 'react';
import { Grid, Card, Button } from 'semantic-ui-react';
import Map from './Map';

class Deals extends React.Component {
    render() {
        console.table(this.props.details);
        return (
            <div className="appBackgroundColor">
                <Card.Group className="dealsCards" centered={true}>
                    <Card fluid>
                    <Card.Content>
                        <Grid columns="equal">
                            <Grid.Row>
                                    <Grid.Column>
                                    <Card.Description content={`Restaurant: ${this.props.details.restaurant}`}>
                                    </Card.Description>
                                    <Card.Description content={`Phone: ${this.props.details.phone}`}>
                                    </Card.Description>
                                    <Card.Description content={`Website: ${this.props.details.site}`}>
                                    </Card.Description>
                                    <Card.Description content={`Days Open: ${this.props.details.day}`}>
                                    </Card.Description>
                                    <Card.Description content={`Hours: ${this.props.details.time}`}>
                                    </Card.Description>
                                </Grid.Column>
                                <Grid.Column>
                                    <Card.Description content={`Today's Special: ${this.props.details.special}`}>
                                    </Card.Description>
                                </Grid.Column>
                                <Grid.Column>
                                    <Map className="map" latlon={this.props.details.location}/>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </Card.Content>
                </Card>
                </Card.Group>
            </div>
        )
    }
}

export default Deals;