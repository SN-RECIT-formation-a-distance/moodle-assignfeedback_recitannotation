<?php 

require('../../../../config.php');
require_login();
?>
<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css"  href="<?php echo $CFG->wwwroot; ?>/mod/assign/feedback/recitannotation/react/build/index.css">
        <!-- This is necessary for tooltip Bootstrap -->
        <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </head>
    <body>
        <div id="recitannotation_placeholder"></div>       
        <script type="text/javascript" src="<?php echo $CFG->wwwroot; ?>/mod/assign/feedback/recitannotation/react/build/index.js"></script>
    </body>
</html>