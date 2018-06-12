import React from 'react'
import Form from './Form';
import ButtonExample from './ButtonExample';

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
          <div className="banner">
              <img className="logo" alt="Meal Dealz Logo" src={this.props.src}/>
            <button onClick={this.showAddForm}>Add Deal</button>
              <ButtonExample name="Jeff"/>
          </div>
            <div>
              <Form hidden={this.state.hidden} listingSubmitted={this.props.listingSubmitted} />
            </div>
        </div>
  )
}
}

export default Header
