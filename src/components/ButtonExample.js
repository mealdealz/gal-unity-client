import React from 'react'
import { Button } from 'semantic-ui-react'

class ButtonExample extends React.Component {
    render() {

        console.log(this.props.name);

        return(


        <Button className="ui button" >Click Here</Button>
        )
    }
}



export default ButtonExample