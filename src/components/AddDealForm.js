import React from 'react';
import { Form, Button, Input } from 'semantic-ui-react';

class AddDealForm extends React.Component {

  state = {
    "id": "",
    "restaurant": "",
    "days": "",
    "time": "",
    "specials": "",
    "site": "",
    "phone": "",
    "location": "",
    "image": ""
  }

  resetForm = () => {
    this.setState(
      {
        "id": "",
        "restaurant": "",
        "days": "",
        "time": "",
        "specials": "",
        "site": "",
        "phone": "",
        "location": "",
        "image": ""
      }
    )
  }

  handleChange = (event) => {
    this.setState(
      {[event.target.name]: event.target.value}
    )
  }

  onFormSubmit = (event) => {
    event.preventDefault()
    this.props.ListingSubmitted(this.state)
    this.resetForm()
  }

  render() {
    return (
      <div>
         <Form>
            <Form.Group unstackable widths={1}>
              <Form.Input placeholder='Restaurants' />
              <Form.Input placeholder='Address' />
              <Form.Input placeholder='Phone Number' />
              <Form.Input placeholder='Website' />
            </Form.Group>
            <Form.Group widths={2}>
              <Form.Input label='Address' placeholder='Address' />
              <Form.Input label='Phone' placeholder='Phone' />
            </Form.Group>
            <Form.Checkbox label='I agree to the Terms and Conditions' />
            <Button type='submit'>Submit</Button>
        </Form>
      </div>
    );
  }
}


export default Form;
