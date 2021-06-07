API inventarisatie
Alles is nu *post* dus de notities erachter zijn suggesties voor wat het moet worden.
# FE perspectief
## Home
Wil huidige en vorige races krijgen van een user + races die open staan voor deelname (in 1 get call). 
Huidig:
- getracepartcipation
- getactiveraces
- getfinishedraces
Allemaal *get* en afhankelijk van de user.

## Login
Wil login info posten en een (un)succes call terug.
- /login *post* 
## Sign up
Wil sign up info posten en een (un)succes call terug.
- /signup *post* deze doet daarna ook automatisch een login call dat zou niet moeten? Of de user moet zelf inloggen of deze logica moet naar BE.

## TeamSelection
Wil de startlijst en huidige team(s) van een user. Als deze niet beschikbaar zijn dan moet een join race *post* call gemaakt kunnen worden.
En er moeten *post* en *delete* calls gemaakt kunnen worden voor het toevoegen en verwijderen van renners aan/uit de team selectie
- Join race *post*
- getridersandteam *get* met race_id maar wel participation check in BE
### Modify team, update db return new team.
- add rider *post*
- remove rider *delete*

## Stage
TODOOOOOOOOOOOOOOOOOOOOOOOOO

## Charts
FE weet eigenlijk niet wat ie naar BE stuurt die gooit gewoon automatisch de {chartname} uit url mee.
Hier moet nog ff een check functie komen of een {chartname} valide is. En dan de verschillende calls. Verder ook nog wel een beetje nadenken over refactor.
- userscores 
- userrank
- riderpercentage
- chartuserracescores (Absolute variant van user scores, ongebruikt)
- scorespread
- scorespreadgrouped
- totalscorespread
- totalscorespreadgrouped
Allemaal *get* met parameters als race_id etc.
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
Allemaal *get* met parameters als race_id etc. De 1e is niet afhankelijk van race_id. Potentieel deze net iets anders behandelen?

## Admin
TODOOOOOOOOOOOOOOOOOOOOOOOOO

## Profile 
Hier moeten we uberhaupt iets mee gaan doen
Dit heeft nu 1 call maar de pagina is niet bereikbaar dus dat endpoint kan wss verwijderd worden of ergens als comment bij gegooid worden.

## Rider
Wil alle resultaten die bij een rider horen ophalen. Hier willen we misschien nog wat meer bij stoppen zodat jij als user wat account specifieke info erbij ziet.
- getriderresults *get*

