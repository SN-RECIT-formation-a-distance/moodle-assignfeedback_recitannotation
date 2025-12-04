
import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, Form, Modal, Tab, Tabs} from 'react-bootstrap';
import { faArrowRight,  faSave, faTimes,} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputTextArea } from '../libs/components/InputTextArea';
import { ToggleButtons} from '../libs/components/Components';
import { $glVars } from '../common/common';
import { JsNx, UtilsString } from '../libs/utils/Utils';
import { AnnotationView } from './AnnotationView';

export class ModalAskAi extends Component{
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

        for(let item of props.criteriaList){
            if(item.instruction_ai.length > 0){
                this.state.data.criteriaList.push(item.id.toString());
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
            $glVars.feedback.showWarning($glVars.i18n.pluginname, 'Liste de critères', 3);
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
        //let data = this.state.data.result;
        let data = {
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
        }
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
                item.el = this.props.createNewAnnotation(null, item.criterion, item.explanation, item.suggestion, item.strategy, true);
            }
        }

        for(let item of corrections){
            item.el.innerHTML = item.innerText; //+ '<i>' + AnnotationView.AI_ICON_SVG + '</i>';
        }

        this.onClose(true);
    }

    onClose(refresh){
        this.props.onClose(refresh);
    }
}