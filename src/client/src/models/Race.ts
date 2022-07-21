export interface Race {
  race_id: number,
  name: "giro" | "tour" | "vuelta" | "classics",
  year: string,
  budget: number,
  finished: boolean,
}