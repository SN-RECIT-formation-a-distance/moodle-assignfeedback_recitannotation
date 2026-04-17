
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Modal, Tab, Tabs} from 'react-bootstrap';
import { faArrowRight,  faPencilAlt,  faSave, faTimes} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputTextArea } from '../libs/components/InputTextArea';
import { ToggleButtons} from '../libs/components/Components';
import { $glVars } from '../common/common';
import Utils, { JsNx, UtilsString } from '../libs/utils/Utils';
import { AnnotationView } from './AnnotationView';

export class ModalAskAi extends Component{
    static defaultProps = {  
        promptAi: null,      
        mode: '1', // 1 = user, 2 = technician
        onClose: null,
        criteriaList: [],
        createNewAnnotation: null,
        onAnnotationChange: null
    };

    constructor(props){
        super(props);

        this.onClose = this.onClose.bind(this);
        this.onCallAI = this.onCallAI.bind(this);
        this.onCallAiResult = this.onCallAiResult.bind(this);
        this.onApply = this.onApply.bind(this);
        this.onReviewPrompt = this.onReviewPrompt.bind(this);

        this.state = {
            dropdownList: {
                criteriaList: []
            }
        };

        for(let item of props.criteriaList){
            this.state.dropdownList.criteriaList.push({value: item.id.toString(), text: item.description, data: item});
        }
    }

    render(){
        
        if(this.props.mode === '1'){
            return  <ModalAskAiUserView criteriaList={this.state.dropdownList.criteriaList} onClose={this.onClose}
                            onReviewPrompt={this.onReviewPrompt} onCallAI={this.onCallAI} onApply={this.onApply}/>;
        }
        else if(this.props.mode === '2'){
            return  <ModalAskAiTechView criteriaList={this.state.dropdownList.criteriaList} promptAi={this.props.promptAi} 
                        onClose={this.onClose} onReviewPrompt={this.onReviewPrompt} onCallAI={this.onCallAI} onApply={this.onApply}/>;
        }
        else{
            return null;
        }
    }

    onReviewPrompt(criteriaList){     
        if(criteriaList.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, 'Liste de critères', 3);
            return "";
        } 

        // do not replace student text here to avoid loosing HTML tags
        // data.prompt = data.prompt.replace("PLACEHOLDER_STUDENT_TEXT", AnnotationView.refAnnotation.current.innerText);

        let tmp = [];
        for(let item of criteriaList){
            let crit = JsNx.getItem(this.props.criteriaList, 'id', item, null);
            if(crit){
                tmp.push(`${tmp.length + 1}. ${crit.description} (ID=${crit.name}): ${crit.instruction_ai}`);
            }
        }

