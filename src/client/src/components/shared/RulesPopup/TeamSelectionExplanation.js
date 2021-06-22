const TeamSelectionExplanation = (props) => {
  return (
    <div>
      <div className="text-3xl">Team selectie:</div>
      <div className="text-xl mt-3">
        <p>Kies 20 verschillende renners binnen het budget.</p>
        <p>Zorg voor een verdeling tussen verschillende types renners zodat je zowel in sprint, berg als tijdrit etappes punten kan scoren.</p>
        <p>Je krijgt punten tijdens etappes en punten voor de klassementen aan het einde van de {props.racename || "ronde"}.</p>
      </div>
    </div>
  )
}

export default TeamSelectionExplanation