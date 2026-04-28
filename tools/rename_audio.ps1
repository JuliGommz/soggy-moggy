# rename_audio.ps1
# Soggy Moggy -- renames downloaded Pixabay files to game target names
#
# Run from project root in PowerShell:
#   cd "C:\Users\Teilnehmer\Desktop\Schule\PRG\Abschlussprojekt_SRH_26"
#   .\rename_audio.ps1

$root = $PSScriptRoot

function Rename-Safe {
  param([string]$from, [string]$to)
  $fromPath = Join-Path $root $from
  $toPath   = Join-Path $root $to
  if (-not (Test-Path $fromPath)) {
    Write-Host "SKIP (not found):      $from" -ForegroundColor Yellow
    return
  }
  if (Test-Path $toPath) {
    Write-Host "SKIP (target exists):  $to" -ForegroundColor Yellow
    return
  }
  Rename-Item -LiteralPath $fromPath -NewName (Split-Path $toPath -Leaf)
  Write-Host "OK:  $from" -ForegroundColor Green
  Write-Host "  -> $to"
}

Write-Host ""
Write-Host "=== CONFIRMED renames ===" -ForegroundColor Cyan

Rename-Safe "audio\sfx\outro\freesound_community-cough-cough-103526.mp3"                       "audio\sfx\outro\l1_outro_bubble.mp3"
Rename-Safe "audio\sfx\outro\freesound_community-female-sigh-medium-distance-6853.mp3"         "audio\sfx\outro\l2_outro_bubble.mp3"
Rename-Safe "audio\sfx\outro\dragon-studio-cute-cat-meow-472372.mp3"                   "audio\sfx\outro\l3_outro_bubble.mp3"
Rename-Safe "audio\sfx\outro\freesound_community-girandola-2-43940.mp3"                       "audio\sfx\outro\windrad.mp3"
Rename-Safe "audio\sfx\player\universfield-funny-cartoon-drum-250961.mp3"                      "audio\sfx\player\damage.mp3"
Rename-Safe "audio\sfx\enemies\freesound_community-cartoon-arrow-hit-6700.mp3"                 "audio\sfx\enemies\wasp_death.mp3"
Rename-Safe "audio\sfx\outro\soundreality-ding-411634.mp3"                                     "audio\sfx\outro\bell.mp3"
Rename-Safe "audio\sfx\outro\40727898-water-goes-down-the-drain-176707.mp3"                    "audio\sfx\outro\water_drain.mp3"
Rename-Safe "audio\sfx\ui\cartoon-music-soundtrack-arcade-game-achievement-bling-489759.mp3"   "audio\sfx\ui\level_complete.mp3"
Rename-Safe "audio\sfx\ui\universfield-cartoon-fail-trumpet-278822.mp3"                                                    "audio\sfx\ui\game_over.mp3"
Rename-Safe "audio\music\freesound_community-short-pizzicato-song-27358.mp3"                                               "audio\music\l1_city.mp3"
Rename-Safe "audio\music\freesound_community-town-of-tranqness-25976.mp3"                                                  "audio\music\l2_shaft.mp3"
Rename-Safe "audio\music\oceanframemusic-funny-kid-481395.mp3"                                                             "audio\music\l3_lighthouse.mp3"
Rename-Safe "audio\music\mccrunchy-muffled-party-music-183774.mp3"                                                         "audio\music\start_screen.mp3"
Rename-Safe "audio\sfx\enemies\freesound_community-a-recreation-of-the-clasic-80s-orchestral-stab-89475.mp3"               "audio\sfx\enemies\wasp_sting.mp3"
Rename-Safe "audio\sfx\hazards\freesound_community-water_flood_enhanced-31196.mp3"                                         "audio\sfx\hazards\flood_ambient.mp3"
Rename-Safe "audio\sfx\hazards\freesound_community-mysterious-electricity-73307.mp3"                                       "audio\sfx\hazards\electricity_ambient.mp3"
Rename-Safe "audio\sfx\hazards\guillermoanaya-city-ambience-121693.mp3"                                                    "audio\sfx\hazards\smog_ambient.mp3"
Rename-Safe "audio\sfx\platforms\freesound_community-crumple-03-40747.mp3"                                                 "audio\sfx\platforms\crumble.mp3"
Rename-Safe "audio\sfx\enemies\freesound_community-bee_wasp-97053.mp3"                                                     "audio\sfx\enemies\wasp_buzz.mp3"
Rename-Safe "audio\sfx\ui\freesound_community-arcade-countdown-7007.mp3"                                                    "audio\sfx\ui\countdown_tick.mp3"
Rename-Safe "audio\sfx\ui\floraphonic-marimba-bloop-2-188149.mp3"                                                          "audio\sfx\ui\menu_click.mp3"
Rename-Safe "audio\sfx\ui\universfield-bubble-pop-06-351337.mp3"                                                            "audio\sfx\ui\menu_nav.mp3"

Rename-Safe "audio\sfx\player\freesound_community-cartoon-jump-6462.mp3"                                                   "audio\sfx\player\jump.mp3"
Rename-Safe "audio\sfx\platforms\freesound_community-041109-jacob39s-ladder-electricity-68154.mp3"                         "audio\sfx\platforms\electro_crumble.mp3"
Rename-Safe "audio\sfx\player\freesound_community-land-81509.mp3"                                                          "audio\sfx\player\land.mp3"
Rename-Safe "audio\sfx\player\freesound_community-item_respawn-91422.mp3"                                                  "audio\sfx\player\respawn.mp3"
Rename-Safe "audio\sfx\player\u_wb4wgxdwxo-boing2-418548.mp3"                                                             "audio\sfx\player\stomp_bounce.mp3"

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
