export interface RiderParticipation {
  rider_participation_id: number,
  race_id: number,
  rider_id: number,
  price: number,
  dnf: boolean,
  team: string,
  punch?: number,
  climb?: number,
  tt?: number,
  sprint?: number,
  gc?: number,
}