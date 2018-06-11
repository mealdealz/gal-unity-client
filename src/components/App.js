import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Deals from './Deals';
import TimeFilter from './TimeFilter';

class App extends React.Component {
    render() {
        return(
            <div>
                <head>
                    <head>
                        <link href='https://api.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css' rel='stylesheet' />
                    </head>
                </head>
            <Header src="images/mealDealzLogo.png"/>
              <TimeFilter/>
              <Deals />
            <Footer />
          </div>
        )
    }
}

export default App;