
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Col, Form, Modal, Row, Tab, Table, Tabs} from 'react-bootstrap';
import { faArrowRight, faBroom, faChalkboard, faCog, faComment, faPrint, faRedo, faSave, faTimes, faTrash, faUndo} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputTextArea } from '../libs/components/InputTextArea';
import {ComboBoxPlus, ToggleButtons} from '../libs/components/Components';
import { $glVars } from '../common/common';
import Utils, { JsNx, UtilsString } from '../libs/utils/Utils';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min'; // includes tooltip
import { DlgConfirm } from '../libs/components/DlgConfirm';

export class AnnotationView extends Component {
    static AI_ICON_SVG = `<svg class="ai-icon" fill="currentColor" aria-hidden="true" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 2c.28 0 .5.22.5.5V3h.5a.5.5 0 0 1 0 1H17v.5a.5.5 0 0 1-1 0V4h-.5a.5.5 0 0 1 0-1h.5v-.5c0-.28.22-.5.5-.5Zm-13 13c.28 0 .5.22.5.5v.5h.5a.5.5 0 0 1 0 1H4v.5a.5.5 0 0 1-1 0V17h-.5a.5.5 0 0 1 0-1H3v-.5c0-.28.22-.5.5-.5Zm4-13c-.65 0-1.12.51-1.24 1.06-.11.55-.4 1.37-1.11 2.09-.72.71-1.54 1-2.09 1.11C2.51 6.37 2 6.86 2 7.5c0 .65.52 1.13 1.06 1.24.55.11 1.37.4 2.09 1.11.71.72 1 1.54 1.11 2.1.12.54.59 1.05 1.24 1.05s1.13-.51 1.24-1.06c.11-.55.4-1.37 1.11-2.09.72-.71 1.54-1 2.1-1.11.54-.11 1.05-.59 1.05-1.24s-.51-1.13-1.06-1.24a4.14 4.14 0 0 1-2.09-1.11c-.71-.72-1-1.54-1.11-2.1C8.63 2.52 8.15 2 7.5 2ZM7 15v-1.06a2.13 2.13 0 0 0 1 0V15c0 1.1.9 2 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1.06a2.13 2.13 0 0 0 0-1H15a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3Zm3-1.5c0-.28.22-.5.5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Zm.5-2.5a.5.5 0 0 0 0 1H15a.5.5 0 0 0 0-1h-4.5Z" fill="currentColor"></path></svg>`;

    static defaultProps = {
        onChangeView: null,
        criteriaList: [],
        commentList: []
    };

    static currentRange = null;
    static selectedElement = null;
    static refAnnotation = null

