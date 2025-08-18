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
 
class Options
{
    static function getAiApiEndpoint(){ 
        return get_config('assignfeedback_recitannotation', 'ai_api_endpoint');
    }

    static function getAiApiKey(){ 
        return get_config('assignfeedback_recitannotation', 'ai_api_key');
    }

    static function isAiApiActive(){
        $endpoint = Options::getAiApiEndpoint();
        $api_key = Options::getAiApiKey();

        if((strlen($endpoint) > 0) && (strlen($api_key) > 0)){
            return true;
        }
        else{
            return false;
        }
    }
}