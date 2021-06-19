import { Component } from 'react';
import Table from '../../shared/table'

class ResultsTables extends Component {
  render() {
    const classificationNamesButtons = ['Etappe', 'Algemeen', 'Punten', 'Bergen', 'Jong'];
    const classificationNames = ['Etappe', 'Algemeen Klassement', 'Punten Klassement', 'Bergen Klassement', 'Jongeren Klassement'];
    const classIndex = this.props.classificationIndex;
    return (
      <div className="classificationsContainer">
        <div style={{ display: 'flex' }}>
          {classificationNamesButtons.map((element, index) => {
            var buttonclassname = "klassementButton ";
            buttonclassname += index === classIndex ? 'block' : 'none';
            return <button style={{ display: 'block' }} disabled={this.props.stageResultsLengths[index] === 0} className={buttonclassname} key={element} onClick={this.props.changedClassificationDisplay.bind(this, index)}>{element}</button>
          })}
        </div>
        <div className="classification">
          <Table data={this.props.data[classIndex]} title={classificationNames[classIndex]} maxRows={20} classNames="classification" />
        </div>
      </div>
    )
  }
}

export default ResultsTables