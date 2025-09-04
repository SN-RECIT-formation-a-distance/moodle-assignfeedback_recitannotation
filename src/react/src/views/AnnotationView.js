
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Col, Form, Modal, Row, Table} from 'react-bootstrap';
import { faArrowRight, faBroom, faChalkboard, faCog, faComment, faRedo, faSave, faTimes, faTrash, faUndo} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputTextArea } from '../libs/components/InputTextArea';
import {ComboBoxPlus, ToggleButtons} from '../libs/components/Components';
import { $glVars } from '../common/common';
import Utils, { JsNx, UtilsString } from '../libs/utils/Utils';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min'; // includes tooltip

export class AnnotationView extends Component {
    static defaultProps = {
        onChangeView: null,
        criteriaList: [],
        commentList: []
    };

    static currentRange = null;
    static selectedElement = null;

    constructor(props) {
        super(props);

        this.onMouseUp = this.onMouseUp.bind(this);
        this.positionFloatingButton = this.positionFloatingButton.bind(this);
        this.onAnnotate = this.onAnnotate.bind(this);
        this.onAskIA = this.onAskIA.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onClose = this.onClose.bind(this);
        this.updateCounters = this.updateCounters.bind(this);
        this.save = this.save.bind(this);        
        this.getData = this.getData.bind(this);
        this.setAnnotationText = this.setAnnotationText.bind(this);

        this.onUndo = this.onUndo.bind(this);
        this.onRedo = this.onRedo.bind(this);
        this.cancelDataChange = this.cancelDataChange.bind(this);
        this.beforeDataChange = this.beforeDataChange.bind(this);
        this.onCleanHtml = this.onCleanHtml.bind(this);
        this.refresh = this.refresh.bind(this);

        this.state = {
            showModalAnnotate: false,
            showModalAskIA: false,
            data: null,
            counter: {},
            updatedCounters: false,
            stack: {
                undo: [],
                redo: []
            }
        };

        this.refAnnotation = React.createRef();
        this.refFloatingMenu = React.createRef();
    }

    componentDidMount(){
        this.getData();
    }
    
    componentDidUpdate(prevProps){
        if((prevProps.criteriaList.length !== this.props.criteriaList.length) || (!this.state.updatedCounters)){
            this.updateCounters();
        }
    }

    getData(){
        let that = this;

         let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            
            that.setState({data: result.data}, () => {
                that.setAnnotationText(result.data.annotation);
            }); 
        }
        
