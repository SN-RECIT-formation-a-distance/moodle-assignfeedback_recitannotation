
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Col, Form, Modal, Row, Table} from 'react-bootstrap';
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
                                <ButtonGroup className='mr-2'>
                                    <Button size='sm' onClick={this.onCleanHtml} title={$glVars.i18n.clean_student_production}>
                                        <FontAwesomeIcon icon={faBroom}/>
                                    </Button>
                                </ButtonGroup>

                                <ButtonGroup>
                                    <Button size='sm'  variant={(this.state.quickAnnotationMethod ? 'primary' : 'outline-primary')}
                                        onClick={() => this.setState({quickAnnotationMethod: !this.state.quickAnnotationMethod})} 
                                        title={$glVars.i18n.quick_annotation_method}>
                                        {$glVars.i18n.quick_annotation_method}
                                    </Button>
                                </ButtonGroup>
                            </div>
                            
                        </div>
                        <div ref={AnnotationView.refAnnotation} onMouseUp={this.onSelectionChange} onTouchEnd={this.onSelectionChange} className='p-3'></div>

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

                    {this.state.showModalAskIA && <ModalAskIA onClose={this.onClose}/>}
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

    createNewAnnotation(el, criterion, comment){
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
        
        el.dataset.toggle = "tooltip";
        el.setAttribute('title', comment);
        el.dataset.criterion = criterion;
        el.dataset.comment = comment;
        el.dataset.placement = 'auto';
        el.dataset.originalTitle = comment;
        el.style.backgroundColor = JsNx.getItem(this.props.criteriaList, 'name', criterion, null).backgroundcolor;

        return el;
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