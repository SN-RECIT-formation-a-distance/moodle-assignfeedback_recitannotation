
import React, { Component } from 'react';
import { $glVars } from '../common/common';
import { AnnotationView } from './AnnotationView';
import { SettingsView } from './SettingsView';

export class MainView extends Component {
    static defaultProps = {
        appMounted: false
    };

    constructor(props) {
        super(props);

        this.onChangeView = this.onChangeView.bind(this);
        this.getData = this.getData.bind(this);
        this.refresh = this.refresh.bind(this);
        this.onAnnotationChange = this.onAnnotationChange.bind(this);
        
        this.state = {
            view: 'annotation', // annotation, settings
            annotation: null,
            dropdownList: {
                criteriaList: [],
                commentList: []
            },
            promptAi: null
        };
    }

    componentDidMount(){
        this.integrateAppReactWithMoodle();
        this.getData();
    }

    componentDidUpdate(){
        // Make sure to retrieve the data only once after the application is mounted
        if(this.state.annotation === null){
            this.getData();
        }
    }

    integrateAppReactWithMoodle(){
        let panelGrade = window.document.querySelector("[data-region='grade-panel']");
        let recitAnnotation = window.document.getElementById("recitannotation_appreact_placeholder");    

        if(recitAnnotation.isEqualNode(panelGrade.firstChild)){
            return;
        }
        
        panelGrade.insertBefore(recitAnnotation, panelGrade.firstChild);
        recitAnnotation.style.display = "block";
        panelGrade.style.display = 'grid';
        panelGrade.style.gridTemplateColumns = "calc(65% - 1rem) calc(35% - 1rem)";
        panelGrade.style.gap = "1rem";
        panelGrade.style.gridAutoRows = "auto";
        panelGrade.style.alignItems = "start";
    }

    getData(){
        if(!this.props.appMounted){ return ;}

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

            if(result.data.annotation.annotation.length === 0){
                result.data.annotation.annotation = "<span class='text-muted'>Le travail remis par l’élève s’affichera ici.</span>";
            }

            that.setState({dropdownList: dropdownList, annotation: result.data.annotation, promptAi: result.data.promptAi});         
        }
            
        $glVars.webApi.getAnnotationFormKit($glVars.moodleData.assignment, $glVars.moodleData.attemptnumber, $glVars.moodleData.userid, callback);
    }

    refresh(){
        this.getData();
    }

    render(){
        // do not unmount AnnotationView because it uses references direct in the DOM and unmouting it causes problems with React
        let main = 
        <>
            {this.state.view === 'settings' && 
                <SettingsView onChangeView={this.onChangeView} promptAi={this.state.promptAi} criteriaList={this.state.dropdownList.criteriaList}
                        commentList={this.state.dropdownList.commentList} refresh={this.refresh} />
            }

            <AnnotationView  className={(this.state.view === 'annotation' ? '' : 'd-none')} 
                    refresh={this.refresh} onChangeView={this.onChangeView} data={this.state.annotation} 
                    promptAi={this.state.promptAi} criteriaList={this.state.dropdownList.criteriaList}
                    commentList={this.state.dropdownList.commentList} onAnnotationChange={this.onAnnotationChange}/>
        </>

        return main;
    }

    onAnnotationChange(value){
        let annotation = {};
        Object.assign(annotation, this.state.annotation);
        annotation.annotation = value;
        this.setState({annotation: annotation});
    }

    onChangeView(view){
        this.setState({view: view || ''});
    }
}
