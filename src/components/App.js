import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Deals from './Deals';
import TimeFilter from './TimeFilter';


class App extends React.Component {
  constructor() {
    super()
    this.state = {
        listings: []
    }
  }

    componentDidMount() {
        fetch('./mapTesting.json')
            .then(response => response.json())
            .then(listings => {this.setState({listings})
            })
    }

  listingSubmitted = (deal) => {
      this.setState({
        listings: this.state.listings.concat(deal).reverse()
      })
    };

    filterTime = (className) => {
        console.log(className);
    };

    render() {

        return(
            <div>
            <head>
                <link href='https://api.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css' rel='stylesheet' />
            </head>
            <Header listingSubmitted={this.listingSubmitted} src="images/LOGO.jpg"/>
            <main>
              <TimeFilter filterTime={this.filterTime}/>
                    {Object.keys(this.state.listings).map(key => <Deals
                        key={key}
                        details={this.state.listings[key]}
                    />)}
            </main>
            <Footer />
          </div>
        )
    }
}

export default App;
