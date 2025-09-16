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
 * @package   assignfeedback_recitannotation
 * @copyright 2025 RÉCIT 
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace recitannotation;

require_once "$CFG->dirroot/user/externallib.php";
require_once __DIR__ . '/recitcommon/PersistCtrl.php';

use DateTime;
use Exception;
use stdClass;

/**
 * Singleton class
 */
class PersistCtrl extends MoodlePersistCtrl
{
    protected static $instance = null;
    
    /**
     * @param MySQL Resource
     * @return PersistCtrl
     */
    public static function getInstance($mysqlConn = null, $signedUser = null)
    {
        if(!isset(self::$instance)) {
            self::$instance = new self($mysqlConn, $signedUser);
        }
        return self::$instance;
    }
    
    protected function __construct($mysqlConn, $signedUser){
        parent::__construct($mysqlConn, $signedUser);
    }
    
    public function hasTeacherAccess($assignment){
        global $DB, $USER;

        $assign = $DB->get_record('assign', ['id' => $assignment], '*', MUST_EXIST);

        $context = \context_course::instance($assign->course);
        $roles = get_user_roles($context, $USER->id, true);

        foreach ($roles as $role) {
            if ($role->shortname == 'editingteacher' || $role->shortname == 'teacher') {
                return true;
            }
        }
        
        if (has_capability('moodle/course:update', $context) || has_capability('moodle/grade:viewall', $context)) {
            return true;
        } 
        
        return false;
    }

    public function getAnnotation($assignmentId, $userId, $attemptnumber = null){

        $vars = [$assignmentId, $userId];
        $whereStmt = " t2.latest = 1";
        
        if($attemptnumber != null){
            $whereStmt = " t2.attemptnumber = ?";
            $vars[] = $attemptnumber;
        }

        $query = "select ". $this->sql_uniqueid() ." uniqueid, coalesce(t1.id, 0) id, 
        coalesce(t1.submission, t2.id) as submission, t1.ownerid, coalesce(t1.annotation, t3.onlinetext) as annotation,
        coalesce(t1.occurrences, '') as occurrences, t1.lastupdate
        from {assign_submission} t2
        inner join {assignsubmission_onlinetext} t3 on t2.id = t3.submission 
        left join {assignfeedback_recitannotation} t1 on t2.id = t1.submission
        where t2.assignment = ? and t2.userid = ? and $whereStmt ";

        $rst = $this->getRecordsSQL($query, $vars);

        $rst = array_pop($rst);

        $result = RecitAnnotation::create($rst);

        // clean html tags
        /*if($result->id == 0){
            $result->annotation = strip_tags($result->annotation, ['<br>', '<p>']);
        }*/
        
        return $result;
    }

