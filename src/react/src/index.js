import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';  
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {VisualFeedback, Loading} from "./libs/components/Components";
import "./css/style.scss";
import { Options } from './common/Options';
import { $glVars } from './common/common';
import Utils from './libs/utils/Utils';
import { MainView } from './views/MainView';

class App extends Component {
    static defaultProps = {
        signedUser: null,
    };

    constructor(props) {
        super(props);

        this.onFeedback = this.onFeedback.bind(this);

        $glVars.signedUser = this.props.signedUser;
        $glVars.urlParams = Utils.getUrlVars();

        this.state = {submissionText: ""};
    }

    componentDidMount(){
        $glVars.feedback.addObserver("App", this.onFeedback);
        window.document.title = window.name + ' - v' + Options.appVersion();
    }

    componentWillUnmount(){
        $glVars.feedback.removeObserver("App");        
    }

    render() {
        let main =
            <div>
                <MainView />
                {$glVars.feedback.msg.map((item, index) => {  
                    return (<VisualFeedback key={index} id={index} msg={item.msg} type={item.type} title={item.title} timeout={item.timeout}/>);                                    
                })}
                <Loading webApi={$glVars.webApi}><FontAwesomeIcon icon={faSpinner} spin/></Loading>
            </div>

        return (main);
    }

    onFeedback(){
        this.forceUpdate();
    }
}

document.addEventListener('DOMContentLoaded', function(e){     
    let domContainer = document.getElementById('recitannotation_placeholder');
    if (domContainer && domContainer.childNodes.length === 0){
        const root = createRoot(domContainer);
        root.render(<App />);
    }
}, false);
