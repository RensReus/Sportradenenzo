import DropdownMenu from "../../shared/DropdownMenu";

const ChartsDropdown = (props) => {
    return (
        <DropdownMenu {...props} name="Charts"
            alwaysLinks={[{ url: "/charts/totalscorespread", title: "Score verdeling Totaal" }]}
            raceOnlyLinks={[
                { url: "/charts/userscores", title: "Relatief Scoreverloop" },
                { url: "/charts/userrank", title: "Ranking" },
                { url: "/charts/riderpercentage", title: "Puntenaandeel Renner per Etappe" },
                { url: "/charts/scorespread", title: "Score verdeling" }
            ]} />
    )
}

export default ChartsDropdown;