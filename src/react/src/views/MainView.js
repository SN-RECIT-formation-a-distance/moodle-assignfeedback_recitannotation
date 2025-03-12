
import React, { Component } from 'react';
import { Button, ButtonGroup, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { ToggleButtons } from '../libs/components/ToggleButtons';

export class MainView extends Component {
    static defaultProps = {
    };

    constructor(props) {
        super(props);

        this.onMouseUp = this.onMouseUp.bind(this);
        this.positionFloatingButton = this.positionFloatingButton.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {
            submissionText: "",  
            showModalAnnotate: false         
        };

        this.criteriaList = [
            {text: 'Traitement', color: "#FFFF00", backgroundColor: "#FFFFE0"},
            {text: 'Organisation', color: "#00FF00", backgroundColor: "#E0FFE0"},
            {text: 'Style/Syntaxe', color: "#00FFFF", backgroundColor: "#E0FFFF"},
            {text: 'Orthographe', color: "#FF00FF", backgroundColor: "#FFE0FF"},
        ];

        this.levelList = ['A', 'B', 'C', 'D', 'E'];

        this.refSubmissionText = React.createRef();
        this.refBtnAnnotate = React.createRef();
        this.currentRange = null;
        this.selectedElement = null;
    }

    componentDidMount(){
        this.setState({submissionText: window.IWrapper.getContent()});
    }

    render() {
        let main =
            <div className="container">
                <Row className='p-3 main-view'>
                    <Col md={8}>
                        <h2>Production de l'élève</h2>
                        <div ref={this.refSubmissionText} onMouseUp={this.onMouseUp} className='p-3' dangerouslySetInnerHTML={{__html: this.state.submissionText}}></div>
                        <Button size='sm' className='btn-annotate' style={{display: 'none'}} ref={this.refBtnAnnotate} onClick={this.onClick}>Annoter</Button>
                    </Col>
                    <Col md={4} className='fixed'>
                        <h2>Évaluation</h2>
                        <Table striped bordered size='sm'>
                            <thead>
                                <tr>
                                <th>Critère</th>
                                {this.levelList.map((item, index) => {
                                    return <th key={index}>{item}</th>;
                                })}
                                <th>Erreurs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.criteriaList.map((item, index) => {
                                    let row = 
                                        <tr key={index} style={{backgroundColor: item.backgroundColor}}>
                                            <td style={{backgroundColor: item.color}}>{item.text}</td>
                                            {this.levelList.map((item2, index2) => {
                                                return <td key={index2} ><input type="radio" name={item.text} value={item2}/></td>;
                                            })}
                                            <td>0</td>
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
                    {this.state.showModalAnnotate && <ModalAnnotate data={this.currentRange} onClose={this.onClose} />}
                </Row>
            </div>;

        return (main);
    }

    onMouseUp(event){
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0) {
            this.currentRange = selection.getRangeAt(0);
            this.positionFloatingButton(this.currentRange);
        } else {
            this.currentRange = null;
            this.positionFloatingButton(null); // Hide button
        }
    }

    onClick(event){
        if (this.currentRange) {
            this.setState({showModalAnnotate: true});// Open modal for a new comment
        }
    }

    onClose(){
        this.positionFloatingButton(null);
        this.setState({showModalAnnotate: false});
    }

    onDbClick(event){
        console.log(event.target, event.currentTarget)
        event.preventDefault(); // Empêche d'autres actions de double-clic
        this.selectedElement = event.target; // 'this' est l'élément sur lequel le clic-droit a été fait
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
}


class ModalAnnotate extends Component{
    static defaultProps = {        
        data: null,
        onClose: null,
        onDbClick: null
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

        this.state = {data: {criterion: "traitement", comment: ""}};

        this.criteriaList = [
            {value: 'traitement', text: 'Traitement'},
            {value: 'organisation', text: 'Organisation'},
            {value: 'style', text: 'Style/Syntaxe'},
            {value: 'orthographe', text: 'Orthographe'},
        ]
    }

    componentDidMount(){
        /*console.log(this.props.selectedElement.dataset, this.props.selectedElement.dataset.criterion)
        if(this.props.selectedElement.dataset.criterion !== null){
            this.setState({data: {criterion: this.props.selectedElement.dataset.title, comment: this.props.selectedElement.dataset.comment}})
        }*/
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
                <Form.Control name="comment" as="textarea" rows={4} />
            </Form.Group>
        </Form>;

        let main = 
            <Modal show={true} onHide={this.props.onClose} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter/Modifier un Commentaire</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonGroup className='d-flex justify-space-between'>
                        <Button style={{flex: 0}} variant='danger'  onClick={this.props.onClose}>Supprimer</Button>
                        <div>
                            <Button style={{flex: 0}} variant='secondary'  onClick={this.props.onClose}>Annuler</Button>
                            <Button style={{flex: 0}} variant='success' onClick={this.onSubmit}>Enregistrer</Button>
                        </div>
                    </ButtonGroup>
                </Modal.Footer>
            </Modal>;
 
        return main;
    }

    onDataChange(event){
        let data = this.state;
        data[event.target.name] = event.target.value;
        this.setState(data);
    }

    onSubmit(event){
        event.preventDefault();
        event.stopPropagation();
              
        let isNewComment = true; //(this.props.data === null);

        if (isNewComment) {
            const span = document.createElement('span');
            span.className = 'highlighted-text highlighter-' + this.state.data.criterion;
            span.dataset.comment = this.state.data.comment;
            span.dataset.toggle = "tooltip";
            span.dataset.placement = "auto";
            span.dataset.criterion = this.state.data.criterion;
            span.title = this.state.data.comment;
            span.id = this.state.data.criterion + Date.now();
            span.addEventListener('dblclick', this.props.onDbClick);  // Gérer le double-clic sur le texte surligné

            this.props.data.surroundContents(span);
            // $(span).tooltip(); // Initialiser le tooltip pour le nouvel élément
            this.props.onClose();
        }else {
            // Modifier un commentaire existant
            this.props.selectedElement.dataset.comment = this.state.data.comment;
            this.props.selectedElement.dataset.criterion = this.state.data.criterion;
            this.props.selectedElement.title = this.props.selectedElement.dataset.comment;
            // Mettre à jour la classe CSS en fonction du nouveau critère
            this.props.selectedElement.className = 'highlighted-text highlighter-' + this.state.data.criterion;
            this.props.onClose();
        }
    }
}