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

require_once(dirname(__FILE__).'/classes/Options.php');
require_once(dirname(__FILE__).'/classes/PersistCtrl.php');

//define('ASSIGNFEEDBACK_RECITANNOTATION_FILEAREA', 'feedback');
//define('ASSIGNFEEDBACK_RECITANNOTATION_COMPONENT', 'assignfeedback_recitannotation');

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
        return get_string('pluginname2', 'assignfeedback_recitannotation');
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
    /*public function get_file_areas() {
        return array(ASSIGNFEEDBACK_RECITANNOTATION_FILEAREA=>$this->get_name());
    }*/

    /**
     * Return a description of external params suitable for uploading an feedback comment from a webservice.
     *
     * @return \core_external\external_description|null
     */
    /*public function get_external_parameters() {
        $editorparams = array('text' => new external_value(PARAM_RAW, 'The text for this feedback.'),
                              'format' => new external_value(PARAM_INT, 'The format for this feedback'));
        $editorstructure = new external_single_structure($editorparams, 'Editor structure', VALUE_OPTIONAL);
        return array('assignfeedbackrecitannotation_editor' => $editorstructure);
    }*/

    /**
     * Get form elements for the grading page
     *
     * @param stdClass|null $grade
     * @param MoodleQuickForm $mform
     * @param stdClass $data
     * @return bool true if elements were added to the form
     */
    public function get_form_elements_for_user($grade, MoodleQuickForm $mform, stdClass $data, $userid) {        
        global $PAGE, $DB, $USER, $CFG;

        $persistCtrl = \recitannotation\PersistCtrl::getInstance($DB, $USER);

        $data = $persistCtrl->getAnnotation($grade->assignment, $userid);
        
        /*$html = "<div>";
        
        $html .= "<div class='mb-3'>{$data->annotation}</div>";
        
        if(strlen($data->generalfeedback) > 0){
            $html .= "<div class='mb-3'>";
            $html .= "<b>Rétroaction générale:</b>";
            $html .= "<p>{$data->generalfeedback}</p>";
            $html .= "</div>";
        }
        
        $html .= "<button class='btn btn-primary' id='btn-annotation-tool'><i class='fa fa-comments'></i> Annotate</button>";
        $html .= "</div>";*/
        
        $group[] = $mform->createElement('static', '', '', "<div id='recitannotation_appreact_placeholder' style='position: sticky; top: 0;' class='bg-white rounded'></div>");
        
       // $PAGE->requires->yui_module('moodle-assignfeedback_recitannotation-button', 'M.assignfeedback_recitannotation.recitannotation.init', array($grade->assignment, $data->submission, $userid));

        $html = html_writer::script('', "{$CFG->wwwroot}/mod/assign/feedback/recitannotation/react/build/index.js");
        $html .= "<link href='{$CFG->wwwroot}/mod/assign/feedback/recitannotation/react/build/index.css' rel='stylesheet'></link>";
        
        $strings = array('pluginname' => '', 'msg_action_completed' => '', 'msg_confirm_deletion' => '', 'student_production' => '', 
                    'undo' => '', 'redo' => '', 'clean_student_production' => '', 'annotate' => '', 'ask_ai' => '', 
                    'occurrences' => '', 'criterion' => '', 'count' => '', 'msg_confirm_clean_html_code' => '', 'select_item' => '', 
                    'comment' => '', 'search_comment' => '', 'add_edit_comment' => '', 'delete' => '', 'cancel' => '', 
                    'save' => '', 'msg_required_field' => '', 'msg_error_highlighting' => '', 'ask_question' => '', 'ask' => '',
                    'back_annotation_view' => '', 'criteria_list' => '', 'comment_list' => '', 'add_new_item' => '', 'import_criteria' => '', 
                    'export_criteria' => '', 'name' => '', 'description' => '', 'color' => '', 'edit' => '', 
                    'move_up' => '', 'move_down' => '', 'only_lowercase' => '', 'add_edit_criterion' => '', 'ok' => '');
        
        foreach($strings as $key => $value){
            $strings[$key] = get_string($key, 'assignfeedback_recitannotation');
        }

        $html .= html_writer::script("
            require(['recitannotation'], function () {
                if (window.loadRecitAnnotationReactApp) {
                    window.loadRecitAnnotationReactApp({
                        assignment: " . json_encode($grade->assignment) . ",
                        submission: " . json_encode($data->submission) . ",
                        userid: " . json_encode($userid) . ",
                        aiApi: ". json_encode(\recitannotation\Options::isAiApiActive()) ."
                    },
                    ". json_encode($strings) .");
                }
            });            
        ");

        $group[] = $mform->createElement('static', '', '', $html);

        $mform->addGroup($group, 'assignfeedbackrecitannotation_group', $this->get_name(), '', false, array('class' => 'has-popout invisible'));
        

        return true;
    }

    /**
     * Display the comment in the feedback table.
     *
     * @param stdClass $grade
     * @param bool $showviewlink Set to true to show a link to view the full feedback
     * @return string
     */
    public function view_summary(stdClass $grade, & $showviewlink) {
        global $DB, $USER;
       
        $showviewlink = false;

        $persistCtrl = \recitannotation\PersistCtrl::getInstance($DB, $USER);
        $data = $persistCtrl->getAnnotation($grade->assignment, $grade->userid, $grade->attemptnumber);
        $criteriaList = $persistCtrl->getCriteriaList($grade->assignment);

        $html = "<div class='bg-white p-2'>";

        $html .= "<div class='mb-3 p-2'>$data->annotation</div>";

        $data->occurrences = json_decode($data->occurrences);
        $html .= "<table class='w-50 table table-striped table-bordered bordered table-sm'>";
        $html .= "<thead>";
        $html .= "<tr>";
        $html .= "<th>Critère</th>";
        $html .= "<th>Nombre</th>";
        $html .= "</tr>";            
        $html .= "</thead>";
        $html .= "<tbody>";       

        foreach($criteriaList as $criterion){
            $attr = $criterion->name;
            if(!isset($data->occurrences->$attr)){
                continue;
            }

            $html .= "<tr>";
            $html .= "<td style='background-color: {$criterion->backgroundcolor} '>{$criterion->description}</td>";
            $html .= "<td>". $data->occurrences->$attr."</td>";
            $html .= "</tr>";    
        }
        

        $html .= "</tbody>";
        $html .= "</table>";
        
        $html .= "</div>";

        return $html;        
    }

    /**
     * Display the comment in the feedback table.
     *
     * @param stdClass $grade
     * @return string
     */
    public function view(stdClass $grade) {
        return "";
    }

    /**
     * Saving the comment content into database.
     *
     * @param stdClass $grade
     * @param stdClass $data
     * @return bool
     */
    public function save(stdClass $grade, stdClass $data) {
        return true;
    }

     /**
     * Has the comment feedback been modified?
     *
     * @param stdClass $grade The grade object.
     * @param stdClass $data Data from the form submission.
     * @return boolean True if the comment feedback has been modified, else false.
     */
    public function is_feedback_modified(stdClass $grade, stdClass $data) {
        return true;
    }

    /**
     * Returns true if there are no feedback comments for the given grade.
     *
     * @param stdClass $grade
     * @return bool
     */
    public function is_empty(stdClass $grade) {
        global $DB, $USER;
       
        $persistCtrl = \recitannotation\PersistCtrl::getInstance($DB, $USER);
        $data = $persistCtrl->getAnnotation($grade->assignment, $grade->userid, $grade->attemptnumber);

        return ($data->id == 0);
    }
    /**
     * The assignment has been deleted - cleanup.
     *
     * @return bool
     */
    public function delete_instance() {
        global $DB, $USER;
       
        $persistCtrl = \recitannotation\PersistCtrl::getInstance($DB, $USER);
        return $persistCtrl->deletePluginData($this->assignment->get_instance()->id);
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