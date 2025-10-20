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
 *
 * @package   assignfeedback_recitannotation
 * @copyright 2025 RÉCIT 
 * @license   {@link http://www.gnu.org/licenses/gpl-3.0.html} GNU GPL v3 or later
 */

namespace recitannotation;

require('../../../../../config.php');
require_once dirname(__FILE__).'/PersistCtrl.php';

$assignment = required_param('assignment', PARAM_INT);
$cmid = required_param('cmid', PARAM_INT);

require_login();

$PAGE->set_context(\context_module::instance($cmid));

$theme = \theme_config::load($PAGE->theme->name);

$brandImage = "{$CFG->wwwroot}/mod/assign/feedback/recitannotation/pix/recit-logo.png";
$customerLogo = $theme->setting_file_url('logo', 'logo');
if(!empty($customerLogo)){
    $brandImage = $customerLogo;
}

$persistCtrl = PersistCtrl::getInstance($DB, $USER);

$isTeacher = $persistCtrl->hasTeacherAccess($assignment);

if(!$isTeacher){
    throw new \moodle_exception(get_string('access_denied', 'assignfeedback_recitannotation'));
}

$commentList = $persistCtrl->getCommentList($assignment);

$pageTitle = sprintf("%s: %s", get_string('pluginname', 'assignfeedback_recitannotation'), get_string('comment_list', 'assignfeedback_recitannotation'));
?>

<!DOCTYPE html>
<html>
<head>
    <title><?php echo $pageTitle; ?></title>    
    <link rel="stylesheet" type="text/css" href="<?php echo $CFG->wwwroot . "/theme/styles.php/{$CFG->theme}/{$CFG->themerev}_1/all"?>">
    <link rel="stylesheet" type="text/css" href="<?php echo $CFG->wwwroot . "/mod/recitcahiertraces/css/report.css"; ?>">
    <link rel="icon" href="../pix/recit-logo.png" />
</head>

<body>
    <div class='Portrait cahier-traces-print-notes'>
        <header class='Header'>
            <div style='flex-grow: 1'>
                <div class='Title'><?php echo get_string('pluginname', 'assignfeedback_recitannotation'); ?></div>
                <div class='Subtitle'><?php echo sprintf("%s", get_string('comment_list', 'assignfeedback_recitannotation'));  ?></div>
            </div>
            <div class='Logo'><img src='<?php echo $brandImage; ?>' alt='brand logo'/></div>
        </header>
    <?php 

        if(empty($commentList)){
            echo "<h6>".get_string('no_data', 'assignfeedback_recitannotation')."</h6>";
        }
        else{
            ?>
                <table class="table table-sm table-striped table-bordered">
                    <thead>
                        <tr>
                            <th><?php echo get_string('criterion', 'assignfeedback_recitannotation'); ?></th>    
                            <th><?php echo get_string('comment', 'assignfeedback_recitannotation'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                            foreach($commentList as $item){
                        ?>
                            <tr>
                                <td><?php echo $item->description; ?></td>    
                                <td><?php echo $item->comment; ?></td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
        <?php } ?>

        <footer class="text-left mt-5">
            <?php echo sprintf("%s: %s", get_string('printed_on', 'assignfeedback_recitannotation'), date('Y-m-d H:i:s')); ?>
        </footer>
    </div>
</body>

</html>