    constructor(props) {
        super(props);

        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.positionFloatingButton = this.positionFloatingButton.bind(this);
        this.onAnnotate = this.onAnnotate.bind(this);
        this.onAskIA = this.onAskIA.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onClose = this.onClose.bind(this);
        this.updateCounters = this.updateCounters.bind(this);
        this.save = this.save.bind(this);        
        this.getData = this.getData.bind(this);
        this.setAnnotationText = this.setAnnotationText.bind(this);
        this.createNewAnnotation = this.createNewAnnotation.bind(this);

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
            },
            quickAnnotationMethod: false
        };

        AnnotationView.refAnnotation = React.createRef();
        this.refFloatingMenu = React.createRef();
    }

    componentDidMount(){
        this.getData();

        document.addEventListener("contextmenu", (event) => {
            if(Utils.isMobileDevice()){
                event.preventDefault(); // blocks the browser’s default context menu. 
            }
        });
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
        
        $glVars.webApi.getAnnotationFormKit($glVars.moodleData.assignment, $glVars.moodleData.attemptnumber, $glVars.moodleData.userid, callback);
    }

    setAnnotationText(value){
        AnnotationView.refAnnotation.current.innerHTML = value;

        // Gérer le clic sur le texte surligné
        let elements = AnnotationView.refAnnotation.current.querySelectorAll(`[data-criterion]`);
        for(let el of elements){
            el.addEventListener('click', this.onClick);  
        }

        this.refresh();
    }

    render() {
        if(this.state.data === null){ return null;}

        let criteriaList = this.props.criteriaList;
        let commentList = this.props.commentList;

        let main =
            <div className="container">
                <Row className='p-3 main-view'>
                    <Col md={8}>
                        <div>
                            <div className='h5'>{$glVars.i18n.student_production}</div>
                            <div>
                                <ButtonGroup className='mr-2'>
                                    <Button size='sm' onClick={this.onUndo} title={$glVars.i18n.undo} disabled={(this.state.stack.undo.length === 0)}>
                                        <FontAwesomeIcon icon={faUndo}/>
                                    </Button>
                                    <Button size='sm' onClick={this.onRedo} title={$glVars.i18n.redo} disabled={(this.state.stack.redo.length === 0)}>
                                        <FontAwesomeIcon icon={faRedo}/>
                                    </Button>
                                </ButtonGroup>
                                <ButtonGroup className='mr-2'>
                                    <Button size='sm' onClick={this.onCleanHtml} title={$glVars.i18n.clean_student_production}>
                                        <FontAwesomeIcon icon={faBroom}/>
                                    </Button>
                                </ButtonGroup>

                                <ButtonGroup  className='mr-2'>
                                    <Button size='sm'  variant={(this.state.quickAnnotationMethod ? 'primary' : 'outline-primary')}
                                        onClick={() => this.setState({quickAnnotationMethod: !this.state.quickAnnotationMethod})} 
                                        title={$glVars.i18n.quick_annotation_method}>
                                        {$glVars.i18n.quick_annotation_method}
                                    </Button>
                                </ButtonGroup>
                                
                                <ButtonGroup >
                                    <Button size='sm' onClick={this.onAskIA} disabled={!$glVars.moodleData.aiApi} title={$glVars.i18n.ask_ai}>
                                        <FontAwesomeIcon icon={faChalkboard}/>
                                    </Button>
                                </ButtonGroup>
                            </div>
                            
                        </div>
                        <div ref={AnnotationView.refAnnotation} onMouseUp={this.onSelectionChange} onTouchEnd={this.onSelectionChange} className='p-3'></div>

                        <ButtonGroup ref={this.refFloatingMenu} className='floating-menu'>
                            <Button size='sm' onClick={this.onAnnotate}>
                                <FontAwesomeIcon icon={faComment}/>{` ${$glVars.i18n.annotate}`}
                            </Button>                            
                        </ButtonGroup>                        
                    </Col>
                    <Col md={4} >
                        <div className='d-flex align-items-baseline'>
                            <span className='h5'>{$glVars.i18n.occurrences}</span>
                            <Button size='sm' variant='link' className='ml-1' onClick={() => this.props.onChangeView('settings')}>
                                <FontAwesomeIcon icon={faCog}/>
                            </Button>
                            <a className='btn btn-sm btn-link' title={$glVars.i18n.print_comment_list} 
                                href={`${$glVars.moodleData.wwwroot}/mod/assign/feedback/recitannotation/classes/print-comment-list.php?cmid=${$glVars.urlParams.id}&assignment=${$glVars.moodleData.assignment}`} target="_blank">
                                <FontAwesomeIcon icon={faPrint}/>
                            </a>
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
                    {!this.state.quickAnnotationMethod &&  this.state.showModalAnnotate && 
                        <ModalAnnotateForm onClose={this.onClose} createNewAnnotation={this.createNewAnnotation} 
                                commentList={commentList} criteriaList={criteriaList} />
                    }                  
                    
                    {this.state.quickAnnotationMethod && this.state.showModalAnnotate && 
                        <QuickAnnotateForm onClose={this.onClose} createNewAnnotation={this.createNewAnnotation} 
                                commentList={commentList} />
                    }   

                    {this.state.showModalAskIA && <ModalAskIA onClose={this.onClose} criteriaList={criteriaList} createNewAnnotation={this.createNewAnnotation}/>}
                </Row>
         </div>;

        return (main);
    }  

    onSelectionChange(event){                     
        const selection = window.getSelection();

        if (selection.rangeCount === 0 || selection.toString().length === 0) {
            AnnotationView.currentRange = null;
            this.positionFloatingButton(null); // Hide button
            return;
        }

        AnnotationView.currentRange = selection.getRangeAt(0);

        if(this.state.quickAnnotationMethod){
            this.onAnnotate();
        }
        else{
            this.positionFloatingButton(AnnotationView.currentRange);
        }
    }

    onAnnotate(event){
        if (AnnotationView.currentRange) {
            if(Utils.isNodePartiallySelected(AnnotationView.currentRange)){
                let msg = $glVars.i18n.msg_error_highlighting;
                $glVars.feedback.showError($glVars.i18n.pluginname, msg);
                return;
            }

            this.setState({showModalAnnotate: true});// Open modal for a new comment
            this.beforeDataChange();
        }
    }

    onAskIA(event){
        this.setState({showModalAskIA: true});
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

    async refresh(){
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

        return counter;
    }   

    initTooltips() {
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover',
            placement: 'auto', // Ajout de la position automatique,
        }); 
        console.log("4")
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
            const eleveTextRect = AnnotationView.refAnnotation.current.getBoundingClientRect();
            
            floatingMenu.style.top = (rect.bottom + window.scrollY - eleveTextRect.top + 10) + 'px'; // Below the selection
            floatingMenu.style.left = (rect.right + window.scrollX - eleveTextRect.left + 10) + 'px'; // A bit to the right
            floatingMenu.style.display = 'inline-flex';
        } else {
            floatingMenu.style.display = 'none';
        }
    }

    beforeDataChange(){
        let stack = this.state.stack;
        stack.undo.push(AnnotationView.refAnnotation.current.innerHTML);
        stack.redo = []; // Clear redo stack on new input
        this.setState({stack: stack});
    }

    cancelDataChange(){
        let stack = this.state.stack;
        stack.undo.pop(); // remove element previously added because there was not any modification
        this.setState({stack: stack});
    }

    async save(){
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
                that.setState({data: data});
                return; 
            }
        } 
        
        await this.refresh(); 
        let data = {};
        Object.assign(data, this.state.data);
        data.annotation = AnnotationView.refAnnotation.current.innerHTML;
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
            stack.redo.push(AnnotationView.refAnnotation.current.innerHTML);
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
            stack.undo.push(AnnotationView.refAnnotation.current.innerHTML);
            this.setAnnotationText(stack.redo.pop());
            this.setState({stack: stack}, this.save);
        }
    }

    onCleanHtml(){
        let that = this;
        let onApply = function(){
            that.beforeDataChange();
            that.setAnnotationText(Utils.cleanHTML(AnnotationView.refAnnotation.current.innerHTML));
            that.save();
        }
        DlgConfirm.render($glVars.i18n.pluginname, $glVars.i18n.msg_confirm_clean_html_code, $glVars.i18n.cancel, $glVars.i18n.ok, null, onApply);
    }

    createNewAnnotation(el, criterionName, suggestion, explanation, strategy){
        if(el === null){
            el = document.createElement('span');

            try {
                AnnotationView.currentRange.surroundContents(el);
                el.addEventListener('click', this.onClick);  // Gérer le clic sur le texte surligné
            }catch (error) {
                let msg = $glVars.i18n.msg_error_highlighting;
                $glVars.feedback.showError($glVars.i18n.pluginname, msg);
                console.log(error);
            }
        }
        
        const commentTemplate = `
        <div class='text-start '>
            <div class='mb-2 pb-1 border-bottom border-secondary'>
                <span class='badge me-2 text-uppercase text-white' >[[CRITERION]]</span>
                <strong class='text-white fs-6'>[[SUGGESTION]]</strong>
            </div>
            <div class='mb-2 text-light' style='font-weight: 100;'>[[EXPLANATION]]</div>
            <div class='p-2 bg-black border border-secondary rounded small text-warning font-italic'>
                <i class='fa-solid fa-lightbulb me-1'></i> [[STRATEGY]]
            </div>
        </div>`;

        let criterion = JsNx.getItem(this.props.criteriaList, 'name', criterionName, null);

        if(criterion){
            el.dataset.toggle = "tooltip";
            el.dataset.criterion = criterionName;
            el.dataset.comment = explanation;
            //el.dataset.placement = 'auto';
            el.dataset.title = commentTemplate.replace('[[CRITERION]]', criterion.description);
            el.dataset.title = el.dataset.title.replace('[[SUGGESTION]]', suggestion);
            el.dataset.title = el.dataset.title.replace('[[EXPLANATION]]', explanation);
            el.dataset.title = el.dataset.title.replace('[[STRATEGY]]', strategy);
            el.dataset.html = "true";
            el.style.borderBottom = `3px solid ${criterion.backgroundcolor}`;

            return el;
        }
        else{
            throw new Error(`The criterion "${criterionName}" was not found.`);
        }
    }
}

