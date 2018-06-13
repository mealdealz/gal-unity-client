import React from 'react';
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';
import { Form, Button, Input, Checkbox, Modal } from 'semantic-ui-react';

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
    const format = 'h:mm a';

    const now = moment().hour(0).minute(0);

    function onChange(value) {
      console.log(value && value.format(format));
    }
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
                <Form.Group>
                  <Form.Checkbox inline label='M' required />
                  <Form.Checkbox inline label='T' required />
                  <Form.Checkbox inline label='W' required />
                  <Form.Checkbox inline label='Th' required />
                  <Form.Checkbox inline label='F' required />
                  <Form.Checkbox inline label='Sat' required />
                  <Form.Checkbox inline label='Sun' required />
                </Form.Group>
                <TimePicker name="Start Time" showSecond={false} defaultValue={now} className="xxx" onChange={onChange} format={format} use12Hours inputReadOnly />
                <TimePicker name="End Time" showSecond={false} defaultValue={now} className="xxx" onChange={onChange} format={format} use12Hours inputReadOnly />
                <Form.Input placeholder='Special' />
                <Form.Input placeholder='' />
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
