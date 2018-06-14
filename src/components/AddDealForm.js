import React from 'react';
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';
import Deals from './Deals.js'
import { Form, Button, Modal } from 'semantic-ui-react';

class AddDealForm extends React.Component {

  state = {
    "id": "",
    "restaurant": "",
    "site": "",
    "phone": "",
    "address": "",
    "location": [],
    "specials": [{
      "special_id": "",
      "category": "",
      "days":  [],
      "start_time": "",
      "end_time": "",
      "deals": [{"name": "",
        "cost": ""},
        {"name": "",
          "cost": ""},
        {"name": "",
          "cost": ""},
        {"name":"",
          "cost":""}]
    }]
  }

  resetForm = () => {
    this.setState(
      {
        "id": "",
        "restaurant": "",
        "site": "",
        "phone": "",
        "address": "",
        "location": [],
        "specials": [{
          "special_id": "",
          "category": "",
          "days":  [],
          "start_time": "",
          "end_time": "",
          "deals": [{"name": "",
            "cost": ""},
            {"name": "",
              "cost": ""},
            {"name": "",
              "cost": ""},
            {"name":"",
              "cost":""}]
      }]}
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
        <Modal trigger={<Button>Add a deal</Button>} centered={false}>
         <Form onSubmit={this.onFormSubmit}>
             <Form.Group widths='equal'>
              <Form.Field>
                <Form.Input placeholder='Restaurant Name' value={this.state.restaurant} onChange={this.handleChange} />
                <Form.Input placeholder='Address' value={this.state.address} onChange={this.handleChange} />
                <Form.Input placeholder='Phone Number' value={this.state.phone} onChange={this.handleChange}/>
                <Form.Input placeholder='Website' value={this.state.site} onChange={this.handleChange} />
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
                <Form.Field label='Timeframe' control='select' value={this.state.specials[0].category} onChange={this.handleChange}>
                  <option value='Happy Hour'>Happy Hour</option>
                  <option value='lunch'>Lunch</option>
                  <option value='dinner'>Dinner</option>
                </Form.Field>
                </Form.Group>
                <Form.Field placeholder='Special' control='textarea' rows='3' />
                <Button type='submit'>Submit</Button>
              </Form.Field>
              </Form.Group>
                {Object.keys(this.state.listings).map(key => <Deals
                  key={key}
                  details={this.state.listings[key]}
              />)}
         </Form>
        </Modal>
      </div>
    );
  }
}


export default AddDealForm;
