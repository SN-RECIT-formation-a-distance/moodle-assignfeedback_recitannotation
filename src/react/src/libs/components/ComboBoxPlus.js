import React, { Component } from 'react';
import Select from 'react-select'

export class ComboBoxPlus extends Component {
    static defaultProps = {        
        onChange: null,    
        value: "",
        name: "",
        disabled: false,
        multiple: false,
        required: false,
        isClearable: false,
        data: {},
        size: 1,
        placeholder: "",
        options: [],
        style: null,
        selectedIndex: -1
    };
    
    constructor(props){
        super(props);
        
        this.onChange = this.onChange.bind(this);
        this.focus = this.focus.bind(this);

        this.ref = React.createRef();
    }

    focus(){
        this.ref.current.focus();
    }
    
    render() { 
        let options = this.props.options;

        let selectedItem = null;
        let value = this.props.value || "";

        for (let o of options){
            //o.label = o.text;
            if (o.value.toString() === value.toString()){
                selectedItem = o;
            }
        }
        //  spread attributes <div {...this.props}>    
        let spreadAttr = {
            required: this.props.required, 
            isDisabled: this.props.disabled, 
            isClearable: this.props.isClearable,
            size: this.props.size, 
            style: this.props.style, 
            options: options
        };
        if (this.props.multiple){
            spreadAttr.isMulti = true;
        }

        let main = 
            <Select ref={this.ref} {...spreadAttr} onChange={this.onChange} value={selectedItem} placeholder={this.props.placeholder}>
            </Select>;            
        return (main);
    }   
    
    onChange(event){
        let value = "";
        let text = "";
        let data = null;

        if(event !== null){
            value = event.value;
            text = event.label;
            data = event.data;
        }   
        
        this.setState({value:value});
        
        if (this.props.multiple){
            value = event;
        }

        this.props.onChange({target:{name: this.props.name, value: value, text: text, data: data}});
    }   
}
