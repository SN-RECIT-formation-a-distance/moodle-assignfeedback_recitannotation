
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Col, Form, Modal, Row, Table} from 'react-bootstrap';
import { faCog, faComment, faSave, faTimes, faTrash} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputTextArea } from '../libs/components/InputTextArea';
import {ComboBoxPlus, ToggleButtons} from '../libs/components/Components';
import { $glVars } from '../common/common';
import { JsNx } from '../libs/utils/Utils';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min'; // includes tooltip

export class MainView extends Component {
    static defaultProps = {
    };

    static currentRange = null;
    static selectedElement = null;

    constructor(props) {
        super(props);

        this.onMouseUp = this.onMouseUp.bind(this);
        this.positionFloatingButton = this.positionFloatingButton.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onDbClick = this.onDbClick.bind(this);
        this.onClose = this.onClose.bind(this);
        this.updateCounters = this.updateCounters.bind(this);
        this.save = this.save.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.getData = this.getData.bind(this);
        this.afterGetData = this.afterGetData.bind(this);
        this.onSettings = this.onSettings.bind(this);
 
        this.state = {
            showModalAnnotate: false,
            showModalSettings: false,
            data: null,
            counter: {},
            dropdownList: null
        };

        this.refAnnotation = React.createRef();
        this.refBtnAnnotate = React.createRef();
    }

    componentDidMount(){
        this.integrateAppReactWithMoodle();
        this.getData();
    }

    integrateAppReactWithMoodle(){
        let panelGrade = window.document.querySelector("[data-region='grade-panel']");
        let recitAnnotation = window.document.getElementById("recitannotation_appreact_placeholder");    
        this.refRecitAnnotationValue = window.document.querySelector("[name='recitannotation_value']");    

        if(recitAnnotation.isEqualNode(panelGrade.firstChild)){
            return;
        }
        
        panelGrade.insertBefore(recitAnnotation, panelGrade.firstChild);
        recitAnnotation.style.display = "block";
        panelGrade.style.display = 'grid';
        panelGrade.style.gridTemplateColumns = "calc(70% - 1rem) calc(30% - 1rem)";
        panelGrade.style.gap = "1rem";
    }

    getData(){
        let that = this;

         let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                return;
            }
            let dropdownList = {
                criteriaList: result.data.criteriaList,
                commentList: result.data.commentList
            }
            that.setState({data: result.data.data, dropdownList: dropdownList}, () => {
                that.afterGetData();
            });         
        }
        
        $glVars.webApi.getAnnotationFormKit($glVars.moodleData.assignment, $glVars.moodleData.userid, callback);
    }

    afterGetData(){
        this.updateCounters();
        
        // Gérer le double-clic sur le texte surligné
        let elements = this.refAnnotation.current.querySelectorAll(`[data-criterion]`);
        for(let el of elements){
            el.addEventListener('dblclick', this.onDbClick);  
        }
    }

    render() {
        if(this.state.data === null){ return null;}

        let main =
            <div className="container">
                <Row className='p-3 main-view'>
                    <Col md={8}>
                        <div className='h5'>Production de l'élève</div>
                        <div ref={this.refAnnotation} onMouseUp={this.onMouseUp} className='p-3' dangerouslySetInnerHTML={{__html: this.state.data.annotation}}></div>
                        <Button size='sm' className='btn-annotate' style={{display: 'none'}} ref={this.refBtnAnnotate} onClick={this.onClick}>
                            <FontAwesomeIcon icon={faComment}/>{` Annoter`}
                        </Button>
                    </Col>
                    <Col md={4} className='fixed'>
                        <div className='d-flex align-items-baseline'>
                            <span className='h5'>Occurrences</span>
                            <Button size='sm' variant='link' className='ml-1' onClick={this.onSettings}>
                                <FontAwesomeIcon icon={faCog}/>
                            </Button>
                        </div>

                        <Table striped bordered size='sm'>
                            <thead>
                                <tr>
                                    <th>Critère</th>
                                    <th>Nombre</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.dropdownList.criteriaList.map((item, index) => {
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
                    {this.state.showModalAnnotate && <ModalAnnotate onClose={this.onClose} onDbClick={this.onDbClick} 
                                criteriaList={this.state.dropdownList.criteriaList} commentList={this.state.dropdownList.commentList}/>}

                    {this.state.showModalSettings && <ModalSettings criteriaList={this.state.dropdownList.criteriaList} commentList={this.state.dropdownList.commentList}/>}
                </Row>
            </div>;

        return (main);
    }

    onMouseUp(event){
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0) {
            MainView.currentRange = selection.getRangeAt(0);
            this.positionFloatingButton(MainView.currentRange);
        } else {
            MainView.currentRange = null;
            this.positionFloatingButton(null); // Hide button
        }
    }

    onClick(event){
        if (MainView.currentRange) {
            this.setState({showModalAnnotate: true});// Open modal for a new comment
        }
    }

    onClose(refresh){
        this.positionFloatingButton(null);
        this.setState({showModalAnnotate: false});

        MainView.currentRange = null;
        MainView.selectedElement = null;
        
        if(refresh){
            this.initTooltips();
            this.updateCounters();
            this.save();
        }
    }

    updateCounters(){
        let counter = this.state.counter;
        
        for(let item of this.state.dropdownList.criteriaList){
            let elements = window.document.querySelectorAll(`[data-criterion="${item.name}"]`);
            counter[item.name] = elements.length;
        }

        this.setState({counter: counter});
    }   

    initTooltips() {
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover',
            placement: 'auto' // Ajout de la position automatique
        }); 
    }

    onDbClick(event){
        event.preventDefault(); // Empêche d'autres actions de double-clic
        MainView.selectedElement = event.target; // 'this' est l'élément sur lequel le clic-droit a été fait
        this.setState({showModalAnnotate: true});
    }

    // Function to position and show the floating button
    positionFloatingButton(range) {
        let addCommentBtn = this.refBtnAnnotate.current;

        if (range && range.toString().length > 0) { //Ensure that something is selected
            const rect = range.getBoundingClientRect();
            // Adjust the positioning here to move the button further away

            //get position of eleve-text
            const eleveTextRect = this.refAnnotation.current.getBoundingClientRect();
            
            addCommentBtn.style.top = (rect.bottom + window.scrollY - eleveTextRect.top + 10) + 'px'; // Below the selection
            addCommentBtn.style.left = (rect.right + window.scrollX - eleveTextRect.left + 10) + 'px'; // A bit to the right
            addCommentBtn.style.display = 'block';
        } else {
            addCommentBtn.style.display = 'none';
        }
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        this.setState({data: data});
    }

    save(){
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 2);
                return;
            }
        } 
        
        let data = {};
        Object.assign(data, this.state.data);
        data.annotation = this.refAnnotation.current.innerHTML;
        data.occurrences = {}; // force new object
        Object.assign(data.occurrences, this.state.counter);

        $glVars.webApi.saveAnnotation(data, callback);
    }

    onSettings(){
        this.setState({showModalSettings: true});
    }
}

