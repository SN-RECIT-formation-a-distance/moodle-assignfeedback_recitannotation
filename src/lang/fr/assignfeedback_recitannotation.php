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

$string['pluginname'] = 'RÉCIT rétroaction par annotation';
$string['pluginname2'] = 'Annotation de texte';
$string['default'] = 'Activé par défaut';
$string['default_help'] = 'Si cette option est définie, cette méthode de rétroaction sera activée par défaut pour toutes les nouvelles affectations.';
$string['enabled'] = 'Rétroaction par annotation';
$string['enabled_help'] = 'Si cette option est activée, l\'enseignant pourra annoter les devoirs des élèves.';
$string['ai_api_endpoint'] = 'Point de terminaison API IA';
$string['ai_api_endpoint_desc'] = 'URL complète de l’API d’intelligence artificielle à laquelle Moodle doit envoyer les requêtes.';
$string['ai_api_key'] = 'Clé API IA';
$string['ai_api_key_desc'] = 'Clé secrète d’authentification fournie par le service d’intelligence artificielle. Elle permet à Moodle d’accéder de manière sécurisée à l’API.';
$string['access_denied'] = 'Accès refusé: Vous n’avez actuellement pas l’autorisation d’utiliser cette fonctionnalité.';
$string['msg_action_completed'] = "L'action a été complétée avec succès.";
$string['msg_confirm_deletion'] = 'Confirmez-vous la suppression? Cette opération est irréversible.';
$string['student_production'] = 'Production de l\'élève';
$string['undo'] = 'Défaire';
$string['redo'] = 'Refaire';
$string['clean_student_production'] = 'Nettoyer le texte de l\'élève';
$string['annotate'] = 'Annoter';
$string['ask_ai'] = 'Demander à l\'IA';
$string['occurrences'] = 'Occurrences';
$string['criterion'] = 'Critère';
$string['count'] = 'Nombre';
$string['msg_confirm_clean_html_code'] = "Souhaitez-vous vraiment nettoyer le code HTML ?<br/><br/>Cette action supprimera également toutes les annotations que vous avez ajoutées.";
$string['select_item'] = 'Sélectionnez un item';
$string['comment'] = 'Commentaire';
$string['search_comment'] = 'Cherchez un commentaire';
$string['add_edit_comment'] = 'Ajouter/Modifier un Commentaire';
$string['delete'] = 'Supprimer';
$string['cancel'] = 'Annuler';
$string['save'] = 'Enregistrer';
$string['ok'] = 'Oui';
$string['msg_required_field'] = "Veuillez remplir le champ '%s' avant de continuer.";
$string['msg_error_highlighting'] = 'Erreur lors de l\'application du surlignage: il y a des nœuds partiellement sélectionnés.';
$string['ask_question'] = 'Poser une question';
$string['ask'] = 'Demander';
$string['back_annotation_view'] = 'Revenir dans l\'écran d\'annotation';
$string['criteria_list'] = 'Liste de critères';
$string['comment_list'] = 'Liste de commentaires';
$string['add_new_item'] = 'Ajouter un nouveau item';
$string['import_criteria'] = 'Importer des critères';
$string['export_criteria'] = 'Exporter des critères';
$string['name'] = 'Nom';
$string['description'] = 'Description';
$string['color'] = 'Couleur';
$string['edit'] = 'Modifier';
$string['move_up'] = 'Déplacement vers le haut';
$string['move_down'] = 'Déplacement vers le bas';
$string['only_lowercase'] = 'Veuillez saisir uniquement des lettres minuscules sans espaces.';
$string['add_edit_criterion'] = 'Ajouter/Modifier un critère';
$string['foreign_key'] = 'Une contrainte de clé étrangère empêche la suppression afin de garantir l\'intégrité des données. Veuillez d\'abord supprimer ou modifier les éléments associés.';
