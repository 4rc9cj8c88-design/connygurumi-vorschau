#!/bin/bash
# Doppelklicken: startet einen kleinen Server und oeffnet die Seite.
cd "$(dirname "$0")"
python3 -m http.server 8765 &
sleep 1
open "http://localhost:8765/index.html"
echo "Server laeuft. Zum Beenden dieses Fenster schliessen."
wait