        $glVars.webApi.getAnnotationFormKit($glVars.moodleData.assignment, $glVars.moodleData.userid, callback);
    }

    setAnnotationText(value){
        this.refAnnotation.current.innerHTML = value;

        // Gérer le double-clic sur le texte surligné
        let elements = this.refAnnotation.current.querySelectorAll(`[data-criterion]`);
        for(let el of elements){
            el.addEventListener('click', this.onClick);  
        }
    }

    render() {
        if(this.state.data === null){ return null;}

        let criteriaList = this.props.criteriaList;
        let commentList = this.props.commentList;

        let main =
            <div className="container">
                <Row className='p-3 main-view'>
                    <Col md={8}>
                        <div className='d-flex'>
                            <span className='h5 mb-0 mr-3'>{$glVars.i18n.student_production}</span>
                            <div>
                                <ButtonGroup className='mr-2'>
                                    <Button size='sm' onClick={this.onUndo} title={$glVars.i18n.undo} disabled={(this.state.stack.undo.length === 0)}>
                                        <FontAwesomeIcon icon={faUndo}/>
                                    </Button>
                                    <Button size='sm' onClick={this.onRedo} title={$glVars.i18n.redo} disabled={(this.state.stack.redo.length === 0)}>
                                        <FontAwesomeIcon icon={faRedo}/>
                                    </Button>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <Button size='sm' onClick={this.onCleanHtml} title={$glVars.i18n.clean_student_production}>
                                        <FontAwesomeIcon icon={faBroom}/>
                                    </Button>
                                </ButtonGroup>
                            </div>
                            
                        </div>
                        <div ref={this.refAnnotation} onMouseUp={this.onMouseUp} className='p-3'></div>

                        <ButtonGroup ref={this.refFloatingMenu} className='floating-menu'>
                            <Button size='sm' onClick={this.onAnnotate}>
                                <FontAwesomeIcon icon={faComment}/>{` ${$glVars.i18n.annotate}`}
                            </Button>
                            <Button size='sm' onClick={this.onAskIA} disabled={!$glVars.moodleData.aiApi}>
                                <FontAwesomeIcon icon={faChalkboard}/>{` ${$glVars.i18n.ask_ai}`}
                            </Button>
                        </ButtonGroup>
                        
                    </Col>
                    <Col md={4} >
                        <div className='d-flex align-items-baseline'>
                            <span className='h5'>{$glVars.i18n.occurrences}</span>
                            <Button size='sm' variant='link' className='ml-1' onClick={() => this.props.onChangeView('settings')}>
                                <FontAwesomeIcon icon={faCog}/>
                            </Button>
                        </div>

                        <Table striped bordered size='sm'>
                            <thead>
                                <tr>
                                    <th>{$glVars.i18n.criterion}</th>
                                    <th>{$glVars.i18n.count}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {criteriaList.map((item, index) => {
                                    let row = 
                                        <tr key={index}>
                                            <td style={{backgroundColor: item.backgroundcolor}}>{item.description}</td>
                                            <td>{(this.state.counter.hasOwnProperty(item.name) ? this.state.counter[item.name] : 0)}</td>
                                        </tr>;
                                    return row;
                                })}
                            </tbody>
                        </Table>
                    </Col>
                    {this.state.showModalAnnotate && <ModalAnnotateForm onClose={this.onClose} onClick={this.onClick} 
                                criteriaList={criteriaList} commentList={commentList}/>}
                    
                    {this.state.showModalAskIA && <ModalAskIA onClose={this.onClose}/>}
                </Row>
            </div>;

        return (main);
    }

    onMouseUp(event){
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0) {
            AnnotationView.currentRange = selection.getRangeAt(0);
            this.positionFloatingButton(AnnotationView.currentRange);
        } else {
            AnnotationView.currentRange = null;
            this.positionFloatingButton(null); // Hide button
        }
    }

    onAnnotate(event){
        if (AnnotationView.currentRange) {
            this.setState({showModalAnnotate: true});// Open modal for a new comment
            this.beforeDataChange();
        }
    }

    onAskIA(event){
        if (AnnotationView.currentRange) {
            this.setState({showModalAskIA: true});
        }
    }

    onClose(refresh){
        this.positionFloatingButton(null);
        this.setState({showModalAnnotate: false, showModalAskIA: false});

        AnnotationView.currentRange = null;
        AnnotationView.selectedElement = null;
        
        if(refresh){            
            this.save();
        }
        else{
            this.cancelDataChange();
        }
    }

    refresh(){
        this.initTooltips();
        this.updateCounters();
    }

    updateCounters(){
        let counter = this.state.counter;
        let criteriaList = this.props.criteriaList;
        
        for(let item of criteriaList){
            let elements = window.document.querySelectorAll(`[data-criterion="${item.name}"]`);
            counter[item.name] = elements.length;
        }

        this.setState({counter: counter, updatedCounters: true});
    }   

    initTooltips() {
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover',
            placement: 'auto' // Ajout de la position automatique
        }); 
    }

    onClick(event){
        event.preventDefault(); // Empêche d'autres actions de clic
        AnnotationView.selectedElement = event.target; // 'this' est l'élément sur lequel le clic-droit a été fait
        this.setState({showModalAnnotate: true});
        this.beforeDataChange();
    }

    // Function to position and show the floating button
    positionFloatingButton(range) {
        let floatingMenu = this.refFloatingMenu.current;

        if (range && range.toString().length > 0) { //Ensure that something is selected
            const rect = range.getBoundingClientRect();
            // Adjust the positioning here to move the button further away

            //get position of eleve-text
            const eleveTextRect = this.refAnnotation.current.getBoundingClientRect();
            
            floatingMenu.style.top = (rect.bottom + window.scrollY - eleveTextRect.top + 10) + 'px'; // Below the selection
            floatingMenu.style.left = (rect.right + window.scrollX - eleveTextRect.left + 10) + 'px'; // A bit to the right
            floatingMenu.style.display = 'inline-flex';
        } else {
            floatingMenu.style.display = 'none';
        }
    }

    beforeDataChange(){
        let stack = this.state.stack;
        stack.undo.push(this.refAnnotation.current.innerHTML);
        stack.redo = []; // Clear redo stack on new input
        this.setState({stack: stack});
    }

    cancelDataChange(){
        let stack = this.state.stack;
        stack.undo.pop(); // remove element previously added because there was not any modification
        this.setState({stack: stack});
    }

    save(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 2);
                let data = that.state.data;
                data.id = result.data;                
                that.setState({data: data}, that.refresh);
                return; 
            }
        } 
        
        let data = {};
        Object.assign(data, this.state.data);
        data.annotation = this.refAnnotation.current.innerHTML;
        data.occurrences = {}; // force new object
        Object.assign(data.occurrences, this.state.counter);

        $glVars.webApi.saveAnnotation(data, $glVars.moodleData.assignment, callback);
    }

    onUndo(){
        let stack = this.state.stack;
    
        if (stack.undo.length > 0) {
            if (stack.redo.length > 25) {
                stack.redo.shift(); // Remove the oldest state
            }
            stack.redo.push(this.refAnnotation.current.innerHTML);
            this.setAnnotationText(stack.undo.pop());
            this.setState({stack: stack}, this.save);
        }
    }

    onRedo(){
        let stack = this.state.stack;
        if (stack.redo.length > 0) {
            if (stack.undo.length > 25) {
                stack.undo.shift(); // Remove the oldest state
            }
            stack.undo.push(this.refAnnotation.current.innerHTML);
            this.setAnnotationText(stack.redo.pop());
            this.setState({stack: stack}, this.save);
        }
    }

    onCleanHtml(){
        if(window.confirm($glVars.i18n.msg_confirm_clean_html_code)){
            this.beforeDataChange();
            this.setAnnotationText(Utils.cleanHTML(this.refAnnotation.current.innerHTML));
            this.save();
        }
    }
}

