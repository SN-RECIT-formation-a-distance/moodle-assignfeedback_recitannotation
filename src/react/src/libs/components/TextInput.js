
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
import { Form } from 'react-bootstrap';

export class TextInput extends Component{
    static defaultProps = {        
        onChange: null,
        disabled: false,
        name: '',
        className: '',
        style: null,
        placeholder: '',
        value: '',
        onBlur: null,
        type: '',
        as: '',
        rows: null,
        max: 0,
        required: false,
        size: ''
    };

    render(){
        let spreadAttr = {required: this.props.required};
        if (this.props.max > 0){
            spreadAttr.maxLength = this.props.max;
        }
        let input = <Form.Control className={`${this.props.className}`} style={this.props.style} {...spreadAttr} disabled={this.props.disabled}
                type={this.props.type} placeholder={this.props.placeholder} value={this.props.value} 
                onBlur={this.props.onBlur} name={this.props.name} onChange={this.props.onChange} />;

        return input;
    }
}
