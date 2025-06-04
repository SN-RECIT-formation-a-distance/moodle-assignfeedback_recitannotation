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
    
     public function getContextAccessIds($userId, $capabilities, $contextlevel){
        global $DB;
        
        $ids = array();
        if ($contextlevel == 40){//Categories
            $categories = $DB->get_records_sql("SELECT id FROM {course_categories}");
            foreach ($categories as $cat){
                $hasAccess = false;
                $ccontext = \context_coursecat::instance($cat->id);
                foreach ($capabilities as $c){
                    if (has_capability($c, $ccontext, $userId, false)) {
                        $hasAccess = true;
                    }
                }
                if ($hasAccess){
                    $ids[] = $cat->id;
                }
            }
        }else if ($contextlevel == 50){//Courses
            $courses = enrol_get_users_courses($userId, false, 'id, shortname');
            foreach ($courses as $course){
                $hasAccess = false;
                $ccontext = \context_course::instance($course->id);
                foreach ($capabilities as $c){
                    if (has_capability($c, $ccontext, $userId, false)) {
                        $hasAccess = true;
                    }
                }
                if ($hasAccess){
                    $ids[] = $course->id;
                }
            }
        }
        $ids = implode(',', $ids);
        if (empty($ids)) $ids = '0';
        return $ids;
    }

    public function hasTeacherAccess($userId){
        $capabilities = array(RECITWORKPLAN_ASSIGN_CAPABILITY, RECITWORKPLAN_MANAGE_CAPABILITY);
        $isTeacher = $this->getContextAccessIds($userId, $capabilities, 50) != '0' || $this->getContextAccessIds($userId, $capabilities, 40) != '0';
        return $isTeacher;
    }

    public function getAnnotation($assignmentId, $userId){
        $query = "select ". $this->sql_uniqueid() ." uniqueid, coalesce(t1.id, 0) id, 
        coalesce(t1.submission, t2.id) as submission, t1.ownerid, coalesce(t1.annotation, t3.onlinetext) as annotation,
        coalesce(t1.occurrences, '') as occurrences, t1.lastupdate
        from {assign_submission} t2
        inner join {assignsubmission_onlinetext} t3 on t2.id = t3.submission 
        left join {assignfeedback_recitannotation} t1 on t2.id = t1.submission
        where t2.assignment = ? and t2.userid = ?";

        $rst = $this->getRecordsSQL($query, [$assignmentId, $userId]);

        $rst = array_pop($rst);

        $result = RecitAnnotation::create($rst);

        if($result->id == 0){
            $result->annotation = strip_tags($result->annotation, ['<br>', '<p>']);
        }
        
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

            if($data->id == 0){
                $this->mysqlConn->insert_record("assignfeedback_recitannotation", $record);
            }
            else{
                $record->id = $data->id;
                $this->mysqlConn->update_record("assignfeedback_recitannotation", $record);
            }

            return true;
        }
        catch(\Exception $ex){
            throw $ex;
        }
    }

    public function getCriteriaList(){
        $query = "select * from {assignfeedback_recitannot_crit} order by description asc";

        $result = $this->getRecordsSQL($query);

        return $result;
    }

    public function getCommentList(){
        $query = "SELECT t1.id, t2.name, t1.comment 
                    FROM {assignfeedback_recitannot_comment} as t1
                    inner join {assignfeedback_recitannot_crit} as t2 on t1.criterionid = t2.id
                    order by name, comment";

        $result = $this->getRecordsSQL($query);

        return $result;
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