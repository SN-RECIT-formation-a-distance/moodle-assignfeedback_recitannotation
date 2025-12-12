import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
// import 'bootstrap/dist/css/bootstrap.min.css';  not necessary because the theme already has Bootstrap
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {VisualFeedback, Loading, FeedbackCtrl} from "./libs/components/Components";
import "./css/style.scss";
import { Options } from './common/Options';
import { $glVars } from './common/common';
import Utils from './libs/utils/Utils';
import { MainView } from './views/MainView';
import { AppWebApi } from './common/AppWebApi';

class App extends Component {
    static defaultProps = {
    };

    constructor(props) {
        super(props);

        this.onFeedback = this.onFeedback.bind(this);

        //$glVars.signedUser = this.props.signedUser;
        $glVars.urlParams = Utils.getUrlVars();

        this.state = {appMounted: false};
    }

    componentDidMount(){
        $glVars.feedback.addObserver("App", this.onFeedback);
        console.log(' | v' + Options.appVersion());
        this.setState({appMounted: true});
    }

    componentWillUnmount(){
        $glVars.feedback.removeObserver("App");     
    }

    render() {
        $glVars.feedback.render();

        let main =
            <div>
                <MainView appMounted={this.state.appMounted}/>                
                <Loading webApi={$glVars.webApi}><FontAwesomeIcon icon={faSpinner} spin/></Loading>
            </div>

        return (main);
    }

    onFeedback(){
        this.forceUpdate();
    }
}

window.loadRecitAnnotationReactApp = function(moodleData, i18n){  
    moodleData.sesskey = M.cfg.sesskey;
    moodleData.wwwroot = M.cfg.wwwroot;
    Object.assign($glVars.moodleData, moodleData);
    
    $glVars.i18n = i18n;
    $glVars.webApi = new AppWebApi();
    $glVars.feedback = new FeedbackCtrl();

    const domContainer = document.getElementById('recitannotation_appreact_placeholder');
    const root = createRoot(domContainer);
    root.render(<App />);
    return root;
};