        return this.props.promptAi.prompt_ai.replace("PLACEHOLDER_CRITERIA_LIST", tmp.join("\n"));
    }

    onCallAI(prompt, callback){
        if(prompt.length === 0){
            $glVars.feedback.showWarning($glVars.i18n.pluginname, UtilsString.sprintf($glVars.i18n.msg_required_field, $glVars.i18n.prompt), 3);
            return;
        }
        
        //prompt = prompt.replace("PLACEHOLDER_STUDENT_TEXT", AnnotationView.getHtml());

        let studentText = `Analyse ce texte d'élève et génère le JSON selon le schéma : \n Texte : \n ${AnnotationView.getHtml()}`;

        let payload = {
            model: $glVars.moodleData.aiModel,    
            input: [
                { type: "message", role: "system", content: prompt },
                { type: "message", role: "user", content: studentText }
            ],
            temperature: 0.7,
            max_output_tokens: 5000,
            text: {
                format:{
                    type: "json_schema",                    
                    name: "AnnotatedTextObject",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            annotatedText: { 
                                type: "string",
                                description: "Le texte complet où chaque erreur est entourée ainsi : [[id:mot_fautif]].  Il est crucial de laisser la faute de l'élève entre les crochets. Exemple : 'Il a [[e1:manjé]]' (et non 'mangé'). Il est également crucial de retourner le texte de l'élève avec les balises HTML d'origine." 
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
                    }                       
                }
            }  
        };
        
        $glVars.webApi.callAzureAI(payload, $glVars.moodleData.assignment, (result) => this.onCallAiResult(result, callback), 120000);
    }

    onCallAiResult(result, callback = null){
        if(!result.success){
            $glVars.feedback.showError($glVars.i18n.pluginname, result.msg);
            return;
        }

        if(result.data.hasOwnProperty('error') && result.data.error !== null){
            $glVars.feedback.showError($glVars.i18n.pluginname, result.data.error.message);
            console.log(result.data);
            return;
        }

        // 1. Find the primary assistant message
        const message = result.data.output.find(m => m.role === "assistant");

        if (!message) {
            $glVars.feedback.showError($glVars.i18n.pluginname, "Aucune réponse de l'IA.");
            return;
        }

        // 2. CHECK FOR REFUSAL (Safety filters)
        // Some models use a 'refusal' property; others just send the "I'm sorry" text.
        if (message.status === "incomplete" && message.content[0].text.includes("I'm sorry")) {
            $glVars.feedback.showError($glVars.i18n.pluginname, "L'IA a refusé de traiter cette demande pour des raisons de sécurité ou de politique.");
            console.warn("Refusal detected:", message.content[0].text);
            return;
        }

        // 3. CHECK FOR TOKEN LIMIT (Incomplete JSON)
        if (message.status === "incomplete") {
            $glVars.feedback.showError($glVars.i18n.pluginname, "La réponse est trop longue et a été coupée. Essayez de réduire le texte à corriger.");
            console.warn("Cut-off detected. Status is incomplete.");
            return;
        }

        // 4. PROCEED TO PARSING IF COMPLETED
        try {
            let rawText = message.content[0].text;
            // Strip potential markdown backticks
            let jsonString = rawText.replace(/```json\n?|```/g, "").trim();
            let dataAI = JSON.parse(jsonString);

            if (callback) callback(dataAI);
            $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
        } 
        catch (error) {
            $glVars.feedback.showError($glVars.i18n.pluginname, "Erreur de formatage : l'IA n'a pas renvoyé un JSON valide.");
            console.error("Parsing error:", error, "Raw text:", message.content[0].text);
        }
    }

    onApply(dataAI){
        for(let item of dataAI.corrections){
            const regex = new RegExp(`\\[\\[${item.id}:([^\\]]*)\\]\\]`);

            dataAI.annotatedText = dataAI.annotatedText.replace(regex, (match, group1) => {
                let el = this.props.createNewAnnotation(null, item.criterion, item.explanation, item.suggestion, item.strategy, true);
                el.innerHTML = group1;
                return el.outerHTML;
            });
        }

        // Remove the [[id:]] that the AI ​​has not replaced
        const regex = new RegExp(`\\[\\[e\\d+:([^\\]]*)\\]\\]`, "g");

        dataAI.annotatedText = dataAI.annotatedText.replaceAll(regex, (match, group1, groupe2) => {
            return group1;
        });

        // avoid set directly innerHTML to prevent issues with React
        // AnnotationView.refAnnotation.current.innerHTML = dataAI.annotatedText;
        this.props.onAnnotationChange(dataAI.annotatedText);

        this.onClose(true);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}

export class ModalAskAiUserView extends Component{
    static defaultProps = {  
        onClose: null,
        criteriaList: [],
        onReviewPrompt: null,
        onCallAI: null,
        onApply: null
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onCallAI = this.onCallAI.bind(this);

        this.state = {
            data: {
                criteriaList: []
            }
        };

        for(let item of props.criteriaList){
            if(item.data.instruction_ai.length > 0){
                this.state.data.criteriaList.push(item.data.id.toString());
            }
        }
    }

    render(){
        let body = 
        <div>
            <Form>
                <Form.Group >
                    <Form.Label>{'Liste de critères'}</Form.Label>
                    <ToggleButtons name="criteriaList" onChange={this.onDataChange} type="checkbox" value={this.state.data.criteriaList} options={this.props.criteriaList}/>
                </Form.Group>                    
            </Form>
        </div>;

        let main = 
            <Modal show={true} onHide={() => this.props.onClose(false)} size="lg" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>{$glVars.i18n.ask_ai}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{body}</Modal.Body>
                <Modal.Footer>
                    <ButtonToolbar>
                        <ButtonGroup >
                            <Button variant='secondary'  onClick={() => this.props.onClose(false)}>
                                 <FontAwesomeIcon icon={faTimes}/>{` ${$glVars.i18n.cancel}`}
                            </Button>
                            <Button variant='primary' onClick={this.onCallAI}>
                                <FontAwesomeIcon icon={faArrowRight}/>{` ${$glVars.i18n.ask_ai}`}
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

    onCallAI(event){
        event.preventDefault();
        event.stopPropagation();

        let prompt = this.props.onReviewPrompt(this.state.data.criteriaList);
        this.props.onCallAI(prompt, this.props.onApply);
        this.props.onClose();
    }
}

export class ModalAskAiTechView extends Component{
    static defaultProps = {  
        promptAi: null,      
        onClose: null,
        criteriaList: [],
        onReviewPrompt: null,
        onCallAI: null,
        onApply: null
    };

    constructor(props){
        super(props);

        this.onClose = this.onClose.bind(this);
        this.onDataChange = this.onDataChange.bind(this);
        this.onCallAI = this.onCallAI.bind(this);
        this.onCallAiResult = this.onCallAiResult.bind(this);
        this.onApply = this.onApply.bind(this);
        this.onReviewPrompt = this.onReviewPrompt.bind(this);

        this.state = {
            data: {
                criteriaList: [],
                result: '',
                prompt: props.promptAi.prompt_ai
            },
            waiting: false,
            tab: '0'
        };

        for(let item of props.criteriaList){
            if(item.data.instruction_ai.length > 0){
                this.state.data.criteriaList.push(item.data.id.toString());
            }
        }
    }

