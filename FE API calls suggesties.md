FE API suggesties
Alles is nu met /api ervoor dat is potentieel overbodig? Daarom nu ook weggelaten voor het gemak. Misschien toevoegen aan de interceptor?
# FE perspectief
## Home
/homepageinfo GET

Returns: Huidige en vorige races krijgen van een user + races die open staan voor deelname, 
naam kan beter

## Login
- /login POST body: email, pw

Returns: JWT token or failure.
## Sign up
- /signup POST body: email, pw, username

Returns: Success or failure. And JWT token?

## TeamSelection
- /joinrace POST 

Returns: Success or failure.
- /teamselection/:race_id GET of 
- /race/selection/:race_id GET

Returns: Teamselection(s) van de ingelogde user of no selection found.
- /teamselection/rider POST body: rider_participation_id, budgetparticipation of 
- /race/selection/rider POST body: rider_participation_id, budgetparticipation

Returns: Nieuwe teamselection(s) van de ingelogde user. Success/failure impliciet.
- /teamselection/rider/:rider_participation_id/:budgetParticipation DELETE of 
- /race/selection/rider/:rider_participation_id/:budgetParticipation DELETE

Returns: Nieuwe teamselection(s) van de ingelogde user. Success/failure impliciet.

## Stage
- /stage/:race_id/:stagenr/info GET of
- /stageinfo/:race_id/:stagenr GET of
- /stage/info/:race_id/:stagenr GET

Returns: mode, stagetype, (starttime)
## Stage Results
- /pouleandteamresults/:race_id/:stagenr GET

Returns: Poule tabel en team results van de ingelogde user.
- /stage/results/:race_id/:stagenr/:classification/:budgetParticipation GET

Returns: De uitslag van een specifiek klassement met de renners van de ingelogde user aangegeven.
- /allselections/:race_id/:stagenr/:budgetParticipation GET

Returns: De selecties van ons 4 met de renners van de ingelogde user aangegeven. Incl niet opgestelde renners.
- /stage/results/comparison/:race_id/:stagenr/:account_id/:budgetParticipation GET of
- /stage/results/comparison/:account_participation_id/ GET

Returns: De selectie de opgevraagde user met de renners van de ingelogde user aangegeven. Incl niet opgestelde renners. Deze vallen eigenlijk niet onder stage/selection
Weet nog niet precies wat ik wil met /stage wel of niet voor bepaalde urls.
## Stage Selection
- /stage/selection/:race_id/:stagenr/:budgetParticipation

Returns: Huidige selectie van de ingelogde user en top 5 klassementen met user's renners aangegeven.
- /stage/selection/rider/ POST body: rider_participation_id, budgetparticipation, stagenr

Returns: Nieuwe selectie van de ingelogde user en top 5 klassementen met user's renners aangegeven.
- /stage/selection/rider/:rider_participation_id/:budgetParticipation DELETE

Returns: Nieuwe selectie van de ingelogde user en top 5 klassementen met user's renners aangegeven.
- /stage/selection/kopman/ POST body: rider_participation_id, budgetparticipation, stagenr

Returns: Nieuwe selectie van de ingelogde user en top 5 klassementen met user's renners aangegeven.
- /stage/selection/kopman/:rider_participation_id/:budgetParticipation DELETE

Returns: Nieuwe selectie van de ingelogde user en top 5 klassementen met user's renners aangegeven.

## Classics
Geen stage selections dus alleen results en ook geen klassementen dus wss gewoon 1 call voor poule/team/etappe uitslag en dan de selection comparison calls.

## Charts
- /charts/:chartname?parameters=X

Returns: Chart data of 404 of ontbrekende parameters?.
Het lijstje parameters per chart is vrij duidelijk uit de url. Hier en wss eerder ook al gaat het wel fout zonder /api ervoor omdat /charts verder ook gebruikt wordt.

## Statistics
- /statistics/:statname?parameters=X

Returns: 1 of meer tabellen met statistieken.
Zelfde idee als Charts. Aanpassingen in de een moeten ook bij de andere gebeuren.

## Admin
Geen zin om over na te denken. Voorlopig maar ff lekker laten voor wat het is.

## Profile 
Kunnen we overna denken als we weten wat we willen. Wss gewoon een statische pagina met 1 get profile info call.

## Rider
/rider/:rider_id GET

Returns: De info die we nu ook returnen voor deze pagina.


Veel van de gets willen we misschien niet met url/:a/:b/:c doen maar met url?a=1&b=2&c=3 Dit maakt het aan beide kanten makkelijker. Wordt ook duidelijk als ik weer ff wat meer lees over express en hoe dat met :var en ?parameters=x omgaat.

Alles eindigend met :budgetParticipation moet ook werken zonder dit argument denk ik en dan default false. Of gewoon met parameters zoals ik halverwege ontdekte