class ModalAnnotateForm extends Component{
    static defaultProps = {        
        onClose: null,
        onClick: null,
        criteriaList: [],
        commentList: []
    };

    constructor(props){
        super(props);

        this.onDelete = this.onDelete.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            data: {},
            dropdownList: {
                criteriaList: []
            },
            isNewNote: true
        };

        this.originalData = {criterion: "", comment: "", search: null};
        
        Object.assign(this.state.data, this.originalData);

        for(let item of props.criteriaList){
            this.state.dropdownList.criteriaList.push({value: item.name, label: item.description});
        }
    }

    componentDidMount(){
        if(AnnotationView.selectedElement && AnnotationView.selectedElement.dataset.criterion !== null){
            this.setState({
                data: {
                    // it ensures that the criterion defined previously in the DOM still exists in the criteria list
                    criterion: JsNx.getItem(this.props.criteriaList, 'name', AnnotationView.selectedElement.dataset.criterion, {name: ''}).name, 
                    comment: AnnotationView.selectedElement.dataset.comment
                },
                isNewNote: false
            })
        }
    }

    render(){
        let commentList = [];

        for(let item of this.props.commentList){
            if(item.name === this.state.data.criterion){
                commentList.push({value: item.comment, label: item.comment});
            }
        }

        let body = 
        <Form onSubmit={this.onSubmit}>
            <Form.Group className='mb-3' >
                <Form.Label>{$glVars.i18n.criterion}</Form.Label>
                <ComboBoxPlus placeholder={`${$glVars.i18n.select_item}...`} name="criterion" value={this.state.data.criterion} options={this.state.dropdownList.criteriaList} onChange={this.onDataChange} />
            </Form.Group>
            <Form.Group >
                <Form.Label>{$glVars.i18n.comment}</Form.Label>
                <ComboBoxPlus isClearable={true} placeholder={`${$glVars.i18n.search_comment}...`} name="commentSearch" value={this.state.data.search} options={commentList} onChange={this.onDataChange} />
                <InputTextArea className="mt-1" name="comment" as="textarea" value={this.state.data.comment} onChange={this.onDataChange} rows={4} />
            </Form.Group>
        </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>{$glVars.i18n.add_edit_comment}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar className='justify-content-between w-100'>
                        <ButtonGroup  >
                            <Button variant='danger'  onClick={() => this.onDelete(true)}>
                                 <FontAwesomeIcon icon={faTrash}/>{` ${$glVars.i18n.delete}`}
                            </Button>
                        </ButtonGroup>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{` ${$glVars.i18n.cancel}`}
                            </Button>
                            <Button  variant='success' onClick={this.onSubmit}>
                                <FontAwesomeIcon icon={faSave}/>{` ${$glVars.i18n.save}`}
                            </Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                    
                </Modal.Footer>
            </Modal>;
 
        return main;
    }

    onDataChange(event){
        let data = this.state.data;

        if(event.target.name === 'commentSearch'){
            data.comment += event.target.value;
            data.search = null;
        }
        else{
            data[event.target.name] = event.target.value;
        }
        
        this.setState({data: data});
    }

    onDelete(){
        if (AnnotationView.selectedElement) {
            if (AnnotationView.selectedElement.dataset.criterion.length > 0) {
                // Remove the highlighted span and return its text content
                const textContent = AnnotationView.selectedElement.textContent;
                AnnotationView.selectedElement.outerHTML = textContent;
            }
        }

        this.onClose(true);
    }

    onSubmit(event){
        event.preventDefault();
        event.stopPropagation();
           
        if(this.state.data.criterion.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.criterion), 3);
            return;
        }
        else if(this.state.data.comment.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.comment), 3);
            return;
        }

        let el = null;
        if (this.state.isNewNote) {
            el = document.createElement('span');
            el.dataset.toggle = "tooltip";

            try {
                AnnotationView.currentRange.surroundContents(el);
               // el.appendChild(MainView.currentRange.extractContents());
               // MainView.currentRange.insertNode(el);

                el.addEventListener('click', this.props.onClick);  // Gérer le clic sur le texte surligné
            }catch (error) {
                let msg = $glVars.i18n.msg_error_highlighting;
                alert(msg);
                console.log(msg, error);
            }
        }else {
            el = AnnotationView.selectedElement;
        }

        el.setAttribute('title', this.state.data.comment);
        el.dataset.criterion = this.state.data.criterion;
        el.dataset.comment = this.state.data.comment;
        el.dataset.placement = 'auto';
        el.dataset.originalTitle = this.state.data.comment;
        el.style.backgroundColor = JsNx.getItem(this.props.criteriaList, 'name', this.state.data.criterion, null).backgroundcolor;

        this.onClose(true);
    }

    onClose(refresh){
        let data = {};
        Object.assign(data, this.originalData);
        this.setState({data: data, isNewNote: true});
        this.props.onClose(refresh);
    }
}