class QuickAnnotateForm extends Component{
    static defaultProps = {        
        onClose: null,
        createNewAnnotation: null,
        commentList: []
    };

    constructor(props){
        super(props);

        this.onDelete = this.onDelete.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);

        this.state = {
            data: {},
            dataChanged: false,
            dropdownList: {
                commentList: []
            },
            isNewNote: true
        };

        this.ref = React.createRef();
        this.refComboBox = React.createRef();

        this.originalData = {criterion: "", comment: ""};
        
        Object.assign(this.state.data, this.originalData);

        for(let item of props.commentList){
            this.state.dropdownList.commentList.push({value: item.comment, label: item.comment, data: item});
        }
    }

    componentDidMount(){
        if(AnnotationView.selectedElement && AnnotationView.selectedElement.dataset.criterion !== null){
            this.setState({
                data: {
                    // it ensures that the criterion defined previously in the DOM still exists in the criteria list
                    criterion: JsNx.getItem(this.props.commentList, 'name', AnnotationView.selectedElement.dataset.criterion, {name: ''}).criterionid, 
                    comment: AnnotationView.selectedElement.dataset.comment
                },
                isNewNote: false
            })
        }

        setTimeout(() => {
            window.document.addEventListener("click", this.onDocumentClick)
        }, 500);

        this.positionFloatingInput();
    }

    componentWillUnmount(){
        window.document.removeEventListener("click", this.onDocumentClick);
    }

    positionFloatingInput() {
        if(this.ref === null){ return null;}
        if(this.ref.current === null){ return null;}

        let floatingMenu = this.ref.current;

        let rect = null;
        if(AnnotationView.selectedElement !== null){
            rect = AnnotationView.selectedElement.getBoundingClientRect();
        }
        //Ensure that something is selected
        else if(AnnotationView.currentRange !== null && AnnotationView.currentRange.toString().length > 0){
            rect = AnnotationView.currentRange.getBoundingClientRect();
        }
        
        if(rect === null){
            return;
        }

        //get position of eleve-text
        const eleveTextRect = AnnotationView.refAnnotation.current.getBoundingClientRect();
        
        floatingMenu.style.top = (rect.bottom + window.scrollY - eleveTextRect.top + 50) + 'px'; // Below the selection
        floatingMenu.style.left = (rect.left + window.scrollX - eleveTextRect.left) + 'px'; 
        floatingMenu.style.display = 'inline-flex';

        this.refComboBox.current.focus();
    }

    onDocumentClick(event){        
        const isClickInside = this.ref.current.contains(event.target);
        if (!isClickInside) {
            if(this.state.dataChanged){
                this.onSave();
            }
            else{
                this.onClose(false);
            }
        }
    }

    onKeyDown(e){
        if(e.key === 'Enter') {
            this.onSave();
        }
    }

    render(){
        let commentList = this.state.dropdownList.commentList;

        this.positionFloatingInput();

        let main = 
            <div ref={this.ref} className='floating-input card shadow' onKeyDown={this.onKeyDown}>
                <div className="card-body p-2">
                    <ComboBoxPlus ref={this.refComboBox} placeholder={`${$glVars.i18n.search_comment}...`} name="comment" value={this.state.data.comment} options={commentList} onChange={this.onDataChange} />
                    {!this.state.isNewNote && 
                        <ButtonGroup className='mt-2 w-100'  >
                            <Button size='sm' variant='danger'  onClick={() => this.onDelete(true)}>
                                    <FontAwesomeIcon icon={faTrash}/>{` ${$glVars.i18n.delete}`}
                            </Button>
                        </ButtonGroup>
                    }
                </div>
                
            </div>;
 
        return main;
    }

    onDataChange(event){
        let data = this.state.data;

        if((event.target.data === null) || (event.target === null)){
            data.criterion = "";
            data.comment = ""; 
        }
        else{
            data.criterion = event.target.data.name;
            data.comment = event.target.data.comment;
        }
        
        this.setState({data: data, dataChanged: true});
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

    onSave(){
        if(this.state.data.comment.length === 0){ return; }

        let el = (this.state.isNewNote ? null : AnnotationView.selectedElement);
        this.props.createNewAnnotation(el, this.state.data.criterion, this.state.data.comment);

        this.onClose(true);
    }

    onClose(refresh){       
        let data = {};
        Object.assign(data, this.originalData);
        this.setState({data: data, isNewNote: true});
        this.props.onClose(refresh);
    }
}

