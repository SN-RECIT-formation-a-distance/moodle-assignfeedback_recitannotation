
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
        this.refreshData = this.refreshData.bind(this);
        
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

            that.setState({dropdownList: dropdownList, annotation: result.data.annotation, promptAi: result.data.promptAi});         
        }
            
        $glVars.webApi.getAnnotationFormKit($glVars.moodleData.assignment, $glVars.moodleData.attemptnumber, $glVars.moodleData.userid, callback);
    }

    refreshData(){
        this.getData();
    }

    render(){
        // do not unmount AnnotationView because it uses references direct in the DOM and unmouting it causes problems with React
        let main = 
        <>
            {this.state.view === 'settings' && 
                <SettingsView onChangeView={this.onChangeView} promptAi={this.state.promptAi} criteriaList={this.state.dropdownList.criteriaList}
                        commentList={this.state.dropdownList.commentList} refresh={this.getData} />
            }

            <AnnotationView  className={(this.state.view === 'annotation' ? '' : 'd-none')} refreshData={this.refreshData} onChangeView={this.onChangeView} data={this.state.annotation} promptAi={this.state.promptAi} criteriaList={this.state.dropdownList.criteriaList}
                        commentList={this.state.dropdownList.commentList} />
        </>

        return main;
    }

    onChangeView(view){
        this.setState({view: view || ''});
    }
}
