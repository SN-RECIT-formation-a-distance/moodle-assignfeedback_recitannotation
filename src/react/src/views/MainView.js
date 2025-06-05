
import React, { Component } from 'react';
import { $glVars } from '../common/common';
import { AnnotationView } from './AnnotationView';
import { SettingsView } from './SettingsView';


export class MainView extends Component {
    static defaultProps = {
    };

    constructor(props) {
        super(props);

        this.onChangeView = this.onChangeView.bind(this);
        this.getData = this.getData.bind(this);
        
        this.state = {
           view: '',
            dropdownList: {
                criteriaList: [],
                commentList: []
            }
        };
    }

    componentDidMount(){
        this.integrateAppReactWithMoodle();
        this.getData();
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
            that.setState({dropdownList: dropdownList});         
        }
        
        $glVars.webApi.getCriteriaList($glVars.moodleData.assignment, callback);
    }

    render(){
        let main = null;

        switch(this.state.view){
            case 'settings':
                main = <SettingsView onChangeView={this.onChangeView} criteriaList={this.state.dropdownList.criteriaList}
                        commentList={this.state.dropdownList.commentList} refresh={this.getData} />;
                break;
            default:
                main = <AnnotationView onChangeView={this.onChangeView} criteriaList={this.state.dropdownList.criteriaList}
                        commentList={this.state.dropdownList.commentList} />
                break;
           
        }

        return main;
    }

    onChangeView(view){
        this.setState({view: view || ''});
    }
}