class ModalAskIA extends Component{
    static defaultProps = {        
        onClose: null
    };

    constructor(props){
        super(props);

        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {
            data: {
                prompt: ""
            },
        };
    }

    render(){
        let body = 
        <Form onSubmit={this.onSubmit}>
            <Form.Group >
                <div className='p-2 text-muted bg-light rounded'>{window.getSelection().toString()}</div>
                <InputTextArea placeholder={$glVars.i18n.ask_question} name="prompt" as="textarea" value={this.state.data.prompt} onChange={this.onDataChange} rows={5} />
            </Form.Group>
        </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>{$glVars.i18n.ask_ai}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{` ${$glVars.i18n.cancel}`}
                            </Button>
                            <Button  variant='success' onClick={this.onSubmit}>
                                <FontAwesomeIcon icon={faArrowRight}/>{` ${$glVars.i18n.ask}`}
                            </Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                </Modal.Footer>
            </Modal>;
 
        return main;
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        this.setState({data: data});
    }

    onSubmit(event){
        event.preventDefault();
        event.stopPropagation();
           
        let that = this;
        let callback = function(result){
            console.log(result);

            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
                that.onClose(true);
            }        
        }
        
        $glVars.webApi.callAzureAI(this.state.data.prompt, $glVars.moodleData.assignment, callback);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}