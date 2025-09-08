<?php
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
 * @package assignfeedback_recitannotation
 * @copyright 2025 RECIT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/** 
 * @package assignfeedback_recitannotation
 * @copyright 2025 RECIT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class backup_assignfeedback_recitannotation_subplugin extends backup_subplugin {

    /**
     * Returns the subplugin information to attach to submission element.
     * @return backup_subplugin_element
     */
    protected function define_grade_subplugin_structure() {
        global $DB;

        try{
            // To know if we are including userinfo
            // not necessary to check userinfo because it is already checked before to be able to include grade data
            // $userinfo = $this->get_setting_value('userinfo');

            // This wrapper is required around your plugin's elements.
            $subplugin = $this->get_subplugin_element();
            $wrapper = new backup_nested_element($this->get_recommended_name());

            // Define your main and child elements
            $annotation = new backup_nested_element('feedback_recitannot_annot', ['id'], [
                'userid', 'ownerid', 'annotation', 'occurrences', 'lastupdate'
            ]);

            $crits = new backup_nested_element('feedback_recitannot_crits'); // container
            $crit = new backup_nested_element('recitannot_crit', ['id'], [
                'assignment', 'name', 'description', 'backgroundcolor', 'sortorder'
            ]);

            $comments = new backup_nested_element('feedback_recitannot_comments'); // container
            $comment = new backup_nested_element('recitannot_comment', ['id'], [
                'criterionid', 'comment'
            ]);

            // Build the XML structure
            $subplugin->add_child($wrapper);
            $wrapper->add_child($annotation); 
            $wrapper->add_child($crits); // container
            $crits->add_child($crit); // actual data
            $crit->add_child($comments); // container
            $comments->add_child($comment); // actual data

            // Set data sources
            //if($userinfo){
                $annotation->set_source_sql('SELECT t1.id, t1.ownerid, t1.annotation, t1.occurrences, t1.lastupdate, t2.userid 
                            from {assignfeedback_recitannotation} t1 inner join {assign_submission} t2 on t1.submission = t2.id 
                            where t2.assignment = (SELECT assignment FROM {assign_grades} WHERE id = :gradeid and userid = t2.userid)', 
                            array('gradeid' => backup::VAR_PARENTID));
            //}
            

            $crit->set_source_sql('SELECT t1.id, t1.assignment, t1.name, t1.description, t1.backgroundcolor, t1.sortorder 
                            from {assignfeedback_recitannot_crit} t1 
                            where t1.assignment = (SELECT assignment FROM {assign_grades} WHERE id = :gradeid)', 
                            array('gradeid' => backup::VAR_PARENTID));

            $comment->set_source_table('assignfeedback_recitannot_comment', [
                'criterionid' => backup::VAR_PARENTID
            ]);

            return $subplugin;
        }
        catch(Exception $ex){
            debugging("Exception on define_grade_subplugin_structure: " . $ex->GetMessage(), DEBUG_DEVELOPER);
        }
    }
}
