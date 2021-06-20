import Table from "../table"

const EndPoints = () => {
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
    <div className="tableDiv">
      <Table data={eindPunten} title="Eind Klassementen" />
    </div>
  )

}

export default EndPoints