class ModalAnnotateForm extends Component{
    static defaultProps = {        
        onClose: null,
        createNewAnnotation: null,
        criteriaList: [],
        commentList: []
    };

    constructor(props){
        super(props);

        this.onDelete = this.onDelete.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

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

    onKeyDown(e){
        if(e.key === 'Enter' && e.target.type !== 'textarea') {
            e.preventDefault();
        }
    }

    render(){
        let commentList = [];

        for(let item of this.props.commentList){
            if(item.name === this.state.data.criterion){
                commentList.push({value: item.comment, label: item.comment});
            }
        }

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>{$glVars.i18n.add_edit_annotation}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={this.onSubmit} onKeyDown={this.onKeyDown}>
                        <Form.Group className='mb-3' >
                            <Form.Label>{$glVars.i18n.criterion}</Form.Label>
                            <ComboBoxPlus placeholder={`${$glVars.i18n.select_item}...`} name="criterion" value={this.state.data.criterion} options={this.state.dropdownList.criteriaList} onChange={this.onDataChange} />
                        </Form.Group>
                        <Form.Group >
                            <Form.Label>{$glVars.i18n.comment}</Form.Label>
                            <ComboBoxPlus isClearable={true} placeholder={`${$glVars.i18n.search_comment}...`} name="commentSearch" value={this.state.data.search} options={commentList} onChange={this.onDataChange} />
                            <InputTextArea className="mt-1" name="comment" as="textarea" value={this.state.data.comment} onChange={this.onDataChange} rows={4} 
                                maxLength={350}/>
                        </Form.Group>
                    </Form>
                </Modal.Body>
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

        let el = (this.state.isNewNote ? null : AnnotationView.selectedElement);
        this.props.createNewAnnotation(el, this.state.data.criterion, this.state.data.comment);

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
        onClose: null,
        criteriaList: [],
        createNewAnnotation: null
    };

    constructor(props){
        super(props);

        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onCallIA = this.onCallIA.bind(this);
        this.onReply = this.onReply.bind(this);
        this.onApply = this.onApply.bind(this);
        this.onReviewPrompt = this.onReviewPrompt.bind(this);

        this.state = {
            data: {
                criteriaList: [],
                result: '',
                prompt: `Agis comme un assistant pédagogique bienveillant.
Voici un texte écrit par un élève :
<<<
PLACEHOLDER_STUDENT_TEXT
>>>

Ton objectif est d'identifier les erreurs pour aider l'élève à progresser.
Analyse le texte en vérifiant STRICTEMENT les 2 critères suivantes :

<<<
PLACEHOLDER_CRITERIA_LIST
>>>

Format de réponse attendu est un objet JSON et son structure est passé comme paramètre dans la requête.
`
            },
            dropdownList: {
                criteriaList: []
            },
            waiting: false,
            tab: '0'
        };

        for(let item of props.criteriaList){
            this.state.dropdownList.criteriaList.push({value: item.id.toString(), text: item.description});
        }
    }

    render(){
        let body = 
        <Tabs activeKey={this.state.tab} onSelect={(tab) => this.setState({tab: tab})}>
            <Tab eventKey="0" title={'Sélectionnez vos critères'}  className=' p-3' disabled>
                <Form>
                    <Form.Group >
                        <Form.Label>{'Critères disponibles'}</Form.Label>
                        <ToggleButtons name="criteriaList" onChange={this.onDataChange} type="checkbox" value={this.state.data.criteriaList} options={this.state.dropdownList.criteriaList}/>
                    </Form.Group>                    
                </Form>
            </Tab>
            <Tab eventKey="1" title={'Réviser le prompt'} className=' p-3' disabled>
                <Form >
                    <Form.Group className='mb-3'>
                        <Form.Label>{$glVars.i18n.prompt}</Form.Label>
                        <InputTextArea placeholder={$glVars.i18n.ask_question} name="prompt" as="textarea" value={this.state.data.prompt} onChange={this.onDataChange} rows={15} />
                    </Form.Group>
                </Form>
            </Tab>
            <Tab eventKey="2" title={$glVars.i18n.result} className=' p-3'>
                <Form >
                    <Form.Group className='mb-3'>
                        <div id="placeholderReplyAi"></div>                    
                    </Form.Group>
                </Form>
            </Tab>
        </Tabs>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="xl" backdrop='static' tabIndex="-1">
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
                            {this.state.tab === '0' && 
                                <Button variant='primary' onClick={this.onReviewPrompt}>
                                    <FontAwesomeIcon icon={faArrowRight}/>{` Générer le prompt`}
                                </Button>
                            }
                            {this.state.tab === '1' &&  
                                <Button disabled={this.state.waiting}  variant='primary' onClick={this.onCallIA}>
                                    <FontAwesomeIcon icon={faArrowRight}/>{` ${$glVars.i18n.ask_ai}`}
                                </Button>
                            }
                            {this.state.tab === '2' &&
                                <Button variant='primary' onClick={this.onApply}>
                                    <FontAwesomeIcon icon={faSave}/>{` ${$glVars.i18n.apply}`}
                                </Button>
                            }
                        </ButtonGroup>
                    </ButtonToolbar>
                </Modal.Footer>
            </Modal>;
 
        return main;
    }

    onReviewPrompt(){
        if(this.state.data.criteriaList.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.criteriaList), 3);
            return;
        }

