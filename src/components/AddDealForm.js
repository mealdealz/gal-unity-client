import React from 'react';
import { Form, Button, Input, Modal } from 'semantic-ui-react';

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
        <Modal trigger={<Button>Show Modal</Button>} centered={false}>
         <Form>
             <Form.Group unstackable widths='equal'>
              <Form.Field>
                <Form.Input placeholder='Restaurant Name' />
                <Form.Input placeholder='Address' />
                <Form.Input placeholder='Phone Number' />
                <Form.Input placeholder='Website' />
              </Form.Field>
              <Form.Field>
                <Form.Input placeholder='Address' />
                <Form.Input placeholder='Phone' />
                <Form.Checkbox label='I agree to the Terms and Conditions' />
                <Button type='submit'>Submit</Button>
              </Form.Field>
              </Form.Group>
         </Form>
        </Modal>
      </div>
    );
  }
}


export default AddDealForm;
