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

require_once(dirname(__FILE__).'../../../../../../config.php');
require_once dirname(__FILE__).'/recitcommon/WebApi.php';
require_once dirname(__FILE__).'/PersistCtrl.php';
require_once dirname(__FILE__).'/Options.php';

use Exception;
use stdClass;

class WebApi extends MoodleApi
{
    protected $ctrl = null;
    
    public function __construct($DB, $COURSE, $USER){
        parent::__construct($DB, $COURSE, $USER);
        $this->ctrl = PersistCtrl::getInstance($DB, $USER);
    }
    /**
     * $level [a = admin | s = student]
     */
    public function canUserAccess($level, $assignment){        
        $isTeacher = $this->ctrl->hasTeacherAccess($assignment);
        
         // if the level is admin then the user must have access to CAPABILITY
        if(($level == 'a') && $isTeacher){
            return true;
        }
        // if the user is student then it has access only if it is accessing its own stuff
        else if(($level == 's')){
            return true;
        }
        else{
            throw new Exception(get_string('access_denied', 'assignfeedback_recitannotation'));
        }
    }
    
    public function getAnnotationFormKit($request){
        try{            
            $assignment = clean_param($request['assignment'], PARAM_INT);
            $attemptnumber = clean_param($request['attemptnumber'], PARAM_INT);
            $userid = clean_param($request['userid'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $result = $this->ctrl->getAnnotation($assignment, $userid, $attemptnumber);
            $this->prepareJson($result);
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function getCriteriaList($request){
        try{            
            $assignment = clean_param($request['assignment'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $result = new stdClass();
            $result->criteriaList = $this->ctrl->getCriteriaList($assignment);
            $result->commentList = $this->ctrl->getCommentList($assignment);
            $this->prepareJson($result);
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function saveCriterion($request){
        try{            
            $data = json_decode(json_encode($request['data']), FALSE);

            $this->canUserAccess('a', $data->assignment);

            $result = $this->ctrl->saveCriterion($data);

            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function deleteCriterion($request){
        try{
            $assignment = clean_param($request['assignment'], PARAM_INT);
            $id = clean_param($request['id'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $this->ctrl->deleteCriterion($id);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function saveAnnotation($request){
        try{            
            $data = json_decode(json_encode($request['data']), FALSE);
            $assignment = clean_param($request['assignment'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $result = $this->ctrl->saveAnnotation($data);

            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function saveComment($request){
        try{
            $data = json_decode(json_encode($request['data']), FALSE);
            $assignment = clean_param($request['assignment'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $result = $this->ctrl->saveComment($data);

            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function deleteComment($request){
        try{
            $id = clean_param($request['id'], PARAM_INT);
            $assignment = clean_param($request['assignment'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $this->ctrl->deleteComment($id);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function exportCriteriaList($request){
        try{
            $assignment = clean_param($request['assignment'], PARAM_INT);
            $this->canUserAccess('a', $assignment);

            $criteriaList = $this->ctrl->getCriteriaList($assignment);
            $commentList = $this->ctrl->getCommentList($assignment);

            $doc = new \DOMDocument('1.0', 'UTF-8');
            $doc->formatOutput = true;

            $root = $doc->createElement('criteria');
            $doc->appendChild($root);

            foreach($criteriaList as $criterionData){
                $criterion = $doc->createElement('criterion');
                $criterion->appendChild($doc->createElement('name', $criterionData->name));
                $criterion->appendChild($doc->createElement('description', $criterionData->description));
                $criterion->appendChild($doc->createElement('backgroundcolor', $criterionData->backgroundcolor));
                $criterion->appendChild($doc->createElement('sortorder', $criterionData->sortorder));
                $root->appendChild($criterion);

                $comments = $doc->createElement('comments');
                $criterion->appendChild($comments);

                foreach($commentList as $commentData){
                    if($commentData->criterionid != $criterionData->id){
                        continue;
                    }
                    $comment = $doc->createElement('comment');
                    $comment->appendChild($doc->createElement('comment', $commentData->comment));
                    $comments->appendChild($comment);
                }
                
            }
           
            $file = new stdClass();
            $file->filename = sys_get_temp_dir() . '/export-criteria-list-' . time() . '.xml';
            $file->charset = 'UTF-8';
            $doc->save($file->filename);

            return new WebApiResult(true, $file, "", 'application/xml');
        }
        catch(Exception $ex){
            throw $ex;
        }
    }

    public function importCriteriaList($request){
        try{
            $data = json_decode(json_encode($request['data']), FALSE);

            $this->canUserAccess('a', $data->assignment);
            
            $this->ctrl->importCriteriaList($data);
            return new WebApiResult(true);
        }
        catch(Exception $ex){
            return new WebApiResult(false, null, $ex->GetMessage());
        }
    }
    
    public function changeCriterionSortOrder($request){
        try{            
            $id = clean_param($request['id'], PARAM_INT);
            $direction = clean_param($request['direction'], PARAM_TEXT);
            $assignment = clean_param($request['assignment'], PARAM_INT);

            $this->canUserAccess('a', $assignment);

            $result = $this->ctrl->changeCriterionSortOrder($id, $direction);
            return new WebApiResult(true, $result);
        }
        catch(Exception $ex){
            return new WebApiResult(false, false, $ex->GetMessage());
        }
    }

    public function callAzureAI($request){
        try{
            $assignment = clean_param($request['assignment'], PARAM_INT);
            $payload = json_decode(json_encode($request['payload']), FALSE);

            $this->canUserAccess('a', $assignment);

            // Replace these with your Azure details
            $endpoint = Options::getAiApiEndpoint();
            $api_key = Options::getAiApiKey();

            // Setup headers
            $headers = [
                "Content-Type: application/json",
                "api-key: $api_key"
            ];

            // Initialize cURL
            $ch = curl_init($endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

            // Execute request
            $response = curl_exec($ch);

            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                throw new Exception($error);
            }

            curl_close($ch);

            return new WebApiResult(true, json_decode($response));
        }
        catch(Exception $ex){
            return new WebApiResult(false, null, $ex->GetMessage());
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////
$PAGE->set_context(\context_system::instance());
$webapi = new WebApi($DB, $COURSE, $USER);
$webapi->getRequest($_REQUEST);
$webapi->processRequest();
$webapi->replyClient();