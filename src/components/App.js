import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Deals from './Deals';
import TimeFilter from './TimeFilter';

class App extends React.Component {
    render() {
        return(
          <div>
            <Header src="images/mealDealzLogo.png"/>
              <TimeFilter/>
              <Deals />
            <Footer />
          </div>
        )
    }
}

export default App;