import React from 'react';

class Days extends React.Component {


    dayGiver = (days) => {

        console.log(days);

        let dayArray = [];

        console.log("dayArray = " + dayArray);

        for (let i = 0; i < days.length; i++) {
            if (days[i] !== false) {
                switch (i) {
                    case 0:
                        dayArray.push("Sun ");
                        break;
                    case 1:
                        dayArray.push("Mon ");
                        break;
                    case 2:
                        dayArray.push("Tues ");
                        break;
                    case 3:
                        dayArray.push("Wed ");
                        break;
                    case 4:
                        dayArray.push("Thur ");
                        break;
                    case 5:
                        dayArray.push("Fri ");
                        break;
                    case 6:
                        dayArray.push("Sat ");
                        break;
                    default:
                        return "You shouldn't be seeing this";
                        break;
                }
            }
        }

        return dayArray;
    };

    render() {

        let days = this.props.details.days;

        return(
            <div>
                <strong>{this.props.details.category}</strong>
                <p>Days: {this.dayGiver(days)}</p>
            </div>
        );
    }
}

export default Days;