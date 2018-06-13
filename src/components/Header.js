import React from 'react'
import AddDealForm from './AddDealForm';
import {Button, Form} from 'semantic-ui-react';

class Header extends React.Component{

    state={
        hidden: true
    }


    showAddForm = (event) => {
        if (this.state.hidden === true) {
            this.setState({
                "hidden": false
            });
        } else {
            this.setState({
                "hidden": true
            });
        }
    };

  render() {
    return (
        <div>
          <div className="banner appBackgroundColor">
              <img className="logo" alt="Meal Dealz Logo" src={this.props.src}/>
            <Button onClick={this.showAddForm} className="clickHere" content='Add Deal' />
          </div>
            <div>
              <Form hidden={this.state.hidden} listingSubmitted={this.props.listingSubmitted} />
            </div>
        </div>
  )
}
}

export default Header
