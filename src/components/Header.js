import React from 'react'

class Header extends React.Component{
  render() {
    return (
        <div>
          <div className="header-top">
            <h1>Meal Dealz</h1>
            <button>Add Deal</button>
          </div>
            <div>
              <p>Future home of drop down to add</p>
            </div>
          <div>
            <img alt="Meal Dealz Logo" src={this.props.src}/>
          </div>
        </div>
  )
}
}

export default Header