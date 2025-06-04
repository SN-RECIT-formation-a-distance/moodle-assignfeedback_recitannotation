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
    moodleData: {
        assignment: 0,
        submission: 0,
        userid: 0,
        sesskey: window.M.cfg.sesskey,
        wwwroot: window.M.cfg.wwwroot,
    },

    init: function(assignment, submission, userid) {
        this.moodleData.assignment = parseInt(assignment, 10);
        this.moodleData.submission = parseInt(submission, 10);
        this.moodleData.userid = parseInt(userid, 10);

        var style = document.createElement("link");
        style.setAttribute('href', M.cfg.wwwroot + "/mod/assign/feedback/recitannotation/react/build/index.css");
        style.setAttribute('rel', "stylesheet");
        document.getElementsByTagName('head')[0].appendChild(style);

        var script = document.createElement('script');
        var that = this;
        script.onload = function(){
            if (window.loadRecitAnnotationReactApp){
                window.loadRecitAnnotationReactApp(that.moodleData);
            }
        }
        script.setAttribute('src', M.cfg.wwwroot + "/mod/assign/feedback/recitannotation/react/build/index.js?1");
        script.setAttribute('id', 'recitannotation');
        script.setAttribute('type', 'text/javascript');
        document.getElementsByTagName('head')[0].appendChild(script);
    },
};
