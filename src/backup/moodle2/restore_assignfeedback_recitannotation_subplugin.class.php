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
 * Restore subplugin class.
 *
 * Provides the necessary information needed
 * to restore one assign_feedback subplugin.
 *
* @package assignfeedback_recitannotation
 * @copyright 2025 RECIT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class restore_assignfeedback_recitannotation_subplugin extends restore_subplugin {
   /**
     * Returns the paths to be handled by the subplugin at workshop level
     * @return array
     */
    protected function define_grade_subplugin_structure() {
        $paths = [];
        // it is useless to check if userinfo is checked here because the assignment user data is checked before it gets to this point.
        //$userinfo = $this->get_setting_value('userinfo');
       
        $elementname = $this->get_namefor('annotation');
        $elementpath = $this->get_pathfor('/feedback_recitannot_annot');
        $paths[] = new restore_path_element($elementname, $elementpath);

        $elementname = $this->get_namefor('criterion');
        $elementpath = $this->get_pathfor('/feedback_recitannot_crits/recitannot_crit');
        $paths[] = new restore_path_element($elementname, $elementpath);

        $elementname = $this->get_namefor('comment');
        $elementpath = $this->get_pathfor('/feedback_recitannot_crits/recitannot_crit/feedback_recitannot_comments/recitannot_comment');
        $paths[] = new restore_path_element($elementname, $elementpath);

        return $paths;
    }

    public function process_assignfeedback_recitannotation_annotation($data) {
        global $DB;

        $data = (object)$data;
        if ($data->ownerid > 0) {
            $data->ownerid = $this->get_mappingid('user', $data->ownerid);
        }

        if ($data->userid > 0) {
            $data->userid = $this->get_mappingid('user', $data->userid);
        }
         
        $assignment = $this->get_new_parentid('assign');
        $submission = $DB->get_record('assign_submission', ['assignment' => $assignment, 'userid' => $data->userid], 'id', MUST_EXIST);
        $data->submission = $submission->id;

        //debugging(print_r($data, true), DEBUG_DEVELOPER);

        // Insert new record
        $DB->insert_record('assignfeedback_recitannotation', $data);
    }

    /**
     * @param mixed $data
     */
    public function process_assignfeedback_recitannotation_criterion($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;
        
        $data->assignment = $this->get_new_parentid('assign');

        // Insert new record
        $newitemid = $DB->insert_record('assignfeedback_recitannot_crit', $data);

        // Save mapping for child table
        $this->set_mapping('criterion', $oldid, $newitemid);
    }

    /**
     * @param mixed $data
     */
    public function process_assignfeedback_recitannotation_comment($data) {
        global $DB;

        $data = (object)$data;

       // Map foreign key
        $data->criterionid = $this->get_mappingid('criterion', $data->criterionid);

        if ($data->criterionid) {
            $DB->insert_record('assignfeedback_recitannot_comment', $data);
        } else {
            debugging("Could not find mapping for criterionid!", DEBUG_DEVELOPER);
        }
    }

}
