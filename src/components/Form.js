import React from 'react'


class Form extends React.Component {

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
      <aside className="form-container"id="side-bar">
        <h3>Add a Deal</h3>
        <form className="form" onSubmit={this.onFormSubmit}>
          <label htmlFor="restaurant">Restaurant Name:</label>
          <input type="text" value={this.state.restaurant} name="restaurant" onChange={this.handleChange}/>
          <label htmlFor="days">Days:</label>
          <input type="text" value={this.state.days} name="days" onChange={this.handleChange}/>
          {/* <label htmlFor="time">Time of specials:</label>
          <input id="time" type="time" value={this.state.time} name="time" onChange={this.handleChange}/>
          <label htmlFor="time"> - </label>
          <input id="time2" type="time" value={this.state.time} name="time" onChange={this.handleChange}/> */}
          <fieldset>
            <label for="min">From</label>
            <input type="time" id="min" name="min" />
            <label for="max">To</label>
            <input type="time" id="max" name="max" />
          </fieldset>
          <label htmlFor="specials">Describe the Special Here:</label>
          <textarea name="specials" value={this.state.specials} onChange={this.handleChange} rows="8" cols="40"></textarea>
          <label htmlFor="site">Site:</label>
          <input type="text" value={this.state.site} name="site" onChange={this.handleChange}/>
          <label htmlFor="phone">Phone Number:</label>
          <input type="text" value={this.state.phone} name="phone" onChange={this.handleChange}/>
          <label htmlFor="location">Address:</label>
          <input type="text" value={this.state.location} name="location" onChange={this.handleChange} />
        </form>
      </aside>
    );
  }
}


export default Form;
