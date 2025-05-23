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
import { FormControl } from 'react-bootstrap';

export class InputTextArea extends Component {
    static defaultProps = {
        name: "",
        value: '',
        placeholder: "",
        onChange: null,
        disabled: false,
        rows: 4,
        className: ""
    };

    constructor(props){
        super(props);

        this.onChange = this.onChange.bind(this);
    }
    
    render() {       
        let main = <FormControl name={this.props.name} as="textarea" className={this.props.className}
                    value={this.props.value} placeholder={this.props.placeholder} onChange={this.onChange} 
                    disabled={this.props.disabled} rows={this.props.rows}/>
        return (main);
    }
 
    onChange(event){ 
        let data = {
            target:{
                name: this.props.name,
                value: event.target.value
            }
        }
        this.props.onChange(data);
    }   
}