    public function saveAnnotation($data){
        try{	
            $record = new stdClass();
            $record->submission = $data->submission;
            $record->ownerid = $this->signedUser->id;
            $record->annotation = $data->annotation;
            $record->occurrences = json_encode($data->occurrences);
            $record->lastupdate = time();

            $lastid = $data->id;
            if($data->id == 0){
                $lastid = $this->mysqlConn->insert_record("assignfeedback_recitannotation", $record);
            }
            else{
                $record->id = $data->id;
                $this->mysqlConn->update_record("assignfeedback_recitannotation", $record);
            }

            return $lastid;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function deletePluginData($assignment){
        global $DB;

        try{
            // delete comments
            $query = "select t1.id
                from {assignfeedback_recitannot_comment} as t1
                inner join {assignfeedback_recitannot_crit} as t2 on t1.criterionid = t2.id
                where t2.assignment = ?";
            $rst = $this->getRecordsSQL($query, [$assignment]);

            $ids = array();
            foreach($rst as $item){
                $ids[] = $item->id;
            }

            if(count($ids) > 0){
                list($in_sql, $params) = $DB->get_in_or_equal($ids);
                $DB->delete_records_select('assignfeedback_recitannot_comment', "id $in_sql", $params);
            }

            // delete criterias
            $this->mysqlConn->delete_records("assignfeedback_recitannot_crit", ['assignment' => $assignment]);

            // delete annotations
            $query = "select t1.id
                    from {assign_submission} t2
                    inner join {assignfeedback_recitannotation} t1 on t2.id = t1.submission
                    where t2.assignment = ?";
            $rst = $this->getRecordsSQL($query, [$assignment]);       

            $ids = array();
            foreach($rst as $item){
                $ids[] = $item->id;
            }

            if(count($ids) > 0){
                list($in_sql, $params) = $DB->get_in_or_equal($ids);
                $DB->delete_records_select('assignfeedback_recitannotation', "id $in_sql", $params);
            }
            
            return true;
        }
        catch(Exception $ex){
            throw $ex;
        }
        /*$DB->delete_records('assignfeedback_recitannot_comment',
                            array('criterionid'=>$this->assignment->get_instance()->id));

        $DB->delete_records('assignfeedback_recitannot_crit',
                            array('assignment'=>$this->assignment->get_instance()->id));
                            
        $DB->delete_records('assignfeedback_recitannotation',
                            array('assignment'=>$this->assignment->get_instance()->id));*/
    }

    public function saveCriterion($data){
        try{	
            $record = new TableCriterion();
            $record->assignment = $data->assignment;
            $record->name = $data->name;
            $record->description = $data->description;
            $record->backgroundcolor = $data->backgroundcolor;
            $record->sortorder = $data->sortorder;

            if($data->id == 0){
                if (!$this->mysqlConn->record_exists('assignfeedback_recitannot_crit', ['name' => $record->name, 'assignment' => $record->assignment])) {
                    // returns inserted ID
                    $record->id = $this->mysqlConn->insert_record("assignfeedback_recitannot_crit", $record, true);
                }
            }
            else{
                $record->id = $data->id;
                $this->mysqlConn->update_record("assignfeedback_recitannot_crit", $record);
            }

            return $record;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function getLastSortOrder($assignment){
        $query = "select coalesce(max(sortorder),0) as sortorder from {assignfeedback_recitannot_crit} 
                where assignment = ?";

        $result = $this->getRecordsSQL($query, array($assignment));

        return array_pop($result);
    }

    public function getCriteriaList($assignment){
        $query = "select * from {assignfeedback_recitannot_crit} 
                where assignment = ?
                order by sortorder asc";

        $result = $this->getRecordsSQL($query, array($assignment));

        return $result;
    }

    public function deleteCriterion($id){
        try{
            /*$query = "select * from {assignfeedback_recitannot_comment} 
                where criterionid = ?";

            $result = $this->getRecordsSQL($query, array($id));

            if(count($result) > 0){
                throw new Exception(get_string('foreign_key', 'assignfeedback_recitannotation'));
            }*/            
            $current = $this->mysqlConn->get_record('assignfeedback_recitannot_crit', ['id' => $id], '*', MUST_EXIST);

            if($current){
                $this->mysqlConn->delete_records("assignfeedback_recitannot_comment", ['criterionid' => $id]);
                $this->mysqlConn->delete_records("assignfeedback_recitannot_crit", ['id' => $id]);
                $this->resequenceSortOrder($current->assignment);
            }

            return true;
        }
        catch(Exception $ex){
            throw $ex;
        }
    }

    public function getCommentList($assignment){
        $query = "SELECT t1.id, t1.criterionid, t2.name,  t2.description, t1.comment 
                    FROM {assignfeedback_recitannot_comment} as t1
                    inner join {assignfeedback_recitannot_crit} as t2 on t1.criterionid = t2.id
                    where t2.assignment = ?
                    order by t2.description, comment";

        $result = $this->getRecordsSQL($query, array($assignment));

        return $result;
    }

    public function deleteComment($id){
        try{
            $this->mysqlConn->delete_records("assignfeedback_recitannot_comment", ['id' => $id]);
            return true;
        }
        catch(Exception $ex){
            throw $ex;
        }
    }

    public function saveComment($data){
        try{	
            $record = new TableComment();
            $record->criterionid = $data->criterionid;
            $record->comment = $data->comment;

            if($data->id == 0){
                if (!$this->mysqlConn->record_exists('assignfeedback_recitannot_comment', ['criterionid' => $record->criterionid, 'comment' => $record->comment])) {
                    $this->mysqlConn->insert_record("assignfeedback_recitannot_comment", $record);
                }
                
            }
            else{
                $record->id = $data->id;
                $this->mysqlConn->update_record("assignfeedback_recitannot_comment", $record);
            }

            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function importCriteriaList($data){
        try{
            libxml_use_internal_errors(true);
            $xml = simplexml_load_string($data->fileContent);

            if ($xml === false) {
                $msg = "";
                foreach(libxml_get_errors() as $error) {
                    $msg .= "\t" . $error->message;
                }

                throw new Exception($msg);
            }

            $sortOrderObj = $this->getLastSortOrder($data->assignment);

            // Loop through each criterion
            foreach ($xml->criterion as $item) {
                $criterion = new TableCriterion();
                $criterion->assignment = (int) $data->assignment;
                $criterion->name = (string) $item->name;
                $criterion->description = (string) $item->description;
                $criterion->backgroundcolor = (string) $item->backgroundcolor;
                $criterion->sortorder = ++$sortOrderObj->sortorder;
                
                $criterion = $this->saveCriterion($criterion);

                // Handle comments
                foreach ($item->comments->comment as $item2) {
                    $comment = new TableComment();
                    $comment->criterionid = $criterion->id;
                    $comment->comment = (string) $item2->comment;
                    $this->saveComment($comment);
                }
            }
           
            return true;
        }
         catch(Exception $ex){
            throw $ex;
        }
    }

    public function changeCriterionSortOrder($id, $direction){
        // 1. Get current item
        $current = $this->mysqlConn->get_record('assignfeedback_recitannot_crit', ['id' => $id], '*', MUST_EXIST);

        // 2. Determine target sortorder
        $targetSort = ($direction === 'up') ? $current->sortorder - 1 : $current->sortorder + 1;

        // 3. Get adjacent item
        $adjacent = $this->mysqlConn->get_record('assignfeedback_recitannot_crit', 
                [
                    'sortorder' => $targetSort,
                    'assignment' => $current->assignment
                ]
            );

        if ($adjacent) {
            // 4. Swap sortorders
            $this->mysqlConn->update_record('assignfeedback_recitannot_crit', ['id' => $current->id, 'sortorder' => $adjacent->sortorder]);
            $this->mysqlConn->update_record('assignfeedback_recitannot_crit', ['id' => $adjacent->id, 'sortorder' => $current->sortorder]);
            return true;
        } else {
            // Can't move (e.g. already at top or bottom)
            return false;
        }
    }

    public function resequenceSortOrder($assignment) {
        // Get items ordered by current sortorder
        $items = $this->mysqlConn->get_records('assignfeedback_recitannot_crit', ['assignment' => $assignment], 'sortorder ASC');

        $i = 1;
        foreach ($items as $item) {
            if ($item->sortorder != $i) {
                $item->sortorder = $i;
                $this->mysqlConn->update_record('assignfeedback_recitannot_crit', $item);
            }
            $i++;
        }
    }
}

class RecitAnnotation{
    public $id = 0;
    public $submission = 0;
    public $ownerid = 0;
    public $annotation = "";
    public $occurrences = "";
    public $lastupdate = 0;

    public static function create($dbData){
        $result = new RecitAnnotation();

        if($dbData == null){
            return $result;
        }
        
        $result->id = intval($dbData->id);
        $result->submission = intval($dbData->submission);
        $result->ownerid = intval($dbData->ownerid);
        $result->annotation = $dbData->annotation; 
        $result->occurrences = $dbData->occurrences; 
        $result->lastupdate = intval($dbData->lastupdate);
        return $result;
    }
}

class TableCriterion{
    public $id = 0;
    public $assignment = 0;
    public $name = "";
    public $description = "";
    public $backgroundcolor = "";
    public $sortorder = 0;
}

class TableComment{
    public $id = 0;
    public $criterionid = 0;
    public $comment = "";
}