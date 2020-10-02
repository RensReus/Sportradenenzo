import React, { Component } from 'react';
import Table from '../shared/table'
class Rulesandpoints extends Component {
  render() {
    var dagPunten = [
      { Positie: 1, Daguitslag: 50, AK: 10, Punten: 8, Berg: 6, Jong: 5 },
      { Positie: 2, Daguitslag: 44, AK: 8, Punten: 6, Berg: 4, Jong: 3 },
      { Positie: 3, Daguitslag: 40, AK: 6, Punten: 4, Berg: 3, Jong: 1 },
      { Positie: 4, Daguitslag: 36, AK: 4, Punten: 2, Berg: 2, Jong: "" },
      { Positie: 5, Daguitslag: 32, AK: 2, Punten: 1, Berg: 1, Jong: "" },
      { Positie: 6, Daguitslag: 30, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 7, Daguitslag: 28, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 8, Daguitslag: 26, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 9, Daguitslag: 24, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 10, Daguitslag: 22, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 11, Daguitslag: 20, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 12, Daguitslag: 18, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 13, Daguitslag: 16, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 14, Daguitslag: 14, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 15, Daguitslag: 12, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 16, Daguitslag: 10, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 17, Daguitslag: 8, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 18, Daguitslag: 6, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 19, Daguitslag: 4, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: 20, Daguitslag: 2, AK: "", Punten: "", Berg: "", Jong: "" },
      { Positie: "Team", Daguitslag: 10, AK: 8, Punten: 6, Berg: 3, Jong: 2 },
    ];

    var dagPuntenTTT = [
      { Positie: 1, Daguitslag: 40 },
      { Positie: 2, Daguitslag: 32 },
      { Positie: 3, Daguitslag: 28 },
      { Positie: 4, Daguitslag: 24 },
      { Positie: 5, Daguitslag: 20 },
      { Positie: 6, Daguitslag: 16 },
      { Positie: 7, Daguitslag: 12 },
      { Positie: 8, Daguitslag: 8 },
    ];

    var eindPunten = [
      { Positie: 1, AK: 100, Punten: 80, Berg: 60, Jong: 50 },
      { Positie: 2, AK: 80, Punten: 60, Berg: 40, Jong: 30 },
      { Positie: 3, AK: 60, Punten: 40, Berg: 30, Jong: 20 },
      { Positie: 4, AK: 50, Punten: 30, Berg: 20, Jong: 10 },
      { Positie: 5, AK: 40, Punten: 20, Berg: 10, Jong: 5 },
      { Positie: 6, AK: 36, Punten: 10, Berg: "", Jong: "" },
      { Positie: 7, AK: 32, Punten: 8, Berg: "", Jong: "" },
      { Positie: 8, AK: 28, Punten: 6, Berg: "", Jong: "" },
      { Positie: 9, AK: 24, Punten: 4, Berg: "", Jong: "" },
      { Positie: 10, AK: 22, Punten: 2, Berg: "", Jong: "" },
      { Positie: 11, AK: 20, Punten: "", Berg: "", Jong: "" },
      { Positie: 12, AK: 18, Punten: "", Berg: "", Jong: "" },
      { Positie: 13, AK: 16, Punten: "", Berg: "", Jong: "" },
      { Positie: 14, AK: 14, Punten: "", Berg: "", Jong: "" },
      { Positie: 15, AK: 12, Punten: "", Berg: "", Jong: "" },
      { Positie: 16, AK: 10, Punten: "", Berg: "", Jong: "" },
      { Positie: 17, AK: 8, Punten: "", Berg: "", Jong: "" },
      { Positie: 18, AK: 6, Punten: "", Berg: "", Jong: "" },
      { Positie: 19, AK: 4, Punten: "", Berg: "", Jong: "" },
      { Positie: 20, AK: 2, Punten: "", Berg: "", Jong: "" },
      { Positie: "Team", AK: 24, Punten: 18, Berg: 9, Jong: 6 },
    ];

    return (
      <div>
        <ul>

        <li>Teamselectie:
        <ul>
          <li>20 renners.</li>
          <li>max 4 renners van hetzelfde team.</li>
          <li>binnen het budget blijven.</li>
        </ul>
        </li>
        <li>Bij TTT punten voor alle finishende renners</li>
        <li>Geen team dag punten bij ITT en TTT wel voor klassementen</li>
        <li>Het is verboden om Campenaerts te selecteren. Indien dit gedaan wordt krijgt de overtreder 500 punten in mindering.</li>
        </ul>
          <div className="tableDiv">
          <Table data={dagPunten} title="Per Etappe" />
        </div>
        <div className="tableDiv">
          <Table data={dagPuntenTTT} title="TTT" />
        </div>
        <div className="tableDiv">
          <Table data={eindPunten} title="Eind Klassementen" />
        </div>

      </div>

    )
  }

}

export default Rulesandpoints