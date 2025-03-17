
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Col, Form, Modal, Row, Table} from 'react-bootstrap';
import { faComment} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputTextArea } from '../libs/components/InputTextArea';
import {ComboBoxPlus, ToggleButtons} from '../libs/components/Components';

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
 
        this.state = {
            submissionText: "",  
            showModalAnnotate: false,
            evaluationData: [    
                {
                    criterion: {id: 'highlighter-traitement', text: 'Traitement', color: "#FFFF00", backgroundColor: "#FFFFE0"},
                    level: '',
                    count: 0
                },
                {
                    criterion:  {id: 'highlighter-organisation', text: 'Organisation', color: "#00FF00", backgroundColor: "#E0FFE0"},
                    level: '',
                    count: 0
                },
                {
                    criterion:  {id: 'highlighter-style', text: 'Style/Syntaxe', color: "#00FFFF", backgroundColor: "#E0FFFF"},
                    level: '',
                    count: 0
                },
                {
                    criterion:  {id: 'highlighter-orthographe', text: 'Orthographe', color: "#FF00FF", backgroundColor: "#FFE0FF"},
                    level: '',
                    count: 0
                },
            ],
            dropdownList: {
                levelListOptions: [
                    {label: 'A', value: 'A'},
                    {label: 'B', value: 'B'},
                    {label: 'C', value: 'C'},
                    {label: 'D', value: 'D'},
                    {label: 'E', value: 'E'}
                ]
            }       
        };

       /* this.criteriaList = [
            {text: 'Traitement', color: "#FFFF00", backgroundColor: "#FFFFE0"},
            {text: 'Organisation', color: "#00FF00", backgroundColor: "#E0FFE0"},
            {text: 'Style/Syntaxe', color: "#00FFFF", backgroundColor: "#E0FFFF"},
            {text: 'Orthographe', color: "#FF00FF", backgroundColor: "#FFE0FF"},
        ];*/

        //this.levelList = ['A', 'B', 'C', 'D', 'E'];
        

        this.refSubmissionText = React.createRef();
        this.refBtnAnnotate = React.createRef();
    }

    componentDidMount(){
        this.setState({submissionText: window.IWrapper.getContent()});
    }

    render() {
        console.log(this.state.evaluationData)
        let main =
            <div className="container">
                <Row className='p-3 main-view'>
                    <Col md={8}>
                        <h2>Production de l'élève</h2>
                        <div ref={this.refSubmissionText} onMouseUp={this.onMouseUp} className='p-3' dangerouslySetInnerHTML={{__html: this.state.submissionText}}></div>
                        <Button size='sm' className='btn-annotate' style={{display: 'none'}} ref={this.refBtnAnnotate} onClick={this.onClick}>
                            <FontAwesomeIcon icon={faComment}/>{` Annoter`}
                        </Button>
                    </Col>
                    <Col md={4} className='fixed'>
                        <h2>Évaluation</h2>
                        <Table striped bordered size='sm'>
                            <thead>
                                <tr>
                                <th>Critère</th>
                                <th>Niveau</th>
                                <th>Erreurs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.evaluationData.map((item, index) => {
                                    let row = 
                                        <tr key={index} style={{backgroundColor: item.criterion.backgroundColor}}>
                                            <td style={{backgroundColor: item.criterion.color}}>{item.criterion.text}</td>
                                            <td>
                                                <ComboBoxPlus placeholder={""} name={'level'} value={item.level} options={this.state.dropdownList.levelListOptions} onChange={(event) => this.onDataChange(event, index)} />
                                            </td>
                                            <td>{item.count}</td>
                                        </tr>;
                                    return row;
                                })}
                            </tbody>
                        </Table>
                        
                        <Form.Group>
                            <Form.Label>Rétroaction générale:</Form.Label>
                            <Form.Control name="generalFeedback" placeholder="Ajouter une rétroaction générale à l'élève..." as="textarea" rows={5} />
                        </Form.Group>
                    </Col>
                    {this.state.showModalAnnotate && <ModalAnnotate onClose={this.onClose} onDbClick={this.onDbClick} />}
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
        }
    }

    updateCounters(){
        let data = this.state.evaluationData;
        for(let item of data){
            let elements = window.document.querySelectorAll(`.${item.criterion.id}`);
            item.count = elements.length;
        }

        this.setState({evaluationData: data});
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
            const eleveTextRect = this.refSubmissionText.current.getBoundingClientRect();
            
            addCommentBtn.style.top = (rect.bottom + window.scrollY - eleveTextRect.top + 10) + 'px'; // Below the selection
            addCommentBtn.style.left = (rect.right + window.scrollX - eleveTextRect.left + 10) + 'px'; // A bit to the right
            addCommentBtn.style.display = 'block';
        } else {
            addCommentBtn.style.display = 'none';
        }
    }

    onDataChange(event, index){
        let data = this.state.evaluationData;
        data[index][event.target.name] = event.target.value;
        this.setState({evaluationData: data});
    }
}


class ModalAnnotate extends Component{
    static defaultProps = {        
        onClose: null,
        onDbClick: null
    };

    constructor(props){
        super(props);

        this.onDelete = this.onDelete.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.originalData = {data: {criterion: "traitement", comment: ""}, isNewNote: true};
        this.state = {};
        Object.assign(this.state, this.originalData);

        this.criteriaList = [
            {value: 'traitement', text: 'Traitement'},
            {value: 'organisation', text: 'Organisation'},
            {value: 'style', text: 'Style/Syntaxe'},
            {value: 'orthographe', text: 'Orthographe'},
        ]
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
        let body = 
        <Form onSubmit={this.onSubmit}>
            <Form.Group className='mb-3' >
                <Form.Label>{"Conserver les collaborateurs"}</Form.Label>
                <ToggleButtons name="criterion" type="radio" value={[this.state.data.criterion]} onClick={this.onDataChange} 
                            options={this.criteriaList}/>
            </Form.Group>
            <Form.Group >
                <Form.Label>{"Commentaire"}</Form.Label>
                <InputTextArea name="comment" as="textarea" value={this.state.data.comment} onChange={this.onDataChange} rows={4} />
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
                            <Button variant='danger'  onClick={() => this.onDelete(true)}>Supprimer</Button>
                        </ButtonGroup>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>Annuler</Button>
                            <Button  variant='success' onClick={this.onSubmit}>Enregistrer</Button>
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

    onDelete(){
        if (MainView.selectedElement) {
            const critereClass = Array.from(MainView.selectedElement.classList).find(className => className.startsWith('highlighter-'));
            if (critereClass) {
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
        el.dataset.originalTitle = this.state.data.comment;
        el.className = 'highlighted-text highlighter-' + this.state.data.criterion;

        this.onClose(true);
    }

    onClose(refresh){
        let data = {};
        Object.assign(data, this.originalData);
        this.setState({data: data});
        this.props.onClose(true);
    }
}