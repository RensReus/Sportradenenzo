import Table from "../table"

const StagePoints = () => {
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
  return (
    <div className="tableDiv">
      <Table data={dagPunten} title="Per Etappe" />
    </div>
  )

}

export default StagePoints