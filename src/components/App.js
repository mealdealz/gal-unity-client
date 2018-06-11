import React from 'react';
import Header from './Header';
import Footer from './Footer';

class App extends React.Component {
    render() {
        return(
          <div>
            <Header />
              <p>Sup?</p>
            <Footer />
          </div>
        )
    }
}

export default App;