        let data = this.state.data;
        data.prompt = data.prompt.replace("PLACEHOLDER_STUDENT_TEXT", AnnotationView.refAnnotation.current.innerText);

        let criteriaList = [];
        for(let item of this.state.data.criteriaList){
            let crit = JsNx.getItem(this.props.criteriaList, 'id', item, null);
            if(crit){
                criteriaList.push(`${criteriaList.length + 1}. ${crit.description} (ID=${crit.name}): ${crit.instruction_ai}`);
            }
        }

        data.prompt = data.prompt.replace("PLACEHOLDER_CRITERIA_LIST", criteriaList.join("\n"));

        this.setState({data: data, tab: '1'})
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        this.setState({data: data});
    }

    onCallIA(event){
        event.preventDefault();
        event.stopPropagation();

        if(this.state.data.prompt.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.prompt), 3);
            return;
        }
        
        let payload = {
            messages: [
                { role: "user", content: this.state.data.prompt }
            ],
            temperature: 0.7,
            max_tokens: 5000,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "AnnotatedTextObject",
                    schema: {
                        type: "object",
                        properties: {
                            annotatedText: { 
                                type: "string",
                                description: "Le texte complet où chaque erreur est entourée ainsi : [[id:mot_fautif]].  Il est crucial de laisser la faute de l'élève entre les crochets. Exemple : 'Il a [[e1:manjé]]' (et non 'mangé')" 
                            },
                            generalFeedback: { 
                                type: "string",
                                description: "Un conseil global encourageant"
                            },
                            corrections: { 
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { 
                                            type: "string",
                                            description: "e1"
                                        },
                                        suggestion: { 
                                            type: "string", 
                                            description: "correction"
                                        },
                                        explanation: { 
                                            type: "string",
                                            description: "Explication courte"
                                        },
                                        strategy: { 
                                            type: "string",
                                            description: "Astuce pour retenir"
                                        },
                                        criterion: { 
                                            type: "string",
                                            description: "L'identificateur du critère. La liste de critères sera passée dans le prompt. Chaque critère aura dans sa description (ID=) qui sera l'identificateur à ajouter dans ce champ."
                                        }
                                    },
                                    required: ["id", "suggestion", "explanation", "strategy", "criterion"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["annotatedText", "generalFeedback", "corrections"],
                        additionalProperties: false
                    },
                    strict: true
                }
            }
        };
        
        $glVars.webApi.callAzureAI(payload, $glVars.moodleData.assignment, this.onReply);
        this.setState({waiting: true});
    }

    onReply(result){
        this.setState({waiting: false});

        if(!result.success){
            $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
            return;
        }

        if(result.data.hasOwnProperty('error')){
            $glVars.feedback.showError($glVars.i18n.pluginname, result.data.error.message);
            console.log(result.data);
            return;
        }

        if(!(result.data.hasOwnProperty('choices')) || !(Array.isArray(result.data.choices))){
            $glVars.feedback.showError($glVars.i18n.pluginname, "Une erreur est survenue.");
            console.log(result.data);
            return;
        }
        
        try{
            let data= this.state.data;
            data.result = JSON.parse(result.data.choices.pop().message.content);
            document.getElementById("placeholderReplyAi").innerText = JSON.stringify(data.result, null, 2); // 2 = indent size;
            this.setState({data: data, tab: '2'});
            $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
        }
        catch(error){
            $glVars.feedback.showError($glVars.i18n.pluginname, error);
            console.log(error);
            return;
        }
    }

    getRangeByIndex(startIndex, length) {
        const container = AnnotationView.refAnnotation.current;
        const endIndex = startIndex + length;

        let currentIndex = 0;

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let node;

        let range = null;
        while ((node = walker.nextNode())) {
            const nodeTextLength = node.textContent.length;

            if (currentIndex + nodeTextLength >= startIndex) {
                range = document.createRange();

                const startOffset = startIndex - currentIndex;
                const endOffset = Math.min(nodeTextLength, endIndex - currentIndex);

                range.setStart(node, startOffset);
                range.setEnd(node, endOffset);

                break;
            }

            currentIndex += nodeTextLength;
        }

        return range;
    }

    onApply(){
        let data = this.state.data.result;
        /*let data = {
            "annotatedText": "Les enfants [[e1:joue]] dans le jardin et ils courent vite. La mère et le père [[e2:prépare]] le dîner pendant que les voisins [[e3:arrive]]. Tout le monde se réjouit, mais les oiseaux [[e4:chante]] trop fort.",
            "generalFeedback": "Bravo pour votre effort dans l'écriture de ce texte. Quelques ajustements mineurs sur les accords et les conjugaisons amélioreront encore sa qualité.",
            "corrections": [
            {
            "id": "e1",
            "suggestion": "jouent",
            "explanation": "Le verbe doit s'accorder en nombre avec le sujet pluriel 'Les enfants'.",
            "strategy": "Souvenez-vous que les sujets pluriels entraînent une terminaison en '-ent' pour les verbes.",
            "criterion": "orthographegrammaticale"
            },
            {
            "id": "e2",
            "suggestion": "préparent",
            "explanation": "Le verbe doit s'accorder en nombre avec le sujet pluriel 'La mère et le père'.",
            "strategy": "Identifiez tous les éléments du sujet pour choisir la bonne terminaison.",
            "criterion": "orthographegrammaticale"
            },
            {
            "id": "e3",
            "suggestion": "arrivent",
            "explanation": "Le verbe doit s'accorder en nombre avec le sujet pluriel 'les voisins'.",
            "strategy": "Vérifiez si le sujet est pluriel ou singulier pour accorder le verbe.",
            "criterion": "orthographegrammaticale"
            },
            {
            "id": "e4",
            "suggestion": "chantent",
            "explanation": "Le verbe doit s'accorder en nombre avec le sujet pluriel 'les oiseaux'.",
            "strategy": "Ajoutez '-ent' aux verbes dont le sujet est pluriel.",
            "criterion": "orthographegrammaticale"
            }
            ]
        }*/
        AnnotationView.refAnnotation.current.innerHTML = data.annotatedText;

        let corrections = [];
        for(let item of data.corrections){
            const regex = new RegExp(`\\[\\[${item.id}:([^\\]]*)\\]\\]`);
            const match = data.annotatedText.match(regex);

            if(match){
                corrections.push({
                    suggestion: item.suggestion,
                    explanation: item.explanation,
                    strategy: item.strategy,
                    criterion: item.criterion,
                    start:  match.index,
                    offset: match[0].length,
                    innerText: match[1]
                });
            }
        }

        for(let item of corrections){
            let range = this.getRangeByIndex(item.start, item.offset);
            
            if(range !== null){
                AnnotationView.currentRange = range;
                item.el = this.props.createNewAnnotation(null, item.criterion, item.suggestion, item.explanation, item.strategy);
            }
        }

        for(let item of corrections){
            item.el.innerHTML = item.innerText + AnnotationView.AI_ICON_SVG;
        }

        this.onClose(true);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}