
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Modal, Tab, Table, Tabs} from 'react-bootstrap';
import { faArrowDown, faArrowLeft,  faArrowUp,  faCheckCircle,  faDownload,  faPencilAlt, faPlus, faSave, faTimes, faTrash, faUpload} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ComboBoxPlus, InputColor, InputTextArea} from '../libs/components/Components';
import { $glVars, Options } from '../common/common';
import { TextInput } from '../libs/components/TextInput';
import { UtilsString } from '../libs/utils/Utils';

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
                <FontAwesomeIcon icon={faArrowLeft}/>{` ${$glVars.i18n.back_annotation_view}`}
            </Button>

            <Tabs activeKey={this.state.tab} onSelect={(tab) => this.setState({tab: tab})}>
                <Tab eventKey="0" title={$glVars.i18n.criteria_list} className='p-3'>
                    <CriterionView criteriaList={criteriaList} refresh={this.props.refresh}/>
                </Tab>
                <Tab eventKey="1" title={$glVars.i18n.comment_list}  className='p-3'>
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
                    <Button  onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/>{` ${$glVars.i18n.add_new_item}`}</Button>
                    <Button onClick={this.onSelectFile}><FontAwesomeIcon icon={faUpload}/>{` ${$glVars.i18n.import_criteria}`}</Button>
                    <a className='btn btn-primary' href={`${Options.getGateway(true)}&service=exportCriteriaList&assignment=${$glVars.moodleData.assignment}`} target='_blank'>
                        <FontAwesomeIcon icon={faDownload}/>{` ${$glVars.i18n.export_criteria}`}
                    </a>
                </ButtonGroup>
                <input  ref={this.fileRef} type="file" accept=".xml"  className='invisible' onChange={this.onFileChange} />
                <Table striped bordered size='sm'>
                    <thead>
                        <tr>
                            <th>{$glVars.i18n.name}</th>
                            <th>{$glVars.i18n.description}</th>
                            <th  style={{width: 100}}>{$glVars.i18n.color}</th>
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
                                            <Button onClick={() => this.onEdit(item)} size='sm'><FontAwesomeIcon icon={faPencilAlt} title={$glVars.i18n.edit}/></Button>
                                            <Button onClick={() => this.onDelete(item.id)} size='sm'><FontAwesomeIcon icon={faTrash} title={$glVars.i18n.delete}/></Button>
                                            <Button disabled={item.sortorder.toString() === "1"} onClick={() => this.changeCriterionSortOrder(item.id, 'up')} size='sm'><FontAwesomeIcon icon={faArrowUp} title={$glVars.i18n.move_up}/></Button>
                                            <Button disabled={criteriaList.length.toString() === item.sortorder.toString()} onClick={() => this.changeCriterionSortOrder(item.id, 'down')} size='sm'><FontAwesomeIcon icon={faArrowDown} title={$glVars.i18n.move_down}/></Button>
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
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
                that.props.refresh();
            }        
        }

        if(window.confirm($glVars.i18n.msg_confirm_deletion)){
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
            $glVars.feedback.showError($glVars.i18n.pluginname, reader.error);
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
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                that.setState({importFile: {content: null, name: ""}}); 
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
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
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
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
                backgroundcolor: "#cce5ff",
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
                    <Form.Label>{$glVars.i18n.name}</Form.Label>
                    <TextInput disabled={(this.state.data.id > 0)} 
                            name="name" value={this.state.data.name} onChange={this.onDataChange} max={25}/>
                    <Form.Text>{$glVars.i18n.only_lowercase}</Form.Text>
                </Form.Group>
                <Form.Group className='mb-3' >
                    <Form.Label>{$glVars.i18n.description}</Form.Label>
                    <TextInput  name="description" value={this.state.data.description} onChange={this.onDataChange} max={50}/>
                </Form.Group>
                <Form.Group >
                    <Form.Label>{$glVars.i18n.color}</Form.Label>
                    <div>
                        <Button variant='link' className='btn-color-picker' style={{backgroundColor: "#cce5ff",}} 
                            onClick={() => this.onDataChange({target:{name: 'backgroundcolor', value: "#cce5ff"}})}>
                            {this.state.data.backgroundcolor === "#cce5ff" && <FontAwesomeIcon icon={faCheckCircle} className='text-dark'/>}
                        </Button>
                        <Button  variant='link' className='btn-color-picker' style={{backgroundColor: "#d4edda"}}
                            onClick={() => this.onDataChange({target:{name: 'backgroundcolor', value: "#d4edda"}})}>
                            {this.state.data.backgroundcolor === '#d4edda' && <FontAwesomeIcon icon={faCheckCircle} className='text-dark'/>}
                        </Button>
                        <Button  variant='link' className='btn-color-picker' style={{backgroundColor: "#f8d7da"}}
                            onClick={() => this.onDataChange({target:{name: 'backgroundcolor', value: "#f8d7da"}})}>
                            {this.state.data.backgroundcolor === '#f8d7da' && <FontAwesomeIcon icon={faCheckCircle} className='text-dark'/>}
                        </Button>
                        <Button  variant='link' className='btn-color-picker' style={{backgroundColor: "#fff3cd"}} 
                            onClick={() => this.onDataChange({target:{name: 'backgroundcolor', value: "#fff3cd"}})}>
                            {this.state.data.backgroundcolor === '#fff3cd' && <FontAwesomeIcon icon={faCheckCircle} className='text-dark'/>}
                        </Button>
                        <Button  variant='link' className='btn-color-picker' style={{backgroundColor: "#d1ecf1"}} 
                            onClick={() => this.onDataChange({target:{name: 'backgroundcolor', value: "#d1ecf1"}})}>
                            {this.state.data.backgroundcolor === '#d1ecf1' && <FontAwesomeIcon icon={faCheckCircle} className='text-dark'/>}
                        </Button>
                        <Button  variant='link' className='btn-color-picker' style={{backgroundColor: "#e2e3e5"}} 
                            onClick={() => this.onDataChange({target:{name: 'backgroundcolor', value: "#e2e3e5"}})}>
                            {this.state.data.backgroundcolor === '#e2e3e5' && <FontAwesomeIcon icon={faCheckCircle} className='text-dark'/>}
                        </Button>
                        <InputColor className="m-2" name='backgroundcolor' value={this.state.data.backgroundcolor} onChange={this.onDataChange} />
                    </div>
                    
                </Form.Group>
            </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1" className='main-view'>
                <Modal.Header closeButton>
                    <Modal.Title>{$glVars.i18n.add_edit_criterion}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{` ${$glVars.i18n.cancel}`}
                            </Button>
                            <Button  variant='success' onClick={this.onSave}>
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
        
        if(event.target.name === 'name'){
            // Keep only lowercase letters a–z, remove everything else (including spaces)
            event.target.value = event.target.value.replace(/[^a-z]/g, '');
        }

        data[event.target.name] = event.target.value;

        this.setState({data: data});
    }

    onSave(){
        if(this.state.data.name.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.name), 3);
            return;
        }
        else if(this.state.data.description.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.description), 3);
            return;
        }
        else if(this.state.data.backgroundcolor.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.color), 3);
            return;
        }

        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
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
            <Button className='d-block ml-auto mb-4' onClick={this.onAdd}><FontAwesomeIcon icon={faPlus}/>{` ${$glVars.i18n.add_new_item}`}</Button>
            <Table striped bordered size='sm'>
                <thead>
                    <tr>
                        <th style={{width: 150}}>{$glVars.i18n.criterion}</th>
                        <th>{$glVars.i18n.comment}</th>
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
                                            <Button onClick={() => this.onEdit(item)} size='sm'><FontAwesomeIcon icon={faPencilAlt} title={$glVars.i18n.edit}/></Button>
                                            <Button onClick={() => this.onDelete(item.id)} size='sm'><FontAwesomeIcon icon={faTrash} title={$glVars.i18n.delete}/></Button>
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
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
                that.props.refresh();
            }        
        }

        if(window.confirm($glVars.i18n.msg_confirm_deletion)){        
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
                    <Form.Label>{$glVars.i18n.criterion}</Form.Label>
                    <ComboBoxPlus  placeholder={`${$glVars.i18n.select_item}...`} name="criterionid" value={this.state.data.criterionid} options={this.state.dropdownList.criteriaList} onChange={this.onDataChange} />
                </Form.Group>
                <Form.Group className='mb-3' >
                    <Form.Label>{$glVars.i18n.comment}</Form.Label>
                    <InputTextArea name="comment" as="textarea" value={this.state.data.comment} onChange={this.onDataChange} rows={4} />
                </Form.Group>
                
            </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>{$glVars.i18n.add_edit_comment}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{` ${$glVars.i18n.cancel}`}
                            </Button>
                            <Button  variant='success' onClick={this.onSave}>
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
        data[event.target.name] = event.target.value;
        this.setState({data: data});
    }

    onSave(){
        if(!(parseInt(this.state.data.criterionid) > 0)){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.criterion), 3);
            return;
        }
        else if(this.state.data.comment.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.comment), 3);
            return;
        }

        let that = this;
        let callback = function(result){
            if(!result.success){
                $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
                return;
            }
            else{
                $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msgactioncompleted, 3);
                that.onClose(true);
            }        
        }

        $glVars.webApi.saveComment(this.state.data, callback);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}