    render(){
        let body = 
        <Tabs activeKey={this.state.tab} onSelect={(tab) => this.setState({tab: tab})}>
            <Tab eventKey="0" title={'Sélectionnez vos critères'}  className=' p-3' disabled>
                <Form>
                    <Form.Group >
                        <Form.Label>{'Liste de critères'}</Form.Label>
                        <ToggleButtons name="criteriaList" onChange={this.onDataChange} type="checkbox" value={this.state.data.criteriaList} options={this.props.criteriaList}/>
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
            <Tab eventKey="2" title={$glVars.i18n.result} className=' p-3' disabled>
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
                                <Button disabled={this.state.waiting}  variant='primary' onClick={this.onCallAI}>
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
        let data = this.state.data;
        data.prompt = this.props.onReviewPrompt(this.state.data.criteriaList);
        this.setState({data: data, tab: '1'})
    }

    onDataChange(event){
        let data = this.state.data;
        data[event.target.name] = event.target.value;
        this.setState({data: data});
    }

    onCallAI(event){
        event.preventDefault();
        event.stopPropagation();

        this.props.onCallAI(this.state.data.prompt, this.onCallAiResult);
        
        this.setState({waiting: true});
    }

    onCallAiResult(aiData){
        this.setState({waiting: false});        
        let data = this.state.data; 
        data.result = aiData;

        document.getElementById("placeholderReplyAi").innerText = JSON.stringify(data.result, null, 2); // 2 = indent size;
        this.setState({data: data, tab: '2'});

        $glVars.feedback.showInfo($glVars.i18n.pluginname, $glVars.i18n.msg_action_completed, 3);
    }

    onApply(){
        this.props.onApply(this.state.data.result);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}

export class PromptAiView extends Component{
    static defaultProps = {
        data: null,
        refresh: null
    };

    constructor(props) {
        super(props);

        this.onEdit = this.onEdit.bind(this);
        this.onClose = this.onClose.bind(this);

        this.state = {showModal: false};
    }

    render(){
        let promptAi = (this.props.data ? Utils.nl2html(this.props.data.prompt_ai) : "");

        let style = {
            fontFamily: "Fira Code, Courier New, monospace",   
            fontSize: "14px",
            backgroundColor: "#f5f5f5",
            color: "#333",
            borderRadius: "4px",
            padding: "1rem"
        };

        let main = 
        <>
            <Button variant='link' className='d-block ml-auto mb-4' onClick={this.onEdit}><FontAwesomeIcon icon={faPencilAlt}/>{` ${$glVars.i18n.edit}`}</Button>
            <div style={style}  dangerouslySetInnerHTML={{ __html: promptAi }}></div>
            {this.state.showModal && <ModalPromptAiForm onClose={this.onClose} data={this.state.data}/>}
        </>;

        return main;
    }

    onEdit(){
        let data = {};
        Object.assign(data, this.props.data);
        this.setState({showModal: true, data: data});
    }

    onClose(refresh){
        this.setState({showModal: false, data: null});

        if(refresh){
            this.props.refresh();
        }
    }
}

class ModalPromptAiForm extends Component{
    static defaultProps = {
        data: null,        
        onClose: null
    };

    constructor(props){
        super(props);

        this.onDataChange = this.onDataChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

        this.state = {
            data: props.data
        };

        if(this.state.data.id === 0){
            this.state.data.assignment = $glVars.moodleData.assignment;
        }
    }

    onKeyDown(e){
        if(e.key === 'Enter' && e.target.type !== 'textarea') {
            e.preventDefault();
        }
    }

    render(){
        let body = 
            <Form onSubmit={this.onSubmit} onKeyDown={this.onKeyDown}>
                <Form.Group className='mb-3' >
                    <Form.Label>{"Prompt à l'IA"}</Form.Label>
                    <InputTextArea name="prompt_ai" as="textarea" value={this.state.data.prompt_ai} onChange={this.onDataChange} rows={10} />
                    <Form.Text>
                        Veuillez utiliser les variables suivantes pour le remplacement automatique lors de la création du prompt : <strong>PLACEHOLDER_STUDENT_TEXT</strong>, <strong>PLACEHOLDER_CRITERIA_LIST</strong>
                    </Form.Text>
                </Form.Group>
                
            </Form>;

        let main = 
            <Modal show={true} onHide={() => this.onClose(false)} size="md" backdrop='static' tabIndex="-1">
                <Modal.Header closeButton>
                    <Modal.Title>{"Ajouter/Modifier le Prompt à l'IA"}</Modal.Title>
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

        $glVars.webApi.savePromptAi(this.state.data, callback);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}