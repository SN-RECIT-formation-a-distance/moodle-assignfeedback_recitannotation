import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import {faExclamationTriangle, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Singleton class
 */
export class FeedbackCtrl
{
    static instance = null;
   
    constructor(){
        if(this.constructor.instance){
            return this.constructor.instance;
        }

        this.constructor.instance = this;

        this.observers = [];
        this.msg = [];
    }

    addObserver(id, update){
        let found = false;
        for(let item of this.observers){
            if(item.id === id){
                found = true;
            }
        }

        if(!found){
            this.observers.push({id:id, update:update});
        }
    }

    removeObserver(id){
        for(let i = 0; i < this.observers.length; i++){
            if(this.observers[i].id === id){
                this.observers.splice(i,1);
            }
        }
    }

    notifyObservers(){        
        for(let o of this.observers){
            o.update();
        }
    }

    showInfo(title, msg, timeout){
        this.msg.push({title: title, msg: msg, type: "info", timeout: timeout});
        this.notifyObservers();
    }
    
    showError(title, msg, timeout){
        this.msg.push({title: title, msg: msg, type: "error", timeout: timeout});
        this.notifyObservers();
    }
    
    showWarning(title, msg, timeout){
        this.msg.push({title: title, msg: msg, type: "warning", timeout: timeout});
        this.notifyObservers();
    }

    removeItem(index){
        if(this.msg.splice(index,1) !== null){
            this.notifyObservers();
        }
    }

    render(){
        let item = this.msg.pop() || null;
        while(item != null){
            let vf = new VisualFeedback();
            vf.render(item.msg, item.type, item.title, item.timeout);
            item = this.msg.pop();
        }
    }
}

class VisualFeedback {
    constructor(){
        this.onDismiss = this.onDismiss.bind(this);

        this.main = null;
    }
    
    render(msg, type, title, timeout) {
        let bsStyle = "";
        let icon = "";
        
        switch(type){
            case 'error':
                bsStyle = "alert-danger";
                icon = "fa-exclamation-triangle";
                break;
            case 'warning':
                bsStyle = "alert-warning";
                icon = "fa-exclamation-triangle";
                break;
            case 'info':                
                bsStyle = "alert-info";
                icon = "fa-info-circle";
                break;
            default:
                bsStyle = "alert-danger";
                icon = "fa-exclamation-triangle";
        }

        if(timeout){
            setTimeout(this.onDismiss, timeout * 1000);
        }
        
        this.main = document.createElement("div");
        this.main.classList.add("VisualFeedback");
        this.main.dataset.feedbackType = type;

        let alert = document.createElement("div");
        alert.classList.add("alert", bsStyle);
        alert.setAttribute("role", "alert");
        this.main.appendChild(alert);

        let btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.classList.add("close");
        btn.addEventListener("click", this.onDismiss);
        alert.appendChild(btn);

        let span = document.createElement("span");
        span.setAttribute("aria-hidden", "true");
        span.innerHTML = "x";
        btn.appendChild(span);

        span = document.createElement("span");
        span.classList.add("sr-only");
        span.innerHTML = "Close alert";
        btn.appendChild(span);

        let alertHeading = document.createElement("div");
        alertHeading.classList.add("alert-heading", "h4");
        alertHeading.innerHTML = title;
        alert.appendChild(alertHeading);

        let paragraph = document.createElement("p");
        alert.appendChild(paragraph);

        let fsIcon = document.createElement("i");
        fsIcon.classList.add("fa", icon);
        paragraph.appendChild(fsIcon);

        let text = document.createElement("span");
        text.innerHTML = ` ${msg}`;
        paragraph.appendChild(text);

        document.body.appendChild(this.main);
    }
    
    onDismiss(){
        this.main.remove();
    }
}

