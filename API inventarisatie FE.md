API inventarisatie
Alles is nu POST dus de notities erachter zijn suggesties voor wat het moet worden.
# FE perspectief
## Home
Wil huidige en vorige races krijgen van een user + races die open staan voor deelname (in 1 get call). 
Huidig:
- getracepartcipation
- getactiveraces
- getfinishedraces
Allemaal GET en afhankelijk van de user.

## Login
Wil login info posten en een (un)succes call terug.
- /login POST
## Sign up
Wil sign up info posten en een (un)succes call terug.
- /signup POST deze doet daarna ook automatisch een login call dat zou niet moeten? Of de user moet zelf inloggen of deze logica moet naar BE.

## TeamSelection
Wil de startlijst en huidige team(s) van een user. Als deze niet beschikbaar zijn dan moet een join race POST call gemaakt kunnen worden.
En er moeten POST en DELETE calls gemaakt kunnen worden voor het toevoegen en verwijderen van renners aan/uit de team selectie
- Join race POST
- getridersandteam GET met race_id maar wel participation check in BE
### Modify team, update db return new team.
- add rider POST
- remove rider DELETE

## Stage
Wil stage info data hebben. Simpele GET
- stageinfo
## Stage Results
Results maakt 3/4? verschillende calls, allemaal GET. Een voor de poule table + team uitslag tabel. En een call voor race uitslag. Deze is voor een specifiek klassement/budget.
En de selecties van alle spelers ophalen. Deze moet aangepast worden naar het ophalen van de selectie van 1 speler + vergelijking met de speler die het opvraagt.
- getPouleTeamResults
- getClassificationResults
- getAllSelections (behouden voor fab four?)
- **New** getSelectioncomparison van een specifieke user/etappe tov ingelogde user (alleen na start van etappe) GET
## Stage Selection
Deze kan data bewerken op de site met add/remove rider/kopman en een initiele get van de huidige selectie en top 5 van de klassementen. Dus 2x POST, 2x DELETE en 1x GET
- add rider POST
- add kopman POST/PATCH?
- remove rider DELETE
- remove kopman DELETE/PATCH?
- getstageselection GET
## Classics
Hier zijn nog allemaal calls van maar volledig gedateerd en weggecommend in BE en mogelijk ook nog kapot. 
Mag na de vuelta gefixt worden. Kan wss veel code van grote rondes hergebruiken.

## Charts
FE weet eigenlijk niet wat ie naar BE stuurt die gooit gewoon automatisch de {chartname} uit de url mee.
Hier moet nog ff een check functie komen of een {chartname} valide is. (Dit hebben we voor statistics in BE) 
- userscores 
- userrank
- riderpercentage
- chartuserracescores (Absolute variant van user scores, ongebruikt)
- scorespread
- scorespreadgrouped
- totalscorespread
- totalscorespreadgrouped
Allemaal GET met parameters als race_id etc.
Die grouped moet gewoon een parameter worden en dan logica in BE om de juiste functies aan te roepen

## Statistics
Zelfde verhaal als Charts behalve dat er hier een in de BE een lijstje is van valide pages en een check voor een 404 response in dat geval
- rondewinsten
- etappewinsten
- allriders
- selectedriders
- missedpoints
- missedpointsall
- teams
- teamcomparisons (onduidelijke tabellen mag weg?)
- overigestats
Allemaal GET met parameters als race_id etc. De 1e is niet afhankelijk van race_id. Potentieel deze net iets anders behandelen?

## Admin
Dit is een beetje een puinhoop dus ik ben benieuwd wat er uit de inventarisatie komt.
Er zitten iig behoorlijk wat gevaarlijke calls die dingen kunnen slopen of nare toevoegingen aan de db
Een simpele get om info over de db te halen. Niet heel boeiend meer nu we geen rijen limiet meer hebben. Misschien weg doen bij een admin refactor of BE refactor.
De interface om te calls te kunnen maken naar de DB. Moet gewoon direct sql queries doorgeven aan de DB en alle info terug sturen.
- query POST
- getdbinfo GET LEGACY
### Import/export
Kan wss weg aangezien we niks meer doen met de mongodb backup maar moeten we later maar eens naar kijken
- import POST LEGACY
- export POST LEGACY
## manual update
We willen de startlist kunnen ophalen dit is een POST omdat we onze db aanpassen. Addstartlist oid is wss een betere naam.
Manual get results ook een POST omdat we onze db aanpassen. Betere naam updatestageresults.
We willen een call maken om de race te beeindigen. 
Copy vergeten selecties deze moet eigenlijk automatisch gebeuren bij stage start maar dat is lastig omdat de server niet altijd draait. Check bij awaken?
- getstartlist(klassiek) POST
- getresults(klassiek) POST
- endrace POST
- copyTeamIfSelectionEmpty POST
## newDB LEGACY
- copy to new db LEGACY

## Profile 
Hier moeten we uberhaupt iets mee gaan doen
Dit heeft nu 1 call maar de pagina is niet bereikbaar dus dat endpoint kan wss verwijderd worden of ergens als comment bij gegooid worden.

## Rider
Wil alle resultaten die bij een rider horen ophalen. Hier willen we misschien nog wat meer bij stoppen zodat jij als user wat account specifieke info erbij ziet.
- getriderresults GET



Sommige POSTs worden misschien PATCH of PUT