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
 * @license   {@link http://www.gnu.org/licenses/gpl-3.0.html} GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * @param int $oldversion the version we are upgrading from
 * @return bool result
 */
function xmldb_assignfeedback_recitannotation_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    $newversion = 2025120802;
    if($oldversion < $newversion){
        // create new table for AI prompts
        $table = new xmldb_table('assignfeedback_recitannot_promptai');

        if (!$dbman->table_exists($table)) {
            $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
            $table->add_field('assignment', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
            $table->add_field('prompt_ai', XMLDB_TYPE_TEXT, null, null, null, null, null);

            $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
            $table->add_key('fkassignmentid', XMLDB_KEY_FOREIGN, ['assignment'], 'assign', ['id']);
            $table->add_key('uniqueassignment', XMLDB_KEY_UNIQUE, ['assignment']);

            $dbman->create_table($table);
        }

        // update table criteria
        $table = new xmldb_table('assignfeedback_recitannot_crit');

        $fields = array(
            new xmldb_field('instruction_ai', XMLDB_TYPE_TEXT, null, null, null, null, null),
        );

        // Conditionally launch add fields
        foreach ($fields as $field){
            if (!$dbman->field_exists($table, $field)) {
                $dbman->add_field($table, $field);
            }
        }

        upgrade_plugin_savepoint(true, $newversion, 'assignfeedback', 'recitannotation');
    }


    return true;
}
