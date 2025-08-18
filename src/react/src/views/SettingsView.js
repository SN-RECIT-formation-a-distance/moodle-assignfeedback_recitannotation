
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Modal, Tab, Table, Tabs} from 'react-bootstrap';
import { faArrowDown, faArrowLeft,  faArrowUp,  faDownload,  faPencilAlt, faPlus, faSave, faTimes, faTrash, faUpload} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComboBoxPlus, InputColor, InputTextArea} from '../libs/components/Components';
import { $glVars, Options } from '../common/common';
import { TextInput } from '../libs/components/TextInput';

export class SettingsView extends Component{
    static defaultProps = {
        onChangeView: null,
        criteriaList: [],
        commentList: [],
        refresh: null
    };

    constructor(props) {
        super(props);

        this.state = {tab: '0'};
    }

    render(){
        let criteriaList = this.props.criteriaList;
        let commentList = this.props.commentList;

        let main = 
        <div className='p-2'>
            <Button onClick={this.props.onChangeView} className='mb-5'>
                <FontAwesomeIcon icon={faArrowLeft}/>{` Revenir dans l'écran d'annotation`}
            </Button>

            <Tabs activeKey={this.state.tab} onSelect={(tab) => this.setState({tab: tab})}>
                <Tab eventKey="0" title="Liste de critères" className='p-3'>
                    <CriterionView criteriaList={criteriaList} refresh={this.props.refresh}/>
                </Tab>
                <Tab eventKey="1" title="Liste de commentaires"  className='p-3'>
                    <CommentsView  criteriaList={criteriaList} commentList={commentList} refresh={this.props.refresh}/>
                </Tab>
            </Tabs>
        </div>;

        return main;
    }
}

class CriterionView extends Component{
    static defaultProps = {
        criteriaList: [],
        refresh: null
    };

    constructor(props) {
        super(props);

        this.onAdd = this.onAdd.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onFileChange = this.onFileChange.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onImport = this.onImport.bind(this);
        this.changeCriterionSortOrder = this.changeCriterionSortOrder.bind(this);

        this.state = {
            showModal: false,
            data: null,
            importFile: {content: null, name: ""} 
        };

        this.fileRef = React.createRef();
    }

    render(){
        let criteriaList = this.props.criteriaList;

        let main = 
            <>
                <ButtonGroup className='d-block justify-content-end mb-4'>
                    <Button  onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/>{" Ajouter un nouveau item"}</Button>
                    <Button onClick={this.onSelectFile}><FontAwesomeIcon icon={faUpload}/>{" Importer des critères"}</Button>
                    <a className='btn btn-primary' href={`${Options.getGateway(true)}&service=exportCriteriaList&assignment=${$glVars.moodleData.assignment}`} target='_blank'>
                        <FontAwesomeIcon icon={faDownload}/>{" Exporter des critères"}
                    </a>
                </ButtonGroup>
                <input  ref={this.fileRef} type="file" accept=".xml"  className='invisible' onChange={this.onFileChange} />
                <Table striped bordered size='sm'>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Description</th>
                            <th  style={{width: 100}}>Couleur</th>
                            <th style={{width: 80}}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {criteriaList.map((item, index) => {
                            let row = 
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.description}</td>
                                    <td style={{backgroundColor: item.backgroundcolor}}></td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Button onClick={() => this.onEdit(item)} size='sm'><FontAwesomeIcon icon={faPencilAlt} title='Modifier'/></Button>
                                            <Button onClick={() => this.onDelete(item.id)} size='sm'><FontAwesomeIcon icon={faTrash} title='Supprimer'/></Button>
                                            <Button disabled={item.sortorder.toString() === "1"} onClick={() => this.changeCriterionSortOrder(item.id, 'up')} size='sm'><FontAwesomeIcon icon={faArrowUp} title='Déplacement vers le haut'/></Button>
                                            <Button disabled={criteriaList.length.toString() === item.sortorder.toString()} onClick={() => this.changeCriterionSortOrder(item.id, 'down')} size='sm'><FontAwesomeIcon icon={faArrowDown} title='Déplacement vers le bas'/></Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            return row;
                        })}
                    </tbody>
                </Table>

