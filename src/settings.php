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
 * This file defines the admin settings for this plugin
 *
 * @package assignfeedback_recitannotation
 * @copyright 2025 RECIT
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$settings->add(new admin_setting_configcheckbox('assignfeedback_recitannotation/default',
                   new lang_string('default', 'assignfeedback_recitannotation'),
                   new lang_string('default_help', 'assignfeedback_recitannotation'), 0));

$name = 'assignfeedback_recitannotation/ai_api_endpoint';
$title = get_string('ai_api_endpoint', 'assignfeedback_recitannotation');
$description = get_string('ai_api_endpoint_desc', 'assignfeedback_recitannotation');
$default = '';
$setting = new admin_setting_configtext($name, $title, $description, $default);
$settings->add($setting);

$name = 'assignfeedback_recitannotation/ai_api_key';
$title = get_string('ai_api_key', 'assignfeedback_recitannotation');
$description = get_string('ai_api_key_desc', 'assignfeedback_recitannotation');
$default = '';
$setting = new admin_setting_configtext($name, $title, $description, $default);
$settings->add($setting);