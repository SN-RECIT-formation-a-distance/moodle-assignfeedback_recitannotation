// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Atto HTML editor
 *
 * @package    atto_reciteditor
 * @copyright  2019 RECIT
 * @license    {@link http://www.gnu.org/licenses/gpl-3.0.html} GNU GPL v3 or later
 */

import React, { Component } from 'react';
import { Form, Button } from 'react-bootstrap';
import { faRemoveFormat } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export class InputColor extends Component {
    static defaultProps = {
        name: "",
        value: '#000000',
        onChange: null,
        disabled: false,
        size: "",
        className: "",
        showRemoveFormat: true
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
        this.onReset = this.onReset.bind(this);
        this.onBlur = this.onBlur.bind(this);

        this.state = {value:this.props.value};
    }
    
    RGBToHex(rgb) {
        rgb = rgb || "rgb(0,0,0)";

        let regex = new RegExp(/^rgb[(](?:\s*0*(?:\d\d?(?:\.\d+)?(?:\s*%)?|\.\d+\s*%|100(?:\.0*)?\s*%|(?:1\d\d|2[0-4]\d|25[0-5])(?:\.\d+)?)\s*(?:,(?![)])|(?=[)]))){3}[)]$/gm);

        // not an RGB
        if(!regex.test(rgb)){ 
            return rgb; 
        }

        // Choose correct separator
        let sep = rgb.indexOf(",") > -1 ? "," : " ";
        // Turn "rgb(r,g,b)" into [r,g,b]
        rgb = rgb.substr(4).split(")")[0].split(sep);
      
        
        // Convert %s to 0–255
        for (let R in rgb) {
            let r = rgb[R];
            if (r.indexOf("%") > -1)
            rgb[R] = Math.round(r.substr(0,r.length - 1) / 100 * 255);
            /* Example:
            75% -> 191
            75/100 = 0.75, * 255 = 191.25 -> 191
            */
        }

        let r = (+rgb[0]).toString(16),
            g = (+rgb[1]).toString(16),
            b = (+rgb[2]).toString(16);
      
        if (r.length === 1)
          r = "0" + r;
        if (g.length === 1)
          g = "0" + g;
        if (b.length === 1)
          b = "0" + b;
      
        /*
            Now we can supply values like either of these:
            rgb(255,25,2)
            rgb(255 25 2)
            rgb(50%,30%,10%)
            rgb(50% 30% 10%)
        */
        return "#" + r + g + b;
    }

    render() {       
        let value = this.RGBToHex(this.state.value);

        let main = 
            <div style={{display: "inline-flex", width: '100%'}} className={this.props.className}>
                <Form.Control className='w-100' size={this.props.size} name={this.props.name} type="color" value={value} 
                                onChange={this.onChange} onBlur={this.onBlur} disabled={this.props.disabled} style={{width: "80px"}}/>
                {this.props.showRemoveFormat && <Button className="ml-1" size='sm' variant={'link'} onClick={this.onReset} title={"Enlever format"}><FontAwesomeIcon icon={faRemoveFormat}/></Button>}
            </div>
        return (main);
    }   
    
    onChange(event){ 
        let eventData = {
            target: {name: this.props.name, value: event.target.value}
        };

        this.setState({value:event.target.value});

        if (this.props.onChange){
            this.props.onChange(eventData);
        }
    }
    
    onBlur(event){ 
        let eventData = {
            target: {name: this.props.name, value: this.state.value}
        };

        if (this.props.onBlur){
            this.props.onBlur(eventData);
        }
    }

    onReset(){
        let eventData = {
            target: {name: this.props.name, value: ''}
        };

        this.setState({value:''});

        if (this.props.onChange){
            this.props.onChange(eventData);
        }

        if (this.props.onBlur){ // Fire onBlur too as it's a button, it'll never get fired
            this.props.onBlur(eventData);
        }
    }
}
