import DropdownMenu from "../../shared/DropdownMenu";

const StatistiekenDropdown = (props) => {
    return (
        <DropdownMenu {...props} name="Statistieken"
            alwaysLinks={[{ url: "/statistics/totalscorespread", title: "Uitslagen per ronde" }]}
            raceOnlyLinks={[
                { url: "/statistics/etappewinsten", title: "Uitslagen per etappe" },
                { url: "/statistics/allriders", title: "Alle renners" },
                { url: "/statistics/klassementen", title: "Klassementen" },
                { url: "/statistics/missedpointsall", title: "Gemiste punten iedereen" },
                { url: "/statistics/missedPointsPerRider", title: "Gemiste punten Per Renner" },
                { url: "/statistics/teams", title: "Team overzichten" },
                { url: "/statistics/teamcomparisons", title: "Selectie vergelijking" },
                { url: "/statistics/overigestats", title: "Overige Statistieken" }
            ]} />
    )
}

export default StatistiekenDropdown;