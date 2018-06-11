import React from 'react'


class Form extends React.Component {

  state = {
      "id": "",
      "restaurant": "",
      "special": "",
      "website": "",
      "phone": "",
      "location": "",
      "image": ""
    }

  resetForm = () => {
    this.setState(
      {
        "id": "",
        "restaurant": "",
        "special": "",
        "website": "",
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
      <aside id="side-bar">
        <h3>Add a Deal</h3>
        <form className="job-form" onSubmit={this.onFormSubmit}>
          <label htmlFor="restaurant">Restaurant Name</label>
          <input type="text" value={this.state.restaurant} name="restaurant" onChange={this.handleChange}
            />
          <label htmlFor="website">Website</label>
          <input type="text" value={this.state.website} name="website" onChange={this.handleChange}
            />
          <label htmlFor="location">Address</label>
          <input type="text" value={this.state.location} name="location" onChange={this.handleChange}
            />
          <label htmlFor="phone">Phone Number</label>
          <input type="text" value={this.state.phone} name="phone" onChange={this.handleChange}
            />
          <label htmlFor="image">Pics?</label>
          <input type="text" value={this.state.image} name="image" onChange={this.handleChange}
            />
          <label htmlFor="special">Describe the Special Here</label>
          <textarea name="special" value={this.state.special} onChange={this.handleChange}
            rows="8" cols="40"></textarea>
          <input type="submit" name="submit" value="Submit" />
        </form>
      </aside>
    );
  }
}


export default Form;
