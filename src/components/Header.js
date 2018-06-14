import React from 'react'
import AddDealForm from './AddDealForm';
import {Button} from 'semantic-ui-react';

class Header extends React.Component{
  render() {
    return (
        <div>
          <div className="banner appBackgroundColor">
              <img className="logo" alt="Meal Dealz Logo" src={this.props.src}/>
              <AddDealForm  listingSubmitted={this.props.listingSubmitted} />
          </div>

        </div>
  )
}
}

export default Header;