class ModalAnnotate extends Component{
    static defaultProps = {        
        onClose: null,
        onDbClick: null,
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
            this.state.dropdownList.criteriaList.push({value: item.name, text: item.description});
        }
    }

    componentDidMount(){
        if(MainView.selectedElement && MainView.selectedElement.dataset.criterion !== null){
            this.setState({
                data: {
                    criterion: MainView.selectedElement.dataset.criterion, 
                    comment: MainView.selectedElement.dataset.comment
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
                <Form.Label>{"Critère"}</Form.Label>
                <ToggleButtons name="criterion" type="radio" value={[this.state.data.criterion]} onClick={this.onDataChange} 
                            options={this.state.dropdownList.criteriaList}/>
            </Form.Group>
            <Form.Group >
                <Form.Label>{"Commentaire"}</Form.Label>
                <ComboBoxPlus  placeholder={"Cherchez un commentaire..."} name="commentSearch" value={this.state.data.search} options={commentList} onChange={this.onDataChange} />
                <InputTextArea className="mt-1" name="comment" as="textarea" value={this.state.data.comment} onChange={this.onDataChange} rows={4} />
            </Form.Group>
        </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter/Modifier un Commentaire</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar className='justify-content-between w-100'>
                        <ButtonGroup >
                            <Button variant='danger'  onClick={() => this.onDelete(true)}>
                                 <FontAwesomeIcon icon={faTrash}/>{' Supprimer'}
                                </Button>
                        </ButtonGroup>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{' Annuler'}
                            </Button>
                            <Button  variant='success' onClick={this.onSubmit}>
                                <FontAwesomeIcon icon={faSave}/>{' Enregistrer'}
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
        if (MainView.selectedElement) {
            if (MainView.selectedElement.dataset.criterion.length > 0) {
                // Remove the highlighted span and return its text content
                const textContent = MainView.selectedElement.textContent;
                MainView.selectedElement.outerHTML = textContent;
            }
        }

        this.onClose(true);
    }

    onSubmit(event){
        event.preventDefault();
        event.stopPropagation();
              
        if(this.state.data.criterion.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Erreur : vous devez remplir le champ 'Critère' avant de continuer.", 3);
            return;
        }
        else if(this.state.data.comment.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Erreur : vous devez remplir le champ 'Commentaire' avant de continuer.", 3);
            return;
        }

        let el = null;
        if (this.state.isNewNote) {
            el = document.createElement('span');
            el.dataset.toggle = "tooltip";

            try {
                MainView.currentRange.surroundContents(el);
               // el.appendChild(MainView.currentRange.extractContents());
               // MainView.currentRange.insertNode(el);

                el.addEventListener('dblclick', this.props.onDbClick);  // Gérer le double-clic sur le texte surligné
            }catch (error) {
                let msg ="Erreur lors de l'application du surlignage: il y a des nœuds partiellement sélectionnés.";
                alert(msg);
                console.log(msg, error);
            }
        }else {
            el = MainView.selectedElement;
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


class ModalSettings extends Component{
    static defaultProps = {        
        onClose: null,
        criteriaList: [],
        commentList: []
    };

    constructor(props){
        super(props);

        this.state = {};
    }

    render(){
        let commentList = [];

        for(let item of this.props.commentList){
            if(item.name === this.state.data.criterion){
                commentList.push({value: item.comment, label: item.comment});
            }
        }

        let body = "aaa";

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>Configurer les critères</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{' Annuler'}
                            </Button>
                            <Button  variant='success' onClick={this.onSubmit}>
                                <FontAwesomeIcon icon={faSave}/>{' Enregistrer'}
                            </Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                    
                </Modal.Footer>
            </Modal>;
 
        return main;
    }

    onClose(refresh){
       
    }
}