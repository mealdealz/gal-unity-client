import React from 'react';
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';
import Deals from './Deals.js'
import { Form, Button, Modal } from 'semantic-ui-react';

class AddDealForm extends React.Component {

  state = {
    "restaurantName": "",
    "restaurantSite": "",
    "restaurantPhone": "",
    "restaurantAddress": "",
    "restaurantLocation": [],
    "restaurantSpecials": [{
      "specialCategory": "",
      "specialDays":  [],
      "startTime": "",
      "endTime": "",
      "deals": [{"dealName": "",
        "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""}]
    }]
  }

  resetForm = () => {
    this.setState(
      {
    "restaurantName": "",
    "restaurantSite": "",
    "restaurantPhone": "",
    "restaurantAddress": "",
    "restaurantLocation": [],
    "restaurantSpecials": [{
      "specialCategory": "",
      "specialDays":  [],
      "startTime": "",
      "endTime": "",
      "deals": [{"dealName": "",
        "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""}]
    }]
  }
    )
  }

  handleChange = (event) => {
    this.setState(
      { [event.target.name]: event.target.value }
    )
    console.log(this.state)
  }

  handleChangeDeal = dealIndex => (event) => {
    const { specials } = this.state
    const { deals } = specials
    let deal = deals[dealIndex] || {}
    const changedDeal = { [event.target.name]: event.target.value }
    console.log('changedDeal', changedDeal)

    deal = Object.assign(deal, changedDeal)
    this.setState(this.state)
  }

  // onFormSubmit = (event) => {
  //   event.preventDefault()
  //   this.props.ListingSubmitted(this.state)
  //   this.resetForm()
  // }

   onFormSubmit = (event) => {
    console.log('submitted', this.state)
    event.preventDefault()
    const url = ''
    const postData ={
    "restaurantName": this.state.restaurantName,
    "restaurantSite": this.state.restaurantSite,
    "restaurantPhone": this.state.restaurantPhone,
    "restaurantAddress": this.state.restaurantAddress,
    "restaurantLocation": [],
    "restaurantSpecials": [{
      "specialCategory": this.state.specialCategory,
      "specialDays":  [],
      "startTime": this.state.startTime,
      "endTime": this.state.endTime,
      "deals": [{"dealName": this.state.dealName,
        "dealPrice": this.state.dealPrice},
        {"dealName": this.state.dealName,
          "dealPrice": this.state.dealPrice},
        {"dealName": this.state.dealName,
          "dealPrice": this.state.dealPrice},
        {"dealName": this.state.dealName,
          "dealPrice": this.state.dealPrice}]
    }]
  }

    console.log(postData)
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(postData),
    })
    .then(response => response.json())
      this.setState(
      {
    "restaurantName": "",
    "restaurantSite": "",
    "restaurantPhone": "",
    "restaurantAddress": "",
    "restaurantLocation": [],
    "restaurantSpecials": [{
      "special_id": "",
      "specialCategory": "",
      "specialDays":  [false, false, false, false, false, false, false, ],
      "startTime": "",
      "endTime": "",
      "deals": [{"dealName": "",
        "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""},
        {"dealName": "",
          "dealPrice": ""},
        {"dealName":"",
          "dealPrice":""}]
    }]
  }
    )
   }

  dateArrayFucntion() {
    const dateArray = ['S', 'M', 'T', 'W', 'Th', 'F', 'S']

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
                {}
                <Form.Input placeholder='Restaurant Name' name="restaurantName" value={this.state.restaurantName} onChange={this.handleChange} />
                <Form.Input placeholder='Address' name="restaurantAddress" value={this.state.restaurantAddress} onChange={this.handleChange} />
                <Form.Input placeholder='Phone Number' name="restaurantPhone" value={this.state.restaurantPhone} onChange={this.handleChange}/>
                <Form.Input placeholder='Website' name="restaurantSite" value={this.state.restuarantSite} onChange={this.handleChange} />

                {/* <Form.Input placeholder='dealName' value={this.state.dealName} onChange={this.handleChangeDeal(3)} /> */}
              </Form.Field>
              <Form.Field>
              <label>Days of Special</label>
                <Form.Group inline widths='equal'>
                  <Form.Checkbox   />
                    {Object.keys(this.state.restaurantSpecials.specialDays).map(key => <Form.Checkbox
                        key={key}
                    details={this.state.listings[key]}
                    name="specialDays"
                    value={this.state.restaurantSpecials.specialDays}
                    onChange={this.handleChange}
                    inline label={}
                    />)}
                </Form.Group>
                <Form.Group inline widths='equal'>
                <Form.Field label='Timeframe' control='select' value={this.state.restaurantSpecials[0].category} onChange={this.handleChange}>
                  <option value='Happy Hour'>Happy Hour</option>
                  <option value='lunch'>Lunch</option>
                  <option value='dinner'>Dinner</option>
                </Form.Field>
                </Form.Group>
                {/* <Form.Input placeholder='dealName' value={this.state.dealName} onChange={this.handleChangeDeal(3)} />
                <Form.Input placeholder='dealPrice' value={this.state.dealPrice} onChange={this.handleChangeDeal(3)} />
                <Form.Input placeholder='dealName' value={this.state.dealName} onChange={this.handleChangeDeal(3)} />
                <Form.Input placeholder='dealPrice' value={this.state.dealName} onChange={this.handleChangeDeal(3)} />
                <Form.Input placeholder='dealName' value={this.state.dealName} onChange={this.handleChangeDeal(3)} />
                <Form.Input placeholder='dealPrice' value={this.state.dealPrice} onChange={this.handleChangeDeal(3)} /> */}
                <Button type='submit'>Submit</Button>
              </Form.Field>
              </Form.Group>
                {/* {Object.keys(this.state.listings).map(key => <Deals
                  key={key}
                  details={this.state.listings[key]}
              />)} */}
         </Form>
        </Modal>
      </div>
    );
  }
}


export default AddDealForm;