                {this.state.showModal && <ModalCriterionForm nbItems={criteriaList.length} onClose={this.onClose} data={this.state.data} />}
            </>;

        return main;
    }

    onDelete(id){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 3);
                that.props.refresh();
            }        
        }

        if(window.confirm($glVars.i18n.msgConfirmDeletion)){        
            $glVars.webApi.deleteCriterion(id, callback);
        }        
    }

    onAdd(){
        this.setState({showModal: true, data: null});
    }

    onEdit(editData){
        let data = {};
        Object.assign(data, editData);
        this.setState({showModal: true, data: data});
    }

    onClose(refresh){
        this.setState({showModal: false, data: null});

        if(refresh){
            this.props.refresh();
        }
    }

    onFileChange(event){
        let reader = new FileReader();
        let file = event.target.files[0];
        reader.readAsText(file, "UTF-8");
        
        let that = this;
        reader.onloadend = () => {
            let tmp = that.state.importFile;
            tmp.content = reader.result;
            tmp.name = file.name;
            that.setState({importFile: tmp}, that.onImport);
        };

        reader.onerror = function () {
            $glVars.feedback.showError($glVars.i18n.appName, reader.error);
        };
    };

    onSelectFile(){
        // Reset file input value to allow re-selecting the same file
        this.fileRef.current.value = null;
        this.fileRef.current.click();
    }

    onImport(){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                that.setState({importFile: {content: null, name: ""}}); 
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 3);
                that.setState({importFile: {content: null, name: ""}}, that.props.refresh);
            }    
        }

        let data = {
            fileContent: this.state.importFile.content, 
            filename: this.state.importFile.name, 
            assignment: $glVars.moodleData.assignment
        };   

        $glVars.webApi.importCriteriaList(data, callback);
    }

    changeCriterionSortOrder(id, direction){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 3);
                that.props.refresh();
            }    
        }

        $glVars.webApi.changeCriterionSortOrder(id, direction, callback)
    }
}

class ModalCriterionForm extends Component{
    static defaultProps = {        
        onClose: null,
        data: null,
        nbItems: 0
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {
            data: {
                id: 0,
                assignment: $glVars.moodleData.assignment,
                name: '',
                description: '',
                backgroundcolor: '#000',
                sortorder: props.nbItems + 1
            }
        };

        if(props.data !== null){
            Object.assign(this.state.data, props.data);
        }
    }

    render(){
        let body = 
            <Form onSubmit={this.onSubmit}>
                <Form.Group className='mb-3' >
                    <Form.Label>{"Nom"}</Form.Label>
                    <TextInput disabled={(this.state.data.id > 0)} 
                            name="name" value={this.state.data.name} onChange={this.onDataChange} max={25}/>
                    <Form.Text>Veuillez saisir uniquement des lettres minuscules sans espaces.</Form.Text>
                </Form.Group>
                <Form.Group className='mb-3' >
                    <Form.Label>{"Description"}</Form.Label>
                    <TextInput  name="description" value={this.state.data.description} onChange={this.onDataChange} max={50}/>
                </Form.Group>
                <Form.Group >
                    <Form.Label>{"Couleur"}</Form.Label>
                    <InputColor name='backgroundcolor' value={this.state.data.backgroundcolor} onChange={this.onDataChange} />
                </Form.Group>
            </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter/Modifier un critère</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{' Annuler'}
                            </Button>
                            <Button  variant='success' onClick={this.onSave}>
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
        
        if(event.target.name === 'name'){
            // Keep only lowercase letters a–z, remove everything else (including spaces)
            event.target.value = event.target.value.replace(/[^a-z]/g, '');
        }

        data[event.target.name] = event.target.value;

        this.setState({data: data});
    }

    onSave(){
        if(this.state.data.name.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Veuillez remplir le champ 'nom' avant de continuer.", 3);
            return;
        }
        else if(this.state.data.description.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Veuillez remplir le champ 'description' avant de continuer.", 3);
            return;
        }
        else if(this.state.data.backgroundcolor.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Veuillez remplir le champ 'couleur' avant de continuer.", 3);
            return;
        }

        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 3);
                that.onClose(true);
            }        
        }

        $glVars.webApi.saveCriterion(this.state.data, callback);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}

