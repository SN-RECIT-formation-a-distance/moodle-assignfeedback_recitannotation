// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package   assignfeedback_recitannotation
 * @copyright 2025 RÉCIT 
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {WebApi, JsNx} from '../libs/utils/Utils';
import { $glVars } from './common';
import { Options } from './Options';

export class AppWebApi extends WebApi
{    
    constructor(){
        super(Options.getGateway(), $glVars.moodleData.sesskey);
                
        this.http.useCORS = true;
        this.sid = 0;
        this.observers = [];
        this.http.timeout = 30000; // 30 secs
    }

    addObserver(id, update, observables){
        this.observers.push({id:id, update:update, observables: observables});
    }

    removeObserver(id){
        JsNx.removeItem(this.observers, "id", id);
    }

    notifyObservers(observable){
        for(let o of this.observers){
            if(o.observables.includes(observable)){
                o.update();
            }
        }
    }

    getAnnotationFormKit(assignment, userid, onSuccess){
        let data = {assignment: assignment, userid: userid, service: "getAnnotationFormKit"};
        this.post(this.gateway, data, onSuccess);
    } 

    getCriteriaList(assignment, onSuccess){
        let data = {assignment: assignment, service: "getCriteriaList"};
        this.post(this.gateway, data, onSuccess);
    } 

    deleteCriterion(id, onSuccess){
        let data = {id: id, service: "deleteCriterion"};
        this.post(this.gateway, data, onSuccess);
    }

    importCriteriaList(data, onSuccess){
        data = {data: data, service: "importCriteriaList"};
        this.post(this.gateway, data, onSuccess); 
    }

    saveCriterion(data, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveCriterion');
            }
        };

        let options = {data: data, service: "saveCriterion"};
        this.post(this.gateway, options, onSuccessTmp, null, true);
    }

    saveAnnotation(data, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveAnnotation');
            }
        };

        let options = {data: data, service: "saveAnnotation"};
        this.post(this.gateway, options, onSuccessTmp, null, true);
    }

    deleteComment(id, onSuccess){
        let data = {id: id, service: "deleteComment"};
        this.post(this.gateway, data, onSuccess);
    }

    saveComment(data, onSuccess){
        let that = this;
        let onSuccessTmp = function(result){     
            onSuccess(result);
            if(result.success){
                that.notifyObservers('saveComment');
            }
        };

        let options = {data: data, service: "saveComment"};
        this.post(this.gateway, options, onSuccessTmp, null, true);
    }
};
