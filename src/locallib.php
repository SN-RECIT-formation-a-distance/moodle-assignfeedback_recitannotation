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
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once(dirname(__FILE__).'/classes/PersistCtrl.php');

define('ASSIGNFEEDBACK_RECITANNOTATION_FILEAREA', 'feedback');
define('ASSIGNFEEDBACK_RECITANNOTATION_COMPONENT', 'assignfeedback_recitannotation');

/**
 * @package assignfeedback_recitannotation
 * @copyright 2025 RECIT
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class assign_feedback_recitannotation extends assign_feedback_plugin {

    /**
     * Get the name of the file feedback plugin.
     *
     * @return string
     */
    public function get_name() {
        return get_string('pluginname', 'assignfeedback_recitannotation');
    }

     /**
     * Get the feedback comment from the database.
     *
     * @param int $gradeid
     * @return stdClass|false The feedback comments for the given grade if it exists.
     *                        False if it doesn't.
     */
    public function get_feedback_annotation($gradeid) {
        global $DB;
        return $DB->get_record('assignfeedback_recitannotation', array('grade'=>$gradeid));
    }

    /**
     * Get file areas returns a list of areas this plugin stores files.
     *
     * @return array - An array of fileareas (keys) and descriptions (values)
     */
    public function get_file_areas() {
        return array(ASSIGNFEEDBACK_RECITANNOTATION_FILEAREA=>$this->get_name());
    }

    /**
     * Return a description of external params suitable for uploading an feedback comment from a webservice.
     *
     * @return \core_external\external_description|null
     */
    public function get_external_parameters() {
        $editorparams = array('text' => new external_value(PARAM_RAW, 'The text for this feedback.'),
                              'format' => new external_value(PARAM_INT, 'The format for this feedback'));
        $editorstructure = new external_single_structure($editorparams, 'Editor structure', VALUE_OPTIONAL);
        return array('assignfeedbackrecitannotation_editor' => $editorstructure);
    }

    /**
     * Get form elements for the grading page
     *
     * @param stdClass|null $grade
     * @param MoodleQuickForm $mform
     * @param stdClass $data
     * @return bool true if elements were added to the form
     */
    public function get_form_elements_for_user($grade, MoodleQuickForm $mform, stdClass $data, $userid) {        
        global $PAGE, $DB, $USER;

        $persistCtrl = \recitannotation\PersistCtrl::getInstance($DB, $USER);

        $data = $persistCtrl->getAnnotation($grade->assignment, $userid);
        
        $html = "<div>";
        $html .= "<div id='assignfeedbackrecitannotation_content'>{$data->annotation}</div>";
        $html .= "<button class='btn btn-primary' id='btn-annotation-tool'><i class='fa fa-comments'></i> Annotate</button>";
        $html .= "</div>";
        $group[] = $mform->createElement('static', 'assignfeedbackrecitannotation_btnannotation', '', $html);
        
        $PAGE->requires->yui_module('moodle-assignfeedback_recitannotation-button', 'M.assignfeedback_recitannotation.recitannotation.init', array($grade->assignment, $data->submission, $userid));

        $mform->addGroup($group, 'assignfeedbackrecitannotation_group', $this->get_name(), '', false, array('class' => 'has-popout'));
        

        return true;
    }

    /**
     * The assignment has been deleted - cleanup.
     *
     * @return bool
     */
    public function delete_instance() {
        global $DB;
        // Will throw exception on failure.
        $DB->delete_records('assignfeedback_recitannotation',
                            array('assignment'=>$this->assignment->get_instance()->id));

        return true;
    }

    /**
     * Called by the assignment module when someone chooses something from the
     * grading navigation or batch operations list.
     *
     * @param string $action - The page to view
     * @return string - The html response
     */
    public function view_page($action) {
        

        return 'view_page';
    }

    /**
     * Return a list of the grading actions performed by this plugin.
     * This plugin supports upload zip.
     *
     * @return array The list of grading actions
     */
    public function get_grading_actions() {
        return array('my_grading_action'=> 'my_grading_action');
    }

    /**
     * Return the plugin configs for external functions.
     *
     * @return array the list of settings
     * @since Moodle 3.2
     */
    public function get_config_for_external() {
        return (array) $this->get_config();
    }
}