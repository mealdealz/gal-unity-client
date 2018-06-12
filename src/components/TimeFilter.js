import React from 'react';

class TimeFilter extends React.Component {

    filterTime = () => {
        console.log("Button works");
    };

    render() {
        return(
        <div className="time-filter-buttons">
            <button onClick={this.filterTime}>Lunch</button>
            <button onClick={this.filterTime}>Happy Hour</button>
            <button onClick={this.filterTime}>Dinner</button>
        </div>
        )
    }
}

export default TimeFilter;