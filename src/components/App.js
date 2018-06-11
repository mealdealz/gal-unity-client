import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Deals from './Deals';
import TimeFilter from './TimeFilter';


class App extends React.Component {
  // constructor() {
  //   super()
  //   this.state = {
  //     listings: []
  //   }
  // }

  // componentDidMount() {
  //   fetch('./listings.json')
  //   .then(response => response.json())
  //   .then(response => {
  //     this.setState({listings: response})
  //   })
  // }

  // listingSubmitted = (deal) => {
  //     this.setState({
  //       listings: this.state.listings.concat(deal).reverse()
  //     })
  //   }

    render() {
        return(
            <div>
            <head>
                <link href='https://api.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css' rel='stylesheet' />
            </head>
            <Header listingSubmitted={this.listingSubmitted} src="images/mealDealzLogo.png"/>
            <main>
              <TimeFilter/>
              <Deals />
            </main>
            <Footer />
          </div>
        )
    }
}

export default App;
