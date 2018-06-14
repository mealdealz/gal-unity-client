import React from 'react';
import { Grid, Card, Segment, Header } from 'semantic-ui-react';
import Map from './Map';
import LeftColumn from './LeftColumn';
import RightColumn from './RightColumn';

class Deals extends React.Component {
    render() {

        return (
            <div className="appBackgroundColor">
                <Card.Group className="dealsCards" centered={true}>
                    <Card fluid>
                    <Card.Content>
                        <Grid columns="equal">
                            <Grid.Row divided stretched>
                                <Grid.Column>
                                        <Header as='h2' textAlign='center'>{this.props.details.restaurant}</Header>
                                    <LeftColumn details={this.props.details}/>
                                </Grid.Column>
                                <Grid.Column>
                                    {Object.keys(this.props.details.specials).map(key => <RightColumn
                                        key={key}
                                        details={this.props.details.specials[key]}
                                    />)}
                                </Grid.Column>
                                <Grid.Column style={{height: 300}}>
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
