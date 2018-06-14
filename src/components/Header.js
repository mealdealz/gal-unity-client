import React from 'react'
import AddDealForm from './AddDealForm';
import {Button, Menu, Image } from 'semantic-ui-react';

class Header extends React.Component{

    state = {}

    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    render() {
      const { activeItem } = this.state

      return (
        <Menu unstackable borderless>
          <Menu.Item className="appBackgroundColor">
            <Image size='small' alt="Meal Dealz Logo" src={this.props.src}/>
          </Menu.Item>

          <Menu.Item position='right' >
            <AddDealForm  listingSubmitted={this.props.listingSubmitted} />
          </Menu.Item>
        </Menu>
      )
    }
}

export default Header;
