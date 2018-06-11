import React from 'react'
import Form from './Form';

class Header extends React.Component{
  render() {
    return (
        <div>
          <div className="header-top">
            <h1>Meal Dealz</h1>
            <button>Add Deal</button>
          </div>
            <div>
              <Form listingSubmitted={this.listingSubmitted} />
            </div>
          <div>
            <img alt="Meal Dealz Logo" src={this.props.src}/>
          </div>
        </div>
  )
}
}

export default Header
