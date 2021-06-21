import SelectionComparison from "./selectionComparison"

const Headers = () => {
    return (
        <tr key="headers">
            <th key=" "></th>
            <th key="User">User</th>
            <th key="Etappe">Etappe</th>
            <th key="Totaal">Totaal</th>
        </tr>
    )
}

const Rows = (props) => {
    let rows = []
    for (const rowData of props.tableData) {
        rows.push(<Row rowData={rowData} data={props.data} />)
    }
    return (
        <tbody>
            {rows}
        </tbody>
    )
}

const Row = (props) => {
    return (
        <tr key={props.rowData.account_participation_id}>
            <td key="pos">{props.rowData[" "]}</td>
            <td key="user"><SelectionComparison title={props.rowData.User} userToCompareId={props.rowData.account_id} data={props.data}/></td>
            <td key="stageScore">{props.rowData.Stage}</td>
            <td key="totalScore">{props.rowData.Total}</td>
        </tr>
    )
}

const PouleTable = (props) => {
    return (
        <div>
            <table style={{ display: 'table' }}>
                <caption>Poule Stand</caption>
                <Headers />
                <Rows data={props.data} tableData={props.tableData} />
            </table>
        </div>
    )
}

export default PouleTable