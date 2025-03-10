$from = "moodle-assignfeedback_recitannotation/src/*"
$to = "shared/recitfad3/mod/assign/feedback/recitannotation/"
$source = "./src";

try {
    . ("..\sync\watcher.ps1")
}
catch {
    Write-Host "Error while loading sync.ps1 script." 
}