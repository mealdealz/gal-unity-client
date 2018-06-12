import React from 'react';
import Map from './Map';
import { Grid, Card, Button } from 'semantic-ui-react';


class Deals extends React.Component {
    render() {
        console.table(this.props.details);
        return (
            <div>
                <Card.Group centered={true}>
                <Card>
                    <Card.Content>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column width={10}>
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
                                <Grid.Column width={30}>
                                    <Card.Description content={`Today's Specials: ${this.props.details.special}`}>
                                    </Card.Description>
                                </Grid.Column>
                                <Grid.Column width={40}>
                                    <div className="map-holder">
                                        <Map className="map" latlon={this.props.details.location}/>
                                        <div>
                                            <Button content="Delete" />
                                            <Button content="Submit" />
                                        </div>
                                    </div>
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