class CommentsView extends Component{
    static defaultProps = {
        commentList: [],
        criteriaList: [],
        refresh: null
    };

    constructor(props) {
        super(props);

        this.onAdd = this.onAdd.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {showModal: false, data: null};
    }

    render(){
        let commentList = this.props.commentList;

        let main = 
        <>
            <Button className='d-block ml-auto mb-4' onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/>{" Ajouter un nouveau item"}</Button>
            <Table striped bordered size='sm'>
                <thead>
                    <tr>
                        <th style={{width: 150}}>Critère</th>
                        <th>Commentaire</th>
                        <th style={{width: 70}}></th>
                    </tr>
                </thead>
                <tbody>
                    {commentList.map((item, index) => {
                        let row = 
                            <tr key={index}>
                                <td>{item.description}</td>
                                <td>{item.comment}</td>
                                <td className='text-center'>
                                        <ButtonGroup>
                                            <Button onClick={() => this.onEdit(item)} size='sm'><FontAwesomeIcon icon={faPencilAlt} title='Modifier'/></Button>
                                            <Button onClick={() => this.onDelete(item.id)} size='sm'><FontAwesomeIcon icon={faTrash} title='Supprimer'/></Button>
                                        </ButtonGroup>
                                    </td>
                            </tr>
                        return row;
                    })}
                </tbody>
            </Table>
            {this.state.showModal && <ModalCommentForm onClose={this.onClose} criteriaList={this.props.criteriaList} data={this.state.data}/>}
        </>;

        return main;
    }

    onDelete(id){
        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 3);
                that.props.refresh();
            }        
        }

        if(window.confirm($glVars.i18n.msgConfirmDeletion)){        
            $glVars.webApi.deleteComment(id, callback);
        }        
    }

    onAdd(){
        this.setState({showModal: true, data: null});
    }

    onEdit(editData){
        let data = {};
        Object.assign(data, editData);
        this.setState({showModal: true, data: data});
    }

    onClose(refresh){
        this.setState({showModal: false, data: null});

        if(refresh){
            this.props.refresh();
        }
    }
}

class ModalCommentForm extends Component{
    static defaultProps = {        
        onClose: null,
        data: null,
        criteriaList: []
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {
            data: {
                id: 0,
                criterionid: 0,
                comment: ''
            },
            dropdownList: {
                criteriaList: []
            },
        };

        if(props.data !== null){
            Object.assign(this.state.data, props.data);
            this.state.data.criterionid = this.state.data.criterionid.toString()
        }

        for(let item of props.criteriaList){
            this.state.dropdownList.criteriaList.push({value: item.id.toString(), label: item.description});
        }
    }

    render(){
        let body = 
            <Form onSubmit={this.onSubmit}>
                <Form.Group className='mb-3' >
                    <Form.Label>{"Critère"}</Form.Label>
                    <ComboBoxPlus  placeholder={"Sélectionnez un item..."} name="criterionid" value={this.state.data.criterionid} options={this.state.dropdownList.criteriaList} onChange={this.onDataChange} />
                </Form.Group>
                <Form.Group className='mb-3' >
                    <Form.Label>{"Commentaire"}</Form.Label>
                    <InputTextArea name="comment" as="textarea" value={this.state.data.comment} onChange={this.onDataChange} rows={4} />
                </Form.Group>
                
            </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter/Modifier un commentaire</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{' Annuler'}
                            </Button>
                            <Button  variant='success' onClick={this.onSave}>
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
        data[event.target.name] = event.target.value;
        this.setState({data: data});
    }

    onSave(){
        if(!(parseInt(this.state.data.criterionid) > 0)){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Erreur : vous devez remplir le champ 'critère' avant de continuer.", 3);
            return;
        }
        else if(this.state.data.comment.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.appName, "Erreur : vous devez remplir le champ 'commentaire' avant de continuer.", 3);
            return;
        }

        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.appName, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.appName, $glVars.i18n.msgactioncompleted, 3);
                that.onClose(true);
            }        
        }

        $glVars.webApi.saveComment(this.state.data, callback);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}