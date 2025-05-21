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
 * @package    assignfeedback_recitannotation
 * @copyright  2025 RECIT
 * @license    {@link http://www.gnu.org/licenses/gpl-3.0.html} GNU GPL v3 or later
 */
M.assignfeedback_recitannotation = M.assignfeedback_recitannotation || {};
M.assignfeedback_recitannotation.recitannotation = {
    globalVars: {
        popup: null,
        contextData: {
            assignment: 0,
            submission: 0,
            userid: 0
        }
    },

    init: function(assignment, submission, userid) {
        this.globalVars.contextData.assignment = parseInt(assignment, 10);
        this.globalVars.contextData.submission = parseInt(submission, 10);
        this.globalVars.contextData.userid = parseInt(userid, 10);

        let btn = window.document.getElementById('btn-annotation-tool');
        btn.addEventListener('click', this.openAnnotateTool.bind(this));
    },

    openAnnotateTool: function(event) {
        event.preventDefault();

        // if the reference exists and the window is not closed so we can bring it to the front with the method focus() method without having to recreate the window
        if(this.globalVars.popup !== null && !this.globalVars.popup.closed){
            this.globalVars.popup.focus();
            return;
        }

        let that = this;
        let url = M.cfg.wwwroot + "/mod/assign/feedback/recitannotation/annotation_tool.php";
        this.globalVars.popup = window.open(url,'RÉCIT Annotation',`width=${screen.availWidth},height=${screen.availHeight},scrollbars=1,menubar=0`);

        this.globalVars.popup.IWrapper = {};
        
        this.globalVars.popup.IWrapper.sesskey = function(){
            return window.M.cfg.sesskey;
        }

        this.globalVars.popup.IWrapper.wwwroot = function(){
            return window.M.cfg.wwwroot;
        }

        this.globalVars.popup.IWrapper.getContextData = function(){
            return that.globalVars.contextData;
        }

        this.globalVars.popup.IWrapper.update = function(){
            that.globalVars.popup.close();
            window.location.reload();
        }
    }
};
