import React from 'react';
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';
import { Form, Button, Modal } from 'semantic-ui-react';

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
             <Form.Group widths='equal'>
              <Form.Field>
                <Form.Input placeholder='Restaurant Name' />
                <Form.Input placeholder='Address' />
                <Form.Input placeholder='Phone Number' />
                <Form.Input placeholder='Website' />
              </Form.Field>
              <Form.Field>
              <label>Days of Special</label>
                <Form.Group inline widths='equal'>
                  <Form.Checkbox inline label='M'/>
                  <Form.Checkbox inline label='T'/>
                  <Form.Checkbox inline label='W'/>
                  <Form.Checkbox inline label='Th'/>
                  <Form.Checkbox inline label='F'/>
                  <Form.Checkbox inline label='Sat'/>
                  <Form.Checkbox inline label='Sun'/>
                </Form.Group>
                <Form.Group inline widths='equal'>
                <Form.Field label='Timeframe' control='select'>
                  <option value='Happy Hour'>Happy Hour</option>
                  <option value='lunch'>Lunch</option>
                  <option value='dinner'>Dinner</option>
                </Form.Field>
                </Form.Group>
                <Form.Field placeholder='Special' control='textarea' rows='3' />
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
